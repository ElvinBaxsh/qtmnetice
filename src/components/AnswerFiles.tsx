"use client";

import { useEffect, useState } from "react";
import { answerFileUrl } from "@/lib/db";
import type { AnswerFile } from "@/lib/types";

// Tələbənin açıq tipli suallara cavabları (müəllim yükləyir). Fayl yoxdursa heç nə göstərilmir.
export default function AnswerFiles({ isNomresi, files }: { isNomresi: string; files: AnswerFile[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const images = files.filter((f) => f.mime.startsWith("image/"));
  const current = open === null ? null : images[open];

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (files.length === 0) return null;

  return (
    <section className="mt-6 w-full max-w-5xl rounded-2xl border border-brand-100 bg-white p-3 shadow-sm sm:p-6">
      <h3 className="mb-1 text-base font-bold text-brand-800 sm:text-lg">Açıq tipli suallara cavablarınız</h3>
      <p className="mb-4 text-sm text-gray-500">Yazılı işiniz müəllim tərəfindən yüklənib. Böyütmək üçün şəklə toxunun.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {files.map((f, i) => {
          const url = answerFileUrl(isNomresi, f.id);
          if (f.mime === "application/pdf") {
            return (
              <a
                key={f.id}
                href={url}
                target="_blank"
                rel="noopener"
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition hover:bg-brand-100"
              >
                <svg aria-hidden className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                  <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="text-sm font-semibold">PDF · {i + 1}</span>
              </a>
            );
          }
          const imageIndex = images.indexOf(f);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setOpen(imageIndex)}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-brand-100 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- API-dən gələn fayl */}
              <img src={url} alt={`Cavab ${i + 1}`} loading="lazy" className="h-full w-full object-contain transition group-hover:scale-105" />
              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-brand-800">
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between gap-3 p-3 text-sm text-white">
            <span>
              {open! + 1} / {images.length}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={answerFileUrl(isNomresi, current.id, true)}
                onClick={(e) => e.stopPropagation()}
                className="rounded-full bg-white/15 px-4 py-2 font-medium hover:bg-white/25"
              >
                Yüklə
              </a>
              <button type="button" aria-label="Bağla" className="rounded-full bg-white/15 px-4 py-2 font-medium hover:bg-white/25">
                Bağla
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- API-dən gələn fayl */}
            <img
              src={answerFileUrl(isNomresi, current.id)}
              alt={`Cavab ${open! + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-3 p-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setOpen((open! - 1 + images.length) % images.length)}
                className="rounded-full bg-white/15 px-5 py-2 text-white hover:bg-white/25"
              >
                ← Əvvəlki
              </button>
              <button
                type="button"
                onClick={() => setOpen((open! + 1) % images.length)}
                className="rounded-full bg-white/15 px-5 py-2 text-white hover:bg-white/25"
              >
                Növbəti →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
