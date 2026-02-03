import fs from "node:fs";

const subjectEn = JSON.parse(
  fs.readFileSync("web/src/data/lexicons/notam_q_subject_en.json", "utf8")
);
const conditionEn = JSON.parse(
  fs.readFileSync("web/src/data/lexicons/notam_q_condition_en.json", "utf8")
);
const subjectZh = JSON.parse(
  fs.readFileSync("web/src/data/lexicons/notam_q_subject_zh.json", "utf8")
);
const conditionZh = JSON.parse(
  fs.readFileSync("web/src/data/lexicons/notam_q_condition_zh.json", "utf8")
);

function merge(en, zh) {
  const merged = {};
  Object.keys(en).forEach((code) => {
    merged[code] = {
      en: en[code],
      "zh-CN": zh[code] || en[code],
    };
  });
  return merged;
}

const subject = merge(subjectEn, subjectZh);
const condition = merge(conditionEn, conditionZh);

fs.writeFileSync(
  "web/src/data/lexicons/notam_q_subject.json",
  JSON.stringify(subject, null, 2)
);
fs.writeFileSync(
  "web/src/data/lexicons/notam_q_condition.json",
  JSON.stringify(condition, null, 2)
);

fs.rmSync("web/src/data/lexicons/notam_q_subject_en.json", { force: true });
fs.rmSync("web/src/data/lexicons/notam_q_condition_en.json", { force: true });
fs.rmSync("web/src/data/lexicons/notam_q_subject_zh.json", { force: true });
fs.rmSync("web/src/data/lexicons/notam_q_condition_zh.json", { force: true });

console.log("merged bilingual Q dictionaries");
