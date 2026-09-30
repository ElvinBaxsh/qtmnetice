import type { Exam, LookupResult } from "./types";

// Canlıda sayt və API eyni domendədir (/api). Lokalda .env.development.local-da NEXT_PUBLIC_API_BASE verilir.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

// "php" (cPanel) və ya "supabase" (Vercel, müvəqqəti) — next.config.ts təyin edir
const useSupabase = process.env.BACKEND === "supabase";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Müvəqqəti xətalarda sorğunu təkrarlayır: internet qırılması, hostinqin flood qorumasının
// qısa bloku (403 — bizim API heç vaxt 403 qaytarmır), server xətası (5xx).
// 404 (tapılmadı) və 429 (bizim axtarış limiti) təkrarlanmır — onlar qəti cavabdır.
async function fetchWithRetry(url: string): Promise<Response> {
  const delays = [800, 2000];
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const transient = res.status === 403 || res.status >= 500;
      if (!transient || attempt >= delays.length) return res;
    } catch (err) {
      if (attempt >= delays.length) throw err;
    }
    await sleep(delays[attempt]);
  }
}

export async function getCurrentExam(): Promise<Exam | null> {
  if (useSupabase) return (await import("./supabaseBackend")).getCurrentExam();

  const res = await fetchWithRetry(`${API_BASE}/exam.php`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`exam: ${res.status}`);
  return res.json();
}

export class RateLimitError extends Error {}

export async function findResult(isNomresi: string): Promise<LookupResult | null> {
  const no = isNomresi.trim();
  if (!/^[0-9A-Za-z-]{1,32}$/.test(no)) return null;

  if (useSupabase) return (await import("./supabaseBackend")).findResult(no);

  const res = await fetchWithRetry(`${API_BASE}/result.php?no=${encodeURIComponent(no)}`);
  if (res.status === 404) return null;
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) throw new Error(`result: ${res.status}`);
  return res.json();
}

export function resultFileUrl(isNomresi: string, download = false): string {
  return `${API_BASE}/file.php?no=${encodeURIComponent(isNomresi)}${download ? "&download=1" : ""}`;
}

export function answerFileUrl(isNomresi: string, id: number, download = false): string {
  return `${API_BASE}/answer-file.php?no=${encodeURIComponent(isNomresi)}&id=${id}${download ? "&download=1" : ""}`;
}
