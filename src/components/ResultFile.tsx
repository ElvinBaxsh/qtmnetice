"use client";

import { resultFileUrl } from "@/lib/db";

// Yüklənmiş şəkil/PDF nəticə vərəqi
export default function ResultFile({
  isNomresi,
  ext,
  onNewSearch,
}: {
  isNomresi: string;
  ext: string;
  onNewSearch: () => void;
}) {
  const src = resultFileUrl(isNomresi);
  const isPdf = ext === "pdf";

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
          <h2 className="text-lg font-semibold text-brand-800">Nəticəniz hazırdır</h2>
          <button
            type="button"
            onClick={onNewSearch}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-800"
          >
            <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Yeni axtarış
          </button>
        </div>
        <a
          href={resultFileUrl(isNomresi, true)}
          className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800"
        >
          {isPdf ? "PDF-i yüklə" : "Şəkli yüklə"}
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white p-2 shadow-sm">
        {isPdf ? (
          <iframe src={src} title={`Nəticə ${isNomresi}`} className="h-[80vh] w-full rounded-xl" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- API-dən gələn fayl, optimizasiya lazım deyil
          <img src={src} alt={`Nəticə vərəqi ${isNomresi}`} className="h-auto w-full rounded-xl" />
        )}
      </div>
    </div>
  );
}
