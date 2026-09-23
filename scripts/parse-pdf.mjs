import { readFileSync, writeFileSync } from "fs";

const pages = JSON.parse(readFileSync("/tmp/pdf-items-all.json"));

function groupByRow(items) {
  const rows = {};
  for (const it of items) {
    const y = it.y;
    rows[y] = rows[y] || [];
    rows[y].push(it);
  }
  return Object.entries(rows)
    .map(([y, items]) => ({ y: Number(y), items: items.sort((a, b) => a.x - b.x).map((i) => i.str) }))
    .sort((a, b) => b.y - a.y);
}

function markToCorrect(mark) {
  if (mark === "+") return true;
  if (mark === "-") return false;
  if (mark === undefined || mark === "") return null;
  return false; // '#' or '~' -> partial credit, treated as not-fully-correct
}

function buildSection(title, noRow, keyRow, answerRow, markRow) {
  const questions = keyRow.map((key, i) => ({
    no: i + 1,
    key,
    answer: answerRow[i] ?? "",
    correct: markToCorrect(markRow[i]),
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

  const xariciDil = buildSection(
    "Xarici dil (1-26)",
    rows[xariciHeaderIdx + 1].items,
    rows[xariciHeaderIdx + 2].items,
    rows[xariciHeaderIdx + 3].items,
    rows[xariciHeaderIdx + 4].items
  );
  const tedrisDili = buildSection(
    "Tədris dili (27-56)",
    rows[tedrisHeaderIdx + 1].items,
    rows[tedrisHeaderIdx + 2].items,
    rows[tedrisHeaderIdx + 3].items,
    rows[tedrisHeaderIdx + 4].items
  );
  const riyaziyyat = buildSection(
    "Riyaziyyat (57-81)",
    rows[riyaziyyatHeaderIdx + 1].items,
    rows[riyaziyyatHeaderIdx + 2].items,
    rows[riyaziyyatHeaderIdx + 3].items,
    rows[riyaziyyatHeaderIdx + 4].items
  );

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

writeFileSync("/tmp/parsed-results.json", JSON.stringify(parsed, null, 2));
console.log("Parsed", parsed.length, "students");
for (const p of parsed) {
  console.log(p.origIsNomresi, p.soyadi, p.adi, "->", p.umumiBal);
}
