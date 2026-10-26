import { flat, MODELS, inputUtc } from "./fields.mjs";
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const timePair = (v) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
  }).format(new Date(v)) +
  " UTC+08:00 / " +
  v;
const termDays = (a, b) =>
  Math.round(
    (Date.parse(new Date(Date.parse(a) + 28800000).toISOString().slice(0, 10)) -
      Date.parse(
        new Date(Date.parse(b) + 28800000).toISOString().slice(0, 10),
      )) /
      -86400000,
  ) + 1;
function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}
export function markdown(blocks) {
  let html = "",
    list = "",
    paragraph = [],
    table = [];
  function flushParagraph() {
    if (paragraph.length) {
      html += `<p>${inlineMarkdown(paragraph.join("\n"))}</p>`;
      paragraph = [];
    }
  }
  function closeList() {
    if (list) {
      html += `</${list}>`;
      list = "";
    }
  }
  function flushTable() {
    if (!table.length) return;
    const rows = table.filter((line) => !/^\|[\s:|\-]+\|$/.test(line));
    html +=
      "<table><tbody>" +
      rows
        .map(
          (line, index) =>
            `<tr>${line
              .slice(1, -1)
              .split("|")
              .map(
                (cell) =>
                  `<${index === 0 ? "th" : "td"}>${inlineMarkdown(cell.trim())}</${index === 0 ? "th" : "td"}>`,
              )
              .join("")}</tr>`,
        )
        .join("") +
      "</tbody></table>";
    table = [];
  }
  for (const line of blocks.split("\n")) {
    if (line.startsWith("|")) {
      flushParagraph();
      closeList();
      table.push(line);
      continue;
    }
    flushTable();
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    if (/^#{1,3} /.test(line)) {
      flushParagraph();
      closeList();
      const n = line.match(/^#+/)[0].length;
      html += `<h${n}>${inlineMarkdown(line.slice(n + 1))}</h${n}>`;
      continue;
    }
    const item = line.match(/^\s*(?:\d+\.|-) (.+)$/);
    if (item) {
      flushParagraph();
      const number = line.match(/^\s*(\d+)\./)?.[1];
      const tag = number ? "ol" : "ul";
      if (list !== tag) {
        closeList();
        html += number ? `<ol start="${number}">` : "<ul>";
        list = tag;
      }
      html += `<li>${inlineMarkdown(item[1])}</li>`;
      continue;
    }
    closeList();
    if (line.startsWith("> ")) {
      flushParagraph();
      html += `<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`;
      continue;
    }
    paragraph.push(line);
  }
  flushTable();
  flushParagraph();
  closeList();
  return html;
}
export function renderContract(snapshot, terms, photos = []) {
  const request = snapshot
    ? {
        id: snapshot.publicNo,
        days: snapshot.requestedDays,
        original: { model: MODELS[snapshot.modelKey] },
        submittedAt: snapshot.submittedAt,
        approvedAt: snapshot.approvedAt,
        approvedBy: snapshot.approvedBy,
        status: "approved",
        acceptance: terms,
        snapshot: flat(snapshot),
      }
    : null;
  const approved = !!snapshot;
  const documentText = (input) => escapeHtml(input).replaceAll("\n", "<br>");
  const data = snapshot ? flat(snapshot) : {};
  const value = (key) =>
    data[key] ? String(data[key]) : approved ? "未填写" : "【待填写】";
  const lenderValue = (key, fallback) => (request ? value(key) : fallback);
  const period = request ? request.days : data.days || "【申请天数】";
  const pairs = {
    "[乙方选择的型号]": request ? request.original.model : value("model"),
    "[与申请型号对应的机器配置]": value("model"),
    "[NO]": value("no"),
    "[SN]": value("sn"),
    "[金额及币种；用于本协议约定的货物价值计费基数]": `${value("value")} ${data.currency || "CNY"}`,
    "[样机默认账户信息]": value("defaultAccountInfo"),
    "[名称、规格、数量及交付状态]": value("accessories"),
    "[检查结果]": value("inspection"),
    "[承运商、快递单号]": `${value("carrier")} / ${value("tracking")}`,
    "[甲方指定收件人、电话和完整地址]": `${value("returnName")} / ${value("returnPhone")} / ${value("returnAddress")}`,
    "[存储卡品牌、型号、容量、接口及性能等级]": value("cardSpecs"),
    "[存储卡序列号]": value("cardSerial"),
    "[与整机价值一致的保价金额、币种及凭证编号]": `${value("insuredValue")} / ${data.insuranceProof || "发货前核对实际保价凭证"}`,
    "[天数]": String(period),
    "[依批复起止时间计算]": snapshot?.schedule
      ? `${termDays(snapshot.schedule.startsAt, snapshot.schedule.dueAt)} 个自然日`
      : "【管理员批复】",
  };
  let clauses = request?.acceptance?.clauses || terms.clauses;
  // Time placeholders appear twice each in the source: start and return deadline.
  const startIso = inputUtc(data.start),
    endIso = inputUtc(data.end);
  clauses = clauses
    .replace(
      "**甲方批复借用起始时间：** [北京时间，UTC+08:00] / [对应 UTC 时间]",
      `**甲方批复借用起始时间：** ${startIso ? timePair(startIso) : "【管理员批复】"}`,
    )
    .replace(
      "**甲方批复归还截止时间：** [北京时间，UTC+08:00] / [对应 UTC 时间]",
      `**甲方批复归还截止时间：** ${endIso ? timePair(endIso) : "【管理员批复】"}`,
    );
  const clausesHtml = markdown(clauses).replace(
    /\[[^\]\n]+\]/g,
    (placeholder) =>
      Object.hasOwn(pairs, placeholder)
        ? documentText(pairs[placeholder])
        : placeholder,
  );
  const metadata = `<div class="document-meta"><span>申请 / 协议编号：<b class="document-value">${documentText(request?.id || "提交申请后生成")}</b></span><span>协议日期：${documentText(data.agreementDate || "审批时填写")}</span><span>条款版本：${documentText(request?.acceptance?.version || terms.version)}</span><span>审批状态：${request ? (approved ? "已批复" : "待批复") : "申请前查看"}</span></div>`;
  const companyFields =
    (data.entity || "公司") === "公司"
      ? `<br>统一社会信用代码（选填）：${documentText(data.credit || "未填写")}<br>注册地址：${documentText(value("registeredAddress"))}`
      : "";
  const parties = `<h2>一、协议双方</h2><p><strong>甲方（出借方）：</strong>${documentText(lenderValue("lender", "泛灵（成都）人工智能科技有限公司"))}<br>地址：${documentText(lenderValue("lenderAddress", "中国（四川）自由贸易试验区成都高新区天府五街200号2栋A区5楼501-502室"))}<br>法定代表人：${documentText(lenderValue("lenderRepresentative", "朱杰"))}<br>联系电话：${documentText(lenderValue("lenderPhone", "15882008185"))}<br>电子邮箱：${documentText(lenderValue("lenderEmail", "support@rminte.com"))}</p><p><strong>乙方（借用方）：</strong>${documentText(value("company"))}<br>主体类型：${documentText(value("entity"))}${companyFields}<br>联系人：${documentText(value("contact"))}<br>联系电话：${documentText(value("phone"))}<br>电子邮箱：${documentText(value("email"))}<br>联系地址：${documentText(value("companyAddress"))}<br>收件人及电话：${documentText(value("receiver"))} / ${documentText(value("receiverPhone"))}<br>收货地址：${documentText(value("shippingAddress"))}</p>${markdown(request?.acceptance?.partyRules || terms.partyRules)}`;
  const deposit = request
    ? `<h2>附表：主体核验及押金报价</h2><p>主体与授权核验：${documentText(data.identityVerified === "yes" ? "已核对" : "待核对")}<br>核验记录：${documentText(value("identityNotes"))}<br>拟付款主体：${documentText(value("payer"))}<br>代付说明：${documentText(data.payerNotes || "无")}<br>应汇押金：${documentText(value("depositAmount"))} ${documentText(data.depositCurrency || "CNY")}<br>汇率来源：${data.depositCurrency === "USD" ? "中国银行美元现汇买入价（每100美元折合人民币）" : "人民币支付，不折算"}<br>采用牌价：${documentText(data.depositCurrency === "USD" ? value("fxRate") : "不适用")}<br>牌价发布时间：${documentText(data.depositCurrency === "USD" && inputUtc(data.fxAt) ? timePair(inputUtc(data.fxAt)) : "不适用")}<br>报价须在确认邮件发出前核对最近一期，24小时从邮件实际送达起算；本附表不证明邮件送达或押金到账。</p>`
    : "";
  const approval = request
    ? `<h2>附表：本次申请与批复记录</h2><p>申请提交时间：${documentText(timePair(request.submittedAt))}<br>批复人员：${documentText(request.approvedBy || "尚未完成")}<br>审批完成时间：${documentText(request.approvedAt ? timePair(request.approvedAt) : "尚未完成")}<br>交付检查时间：${documentText(data.inspectionTime ? timePair(inputUtc(data.inspectionTime)) : "待填写")}<br>批复备注：${documentText(data.approvalNote || "无")}<br>附件说明：${documentText(data.attachmentNotes || "无")}</p>`
    : "";
  const photoMarkup = photos.length
    ? `<h2>附件照片</h2>${photos.map((photo, index) => `<figure><img class="document-photo" src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.name)}"><figcaption>图 ${index + 1} · ${escapeHtml(photo.name)}</figcaption></figure>`).join("")}`
    : "";
  return `<h1>RMinte RM-01 产品借用协议</h1>${metadata}${parties}${clausesHtml}${deposit}${approval}${photoMarkup}`;
}
