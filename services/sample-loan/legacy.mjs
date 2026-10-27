import { assert, exact, text, at, iso, integer } from "./domain.mjs";
import {
  first,
  rows,
  mutation,
  eventStatement,
  priorMutation,
} from "./store.mjs";
export function legacyData(raw) {
  exact(raw, ["borrower", "contact", "lentAt", "dueAt", "notes"]);
  const data = {
    borrower: text(raw.borrower, "legacyLoan.borrower", 200),
    contact: text(raw.contact, "legacyLoan.contact", 200, true),
    lentAt:
      raw.lentAt == null
        ? null
        : at(raw.lentAt, "legacyLoan.lentAt", { past: true }),
    dueAt: raw.dueAt == null ? null : at(raw.dueAt, "legacyLoan.dueAt"),
    notes: text(raw.notes, "legacyLoan.notes", 4000, true) || "",
  };
  assert(
    !data.lentAt || !data.dueAt || data.dueAt >= data.lentAt,
    "INVALID_TIME",
    "归还日期不能早于实际借出日期",
    422,
  );
  return data;
}
export const legacyRows = (env, assetId) =>
  rows(
    env,
    "SELECT id,borrower,contact,lent_at AS lentAt,due_at AS dueAt,notes,status,ended_at AS endedAt,end_reason AS endReason,hold_reason AS holdReason,recorded_at AS recordedAt,updated_at AS updatedAt FROM sample_legacy_loans WHERE asset_id=? ORDER BY recorded_at DESC,id",
    [assetId],
  );
export async function endLegacy(request, env, user, assetId, id, action, d) {
  const scope = `legacy/${assetId}/${id}/${action}`;
  if (action === "preservation")
    assert(user.is_owner, "OWNER_REQUIRED", "仅主管理员可设置档案保留", 403);
  const prior = await priorMutation(env, request, user, scope, d);
  if (prior) return prior;
  if (action === "preservation") {
    exact(d, ["expectedAssetVersion", "holdReason"]);
    const hold = text(d.holdReason, "holdReason", 4000, true);
    return mutation(env, request, user, {
      scope,
      data: d,
      condition:
        "EXISTS (SELECT 1 FROM sample_assets WHERE id=? AND row_version=?) AND EXISTS (SELECT 1 FROM sample_legacy_loans WHERE id=? AND asset_id=?)",
      conditionValues: [
        assetId,
        integer(d.expectedAssetVersion, "expectedAssetVersion"),
        id,
        assetId,
      ],
      statements: [
        [
          "UPDATE sample_legacy_loans SET hold_reason=?,updated_at=?,row_version=row_version+1 WHERE id=? AND $gate",
          [hold, iso(), id],
        ],
        [
          "UPDATE sample_assets SET row_version=row_version+1,updated_at=? WHERE id=? AND $gate",
          [iso(), assetId],
        ],
        eventStatement(null, assetId, user, "legacy.preservation", {
          legacyLoanId: id,
          enabled: !!hold,
        }),
      ],
      result: { id: assetId, legacyLoanId: id },
    });
  }
  exact(d, ["expectedAssetVersion", "occurredAt", "reason", "holdReason"]);
  const loan = await first(
    env,
    "SELECT * FROM sample_legacy_loans WHERE id=? AND asset_id=? AND status='active'",
    [id, assetId],
  );
  assert(loan, "NOT_FOUND", "未找到正在借出的历史登记", 404);
  const reason = text(d.reason, "reason", 4000),
    time =
      action === "correct"
        ? iso()
        : at(d.occurredAt, "occurredAt", { past: true });
  assert(
    !loan.lent_at || time >= loan.lent_at,
    "INVALID_TIME",
    "结束时间不能早于借出时间",
    422,
  );
  const status = { return: "returned", loss: "lost", correct: "corrected" }[
    action
  ];
  const hold = text(d.holdReason, "holdReason", 4000, true);
  return mutation(env, request, user, {
    scope,
    data: d,
    condition:
      "EXISTS (SELECT 1 FROM sample_assets WHERE id=? AND row_version=?) AND EXISTS (SELECT 1 FROM sample_allocations WHERE asset_id=? AND legacy_loan_id=?)",
    conditionValues: [
      assetId,
      integer(d.expectedAssetVersion, "expectedAssetVersion"),
      assetId,
      id,
    ],
    statements: [
      [
        "UPDATE sample_legacy_loans SET status=?,ended_at=?,end_reason=?,hold_reason=COALESCE(hold_reason,?),updated_at=?,row_version=row_version+1 WHERE id=? AND $gate",
        [status, time, reason, hold, iso(), id],
      ],
      [
        "DELETE FROM sample_allocations WHERE asset_id=? AND legacy_loan_id=? AND $gate",
        [assetId, id],
      ],
      [
        "UPDATE sample_assets SET lifecycle=CASE WHEN ?='lost' THEN 'lost' ELSE lifecycle END,row_version=row_version+1,updated_at=? WHERE id=? AND $gate",
        [status, iso(), assetId],
      ],
      eventStatement(
        null,
        assetId,
        user,
        "legacy." + status,
        { legacyLoanId: id, reason },
        time,
      ),
    ],
    result: { id: assetId, legacyLoanId: id },
  });
}
