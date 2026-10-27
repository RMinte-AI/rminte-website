import { createUI } from "../sample-loan/ui.mjs";
const LANGUAGES = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
};
export function setupDealerLibrary({ api, toast, report }) {
  const root = document.querySelector("#dealer-panel"),
    ui = createUI(root),
    {
      $,
      validateForm,
      clearFieldError,
      serverErrors,
      installSelects,
      refreshSelects,
      wireDialogs,
      showDialog,
    } = ui;
  const form = $("#dealer-form"),
    dialog = $("#dealer-editor"),
    slot = $("#dealer-files");
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const options =
    '<option value="">请选择语言</option>' +
    Object.entries(LANGUAGES)
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join("");
  $("#dealer-translations").innerHTML = Object.keys(LANGUAGES)
    .map(
      (_, i) =>
        `<div class="translation-row" data-index="${i}" hidden><label class="field cs-field"><span>语言</span><select name="language${i}" required disabled>${options}</select></label><label class="field cs-field"><span>展示名称</span><input name="title${i}" required maxlength="200" disabled></label><button type="button" class="ad-btn" data-remove-language="${i}">移除</button></div>`,
    )
    .join("");
  form.elements.fileLanguage.innerHTML =
    options + '<option value="multi">多语言</option>';
  wireDialogs();
  installSelects();
  let files = [],
    editing = null,
    saving = false,
    opener = null;
  const rows = () => [...root.querySelectorAll(".translation-row")];
  function rowState(row, on) {
    row.hidden = !on;
    row.querySelectorAll("input,select").forEach((x) => (x.disabled = !on));
    if (!on) {
      row.querySelectorAll("input,select").forEach(clearFieldError);
      row.querySelector("input").value = "";
      row.querySelector("select").value = "";
    }
    $("#add-dealer-language").disabled = rows().every((x) => !x.hidden);
    refreshSelects(form);
  }
  async function load() {
    try {
      files = (await api("/api/admin/dealer-materials")).files;
      slot.innerHTML = files.length
        ? `<table class="ad-table"><thead><tr><th>资料名称</th><th>语言 / 文件</th><th>状态 / 更新时间</th><th>操作</th></tr></thead><tbody>${files
            .map(
              (f) =>
                `<tr data-dealer-id="${f.id}"><td data-label="资料名称">${esc(f.titles.zh || Object.values(f.titles)[0])}</td><td data-label="语言 / 文件">${Object.keys(
                  f.titles,
                )
                  .map((k) => LANGUAGES[k])
                  .join(
                    " · ",
                  )}<span class="s">${esc(f.fileName)}</span><span class="s">文件：${LANGUAGES[f.fileLanguage] || "多语言"}${f.size !== null ? " · " + (f.size / 1048576).toFixed(1) + " MB" : ""}</span></td><td data-label="状态 / 更新时间">${f.status === "deleting" ? "删除未完成" : f.status === "draft" || f.size === null ? "待上传 PDF" : f.cleanupPending ? "已发布 · 旧文件待清理" : "已发布"}<span class="s" title="${esc(f.updatedAt)}">${new Date(f.updatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}</span></td><td data-label="操作"><div class="ad-ops">${f.status !== "deleting" ? '<button type="button" class="ad-btn" data-edit-dealer>编辑 / 替换</button>' : ""}${f.cleanupPending && f.status !== "deleting" ? '<button type="button" class="ad-btn" data-clean-dealer>清理旧文件</button>' : ""}<button type="button" class="ad-btn" data-delete-dealer>${f.status === "deleting" ? "继续删除" : "删除"}</button></div></td></tr>`,
            )
            .join("")}</tbody></table>`
        : '<p class="ad-note">尚无经销商资料，点击“添加资料”开始。</p>';
    } catch (e) {
      report(e);
    }
  }
  function open(file, button) {
    editing = file;
    opener = button;
    form.reset();
    rows().forEach((r) => rowState(r, false));
    Object.entries(file?.titles || { zh: "" }).forEach(([lang, title], i) => {
      const row = rows()[i];
      rowState(row, true);
      form.elements["language" + i].value = lang;
      form.elements["title" + i].value = title;
    });
    form.elements.fileLanguage.value = file?.fileLanguage || "zh";
    form.elements.pdf.required =
      !file || file.status === "draft" || file.size === null;
    $("#dealer-error").hidden = true;
    [...form.elements].forEach(clearFieldError);
    refreshSelects(form);
    $("#dealer-edit-title").textContent = file ? "修改资料" : "添加资料";
    showDialog(dialog);
  }
  $("#add-dealer").onclick = (e) => open(null, e.currentTarget);
  $("#refresh-dealer").onclick = load;
  $("#add-dealer-language").onclick = () => {
    const row = rows().find((r) => r.hidden);
    if (row) rowState(row, true);
  };
  $("#dealer-translations").onclick = (e) => {
    const b = e.target.closest("[data-remove-language]");
    if (!b) return;
    if (rows().filter((r) => !r.hidden).length === 1) {
      $("#dealer-error").textContent = "请至少保留一种语言名称";
      $("#dealer-error").hidden = false;
      return;
    }
    rowState(rows()[Number(b.dataset.removeLanguage)], false);
  };
  dialog.addEventListener(
    "click",
    (e) => {
      if (saving && e.target === dialog) e.stopImmediatePropagation();
    },
    true,
  );
  dialog.addEventListener("cancel", (e) => {
    if (saving) e.preventDefault();
  });
  dialog.addEventListener("close", () => opener?.focus());
  slot.onclick = async (e) => {
    const b = e.target.closest("button"),
      row = b?.closest("[data-dealer-id]");
    if (!row) return;
    const f = files.find((x) => x.id === row.dataset.dealerId);
    if (b.hasAttribute("data-edit-dealer")) return open(f, b);
    if (b.hasAttribute("data-delete-dealer")) {
      b.closest(".ad-ops").innerHTML =
        '<span class="ad-note">删除后原链接将不可下载</span><button type="button" class="ad-btn" data-confirm-dealer>确认删除</button><button type="button" class="ad-btn" data-cancel-dealer>取消</button>';
      row.querySelector("[data-confirm-dealer]").focus();
      return;
    }
    if (b.hasAttribute("data-cancel-dealer")) return load();
    b.disabled = true;
    try {
      await api("/api/admin/dealer-materials/" + f.id, {
        method: b.hasAttribute("data-clean-dealer") ? "POST" : "DELETE",
        headers: { "If-Match": String(f.version) },
      });
      toast("已完成", "资料列表已更新。");
    } catch (err) {
      report(err);
    } finally {
      await load();
    }
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (saving || !validateForm(form)) return;
    $("#dealer-error").hidden = true;
    const titles = {},
      mapping = { fileLanguage: "fileLanguage", pdf: "fileName" };
    for (const row of rows().filter((r) => !r.hidden)) {
      const i = row.dataset.index,
        lang = form.elements["language" + i].value;
      if (Object.hasOwn(titles, lang)) {
        serverErrors(form, { ["language" + i]: "同一种语言只能填写一行" });
        return;
      }
      titles[lang] = form.elements["title" + i].value.trim();
      mapping["title" + i] = "titles." + lang;
    }
    const pdf = form.elements.pdf.files[0];
    if (pdf && pdf.size > 20 * 1048576) {
      serverErrors(form, { pdf: "PDF 不能超过 20 MB" });
      return;
    }
    const controls = [...form.elements].map((el) => [el, el.disabled]);
    saving = true;
    controls.forEach(([el]) => (el.disabled = true));
    refreshSelects(form);
    let problem;
    try {
      const data = {
        titles,
        fileLanguage: form.elements.fileLanguage.value,
        ...(editing ? { expectedVersion: editing.version } : {}),
      };
      const saved = await api(
        "/api/admin/dealer-materials" + (editing ? "/" + editing.id : ""),
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) },
      );
      editing = {
        ...editing,
        id: saved.id,
        version: saved.version,
        titles,
        fileLanguage: data.fileLanguage,
      };
      if (pdf) {
        const uploaded = await api(
          "/api/admin/dealer-materials/" + editing.id,
          {
            method: "PUT",
            headers: {
              "If-Match": String(editing.version),
              "X-File-Name": encodeURIComponent(pdf.name),
              "Content-Type": "application/pdf",
            },
            body: pdf,
          },
        );
        editing.version = uploaded.version;
        form.elements.pdf.required = false;
        form.elements.pdf.value = "";
        if (uploaded.cleanupPending) {
          try {
            await api("/api/admin/dealer-materials/" + editing.id, {
              method: "POST",
              headers: { "If-Match": String(editing.version) },
            });
          } catch (err) {
            dialog.close();
            toast(
              "资料已保存，旧文件未清理",
              err.message + "。请在列表中点击“清理旧文件”。",
            );
            return;
          }
        }
      }
      dialog.close();
      toast("已保存", "已填写名称的语言页面会显示这份资料。");
    } catch (err) {
      problem = err;
    } finally {
      saving = false;
      controls.forEach(([el, disabled]) => (el.disabled = disabled));
      refreshSelects(form);
      if (problem && !serverErrors(form, problem.fieldErrors, mapping)) {
        $("#dealer-error").textContent = problem.message;
        $("#dealer-error").hidden = false;
      }
      await load();
    }
  };
  return { load };
}
