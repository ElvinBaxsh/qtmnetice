import type { Exam, LookupResult } from "./types";

// Canlıda sayt və API eyni domendədir (/api). Lokalda .env.development.local-da NEXT_PUBLIC_API_BASE verilir.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

// "php" (cPanel) və ya "supabase" (Vercel, müvəqqəti) — next.config.ts təyin edir
const useSupabase = process.env.BACKEND === "supabase";

export async function getCurrentExam(): Promise<Exam | null> {
  if (useSupabase) return (await import("./supabaseBackend")).getCurrentExam();

  const res = await fetch(`${API_BASE}/exam.php`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`exam: ${res.status}`);
  return res.json();
}

export class RateLimitError extends Error {}

export async function findResult(isNomresi: string): Promise<LookupResult | null> {
  const no = isNomresi.trim();
  if (!/^[0-9A-Za-z-]{1,32}$/.test(no)) return null;

  if (useSupabase) return (await import("./supabaseBackend")).findResult(no);

  const res = await fetch(`${API_BASE}/result.php?no=${encodeURIComponent(no)}`);
  if (res.status === 404) return null;
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) throw new Error(`result: ${res.status}`);
  return res.json();
}

export function resultFileUrl(isNomresi: string, download = false): string {
  return `${API_BASE}/file.php?no=${encodeURIComponent(isNomresi)}${download ? "&download=1" : ""}`;
}
