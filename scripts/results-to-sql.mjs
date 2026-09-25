// Nəticələri phpMyAdmin-ə import üçün SQL faylına çevirir.
//
// İstifadə:
//   node scripts/results-to-sql.mjs <nəticələr.json> "<imtahan adı>" <YYYY-MM-DD> <çıxış.sql>
//
// <nəticələr.json> — parse-pdf.mjs-in çıxışı (massiv), və ya { results: [...] } obyekti.
// İmtahan yoxdursa yaradılır; eyni iş nömrəsi təkrar gələrsə yenilənir.
import { readFileSync, writeFileSync } from "fs";

const [inputPath, examName, examDate, outPath] = process.argv.slice(2);
if (!inputPath || !examName || !/^\d{4}-\d{2}-\d{2}$/.test(examDate ?? "") || !outPath) {
  console.error('İstifadə: node scripts/results-to-sql.mjs <nəticələr.json> "<imtahan adı>" <YYYY-MM-DD> <çıxış.sql>');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.results;

// MySQL sətir literalı
function q(value) {
  if (value === null || value === undefined) return "NULL";
  const s = String(value).replace(/[\0\n\r\x1a\\']/g, (c) => ({ "\0": "\\0", "\n": "\\n", "\r": "\\r", "\x1a": "\\Z", "\\": "\\\\", "'": "\\'" })[c]);
  return `'${s}'`;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "NULL";
}

// parse-pdf.mjs çıxışı (origIsNomresi, umumiBal) və ya DB sətri (is_nomresi, umumi_bal)
const values = rows.map((r) => {
  const no = r.origIsNomresi ?? r.isNomresi ?? r.is_nomresi;
  if (!/^[0-9A-Za-z-]{1,32}$/.test(String(no))) throw new Error(`Yanlış iş nömrəsi: ${no}`);
  return `(@exam_id, ${[
    q(no),
    q(r.soyadi),
    q(r.adi),
    q(r.sinif),
    q(r.bolme),
    q(r.variant),
    q(JSON.stringify(r.sections ?? [])),
    q(JSON.stringify(r.summary ?? [])),
    num(r.umumiBal ?? r.umumi_bal),
    r.published === false ? "0" : "1",
  ].join(", ")})`;
});

const sql = `-- ${rows.length} nəticə: ${examName} (${examDate})
SET NAMES utf8mb4;

INSERT INTO exams (name, exam_date)
SELECT ${q(examName)}, ${q(examDate)} FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE name = ${q(examName)} AND exam_date = ${q(examDate)});

SET @exam_id = (SELECT id FROM exams WHERE name = ${q(examName)} AND exam_date = ${q(examDate)} ORDER BY id LIMIT 1);

INSERT INTO results (exam_id, is_nomresi, soyadi, adi, sinif, bolme, variant, sections, summary, umumi_bal, published) VALUES
${values.join(",\n")}
ON DUPLICATE KEY UPDATE
  soyadi = VALUES(soyadi), adi = VALUES(adi), sinif = VALUES(sinif), bolme = VALUES(bolme),
  variant = VALUES(variant), sections = VALUES(sections), summary = VALUES(summary),
  umumi_bal = VALUES(umumi_bal), published = VALUES(published);
`;

writeFileSync(outPath, sql);
console.log(`${rows.length} nəticə -> ${outPath}`);
