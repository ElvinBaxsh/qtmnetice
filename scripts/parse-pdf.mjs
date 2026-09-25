import { readFileSync, writeFileSync } from "fs";

// İstifadə: node scripts/parse-pdf.mjs [pdf-items.json] [parsed-results.json]
const inputPath = process.argv[2] || "/tmp/pdf-items-all.json";
const outputPath = process.argv[3] || "/tmp/parsed-results.json";
const pages = JSON.parse(readFileSync(inputPath));

function groupByRow(items) {
  const rows = {};
  for (const it of items) {
    const y = it.y;
    rows[y] = rows[y] || [];
    rows[y].push(it);
  }
  return Object.entries(rows)
    .map(([y, items]) => {
      const cells = items.sort((a, b) => a.x - b.x);
      return { y: Number(y), cells, items: cells.map((i) => i.str) };
    })
    .sort((a, b) => b.y - a.y);
}

function markToCorrect(mark) {
  if (mark === "+") return true;
  if (mark === "-") return false;
  if (mark === undefined || mark === "") return null;
  return false; // '#' or '~' -> qismən bal, tam düz sayılmır
}

// Cavab/nəticə xanalarını açar sətrinin sütunlarına x mövqeyinə görə düzür.
// Boş xanalar PDF-də ümumiyyətlə olmur, "2/3 2/3" kimi bir mətn isə bir neçə xananı tuta bilər.
function alignToColumns(columnXs, row, label, sectionTitle) {
  const out = new Array(columnXs.length).fill("");
  for (const cell of row.cells) {
    let col = 0;
    for (let c = 1; c < columnXs.length; c++) {
      if (Math.abs(columnXs[c] - cell.x) < Math.abs(columnXs[col] - cell.x)) col = c;
    }
    for (const token of cell.str.trim().split(/\s+/)) {
      if (col >= out.length || out[col] !== "") {
        throw new Error(`${sectionTitle}: ${label} sətrində xana düzülüşü uyğun gəlmir (${cell.str})`);
      }
      out[col++] = token;
    }
  }
  return out;
}

// "Tədris dili (27-56)" -> 27
function firstQuestionNo(title) {
  const m = title.match(/\((\d+)\s*-\s*\d+\)/);
  return m ? Number(m[1]) : 1;
}

function buildSection(title, keyRow, answerRow, markRow) {
  const columnXs = keyRow.cells.map((c) => c.x);
  const answers = alignToColumns(columnXs, answerRow, "Cavab", title);
  const marks = alignToColumns(columnXs, markRow, "Nəticə", title);
  const start = firstQuestionNo(title);
  const questions = keyRow.items.map((key, i) => ({
    no: start + i,
    key,
    answer: answers[i],
    mark: marks[i],
    correct: markToCorrect(marks[i]),
  }));
  return { title, questions };
}

function parsePage(pageData) {
  const rows = groupByRow(pageData.items);
  const find = (pred) => rows.find(pred);
  const findAll = (pred) => rows.filter(pred);

  const line1 = find((r) => r.items[0] === "İmtahan");
  const line2 = find((r) => r.items[0] === "Keçirilmə tarixi");
  const line3 = find((r) => r.items[0] === "Soyadı");
  const line4 = find((r) => r.items[0] === "Adı");

  const imtahan = line1.items[1];
  const isNomresi = line1.items[3];
  const kecirilmeTarixi = line2.items[1];
  const bolme = line2.items[3];
  const soyadi = line3.items[1];
  const sinif = line3.items[3];
  const adi = line4.items[1];
  const variant = line4.items[3];

  const xariciHeaderIdx = rows.findIndex((r) => r.items[0] === "Xarici dil (1-26)");
  const tedrisHeaderIdx = rows.findIndex((r) => r.items[0] === "Tədris dili (27-56)");
  const riyaziyyatHeaderIdx = rows.findIndex((r) => r.items[0] === "Riyaziyyat (57-81)");

  const xariciDil = buildSection("Xarici dil (1-26)", rows[xariciHeaderIdx + 2], rows[xariciHeaderIdx + 3], rows[xariciHeaderIdx + 4]);
  const tedrisDili = buildSection("Tədris dili (27-56)", rows[tedrisHeaderIdx + 2], rows[tedrisHeaderIdx + 3], rows[tedrisHeaderIdx + 4]);
  const riyaziyyat = buildSection("Riyaziyyat (57-81)", rows[riyaziyyatHeaderIdx + 2], rows[riyaziyyatHeaderIdx + 3], rows[riyaziyyatHeaderIdx + 4]);

  const subjectRows = findAll(
    (r) => r.items[0] === "Xarici dil" || r.items[0] === "Tədris dili" || r.items[0] === "Riyaziyyat"
  );
  const summary = subjectRows.map((r) => ({
    fenn: r.items[0],
    sualSayi: Number(r.items[1]),
    qapaliDuzSayi: Number(r.items[2]),
    qapaliSehvSayi: Number(r.items[3]),
    aciqDuzSayi: Number(r.items[4]),
    aciqSehvSayi: Number(r.items[5]),
    yaziBallarinCemi: Number(r.items[6]),
    fennBali: Number(r.items[7]),
  }));

  const summaryMinY = Math.min(...subjectRows.map((r) => r.y));
  const summaryMaxY = Math.max(...subjectRows.map((r) => r.y));
  const umumiBalRow = find(
    (r) =>
      r.y >= summaryMinY &&
      r.y <= summaryMaxY &&
      r.items.length === 1 &&
      /^\d+(\.\d+)?$/.test(r.items[0])
  );
  const umumiBal = umumiBalRow ? Number(umumiBalRow.items[0]) : null;

  return {
    origIsNomresi: isNomresi,
    imtahan,
    kecirilmeTarixi,
    bolme,
    soyadi,
    adi,
    sinif,
    variant,
    sections: [xariciDil, tedrisDili, riyaziyyat],
    summary,
    umumiBal,
  };
}

const parsed = pages.map(parsePage);
parsed.sort((a, b) => Number(a.origIsNomresi) - Number(b.origIsNomresi));

writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
console.log("Parsed", parsed.length, "students");
for (const p of parsed) {
  console.log(p.origIsNomresi, p.soyadi, p.adi, "->", p.umumiBal);
}
