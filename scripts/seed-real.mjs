import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing env vars");
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

const parsed = JSON.parse(readFileSync("/tmp/parsed-results.json"));
const examName = "Qarabağ Tədris Mərkəzi — 9-cu sinif sınaq imtahanı";

async function main() {
  const { data: existingExam, error: examErr } = await supabase
    .from("exams")
    .select("id")
    .eq("name", examName)
    .maybeSingle();
  if (examErr) throw examErr;
  const examId = existingExam.id;

  // Kohne 27xxx yer-tutan neticelerini temizle - PDF-in oz is nomreleri istifade olunur
  const { error: delErr } = await supabase.from("results").delete().eq("exam_id", examId).gte("is_nomresi", "27000");
  if (delErr) throw delErr;

  const rows = parsed.map((p) => ({
    exam_id: examId,
    is_nomresi: p.origIsNomresi,
    soyadi: p.soyadi,
    adi: p.adi,
    sinif: p.sinif,
    bolme: p.bolme,
    variant: p.variant,
    sections: p.sections,
    summary: p.summary,
    umumi_bal: p.umumiBal,
    published: true,
  }));

  const { error } = await supabase.from("results").upsert(rows, { onConflict: "exam_id,is_nomresi" });
  if (error) throw error;

  console.log("Seeded", rows.length, "real results with original iş nömrələri");
  for (const r of rows) {
    console.log(r.is_nomresi, "->", r.umumi_bal);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
