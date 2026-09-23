import { Exam, ExamResult, QuestionAnswer, Section, SubjectSummary } from "./types";

export const exams: Exam[] = [
  { id: "qarabag-2026-03-29", name: "Qarabağ Tədris Mərkəzi — 9-cu sinif sınaq imtahanı", date: "2026-03-29" },
];

function buildSection(
  title: string,
  keys: string[],
  answers: string[],
  correct: (boolean | null)[]
): Section {
  const questions: QuestionAnswer[] = keys.map((key, i) => ({
    no: i + 1,
    key,
    answer: answers[i],
    correct: correct[i],
  }));
  return { title, questions };
}

// Nümunə #1 — real nəticə vərəqindəki formatı əsas götürüb hazırlanıb
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

const summary1: SubjectSummary[] = [
  { fenn: "Xarici dil", sualSayi: 30, qapaliDuzSayi: 16, qapaliSehvSayi: 6, aciqDuzSayi: 2, aciqSehvSayi: 1, yaziBallarinCemi: 0, fennBali: 60 },
  { fenn: "Tədris dili", sualSayi: 30, qapaliDuzSayi: 22, qapaliSehvSayi: 4, aciqDuzSayi: 0, aciqSehvSayi: 0, yaziBallarinCemi: 21.57, fennBali: 86.27 },
  { fenn: "Riyaziyyat", sualSayi: 30, qapaliDuzSayi: 12, qapaliSehvSayi: 3, aciqDuzSayi: 5, aciqSehvSayi: 0, yaziBallarinCemi: 27.59, fennBali: 86.21 },
];

const result1: ExamResult = {
  isNomresi: "27001",
  imtahan: "Sizlərə uğurlar",
  kecirilmeTarixi: "2026-03-29",
  bolme: "Azərbaycan",
  soyadi: "HƏSƏNZADƏ",
  adi: "FATİMƏ",
  sinif: "9",
  variant: "A",
  sections: [xariciDil1, tedrisDili1, riyaziyyat1],
  summary: summary1,
  umumiBal: 232.48,
};

// Nümunə #2 — demo üçün ikinci iştirakçı
const result2: ExamResult = {
  ...result1,
  isNomresi: "27002",
  soyadi: "MƏMMƏDOV",
  adi: "TURAL",
  variant: "B",
  summary: [
    { fenn: "Xarici dil", sualSayi: 30, qapaliDuzSayi: 20, qapaliSehvSayi: 2, aciqDuzSayi: 3, aciqSehvSayi: 0, yaziBallarinCemi: 0, fennBali: 70 },
    { fenn: "Tədris dili", sualSayi: 30, qapaliDuzSayi: 18, qapaliSehvSayi: 8, aciqDuzSayi: 0, aciqSehvSayi: 0, yaziBallarinCemi: 15.4, fennBali: 75.4 },
    { fenn: "Riyaziyyat", sualSayi: 30, qapaliDuzSayi: 15, qapaliSehvSayi: 0, aciqDuzSayi: 3, aciqSehvSayi: 2, yaziBallarinCemi: 18.2, fennBali: 78.2 },
  ],
  umumiBal: 223.6,
};

// Nümunə #3 — demo üçün üçüncü iştirakçı
const result3: ExamResult = {
  ...result1,
  isNomresi: "27003",
  soyadi: "QULİYEVA",
  adi: "NƏRMİN",
  variant: "A",
  summary: [
    { fenn: "Xarici dil", sualSayi: 30, qapaliDuzSayi: 24, qapaliSehvSayi: 1, aciqDuzSayi: 3, aciqSehvSayi: 0, yaziBallarinCemi: 0, fennBali: 82 },
    { fenn: "Tədris dili", sualSayi: 30, qapaliDuzSayi: 26, qapaliSehvSayi: 0, aciqDuzSayi: 0, aciqSehvSayi: 0, yaziBallarinCemi: 24.9, fennBali: 96.9 },
    { fenn: "Riyaziyyat", sualSayi: 30, qapaliDuzSayi: 20, qapaliSehvSayi: 0, aciqDuzSayi: 5, aciqSehvSayi: 0, yaziBallarinCemi: 29.1, fennBali: 95.1 },
  ],
  umumiBal: 274.0,
};

export const mockResults: Record<string, ExamResult> = {
  [`${exams[0].id}:27001`]: result1,
  [`${exams[0].id}:27002`]: result2,
  [`${exams[0].id}:27003`]: result3,
};

export function findResult(examId: string, isNomresi: string): ExamResult | null {
  return mockResults[`${examId}:${isNomresi.trim()}`] ?? null;
}
