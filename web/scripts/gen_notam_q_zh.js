import fs from "node:fs";

const subject = JSON.parse(
  fs.readFileSync("web/src/data/lexicons/notam_q_subject_en.json", "utf8")
);
const condition = JSON.parse(
  fs.readFileSync("web/src/data/lexicons/notam_q_condition_en.json", "utf8")
);

const dictionary = [
  ["en route", "航路"],
  ["crossing", "穿越"],
  ["safe", "安全"],
  ["minimum altitude", "最低高度"],
  ["maximum altitude", "最高高度"],
  ["surface area", "地面区域"],
  ["control area", "管制区"],
  ["air defense identification zone", "防空识别区"],
  ["air traffic control", "空中交通管制"],
  ["air traffic", "空中交通"],
  ["minimum", "最低"],
  ["maximum", "最高"],
  ["altitude", "高度"],
  ["flight level", "飞行高度层"],
  ["class b, c, d, or e surface area", "B/C/D/E 级地面区域"],
  ["class a", "A 级"],
  ["class b", "B 级"],
  ["class c", "C 级"],
  ["class d", "D 级"],
  ["class e", "E 级"],
  ["airspace", "空域"],
  ["airspace organization", "空域组织"],
  ["approach", "进近"],
  ["procedures", "程序"],
  ["procedure", "程序"],
  ["aerodrome", "机场"],
  ["airport", "机场"],
  ["runway", "跑道"],
  ["taxiway", "滑行道"],
  ["apron", "机坪"],
  ["lighting", "灯光"],
  ["light", "灯光"],
  ["obstacle", "障碍物"],
  ["equipment", "设备"],
  ["navigation", "导航"],
  ["navigational", "导航"],
  ["radar", "雷达"],
  ["communication", "通信"],
  ["communications", "通信"],
  ["control", "管制"],
  ["service", "服务"],
  ["services", "服务"],
  ["route", "航路"],
  ["routes", "航路"],
  ["air traffic", "空中交通"],
  ["traffic", "交通"],
  ["restriction", "限制"],
  ["restricted", "限制"],
  ["prohibited", "禁止"],
  ["danger", "危险"],
  ["area", "区域"],
  ["areas", "区域"],
  ["temporary", "临时"],
  ["permanent", "永久"],
  ["closed", "关闭"],
  ["unserviceable", "不可用"],
  ["available", "可用"],
  ["unavailable", "不可用"],
  ["warning", "警告"],
  ["warning area", "警告区"],
  ["facility", "设施"],
  ["facilities", "设施"],
  ["system", "系统"],
  ["signal", "信号"],
  ["beacon", "信标"],
  ["marker", "标志"],
  ["holding", "等待"],
  ["departure", "离场"],
  ["arrival", "到达"],
  ["instrument", "仪表"],
  ["visual", "目视"],
  ["procedure(s)", "程序"],
  ["operation", "运行"],
  ["operations", "运行"],
  ["level", "高度层"],
  ["frequency", "频率"],
  ["flight", "飞行"],
  ["meteorological", "气象"],
  ["information", "信息"],
  ["reporting", "报告"],
  ["surface", "地面"],
  ["ground", "地面"],
  ["radionavigation", "无线电导航"],
  ["aid", "设施"],
  ["unit", "单位"],
  ["centre", "中心"],
  ["center", "中心"],
  ["warning", "警告"],
  ["hazard", "危险"],
  ["hazardous", "危险"],
  ["observation", "观测"],
  ["search and rescue", "搜救"],
  ["rescue", "救援"],
  ["training", "训练"],
  ["exercise", "演练"],
  ["work", "施工"],
  ["construction", "施工"],
  ["survey", "测量"],
  ["maintenance", "维护"],
  ["testing", "测试"],
  ["activation", "启用"],
  ["withdrawn", "撤销"],
  ["withdrawn for maintenance", "维修停用"],
  ["limited to", "限于"],
  ["closed to vfr operations", "VFR 禁止"],
  ["closed to ifr operations", "IFR 禁止"],
  ["operating but caution advised due to", "运行中但需谨慎，原因"],
  ["will take place", "将进行"],
  ["instrument flight rules", "仪表飞行规则"],
  ["visual flight rules", "目视飞行规则"],
  ["flight information region", "飞行情报区"],
  ["approach lighting system", "进近灯光系统"],
  ["approach", "进近"],
  ["departure", "离场"],
  ["arrival", "到达"],
  ["holding", "等待"],
  ["heliport", "直升机场"],
  ["helipad", "直升机坪"],
  ["surface", "地面"],
  ["runway", "跑道"],
  ["taxiway", "滑行道"],
  ["apron", "机坪"],
  ["closed", "关闭"],
  ["unserviceable", "不可用"],
  ["available", "可用"],
  ["unavailable", "不可用"],
];

function translate(text) {
  let result = text;
  dictionary.forEach(([en, zh]) => {
    const re = new RegExp(`\\b${en}\\b`, "gi");
    result = result.replace(re, zh);
  });
  return result;
}

function translateMap(map) {
  const out = {};
  Object.entries(map).forEach(([code, text]) => {
    out[code] = translate(text);
  });
  return out;
}

const subjectZh = translateMap(subject);
const conditionZh = translateMap(condition);

fs.writeFileSync(
  "web/src/data/lexicons/notam_q_subject_zh.json",
  JSON.stringify(subjectZh, null, 2)
);
fs.writeFileSync(
  "web/src/data/lexicons/notam_q_condition_zh.json",
  JSON.stringify(conditionZh, null, 2)
);

console.log("generated zh subject/condition");
