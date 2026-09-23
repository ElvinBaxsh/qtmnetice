export type QuestionAnswer = {
  no: number | string;
  key: string;
  answer: string;
  correct: boolean | null; // null = not applicable (e.g. essay/blank)
};

export type Section = {
  title: string; // e.g. "Xarici dil (1-26)"
  questions: QuestionAnswer[];
};

export type SubjectSummary = {
  fenn: string;
  sualSayi: number;
  qapaliDuzSayi: number;
  qapaliSehvSayi: number;
  aciqDuzSayi: number;
  aciqSehvSayi: number;
  yaziBallarinCemi: number;
  fennBali: number;
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
};

export type Exam = {
  id: string;
  name: string;
  date: string;
};
