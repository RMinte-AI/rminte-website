import {
  exact,
  text,
  integer,
  requireField,
  fail,
  iso,
} from "../sample-loan/domain.mjs";
export const MAX_DEALER_PDF_BYTES = 20 * 1024 * 1024;
export const DEALER_LANGUAGES = ["zh", "en", "ja", "ko", "es", "fr"];
const get = (env, sql, ...args) =>
  env.CASE_DB.prepare(sql)
    .bind(...args)
    .first();
const all = async (env, sql, ...args) =>
  (
    await env.CASE_DB.prepare(sql)
      .bind(...args)
      .all()
  ).results;
function metadata(d) {
  exact(d, ["titles", "fileLanguage", "expectedVersion"]);
  requireField(
    d.titles && typeof d.titles === "object" && !Array.isArray(d.titles),
    "titles",
    "请填写至少一种语言的展示名称",
  );
  const titles = {};
  for (const [lang, title] of Object.entries(d.titles)) {
    requireField(
      DEALER_LANGUAGES.includes(lang),
      "titles",
      "请选择网站支持的语言",
    );
    titles[lang] = text(title, "titles." + lang, 200);
  }
  requireField(
    Object.keys(titles).length > 0,
    "titles",
    "请填写至少一种语言的展示名称",
  );
  requireField(
    [...DEALER_LANGUAGES, "multi"].includes(d.fileLanguage),
    "fileLanguage",
    "请选择文件实际语言",
  );
  return { titles, fileLanguage: d.fileLanguage };
}
const access =
  "EXISTS(SELECT 1 FROM users u JOIN sessions s ON s.user_id=u.id WHERE u.id=? AND s.token_hash=? AND s.expires_at>? AND u.role='admin' AND u.disabled_at IS NULL AND u.must_change_password=0 AND EXISTS(SELECT 1 FROM access_settings WHERE id=1 AND ready=1))";
