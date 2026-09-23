import { supabase } from "./supabaseClient";
import type { Exam, ExamResult, Section, SubjectSummary } from "./types";

export async function listExams(): Promise<Exam[]> {
  const { data, error } = await supabase.from("exams").select("id, name, exam_date").order("exam_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, date: row.exam_date }));
}

export async function findResult(examId: string, isNomresi: string): Promise<ExamResult | null> {
  const trimmed = isNomresi.trim();
  if (!examId || !trimmed) return null;

  const { data: examRow, error: examError } = await supabase
    .from("exams")
    .select("name, exam_date")
    .eq("id", examId)
    .maybeSingle();
  if (examError) throw examError;
  if (!examRow) return null;

  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("exam_id", examId)
    .eq("is_nomresi", trimmed)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    isNomresi: data.is_nomresi,
    imtahan: examRow.name,
    kecirilmeTarixi: examRow.exam_date,
    bolme: data.bolme ?? "",
    soyadi: data.soyadi,
    adi: data.adi,
    sinif: data.sinif ?? "",
    variant: data.variant ?? "",
    sections: (data.sections ?? []) as Section[],
    summary: (data.summary ?? []) as SubjectSummary[],
    umumiBal: Number(data.umumi_bal ?? 0),
  };
}
