// Müvəqqəti backend: cPanel hostinqi aktivləşənə qədər Vercel-dəki sayt datanı Supabase-dən oxuyur.
// PHP API ilə eyni formatda cavab qaytarır (db.ts bunu seçir).
import { createClient } from "@supabase/supabase-js";
import type { Exam, LookupResult, Section, SubjectSummary } from "./types";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type ExamRow = { id: string; name: string; exam_date: string };

async function currentExamRow(): Promise<ExamRow | null> {
  const { data, error } = await supabase
    .from("exams")
    .select("id, name, exam_date")
    .order("exam_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCurrentExam(): Promise<Exam | null> {
  const row = await currentExamRow();
  // id yalnız göstərmək üçündür; axtarış həmişə cari imtahanda gedir
  return row ? { id: 0, name: row.name, date: row.exam_date } : null;
}

export async function findResult(no: string): Promise<LookupResult | null> {
  const exam = await currentExamRow();
  if (!exam) return null;

  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("exam_id", exam.id)
    .eq("is_nomresi", no)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    kind: "sheet",
    result: {
      isNomresi: data.is_nomresi,
      imtahan: exam.name,
      kecirilmeTarixi: exam.exam_date,
      bolme: data.bolme ?? "",
      soyadi: data.soyadi,
      adi: data.adi,
      sinif: data.sinif ?? "",
      variant: data.variant ?? "",
      sections: (data.sections ?? []) as Section[],
      summary: (data.summary ?? []) as SubjectSummary[],
      umumiBal: Number(data.umumi_bal ?? 0),
    },
  };
}
