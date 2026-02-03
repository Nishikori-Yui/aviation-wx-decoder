import fs from "node:fs";

const url =
  "https://www.faa.gov/air_traffic/publications/atpubs/notam_html/appendix_b.html";

const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Failed to fetch ${url}: ${response.status}`);
}
const html = await response.text();

const marker = "Fourth and Fifth Letter Decode Tables</strong>";
const idx = html.indexOf(marker);
if (idx < 0) {
  throw new Error("Marker not found in FAA Appendix B.");
}

const subjectPart = html.slice(0, idx);
const conditionPart = html.slice(idx);
const rowRe = /<tr>\s*<td>\s*<p class="table-content-paragraph">\s*([^<\s]+)\s*<\/p>\s*<\/td>\s*<td>\s*<p class="table-content-paragraph">\s*([^<]+?)\s*<\/p>/g;

function parseTable(part) {
  const map = {};
  let match;
  while ((match = rowRe.exec(part))) {
    const code = match[1].trim();
    const text = match[2].replace(/\s+/g, " ").trim();
    if (code === "Code") {
      continue;
    }
    if (!/^[A-Z]{2}$/.test(code)) {
      continue;
    }
    map[code] = text;
  }
  return map;
}

const subject = parseTable(subjectPart);
const condition = parseTable(conditionPart);

fs.mkdirSync("web/src/data/lexicons", { recursive: true });
fs.writeFileSync(
  "web/src/data/lexicons/notam_q_subject_en.json",
  JSON.stringify(subject, null, 2)
);
fs.writeFileSync(
  "web/src/data/lexicons/notam_q_condition_en.json",
  JSON.stringify(condition, null, 2)
);

console.log(`subject ${Object.keys(subject).length}`);
console.log(`condition ${Object.keys(condition).length}`);