async function write(env, user, sql, args, action, id) {
  const auth = [user.id, user.session_hash, Math.floor(Date.now() / 1000)];
  const result = await env.CASE_DB.batch([
    env.CASE_DB.prepare(sql.replace("$access", access)).bind(...args, ...auth),
    env.CASE_DB.prepare(
      "INSERT INTO permission_events(id,actor_id,target_id,action,details,occurred_at) SELECT ?,?,?,?,?,? WHERE changes()=1",
    ).bind(
      crypto.randomUUID(),
      user.id,
      id,
      action,
      "{}",
      Math.floor(Date.now() / 1000),
    ),
  ]);
  if (!result[0].meta.changes)
    fail(409, "VERSION_CONFLICT", "资料或权限已变化，请刷新后重新核对");
}
export async function listDealerMaterials(env, lang = null) {
  if (lang !== null && !DEALER_LANGUAGES.includes(lang))
    fail(422, "INVALID_LANGUAGE", "语言不受支持");
  const items = await all(
    env,
    "SELECT * FROM dealer_materials" +
      (lang
        ? " WHERE status='published' AND json_extract(titles_json,?) IS NOT NULL"
        : "") +
      " ORDER BY created_at,id",
    ...(lang ? ["$." + lang] : []),
  );
  const files = [];
  for (const r of items) {
    let size = r.size;
    if (size === null && r.status === "published") {
      if (!env.CASE_FILES) fail(503, "STORAGE_UNAVAILABLE", "资料存储尚未配置");
      size = (await env.CASE_FILES.head(r.object_key))?.size ?? null;
    }
    if (lang && size === null) continue;
    files.push({
      id: r.id,
      ...(lang
        ? { title: JSON.parse(r.titles_json)[lang] }
        : {
            titles: JSON.parse(r.titles_json),
            version: r.row_version,
            status: r.status,
            cleanupPending: !!r.obsolete_key,
            updatedAt: r.updated_at,
          }),
      fileLanguage: r.file_language,
      size,
      fileName: r.file_name,
      downloadUrl: "/api/dealer-materials/" + r.id + "/download",
    });
  }
  return { files };
}
export async function dealerDownload(env, id, method) {
  const item = await get(
    env,
    "SELECT * FROM dealer_materials WHERE id=? AND status='published'",
    id,
  );
  if (!item) fail(404, "NOT_FOUND", "资料不存在");
  if (!env.CASE_FILES)
    fail(503, "STORAGE_UNAVAILABLE", "经销商资料存储尚未配置");
  const object = await env.CASE_FILES[method === "HEAD" ? "head" : "get"](
    item.object_key,
  );
  if (!object) fail(404, "NOT_FOUND", "资料不存在");
  return new Response(method === "HEAD" ? null : object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(object.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(item.file_name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function dealerCommand(request, env, user, id, d = null) {
  const method = request.method,
    now = iso();
  if (!env.CASE_FILES)
    fail(503, "STORAGE_UNAVAILABLE", "经销商资料存储尚未配置");
  if (!id && method === "POST") {
    const m = metadata(d),
      key = crypto.randomUUID();
    await write(
      env,
      user,
      "INSERT INTO dealer_materials(id,titles_json,file_language,object_key,file_name,status,created_by,created_at,updated_at) SELECT ?,?,?,?,?,'draft',?,?,? WHERE $access",
      [
        key,
        JSON.stringify(m.titles),
        m.fileLanguage,
        "dealer/" + key + "/" + crypto.randomUUID() + ".pdf",
        "document.pdf",
        user.id,
        now,
        now,
      ],
      "dealer.created",
      key,
    );
    return { id: key, version: 1 };
  }
  const r = await get(env, "SELECT * FROM dealer_materials WHERE id=?", id);
  if (!r) fail(404, "NOT_FOUND", "资料不存在");
  const version = integer(
    method === "PATCH"
      ? d.expectedVersion
      : Number(request.headers.get("If-Match")),
    "expectedVersion",
  );
  if (version !== r.row_version)
    fail(409, "VERSION_CONFLICT", "资料已变化，请刷新后重新核对");
  if (method === "POST") {
    if (!r.obsolete_key) fail(409, "NO_CLEANUP", "没有待清理文件");
    await env.CASE_FILES.delete(r.obsolete_key);
    await write(
      env,
      user,
      "UPDATE dealer_materials SET obsolete_key=NULL,row_version=row_version+1 WHERE id=? AND row_version=? AND $access",
      [id, version],
      "dealer.cleaned",
      id,
    );
    return { id, version: version + 1 };
  }
  if (method === "PATCH") {
    const m = metadata(d);
    if (r.status === "deleting")
      fail(409, "DELETE_IN_PROGRESS", "资料正在删除");
    await write(
      env,
      user,
      "UPDATE dealer_materials SET titles_json=?,file_language=?,updated_at=?,row_version=row_version+1 WHERE id=? AND row_version=? AND status<>'deleting' AND $access",
      [JSON.stringify(m.titles), m.fileLanguage, now, id, version],
      "dealer.updated",
      id,
    );
    return { id, version: version + 1 };
  }
  if (method === "DELETE") {
    await write(
      env,
      user,
      "UPDATE dealer_materials SET status='deleting',updated_at=?,row_version=row_version+1 WHERE id=? AND row_version=? AND $access",
      [now, id, version],
      "dealer.deleting",
      id,
    );
    if (r.obsolete_key) await env.CASE_FILES.delete(r.obsolete_key);
    await env.CASE_FILES.delete(r.object_key);
    await write(
      env,
      user,
      "DELETE FROM dealer_materials WHERE id=? AND row_version=? AND $access",
      [id, version + 1],
      "dealer.deleted",
      id,
    );
    return { ok: true };
  }
  if (r.status === "deleting") fail(409, "DELETE_IN_PROGRESS", "资料正在删除");
  if (r.obsolete_key) fail(409, "CLEANUP_REQUIRED", "请先完成旧文件清理");
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/pdf"
  )
    fail(415, "PDF_REQUIRED", "请选择 PDF 文件", { pdf: "请选择 PDF 文件" });
  let decodedName;
  try {
    decodedName = decodeURIComponent(request.headers.get("X-File-Name") || "");
  } catch {
    requireField(false, "fileName", "请使用有效文件名");
  }
  const name = text(decodedName, "fileName", 200);
  requireField(!/[\\/\r\n]/.test(name), "fileName", "请使用有效文件名");
  const reader = request.body?.getReader();
  if (!reader)
    fail(400, "EMPTY_BODY", "缺少 PDF 文件", { pdf: "缺少 PDF 文件" });
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_DEALER_PDF_BYTES) {
      await reader.cancel();
      fail(413, "FILE_TOO_LARGE", "PDF 不能超过 20 MB", {
        pdf: "PDF 不能超过 20 MB",
      });
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-")
    fail(400, "INVALID_PDF", "文件不是有效的 PDF", {
      pdf: "文件不是有效的 PDF",
    });
  const key = "dealer/" + id + "/" + crypto.randomUUID() + ".pdf";
  await env.CASE_FILES.put(key, bytes, {
    httpMetadata: { contentType: "application/pdf" },
  });
  try {
    await write(
      env,
      user,
      "UPDATE dealer_materials SET object_key=?,obsolete_key=?,file_name=?,size=?,status='published',updated_at=?,row_version=row_version+1 WHERE id=? AND row_version=? AND status<>'deleting' AND $access",
      [
        key,
        r.status === "published" ? r.object_key : null,
        name,
        size,
        now,
        id,
        version,
      ],
      "dealer.uploaded",
      id,
    );
  } catch (e) {
    await env.CASE_FILES.delete(key);
    throw e;
  }
  return {
    id,
    size,
    version: version + 1,
    cleanupPending: r.status === "published",
  };
}
