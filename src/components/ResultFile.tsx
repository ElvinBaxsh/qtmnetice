"use client";

import { resultFileUrl } from "@/lib/db";

// Yüklənmiş şəkil/PDF nəticə vərəqi
export default function ResultFile({ isNomresi, ext }: { isNomresi: string; ext: string }) {
  const src = resultFileUrl(isNomresi);
  const isPdf = ext === "pdf";

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-brand-800">Nəticəniz hazırdır</h2>
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
