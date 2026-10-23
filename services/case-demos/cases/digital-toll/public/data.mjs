// Synthetic fixtures only. No customer records, endpoints or credentials.
export const catalog = [
  {id:'statistics',name:'数据统计',group:'data',icon:'chart-no-axes-combined',tone:'blue',description:'收费数据、车流与支付结构'},
  {id:'automation',name:'AI 数据自动化',group:'data',icon:'sheet',tone:'teal',description:'表格填写与结果核对'},
  {id:'squad',name:'中队日志',group:'data',icon:'notebook-text',tone:'green',description:'班次记录与交接事项'},
  {id:'report',name:'AI 工作汇报',group:'data',icon:'file-text',tone:'purple',description:'运营汇总与汇报整理'},
  {id:'knowledge',name:'收费站知识库',group:'knowledge',icon:'book-open',tone:'blue',description:'资料查询与原文追溯'},
  {id:'exemption',name:'车辆减免查询',group:'knowledge',icon:'car',tone:'yellow',description:'减免记录与核对依据'},
  {id:'payment',name:'支付流水排查',group:'business',icon:'search-check',tone:'pink',description:'流水核对与异常定位'},
  {id:'inspection',name:'车道巡检',group:'business',icon:'scan-line',tone:'teal',description:'设备检查与异常跟进'},
  {id:'archive',name:'执法影像扫描归档',group:'business',icon:'folder-open',tone:'gray',description:'影像识别与记录归档'},
  {id:'video',name:'闯关车辆视频分析',group:'business',icon:'video',tone:'purple',description:'事件梳理与材料整理'},
  {id:'ocr',name:'AI·OCR',group:'business',icon:'scan-text',tone:'green',description:'文档文字与表格识别'}
];
export const groups = [
  {id:'data',name:'数据类能力',description:'问数、统计、填表'},
  {id:'knowledge',name:'知识类能力',description:'资料查询、原文追溯、历史记录'},
  {id:'business',name:'业务类能力',description:'巡检、影像、OCR、异常排查'}
];
export const questions = [
  {id:'daily',label:'出口流水查询',text:'查询 2026 年 9 月 18 日的出口流水'},
  {id:'payments',label:'按支付方式拆分',text:'按支付方式拆分 9 月 18 日的出口流水'},
  {id:'exception',label:'异常流水核对',text:'9 月 18 日有哪些支付流水需要核对？'},
  {id:'policy',label:'查验资料追溯',text:'查询绿通查验的工作记录要求，并展示来源'}
];
export const days = {
  '2026-09-18': {entry:4968,discount:18420,payments:[['ETC',3580,174320],['微信',780,39960],['支付宝',320,15360],['现金',140,6840]]},
  '2026-09-17': {entry:4836,discount:17160,payments:[['ETC',3490,170420],['微信',760,38180],['支付宝',325,14960],['现金',135,6300]]}
};
export function totals(day='2026-09-18') {
  const data=days[day];
  return {traffic:data.payments.reduce((n,row)=>n+row[1],0),revenue:data.payments.reduce((n,row)=>n+row[2],0),...data};
}
export const exemptionRows = [
  ['DEMO-A001','绿通运输','2026-09-18 09:24','查验记录齐全','DEMO-GT-018'],
  ['DEMO-A002','绿通运输','2026-09-18 10:06','待补查验照片','DEMO-GT-019'],
  ['DEMO-A003','公务车辆','2026-09-18 11:32','待核验凭证','DEMO-GW-007']
];
export const paymentRows = [
  ['DEMO-P018','09:18:32','微信','48.00','支付成功','待核对回写'],
  ['DEMO-P027','11:42:16','支付宝','65.00','支付成功','已匹配'],
  ['DEMO-P031','14:26:08','微信','32.00','已退款','待核对退款']
];
export const articles = [
  {id:'green',title:'绿通查验工作记录',section:'第三节 · 记录与复核',keywords:'绿通 查验 工作 记录',body:'记录查验时间、车道、车辆示例编号及查验结论。查验照片与记录应对应；资料缺项时，先补充核实，再提交复核。',source:'《示例收费站作业资料》DEMO-KB-001'},
  {id:'handover',title:'交接班记录要求',section:'第二节 · 交接事项',keywords:'交接 班次 日志',body:'交接时核对设备状态、未完结事项与对应流水编号。接班人员确认后，保留交接时间及后续处理记录。',source:'《示例收费站作业资料》DEMO-KB-002'}
];
export const format = (value, digits=0) => new Intl.NumberFormat('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
