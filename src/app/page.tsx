"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getCurrentExam, findResult, RateLimitError } from "@/lib/db";
import type { Exam, LookupResult } from "@/lib/types";
import ResultSheet from "@/components/ResultSheet";
import ResultFile from "@/components/ResultFile";

// "Qarabağ Tədris Mərkəzi — 27.09.2026 sınaq imtahanı" -> ["Qarabağ Tədris Mərkəzi", "27.09.2026 sınaq imtahanı"]
function splitExamName(name: string): [string, string] {
  const [org, ...rest] = name.split(" — ");
  return rest.length ? [org, rest.join(" — ")] : ["", name];
}

// Son nəticə yalnız bu tabda saxlanır: refresh-də qalır, tab bağlananda silinir
const STORAGE_KEY = "qtm-son-netice";
type Saved = { examName: string; no: string; result: LookupResult };

function loadSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function saveResult(value: Saved | null) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // brauzer yaddaşı bağlıdırsa (məs. gizli rejim) sadəcə saxlamırıq
  }
}

export default function Home() {
  // Yalnız ən son dərc olunmuş imtahan göstərilir (API seçir)
  const [exam, setExam] = useState<Exam | null>(null);
  const [isNomresi, setIsNomresi] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [searchedNo, setSearchedNo] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "not-found" | "found" | "error" | "rate-limited">("idle");

  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Refresh-dən sonra bərpa olunan nəticəyə sürüşdürmürük — brauzer öz mövqeyini saxlayır
  const skipScrollRef = useRef(false);

  // Nəticə tapılanda ona sürüşdür (telefonda forma ekranı tutur)
  useEffect(() => {
    if (status !== "found") return;
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [status, result]);

  useEffect(() => {
    getCurrentExam()
      .then((current) => {
        setExam(current);
        const saved = loadSaved();
        // Başqa imtahanın köhnə nəticəsini göstərmirik
        if (current && saved && saved.examName === current.name) {
          skipScrollRef.current = true;
          setIsNomresi(saved.no);
          setSearchedNo(saved.no);
          setResult(saved.result);
          setStatus("found");
        } else if (saved) {
          saveResult(null);
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  function handleClear() {
    setIsNomresi("");
    setResult(null);
    setSearchedNo("");
    setStatus("idle");
    saveResult(null);
    inputRef.current?.focus();
  }

  function handleNewSearch() {
    handleClear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const no = isNomresi.trim();
    if (!exam || !no) return;

    setStatus("loading");
    try {
      const found = await findResult(no);
      setResult(found);
      setSearchedNo(no);
      setStatus(found ? "found" : "not-found");
      saveResult(found ? { examName: exam.name, no, result: found } : null);
    } catch (err) {
      setResult(null);
      setStatus(err instanceof RateLimitError ? "rate-limited" : "error");
    }
  }

  const [org, title] = exam ? splitExamName(exam.name) : ["", ""];

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center overflow-clip bg-gradient-to-br from-brand-50/70 via-background to-gold-50/60 px-3 pb-8 sm:px-4 xl:pb-0">
      {/* dekorativ fon (bütün ölçülərdə) */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-brand-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[26rem] w-[26rem] rounded-full bg-brand-100/60 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 top-[30%] h-56 w-56 rounded-full bg-gold-100/70 blur-xl" />

      <section className="relative flex w-full justify-center pt-8 sm:pt-16 xl:min-h-[100svh] xl:items-center xl:pt-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- dekorativ SVG */}
        <img src="/illustrations/cap.svg" alt="" aria-hidden className="pointer-events-none absolute bottom-[4%] right-[3%] hidden w-[240px] opacity-[0.07] xl:block 2xl:w-[300px]" />

        <div className="relative z-10 w-full max-w-xl rounded-[28px] border border-white bg-white/95 p-5 shadow-2xl shadow-brand-900/10 backdrop-blur sm:p-11">
          {/* illüstrasiyalar kartın kənarına bağlıdır — ekran daralanda kiçilir, kartın altına girmir */}
          {/* eslint-disable-next-line @next/next/no-img-element -- dekorativ SVG */}
          <img
            src="/illustrations/books.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-full top-[38%] mr-14 hidden w-[min(320px,calc(50vw-360px))] xl:block"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- dekorativ SVG */}
          <img
            src="/illustrations/plane.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-full top-[22%] ml-10 hidden w-[min(300px,calc(50vw-350px))] opacity-50 xl:block"
          />
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo-256.png"
              alt="Qarabağ Tədris Mərkəzi"
              width={128}
              height={128}
              preload
              unoptimized
              className="mb-3 h-24 w-24 sm:mb-4 sm:h-32 sm:w-32"
            />
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-800 sm:text-5xl">İmtahan nəticələri</h1>
            <p className="mt-3 max-w-md text-sm text-gray-500 sm:text-base">İş nömrənizi daxil edin və nəticənizi öyrənin.</p>
          </div>

          {/* imtahan kartı */}
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/80 px-4 py-3 sm:mt-9 sm:gap-5 sm:px-5 sm:py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 sm:h-12 sm:w-12">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0 text-left">
              {exam ? (
                <>
                  {org && <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500 sm:text-xs">{org}</p>}
                  <p className="text-sm font-bold text-brand-900 sm:text-lg">{title}</p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-brand-100" />
                  <div className="h-4 w-48 animate-pulse rounded bg-brand-100" />
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <svg aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="search"
                placeholder="İş nömrəsi"
                aria-label="İş nömrəsi"
                value={isNomresi}
                onChange={(e) => setIsNomresi(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-11 text-base text-brand-900 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
              />
              {/* inputu təmizləmək üçün sadə × (düyməyə oxşamır) */}
              {isNomresi && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Təmizlə"
                  title="Təmizlə"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-gray-400 transition hover:text-brand-600"
                >
                  <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !exam}
              className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-700/25 transition hover:from-brand-800 hover:to-brand-600 disabled:opacity-60 sm:w-auto"
            >
              {status === "loading" ? (
                "Axtarılır…"
              ) : (
                <>
                  Nəticəni gör
                  <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {status === "not-found" && (
            <p className="mt-4 text-center text-sm text-red-600">
              Bu iş nömrəsi üzrə nəticə tapılmadı, ya da nəticələr hələ elan olunmayıb.
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 text-center text-sm text-red-600">Xəta baş verdi, bir az sonra yenidən cəhd edin.</p>
          )}
          {status === "rate-limited" && (
            <p className="mt-4 text-center text-sm text-red-600">Çox sayda sorğu göndərildi. Bir dəqiqə sonra yenidən cəhd edin.</p>
          )}

          {/* əlaqə */}
          <div className="mt-6 flex flex-col items-center gap-2 border-t border-brand-100 pt-5 text-sm text-gray-600 sm:mt-8 sm:flex-row sm:justify-center sm:gap-6">
            <a href="tel:+994503654404" className="flex items-center gap-2 font-semibold text-brand-800 hover:text-brand-600">
              <svg aria-hidden className="h-4 w-4 shrink-0 text-brand-500" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              +994 50 365 44 04
            </a>
            <span className="flex items-center gap-2 text-center">
              <svg aria-hidden className="h-4 w-4 shrink-0 text-brand-500" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              H. Əliyev pr. 201, Kontakt Home ilə üzbəüz
            </span>
          </div>
        </div>
      </section>

      {/* telefon/planşet: yan illüstrasiyaların yerinə kartın altında kiçik şəkil */}
      {status !== "found" && (
        // eslint-disable-next-line @next/next/no-img-element -- dekorativ SVG
        <img src="/illustrations/books.svg" alt="" aria-hidden className="pointer-events-none mt-6 w-60 max-w-[70%] opacity-90 sm:w-72 xl:hidden" />
      )}

      {status === "found" && result && exam && (
        <div ref={resultRef} className="relative z-10 mt-6 flex w-full scroll-mt-4 justify-center sm:mt-10">
          {result.kind === "sheet" ? (
            <ResultSheet exam={exam} result={result.result} onNewSearch={handleNewSearch} />
          ) : (
            <ResultFile isNomresi={searchedNo} ext={result.ext} onNewSearch={handleNewSearch} />
          )}
        </div>
      )}
    </main>
  );
}
