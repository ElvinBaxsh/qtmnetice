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

// --- "NƏTİCƏ VƏRƏQİ" formatı (QTM Təkmilləşdirmə, 2026-09): hər fənn "Ad (1-20)", sətirlər
// Sual N / Doğrular / Cavablar / Nəticələr, sağda fənn üzrə Doğru / Yanlış / Cavabsız / Bal.
const HEADER_LABELS = new Set([
  "İmtahan", "İş nömrəsi", "Xaric dil", "Tarix", "Variant", "Adı", "Bölmə", "Doğru",
  "Soyadı", "Yanlış", "Ata adı", "Sinif", "Cavabsız", "Məktəb", "Bal",
]);
const SIDE_LABELS = new Set(["Doğru", "Yanlış", "Cavabsız", "Bal"]);

function num(value, what) {
  const n = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`${what}: rəqəm deyil (${value})`);
  return n;
}

function parsePageQtm(pageData, pageNo) {
  const rows = groupByRow(pageData.items);
  const firstSection = rows.findIndex((r) => r.items.length === 1 && /\(\d+\s*-\s*\d+\)$/.test(r.items[0]));
  if (firstSection < 0) throw new Error(`Səhifə ${pageNo}: fənn bölmələri tapılmadı`);

  // Başlıq: etiket -> dəyər (dəyər boş ola bilər, məs. "Ata adı")
  const head = {};
  for (const r of rows.slice(0, firstSection)) {
    r.items.forEach((s, i) => {
      if (!HEADER_LABELS.has(s)) return;
      const next = r.items[i + 1];
      head[s] = next !== undefined && !HEADER_LABELS.has(next) ? next : "";
    });
  }
  const need = (label) => {
    if (!head[label]) throw new Error(`Səhifə ${pageNo}: "${label}" tapılmadı`);
    return head[label];
  };

  const sections = [];
  const summary = [];
  const titleIdx = rows.map((r, i) => (r.items.length === 1 && /\(\d+\s*-\s*\d+\)$/.test(r.items[0]) ? i : -1)).filter((i) => i >= 0);
  for (const ti of titleIdx) {
    const title = rows[ti].items[0];
    const [, fenn, from, to] = title.match(/^(.*?)\s*\((\d+)\s*-\s*(\d+)\)$/);
    const count = Number(to) - Number(from) + 1;
    const block = rows.slice(ti + 1, ti + 5);
    const byLabel = Object.fromEntries(block.map((r) => [r.items[0], r.items]));
    const cellsOf = (label) => {
      const items = byLabel[label];
      if (!items) throw new Error(`Səhifə ${pageNo}, ${title}: "${label}" sətri yoxdur`);
      const end = items.findIndex((s, i) => i > 0 && SIDE_LABELS.has(s));
      const cells = items.slice(1, end < 0 ? undefined : end);
      if (cells.length !== count) throw new Error(`Səhifə ${pageNo}, ${title}: "${label}" ${cells.length} xana, ${count} gözlənilirdi`);
      return cells;
    };
    // Sağ tərəfdəki fənn göstəricisi: sətirdə etiketdən sonrakı dəyər
    const side = (label) => {
      for (const r of block) {
        const i = r.items.indexOf(label, 1);
        if (i > 0) return num(r.items[i + 1], `Səhifə ${pageNo}, ${title}, ${label}`);
      }
      throw new Error(`Səhifə ${pageNo}, ${title}: "${label}" yoxdur`);
    };

    const keys = cellsOf("Doğrular");
    const answers = cellsOf("Cavablar");
    const marks = cellsOf("Nəticələr");
    sections.push({
      title,
      questions: keys.map((key, i) => {
        // "#" bu formatda cavabsız deməkdir
        const blank = answers[i] === "#" || marks[i] === "#";
        return {
          no: Number(from) + i,
          key,
          answer: blank ? "" : answers[i],
          mark: blank ? "" : marks[i],
          correct: blank ? null : markToCorrect(marks[i]),
        };
      }),
    });
    summary.push({ fenn, sualSayi: count, dogru: side("Doğru"), yanlis: side("Yanlış"), cavabsiz: side("Cavabsız"), bal: side("Bal") });
  }

  return {
    origIsNomresi: need("İş nömrəsi"),
    imtahan: head["İmtahan"] ?? "",
    kecirilmeTarixi: head["Tarix"] ?? "",
    bolme: head["Bölmə"] ?? "",
    soyadi: need("Soyadı"),
    adi: need("Adı"),
    sinif: head["Sinif"] ?? "",
    variant: head["Variant"] ?? "",
    sections,
    summary,
    umumiBal: num(need("Bal"), `Səhifə ${pageNo}, Bal`),
    extra: {
      ataAdi: head["Ata adı"] ?? "",
      xariciDil: head["Xaric dil"] ?? "",
      mekteb: head["Məktəb"] ?? "",
      dogru: num(head["Doğru"], `Səhifə ${pageNo}, Doğru`),
      yanlis: num(head["Yanlış"], `Səhifə ${pageNo}, Yanlış`),
      cavabsiz: num(head["Cavabsız"], `Səhifə ${pageNo}, Cavabsız`),
    },
  };
}

// Format avtomatik tanınır: yeni "NƏTİCƏ VƏRƏQİ" və ya köhnə (Xarici dil / Tədris dili / Riyaziyyat)
const isQtmFormat = (page) => page.items.some((it) => it.str === "Sual N") && page.items.some((it) => it.str === "Doğrular");
const parsed = pages.map((p, i) => (isQtmFormat(p) ? parsePageQtm(p, i + 1) : parsePage(p)));

// Yoxlama: fənn ballarının cəmi ümumi bala, doğru+yanlış+cavabsız sual sayına bərabər olmalıdır
for (const p of parsed.filter((x) => x.extra)) {
  const sum = p.summary.reduce((s, r) => s + r.bal, 0);
  if (Math.abs(sum - p.umumiBal) > 0.01) throw new Error(`${p.origIsNomresi}: fənn ballarının cəmi ${sum}, ümumi bal ${p.umumiBal}`);
  for (const r of p.summary) {
    if (r.dogru + r.yanlis + r.cavabsiz !== r.sualSayi) throw new Error(`${p.origIsNomresi} ${r.fenn}: doğru+yanlış+cavabsız ≠ ${r.sualSayi}`);
    const q = p.sections.find((s) => s.title.startsWith(r.fenn)).questions;
    const counted = { d: q.filter((x) => x.correct === true).length, y: q.filter((x) => x.correct === false).length, c: q.filter((x) => x.correct === null).length };
    if (counted.d !== r.dogru || counted.y !== r.yanlis || counted.c !== r.cavabsiz) {
      throw new Error(`${p.origIsNomresi} ${r.fenn}: işarələr (${counted.d}/${counted.y}/${counted.c}) cədvəllə uyğun gəlmir (${r.dogru}/${r.yanlis}/${r.cavabsiz})`);
    }
  }
}
parsed.sort((a, b) => Number(a.origIsNomresi) - Number(b.origIsNomresi));

writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
console.log("Parsed", parsed.length, "students");
for (const p of parsed) {
  console.log(p.origIsNomresi, p.soyadi, p.adi, "->", p.umumiBal);
}
