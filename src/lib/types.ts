export type QuestionAnswer = {
  no: number | string;
  key: string;
  answer: string;
  mark?: string; // PDF-dəki orijinal işarə: "+", "-", "#", "~"
  correct: boolean | null; // null = not applicable (e.g. essay/blank)
};

export type Section = {
  title: string; // e.g. "Xarici dil (1-26)"
  questions: QuestionAnswer[];
};

// Fənn üzrə yekun. İki format var:
// - köhnə (9-cu sinif sınağı): qapalı/açıq düz-səhv, yazı balları, fənn balı
// - "NƏTİCƏ VƏRƏQİ" (QTM Təkmilləşdirmə): doğru / yanlış / cavabsız / bal
export type SubjectSummary = {
  fenn: string;
  sualSayi: number;
  qapaliDuzSayi?: number;
  qapaliSehvSayi?: number;
  aciqDuzSayi?: number;
  aciqSehvSayi?: number;
  yaziBallarinCemi?: number;
  fennBali?: number;
  dogru?: number;
  yanlis?: number;
  cavabsiz?: number;
  bal?: number;
};

// Yalnız yeni formatda olan əlavə məlumatlar
export type ResultExtra = {
  ataAdi?: string;
  xariciDil?: string;
  mekteb?: string;
  dogru?: number;
  yanlis?: number;
  cavabsiz?: number;
};

export type ExamResult = {
  isNomresi: string;
  imtahan: string;
  kecirilmeTarixi: string;
  bolme: string;
  soyadi: string;
  adi: string;
  sinif: string;
  variant: string;
  sections: Section[];
  summary: SubjectSummary[];
  umumiBal: number;
  extra?: ResultExtra;
};

export type Exam = {
  id: number;
  name: string;
  date: string;
};

// Müəllimin yüklədiyi açıq tipli cavab faylı
export type AnswerFile = { id: number; mime: string };

// Nəticə ya struktur vərəqdir (PDF-dən oxunmuş), ya da yüklənmiş şəkil/PDF faylı
export type LookupResult =
  | { kind: "sheet"; result: ExamResult; answerFiles?: AnswerFile[] }
  | { kind: "file"; ext: "png" | "jpg" | "jpeg" | "pdf" };
