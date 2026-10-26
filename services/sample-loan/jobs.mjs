import puppeteer from "@cloudflare/puppeteer";
import { createHash } from "node:crypto";
import { first, rows, stmt } from "./store.mjs";
import { open } from "./vault.mjs";
import { iso, assert, fail } from "./domain.mjs";
import { compressImage, renderPdf } from "./render.mjs";
import { maintainData, sweepOrphanDocuments } from "./maintenance.mjs";
import { enqueuePending } from "./dispatcher.mjs";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const dataUrl = (type, bytes) =>
  `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
async function documentAssets(env) {
  assert(
    env.DOCUMENT_ASSETS,
    "DOCUMENT_ASSETS_REQUIRED",
    "PDF字体与Logo未配置",
    503,
  );
  const load = (path) =>
    env.DOCUMENT_ASSETS.fetch(
      new Request("https://document-assets.internal/" + path),
    );
  const response = await load("manifest.json");
  assert(response.ok, "DOCUMENT_ASSETS_REQUIRED", "缺少字体清单", 503);
  const manifest = await response.json();
  const logo = await load("logo.svg");
  assert(logo.ok, "DOCUMENT_ASSETS_REQUIRED", "Logo缺失", 503);
  let fontCss = "";
  for (const font of manifest.fonts) {
    assert(
      /^[a-z0-9-]+\.woff2$/.test(font.file) && /^[A-Za-z]+$/.test(font.family),
      "INVALID_FONT_MANIFEST",
      "字体清单无效",
      422,
    );
    const response = await load(font.file);
    assert(response.ok, "DOCUMENT_ASSETS_REQUIRED", "字体缺失", 503);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert(
      sha(bytes) === font.sha256,
      "FONT_HASH_MISMATCH",
      "字体资源与清单不符",
      422,
    );
    fontCss += `@font-face{font-family:${font.family};font-style:normal;font-weight:100 900;src:url(${dataUrl("font/woff2", bytes)}) format('woff2')}`;
  }
  return {
    cmap: manifest,
    fontManifestHash: sha(JSON.stringify(manifest)),
    fontCss,
    logo: dataUrl("image/svg+xml", await logo.arrayBuffer()),
  };
}
export async function runJob(
  env,
  jobId,
  { launch = () => puppeteer.launch(env.BROWSER) } = {},
) {
  const initial = await first(env, "SELECT * FROM sample_jobs WHERE id=?", [
    jobId,
  ]);
  if (
    !initial ||
    ["ready", "failed_permanent", "cancelled"].includes(initial.status) ||
    initial.next_attempt_at > iso()
  )
    return;
  const attempt = crypto.randomUUID(),
    expires = new Date(Date.now() + 5 * 60000).toISOString();
  const acquired = await first(
    env,
    "UPDATE sample_jobs SET status='processing',lease_owner=?,lease_expires_at=?,lease_generation=lease_generation+1,attempt_count=attempt_count+1 WHERE id=? AND status IN ('queued','retry_wait','pending_assets','processing') AND (lease_expires_at IS NULL OR lease_expires_at<?) AND next_attempt_at<=? RETURNING *",
    [attempt, expires, jobId, iso(), iso()],
  );
  if (!acquired) return;
  const fence =
      "id=? AND status='processing' AND lease_owner=? AND lease_generation=? AND lease_expires_at>?",
    fenceValues = () => [jobId, attempt, acquired.lease_generation, iso()];
  let browser, page;
  try {
    assert(
      env.SAMPLE_FILES && env.SAMPLE_SECRET,
      "STORAGE_UNAVAILABLE",
      "任务绑定未配置",
      503,
    );
    const v = await first(
      env,
      "SELECT * FROM sample_agreement_versions WHERE request_id=? AND revision_no=?",
      [acquired.request_id, acquired.revision_no],
    );
    assert(v, "SNAPSHOT_MISSING", "合同快照缺失", 422);
    const snapshot = await open(
      env.SAMPLE_SECRET,
      acquired.request_id + ":" + acquired.revision_no,
      v.snapshot_cipher,
    );
    const termsRow = await first(
      env,
      "SELECT canonical_json FROM sample_terms_versions WHERE version=?",
      [v.terms_version],
    );
    assert(termsRow, "TERMS_MISSING", "固定条款缺失", 422);
    const terms = JSON.parse(termsRow.canonical_json);
    browser = await launch();
    page = await browser.newPage();
    const photos = [];
    const files = await rows(
      env,
      "SELECT f.* FROM sample_version_files v JOIN sample_files f ON f.id=v.file_id WHERE v.request_id=? AND v.revision_no=? ORDER BY v.position",
      [acquired.request_id, acquired.revision_no],
    );
    for (const file of files) {
      let derived = file.derivative_key
        ? await env.SAMPLE_FILES.get(file.derivative_key)
        : null;
      if (!derived) {
        const source = await env.SAMPLE_FILES.get(file.original_key);
        assert(source, "ORIGINAL_MISSING", "原图缺失", 422);
        assert(
          source.size <= 64 * 1024 * 1024,
          "IMAGE_RESOURCE_LIMIT",
          "该原图超出当前单次解码能力，原件已保留，请分批或人工处理",
          422,
        );
        let image;
        try {
          image = await compressImage(
            page,
            new Uint8Array(await source.arrayBuffer()),
            file.mime,
          );
        } catch (e) {
          if (
            e.name === "EncodingError" ||
            /INVALID_IMAGE|IMAGE_BUDGET/.test(e.message)
          )
            fail(
              422,
              "INVALID_IMAGE",
              `附件无法解码或无法保持可读性：${file.name}（${file.id}）`,
            );
          throw e;
        }
        const hash = sha(image.bytes),
          key = `derived/${acquired.request_id}/${file.id}/${hash}.jpg`;
        assert(
          image.bytes.byteLength <= 500000,
          "IMAGE_BUDGET",
          "图片超过500K",
          422,
        );
        await env.SAMPLE_FILES.put(key, image.bytes, {
          httpMetadata: { contentType: "image/jpeg" },
        });
        await stmt(
          env,
          "UPDATE sample_files SET derivative_key=?,derivative_size=?,derivative_hash=?,status='ready',updated_at=? WHERE id=? AND request_id=?",
          [
            key,
            image.bytes.byteLength,
            hash,
            iso(),
            file.id,
            acquired.request_id,
          ],
        ).run();
        photos.push({
          name: file.name,
          url: dataUrl("image/jpeg", image.bytes),
        });
      } else {
        assert(derived.size <= 500000, "IMAGE_BUDGET", "衍生图不合规", 422);
        photos.push({
          name: file.name,
          url: dataUrl("image/jpeg", await derived.arrayBuffer()),
        });
      }
      const renew = await stmt(
        env,
        `UPDATE sample_jobs SET lease_expires_at=? WHERE ${fence}`,
        [new Date(Date.now() + 5 * 60000).toISOString(), ...fenceValues()],
      ).run();
      assert(renew.meta.changes, "LEASE_EXPIRED", "任务租约已失效");
    }
    const assets = await documentAssets(env),
      rendered = await renderPdf(page, { snapshot, terms, photos, ...assets }),
      hash = sha(rendered.bytes),
      documentId = crypto.randomUUID(),
      key = `agreements/${acquired.request_id}/R${acquired.revision_no}/${attempt}.pdf`,
      now = iso();
    await env.SAMPLE_FILES.put(key, rendered.bytes, {
      httpMetadata: { contentType: "application/pdf" },
      customMetadata: {
        sha256: hash,
        requestId: acquired.request_id,
        revision: String(acquired.revision_no),
      },
    });
    const gate = `EXISTS (SELECT 1 FROM sample_jobs WHERE ${fence})`,
      values = fenceValues();
    const done = await env.CASE_DB.batch([
      stmt(
        env,
        `INSERT INTO sample_document_objects(document_id,request_id,revision_no,attempt_id,object_key,sha256,size,page_count,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE ${gate}`,
        [
          documentId,
          acquired.request_id,
          acquired.revision_no,
          attempt,
          key,
          hash,
          rendered.bytes.byteLength,
          rendered.pageCount,
          now,
          ...values,
        ],
      ),
      stmt(
        env,
        `UPDATE sample_agreement_versions SET pdf_status='ready',document_id=?,font_manifest_hash=? WHERE request_id=? AND revision_no=? AND document_id IS NULL AND ${gate}`,
        [
          documentId,
          assets.fontManifestHash,
          acquired.request_id,
          acquired.revision_no,
          ...values,
        ],
      ),
      stmt(
        env,
        `UPDATE sample_requests SET latest_ready_agreement_revision=MAX(latest_ready_agreement_revision,?) WHERE id=? AND ${gate}`,
        [acquired.revision_no, acquired.request_id, ...values],
      ),
      stmt(
        env,
        `UPDATE sample_jobs SET status='ready',lease_owner=NULL,lease_expires_at=NULL,error_code=NULL,error_detail=NULL WHERE ${fence}`,
        values,
      ),
    ]);
    if (!done[0].meta.changes) await env.SAMPLE_FILES.delete(key);
    return { published: !!done[0].meta.changes, documentId, hash };
  } catch (e) {
    const permanent =
      e.status === 422 ||
      /INVALID_IMAGE|IMAGE_BUDGET|FONT_LOAD|EncodingError/.test(e.message) ||
      acquired.attempt_count >= 5;
    const code =
        e.code ||
        (/429/.test(e.message) ? "RENDER_RATE_LIMITED" : "RENDER_FAILED"),
      status = permanent ? "failed_permanent" : "retry_wait",
      next = new Date(
        Date.now() + Math.min(86400000, 60000 * 2 ** acquired.attempt_count),
      ).toISOString();
    // Never persist arbitrary browser exceptions: they may contain default credentials or embedded data URLs.
    const description = e.code ? e.message : "渲染未完成，请核对资源及服务额度";
    await env.CASE_DB.batch([
      stmt(
        env,
        `UPDATE sample_agreement_versions SET pdf_status=? WHERE request_id=? AND revision_no=? AND ${"EXISTS (SELECT 1 FROM sample_jobs WHERE " + fence + ")"}`,
        [status, acquired.request_id, acquired.revision_no, ...fenceValues()],
      ),
      stmt(
        env,
        `UPDATE sample_jobs SET status=?,next_attempt_at=?,lease_owner=NULL,lease_expires_at=NULL,error_code=?,error_detail=? WHERE ${fence}`,
        [status, next, code, description, ...fenceValues()],
      ),
    ]);
    return { failed: true, code, status };
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}
export async function repairJobs(env) {
  const now = iso();
  await env.CASE_DB.batch([
    stmt(
      env,
      "UPDATE sample_agreement_versions SET pdf_status='failed_permanent' WHERE EXISTS (SELECT 1 FROM sample_jobs j WHERE j.request_id=sample_agreement_versions.request_id AND j.revision_no=sample_agreement_versions.revision_no AND j.status='processing' AND j.lease_expires_at<? AND j.attempt_count>=5)",
      [now],
    ),
    stmt(
      env,
      "UPDATE sample_jobs SET status=CASE WHEN attempt_count>=5 THEN 'failed_permanent' ELSE 'retry_wait' END,lease_owner=NULL,lease_expires_at=NULL,next_attempt_at=?,error_code=CASE WHEN attempt_count>=5 THEN 'ATTEMPTS_EXHAUSTED' ELSE 'LEASE_EXPIRED' END,error_detail=CASE WHEN attempt_count>=5 THEN '多次执行未完成，请人工核对资源与服务状态' ELSE '任务租约已过期，等待恢复' END WHERE status='processing' AND lease_expires_at<?",
      [now, now],
    ),
  ]);
  const phases = await Promise.allSettled([
    enqueuePending(env),
    (async () => {
      await maintainData(env);
      await sweepOrphanDocuments(env);
    })(),
  ]);
  const failures = [];
  phases.forEach((phase, index) => {
    if (phase.status === "rejected") {
      console.error(
        JSON.stringify({
          service: "sample-scheduler",
          phase: index === 0 ? "enqueue" : "maintenance",
          error: phase.reason.name,
        }),
      );
      failures.push(phase.reason);
    }
  });
  if (failures.length)
    throw new AggregateError(failures, "Sample scheduler did not complete");
  await stmt(
    env,
    "INSERT INTO sample_counters(name,value) VALUES('last_scheduler_ms',?) ON CONFLICT(name) DO UPDATE SET value=excluded.value",
    [Date.now()],
  ).run();
}
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        assert(
          typeof message.body?.jobId === "string",
          "INVALID_MESSAGE",
          "任务消息不符",
          422,
        );
        await runJob(env, message.body.jobId);
        message.ack();
      } catch (e) {
        console.error(
          JSON.stringify({
            service: "sample-jobs",
            messageId: message.id,
            error: e.constructor.name,
          }),
        );
        message.retry({ delaySeconds: 60 });
      }
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(repairJobs(env));
  },
  fetch() {
    return new Response("Not found", { status: 404 });
  },
};
