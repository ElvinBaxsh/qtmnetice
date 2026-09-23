import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const exam = { name: "Qarabağ Tədris Mərkəzi — 9-cu sinif sınaq imtahanı", exam_date: "2026-03-29" };

function buildSection(title, keys, answers, correct) {
  return {
    title,
    questions: keys.map((key, i) => ({ no: i + 1, key, answer: answers[i], correct: correct[i] })),
  };
}

const xariciDil1 = buildSection(
  "Xarici dil (1-26)",
  ["E", "E", "E", "BBAA", "B", "B", "C", "B", "B", "B", "C", "****", "B", "B", "A", "C", "C", "D", "A", "B", "B", "C", "A", "B", "****", "x"],
  ["D", "E", "A", "ABBA", "B", "B", "C", "B", "B", "B", "C", "####", "A", "D", "E", "B", "C", "D", "A", "B", "B", "C", "A", "B", "####", "0"],
  [false, true, false, false, true, true, true, true, true, true, true, true, false, false, false, true, true, true, true, true, true, true, true, true, true, null]
);

const tedrisDili1 = buildSection(
  "Tədris dili (27-56)",
  ["D", "B", "E", "C", "E", "D", "B", "A", "D", "E", "B", "C", "B", "C", "B", "A", "A", "B", "x", "x", "B", "C", "B", "B", "C", "B", "B", "B", "x", "x"],
  ["B", "B", "E", "C", "D", "D", "B", "E", "D", "C", "B", "C", "B", "A", "A", "B", "1", "2/3", "B", "C", "B", "B", "C", "B", "B", "B", "1", "1", "", ""],
  [false, true, true, true, false, true, true, false, true, false, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, null, null]
);

const riyaziyyat1 = buildSection(
  "Riyaziyyat (57-81)",
  ["D", "C", "C", "B", "D", "E", "E", "A", "A", "C", "C", "D", "A", "E", "A", "16####", "22####", "18.16#", "3#####", "11####", "7#####", "x", "x", "x", "x"],
  ["D", "C", "C", "B", "B", "E", "A", "A", "A", "C", "C", "D", "C", "E", "A", "16####", "22####", "######", "3#####", "11####", "7#####", "1", "1", "1", "1"],
  [true, true, true, true, false, true, false, true, true, true, true, false, true, true, true, true, true, false, true, true, true, true, true, true, true]
);

const summary1 = [
  { fenn: "Xarici dil", sualSayi: 30, qapaliDuzSayi: 16, qapaliSehvSayi: 6, aciqDuzSayi: 2, aciqSehvSayi: 1, yaziBallarinCemi: 0, fennBali: 60 },
  { fenn: "Tədris dili", sualSayi: 30, qapaliDuzSayi: 22, qapaliSehvSayi: 4, aciqDuzSayi: 0, aciqSehvSayi: 0, yaziBallarinCemi: 21.57, fennBali: 86.27 },
  { fenn: "Riyaziyyat", sualSayi: 30, qapaliDuzSayi: 12, qapaliSehvSayi: 3, aciqDuzSayi: 5, aciqSehvSayi: 0, yaziBallarinCemi: 27.59, fennBali: 86.21 },
];

const baseResult = {
  bolme: "Azərbaycan",
  sinif: "9",
  sections: [xariciDil1, tedrisDili1, riyaziyyat1],
};

const results = [
  { is_nomresi: "27001", soyadi: "HƏSƏNZADƏ", adi: "FATİMƏ", variant: "A", summary: summary1, umumi_bal: 232.48, published: true },
  {
    is_nomresi: "27002",
    soyadi: "MƏMMƏDOV",
    adi: "TURAL",
    variant: "B",
    summary: [
      { fenn: "Xarici dil", sualSayi: 30, qapaliDuzSayi: 20, qapaliSehvSayi: 2, aciqDuzSayi: 3, aciqSehvSayi: 0, yaziBallarinCemi: 0, fennBali: 70 },
      { fenn: "Tədris dili", sualSayi: 30, qapaliDuzSayi: 18, qapaliSehvSayi: 8, aciqDuzSayi: 0, aciqSehvSayi: 0, yaziBallarinCemi: 15.4, fennBali: 75.4 },
      { fenn: "Riyaziyyat", sualSayi: 30, qapaliDuzSayi: 15, qapaliSehvSayi: 0, aciqDuzSayi: 3, aciqSehvSayi: 2, yaziBallarinCemi: 18.2, fennBali: 78.2 },
    ],
    umumi_bal: 223.6,
    published: true,
  },
  {
    is_nomresi: "27003",
    soyadi: "QULİYEVA",
    adi: "NƏRMİN",
    variant: "A",
    summary: [
      { fenn: "Xarici dil", sualSayi: 30, qapaliDuzSayi: 24, qapaliSehvSayi: 1, aciqDuzSayi: 3, aciqSehvSayi: 0, yaziBallarinCemi: 0, fennBali: 82 },
      { fenn: "Tədris dili", sualSayi: 30, qapaliDuzSayi: 26, qapaliSehvSayi: 0, aciqDuzSayi: 0, aciqSehvSayi: 0, yaziBallarinCemi: 24.9, fennBali: 96.9 },
      { fenn: "Riyaziyyat", sualSayi: 30, qapaliDuzSayi: 20, qapaliSehvSayi: 0, aciqDuzSayi: 5, aciqSehvSayi: 0, yaziBallarinCemi: 29.1, fennBali: 95.1 },
    ],
    umumi_bal: 274.0,
    published: true,
  },
  // 27004 - iş nömrəsi mövcuddur amma nəticə hələ elan olunmayıb (published = false) demo üçün
  { is_nomresi: "27004", soyadi: "ƏLİYEV", adi: "RƏŞAD", variant: "B", summary: [], umumi_bal: null, published: false },
];

async function main() {
  const { data: existingExam } = await supabase.from("exams").select("id").eq("name", exam.name).maybeSingle();

  let examId = existingExam?.id;
  if (!examId) {
    const { data, error } = await supabase.from("exams").insert(exam).select("id").single();
    if (error) throw error;
    examId = data.id;
  }
  console.log("exam id:", examId);

  for (const r of results) {
    const row = { ...baseResult, ...r, exam_id: examId };
    const { error } = await supabase.from("results").upsert(row, { onConflict: "exam_id,is_nomresi" });
    if (error) throw error;
    console.log("seeded:", r.is_nomresi);
  }
}

main().then(() => {
  console.log("done");
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
