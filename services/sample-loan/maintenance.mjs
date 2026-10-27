import { first, rows, stmt } from "./store.mjs";
import { beijingDay, endOfDay, iso, assert, date } from "./domain.mjs";
export function workingDeadline(receivedAt, calendar) {
  if (!calendar || beijingDay(receivedAt) < calendar.validFrom) return null;
  const holidays = new Set(calendar.holidays),
    working = new Set(calendar.workingDates);
  let day = beijingDay(receivedAt),
    count = 0;
  while (count < 5) {
    day = new Date(Date.parse(day + "T00:00:00Z") + 86400000)
      .toISOString()
      .slice(0, 10);
    if (day > calendar.validUntil) return null;
    const weekday = new Date(day + "T00:00:00Z").getUTCDay();
    if (
      working.has(day) ||
      (!holidays.has(day) && weekday !== 0 && weekday !== 6)
    )
      count++;
  }
  return endOfDay(day);
}
export async function refundDeadline(env, receivedAt) {
  const row = await first(
    env,
    "SELECT id,data_json FROM sample_settings_versions WHERE kind='calendar' AND active=1",
  );
  return row
    ? {
        dueAt: workingDeadline(receivedAt, JSON.parse(row.data_json)),
        calendarRevision: row.id,
      }
    : { dueAt: null, calendarRevision: null };
}
export function validateCalendar(input) {
  const validFrom = date(input.validFrom, "validFrom"),
    validUntil = date(input.validUntil, "validUntil");
  assert(
    validUntil >= validFrom,
    "INVALID_CALENDAR",
    "日历结束日期须晚于开始日期",
    422,
  );
  for (const key of ["holidays", "workingDates"])
    assert(
      Array.isArray(input[key]) && input[key].length <= 3660,
      "INVALID_CALENDAR",
      "请填写调休与假日日期列表",
      422,
    );
  const holidays = [...new Set(input.holidays.map((d) => date(d, "holidays")))],
    workingDates = [
      ...new Set(input.workingDates.map((d) => date(d, "workingDates"))),
    ];
  assert(
    holidays.every((d) => !workingDates.includes(d)),
    "INVALID_CALENDAR",
    "同一天不能同时为假日和调休工作日",
    422,
  );
  return { validFrom, validUntil, holidays, workingDates };
}
function expired(r, now) {
  if (
    !r.closed_at ||
    !["rejected", "cancelled", "completed", "loss_closed"].includes(r.status)
  )
    return false;
  const f = r.projection_json ? JSON.parse(r.projection_json) : null;
  if (f && (!f.balanced || !r.financial_closed_at)) return false;
  if (r.money_count && !r.financial_closed_at) return false;
  const end = new Date(
    [r.closed_at, r.financial_closed_at].filter(Boolean).sort().at(-1),
  );
  if (r.shipped_at) end.setUTCFullYear(end.getUTCFullYear() + 3);
  else end.setUTCDate(end.getUTCDate() + 90);
  return end.getTime() <= now;
}
async function removePrefix(bucket, prefix) {
  let cursor;
  do {
    const result = await bucket.list({ prefix, cursor, limit: 1000 });
    if (result.objects.length)
      await bucket.delete(result.objects.map((o) => o.key));
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);
}
export async function maintainData(env, { now = Date.now() } = {}) {
  const securityCutoff = new Date(now);
  securityCutoff.setUTCMonth(securityCutoff.getUTCMonth() - 6);
  await stmt(env, "DELETE FROM sample_security_events WHERE occurred_at<?", [
    securityCutoff.toISOString(),
  ]).run();
  const unshippedCutoff = new Date(now);
  unshippedCutoff.setUTCDate(unshippedCutoff.getUTCDate() - 90);
  const shippedCutoff = new Date(now);
  shippedCutoff.setUTCFullYear(shippedCutoff.getUTCFullYear() - 3);
  const candidates = await rows(
    env,
    `SELECT r.*,p.shipped_at,f.projection_json,(SELECT COUNT(*) FROM sample_financial_entries e WHERE e.request_id=r.id) AS money_count FROM sample_requests r LEFT JOIN sample_progress p ON p.request_id=r.id LEFT JOIN sample_financial_projections f ON f.request_id=r.id WHERE r.closed_at IS NOT NULL AND r.hold_reason IS NULL AND r.status IN ('rejected','cancelled','completed','loss_closed') AND (r.financial_closed_at IS NOT NULL OR NOT EXISTS(SELECT 1 FROM sample_financial_entries e WHERE e.request_id=r.id)) AND (f.projection_json IS NULL OR (json_extract(f.projection_json,'$.balanced')=1 AND r.financial_closed_at IS NOT NULL)) AND (CASE WHEN r.financial_closed_at>r.closed_at THEN r.financial_closed_at ELSE r.closed_at END)<=CASE WHEN p.shipped_at IS NULL THEN ? ELSE ? END ORDER BY r.closed_at LIMIT 50`,
    [unshippedCutoff.toISOString(), shippedCutoff.toISOString()],
  );
  let marked = 0,
    purged = 0;
  for (const r of candidates) {
    if (!expired(r, now)) continue;
    if (!r.purge_after_at) {
      const after = new Date(now + 86400000).toISOString();
      const gate =
        "EXISTS (SELECT 1 FROM sample_requests WHERE id=? AND row_version=? AND hold_reason IS NULL AND purge_after_at IS NULL)";
      const result = await env.CASE_DB.batch([
        stmt(
          env,
          `UPDATE sample_jobs SET status='cancelled',lease_generation=lease_generation+1,lease_owner=NULL,lease_expires_at=NULL WHERE request_id=? AND ${gate}`,
          [r.id, r.id, r.row_version],
        ),
        stmt(
          env,
          "UPDATE sample_requests SET purge_after_at=?,row_version=row_version+1 WHERE id=? AND row_version=? AND hold_reason IS NULL AND purge_after_at IS NULL",
          [after, r.id, r.row_version],
        ),
      ]);
      if (result[1].meta.changes) marked++;
      continue;
    }
    if (Date.parse(r.purge_after_at) > now) continue;
    // A one-day grace follows task cancellation. All normal writes are blocked while purging.
    let current = await first(
      env,
      "SELECT row_version,hold_reason,purge_after_at,purge_started_at FROM sample_requests WHERE id=?",
      [r.id],
    );
    if (
      !current ||
      current.hold_reason ||
      current.row_version !== r.row_version
    )
      continue;
    if (!current.purge_started_at) {
      const claim = await stmt(
        env,
        "UPDATE sample_requests SET purge_started_at=?,row_version=row_version+1 WHERE id=? AND row_version=? AND hold_reason IS NULL AND purge_started_at IS NULL",
        [iso(), r.id, current.row_version],
      ).run();
      if (!claim.meta.changes) continue;
      current = await first(
        env,
        "SELECT row_version,purge_after_at FROM sample_requests WHERE id=?",
        [r.id],
      );
    }
    assert(
      env.SAMPLE_FILES,
      "STORAGE_UNAVAILABLE",
      "资料清理需要私有存储绑定",
      503,
    );
    const files = await rows(
      env,
      "SELECT original_key,upload_id,status FROM sample_files WHERE request_id=?",
      [r.id],
    );
    for (const f of files)
      if (f.upload_id && f.status === "uploading")
        await env.SAMPLE_FILES.resumeMultipartUpload(
          f.original_key,
          f.upload_id,
        ).abort();
    for (const prefix of [
      `originals/${r.id}/`,
      `derived/${r.id}/`,
      `agreements/${r.id}/`,
    ])
      await removePrefix(env.SAMPLE_FILES, prefix);
    const tables = [
      "sample_version_files",
      "sample_financial_entries",
      "sample_assessments",
      "sample_financial_projections",
      "sample_quotes",
      "sample_events",
      "sample_jobs",
      "sample_document_objects",
      "sample_agreement_versions",
      "sample_files",
      "sample_decisions",
      "sample_progress",
      "sample_losses",
      "sample_extensions",
    ];
    await env.CASE_DB.batch([
      ...tables.map((table) =>
        stmt(env, `DELETE FROM ${table} WHERE request_id=?`, [r.id]),
      ),
      stmt(
        env,
        "DELETE FROM sample_idempotency WHERE json_extract(result_json,'$.id')=?",
        [r.id],
      ),
      stmt(env, "DELETE FROM sample_operations WHERE request_id=?", [r.id]),
      stmt(
        env,
        "DELETE FROM sample_requests WHERE id=? AND row_version=? AND hold_reason IS NULL AND purge_after_at=?",
        [r.id, current.row_version, current.purge_after_at],
      ),
    ]);
    purged++;
  }
  // Retain history for three years after its last recorded handling, including backdated returns.
  const legacyCutoff = new Date(now);
  legacyCutoff.setUTCFullYear(legacyCutoff.getUTCFullYear() - 3);
  const legacy = await rows(
    env,
    "SELECT id FROM sample_legacy_loans WHERE status<>'active' AND updated_at<=? AND hold_reason IS NULL AND NOT EXISTS (SELECT 1 FROM sample_allocations x WHERE x.legacy_loan_id=sample_legacy_loans.id) LIMIT 50",
    [legacyCutoff.toISOString()],
  );
  for (const l of legacy)
    await env.CASE_DB.batch([
      stmt(
        env,
        "DELETE FROM sample_events WHERE json_extract(details_json,'$.legacyLoanId')=? AND EXISTS (SELECT 1 FROM sample_legacy_loans WHERE id=? AND status<>'active' AND updated_at<=? AND hold_reason IS NULL)",
        [l.id, l.id, legacyCutoff.toISOString()],
      ),
      stmt(
        env,
        "DELETE FROM sample_legacy_loans WHERE id=? AND status<>'active' AND updated_at<=? AND hold_reason IS NULL",
        [l.id, legacyCutoff.toISOString()],
      ),
    ]);
  // Populate dates only from an explicitly maintained working-day calendar.
  const missing = await rows(
    env,
    "SELECT request_id,returned_at FROM sample_progress WHERE returned_at IS NOT NULL AND refund_due_at IS NULL LIMIT 50",
  );
  for (const r of missing) {
    const deadline = await refundDeadline(env, r.returned_at);
    if (deadline.dueAt)
      await stmt(
        env,
        "UPDATE sample_progress SET refund_due_at=?,refund_calendar_revision=? WHERE request_id=? AND returned_at=? AND refund_due_at IS NULL",
        [
          deadline.dueAt,
          deadline.calendarRevision,
          r.request_id,
          r.returned_at,
        ],
      ).run();
  }
  return { marked, purged };
}
export async function sweepOrphanDocuments(env, { now = Date.now() } = {}) {
  if (!env.SAMPLE_FILES) return { deleted: 0 };
  const day = Math.floor(now / 86400000),
    last = await first(
      env,
      "SELECT value FROM sample_counters WHERE name='orphan_sweep_day'",
    );
  if (last?.value >= day) return { deleted: 0 };
  let cursor,
    deleted = 0;
  do {
    const page = await env.SAMPLE_FILES.list({
      prefix: "agreements/",
      cursor,
      limit: 1000,
    });
    for (const object of page.objects) {
      if (new Date(object.uploaded).getTime() > now - 86400000) continue;
      if (
        await first(
          env,
          "SELECT document_id FROM sample_document_objects WHERE object_key=?",
          [object.key],
        )
      )
        continue;
      const parts = object.key.split("/"),
        attempt = parts.at(-1).replace(/\.pdf$/, "");
      const active = await first(
        env,
        "SELECT id FROM sample_jobs WHERE request_id=? AND lease_owner=? AND status='processing' AND lease_expires_at>?",
        [parts[1], attempt, new Date(now).toISOString()],
      );
      if (active) continue;
      await env.SAMPLE_FILES.delete(object.key);
      deleted++;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  await stmt(
    env,
    "INSERT INTO sample_counters(name,value) VALUES('orphan_sweep_day',?) ON CONFLICT(name) DO UPDATE SET value=excluded.value",
    [day],
  ).run();
  return { deleted };
}
