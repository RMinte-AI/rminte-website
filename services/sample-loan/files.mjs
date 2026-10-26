import { createHash } from "node:crypto";
import { assert, exact, text, iso, integer, fail } from "./domain.mjs";
import {
  first,
  stmt,
  mutation,
  priorMutation,
  eventStatement,
} from "./store.mjs";
export async function hashStream(stream) {
  const h = createHash("sha256");
  let size = 0;
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    h.update(value);
    size += value.length;
  }
  return { hash: h.digest("hex"), size };
}
export async function uploadCommand(
  request,
  env,
  user,
  requestId,
  action,
  id,
  d,
) {
  assert(env.SAMPLE_FILES, "STORAGE_UNAVAILABLE", "样机文件存储尚未配置", 503);
  const source = await first(
    env,
    "SELECT purge_after_at FROM sample_requests WHERE id=?",
    [requestId],
  );
  assert(
    source && !source.purge_after_at,
    "RETENTION_CLEANUP",
    "申请资料已进入清理流程",
    410,
  );
  const scope =
    action === "init"
      ? "uploads/" + requestId
      : action === "complete"
        ? "uploads/" + id + "/complete"
        : null;
  if (scope) {
    const prior = await priorMutation(env, request, user, scope, d);
    if (prior) return prior;
  }
  if (action === "init") {
    exact(d, ["name", "mime"]);
    const name = text(d.name, "name", 255);
    assert(
      ["image/jpeg", "image/png", "image/webp"].includes(d.mime),
      "INVALID_IMAGE",
      "仅支持JPEG、PNG、WebP图片",
      422,
    );
    const fileId = crypto.randomUUID(),
      key = `originals/${requestId}/${fileId}`,
      upload = await env.SAMPLE_FILES.createMultipartUpload(key, {
        httpMetadata: { contentType: d.mime },
      }),
      now = iso();
    let result;
    try {
      result = await mutation(env, request, user, {
        scope: "uploads/" + requestId,
        data: d,
        statements: [
          [
            "INSERT INTO sample_files(id,request_id,original_key,upload_id,name,mime,created_at,updated_at,parts_json) SELECT ?,?,?,?,?,?,?,?,? WHERE $gate",
            [
              fileId,
              requestId,
              key,
              upload.uploadId,
              name,
              d.mime,
              now,
              now,
              "{}",
            ],
          ],
        ],
        result: { id: fileId, partSize: 8388608 },
      });
    } catch (e) {
      await upload.abort();
      throw e;
    }
    if (result.id !== fileId) await upload.abort();
    return { id: result.id, partSize: 8388608 };
  }
  const f = await first(
    env,
    "SELECT * FROM sample_files WHERE id=? AND request_id=?",
    [id, requestId],
  );
  assert(f, "NOT_FOUND", "附件不存在", 404);
  assert(
    f.status === "uploading",
    "UPLOAD_FINISHED",
    "附件已完成或不可继续上传",
  );
  const upload = env.SAMPLE_FILES.resumeMultipartUpload(
    f.original_key,
    f.upload_id,
  );
  if (action === "part") {
    const partNumber = integer(
        Number(new URL(request.url).searchParams.get("partNumber")),
        "partNumber",
        1,
        10000,
      ),
      length = Number(request.headers.get("content-length"));
    assert(
      length > 0 && length <= 8388608,
      "INVALID_PART_SIZE",
      "分片须大于0且不超过8MiB",
      413,
    );
    assert(request.body, "EMPTY_BODY", "分片不能为空", 422);
    // A bounded part is accepted only after its actual size is checked; no unbounded Buffer.
    const reader = request.body.getReader(),
      chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8388608) {
        await reader.cancel();
        fail(413, "INVALID_PART_SIZE", "分片超过8MiB");
      }
      chunks.push(value);
    }
    assert(size === length, "INVALID_PART_SIZE", "分片长度不符", 422);
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    const part = await upload.uploadPart(partNumber, bytes);
    const changed = await stmt(
      env,
      "UPDATE sample_files SET parts_json=json_set(parts_json,?,json(?)),updated_at=? WHERE id=? AND request_id=? AND status='uploading'",
      ['$."' + partNumber + '"', JSON.stringify(part), iso(), id, requestId],
    ).run();
    assert(changed.meta.changes, "UPLOAD_FINISHED", "附件状态已改变");
    return part;
  }
  exact(d, ["sha256"]);
  assert(
    d.sha256 === undefined ||
      d.sha256 === null ||
      (typeof d.sha256 === "string" && /^[a-f0-9]{64}$/.test(d.sha256)),
    "INVALID_HASH",
    "请提供原图SHA-256",
    422,
  );
  const parts = Object.values(JSON.parse(f.parts_json)).sort(
    (a, b) => a.partNumber - b.partNumber,
  );
  assert(
    parts.length && parts.every((p, i) => p.partNumber === i + 1),
    "MISSING_PART",
    "分片不完整",
    422,
  );
  if (!(await env.SAMPLE_FILES.head(f.original_key)))
    await upload.complete(parts);
  const original = await env.SAMPLE_FILES.get(f.original_key);
  assert(original, "UPLOAD_MISSING", "原图未保存", 503);
  const head = await env.SAMPLE_FILES.get(f.original_key, {
      range: { offset: 0, length: 16 },
    }),
    signature = new Uint8Array(await head.arrayBuffer()),
    ascii = new TextDecoder("latin1").decode(signature);
  const valid =
    f.mime === "image/jpeg"
      ? signature[0] === 255 && signature[1] === 216 && signature[2] === 255
      : f.mime === "image/png"
        ? signature
            .slice(0, 8)
            .every((v, i) => v === [137, 80, 78, 71, 13, 10, 26, 10][i]) &&
          signature.length >= 8
        : ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP";
  assert(valid, "INVALID_IMAGE", "文件内容与图片格式不符", 422);
  const checked = await hashStream(original.body);
  assert(
    !d.sha256 || checked.hash === d.sha256,
    "HASH_MISMATCH",
    "原图校验不符，请重新上传",
    422,
  );
  await mutation(env, request, user, {
    scope: "uploads/" + id + "/complete",
    data: d,
    statements: [
      [
        "UPDATE sample_files SET status='uploaded',original_hash=?,original_size=?,updated_at=? WHERE id=? AND request_id=? AND $gate",
        [checked.hash, checked.size, iso(), id, requestId],
      ],
      eventStatement(requestId, null, user, "file.uploaded", {
        fileId: id,
        name: f.name,
      }),
    ],
    result: { id },
  });
  return { id, status: "uploaded", sha256: checked.hash, size: checked.size };
}
