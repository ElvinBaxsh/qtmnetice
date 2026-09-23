"use client";

import { useState } from "react";
import { exams, findResult } from "@/lib/mockData";
import type { ExamResult } from "@/lib/types";
import ResultSheet from "@/components/ResultSheet";

export default function Home() {
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const [isNomresi, setIsNomresi] = useState("");
  const [result, setResult] = useState<ExamResult | null>(null);
  const [status, setStatus] = useState<"idle" | "not-found" | "found">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!examId || !isNomresi.trim()) return;

    const found = findResult(examId, isNomresi);
    if (found) {
      setResult(found);
      setStatus("found");
    } else {
      setResult(null);
      setStatus("not-found");
    }
  }

  const selectedExam = exams.find((ex) => ex.id === examId) ?? exams[0];

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-16">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-orange-100/70 blur-3xl" />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white/90 p-8 shadow-xl backdrop-blur sm:p-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="#059669" strokeWidth="1.5" />
              <path d="M9 13.5l2 2 4-4.5" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#17213b] sm:text-4xl">İmtahan nəticələri</h1>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            İmtahanı seçin, iştirakçı nömrənizi daxil edin və nəticənizi öyrənin.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-3 rounded-2xl bg-gray-50/80 p-3 sm:flex-row sm:items-center"
        >
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#17213b] outline-none focus:border-orange-300 sm:w-56"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            inputMode="numeric"
            placeholder="İş nömrəsini daxil edin"
            value={isNomresi}
            onChange={(e) => setIsNomresi(e.target.value)}
            className="w-full flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#17213b] outline-none focus:border-orange-300"
          />

          <button
            type="submit"
            className="w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            Daxil ol &nbsp;→
          </button>
        </form>

        {status === "not-found" && (
          <p className="mt-4 text-center text-sm text-red-500">
            Bu iş nömrəsi üzrə nəticə tapılmadı, ya da nəticələr hələ elan olunmayıb.
          </p>
        )}
      </div>

      {status === "found" && result && (
        <div className="relative z-10 mt-10 flex w-full justify-center">
          <ResultSheet exam={selectedExam} result={result} />
        </div>
      )}
    </main>
  );
}
