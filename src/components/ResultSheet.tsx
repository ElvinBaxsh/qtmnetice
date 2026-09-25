"use client";

import { useRef, useState } from "react";
import type { ExamResult, Exam, QuestionAnswer } from "@/lib/types";

type Tone = "correct" | "wrong" | "partial" | "none";

function toneOf(q: QuestionAnswer): Tone {
  if (q.mark === "#" || q.mark === "~") return "partial";
  if (q.correct === null) return "none";
  return q.correct ? "correct" : "wrong";
}

const TONE_STYLES: Record<Tone, { tile: string; mark: string; symbol: string }> = {
  correct: { tile: "border-emerald-200 bg-emerald-50/60", mark: "text-emerald-600", symbol: "+" },
  wrong: { tile: "border-red-200 bg-red-50/60", mark: "text-red-500", symbol: "−" },
  partial: { tile: "border-gold-200 bg-gold-50", mark: "text-gold-600", symbol: "" },
  none: { tile: "border-gray-200 bg-white", mark: "text-gray-300", symbol: "—" },
};

// Telefon/planşet (lg-dən kiçik): hər sual kart, ekran eninə görə növbəti sətrə keçir
function QuestionTile({ q }: { q: QuestionAnswer }) {
  const tone = toneOf(q);
  const style = TONE_STYLES[tone];
  const wide = q.key.length > 4 || q.answer.length > 4;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border text-center leading-tight ${style.tile} ${wide ? "col-span-2" : ""}`}
    >
      <div className="bg-brand-700 py-0.5 text-[10px] font-semibold text-white">{q.no}</div>
      <div className="break-all px-0.5 pt-1 text-[11px] text-gray-500">{q.key}</div>
      <div className="break-all px-0.5 pt-0.5 text-xs font-semibold text-brand-900">{q.answer || "–"}</div>
      <div className={`pb-1 pt-0.5 text-sm font-bold ${style.mark}`}>{style.symbol || q.mark}</div>
    </div>
  );
}

// Kompüter (lg+): klassik cədvəl — bu enlikdə tam sığır, scroll yoxdur
function SectionTable({ section }: { section: ExamResult["sections"][number] }) {
  const rowLabel = "border-r border-brand-100 px-2 py-1.5 text-left font-medium text-gray-500";
  const cell = "border-r border-brand-50 px-1 py-1.5 last:border-r-0";

  return (
    <div className="mb-5 hidden overflow-hidden rounded-xl border border-brand-100 lg:block">
      <div className="bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white">{section.title}</div>
      <table className="w-full text-center text-xs">
        <tbody>
          <tr className="bg-brand-50 text-brand-700">
            <td className={`${rowLabel} w-16 text-brand-700`}>№</td>
            {section.questions.map((q) => (
              <td key={q.no} className={`${cell} font-semibold`}>
                {q.no}
              </td>
            ))}
          </tr>
          <tr>
            <td className={rowLabel}>Açar</td>
            {section.questions.map((q) => (
              <td key={q.no} className={`${cell} whitespace-nowrap text-gray-600`}>
                {q.key}
              </td>
            ))}
          </tr>
          <tr className="bg-brand-50/40">
            <td className={rowLabel}>Cavab</td>
            {section.questions.map((q) => (
              <td key={q.no} className={`${cell} whitespace-nowrap font-semibold text-brand-900`}>
                {q.answer || "–"}
              </td>
            ))}
          </tr>
          <tr>
            <td className={rowLabel}>Nəticə</td>
            {section.questions.map((q) => {
              const style = TONE_STYLES[toneOf(q)];
              return (
                <td key={q.no} className={`${cell} text-sm font-bold ${style.mark}`}>
                  {style.symbol || q.mark}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SectionBlock({ section }: { section: ExamResult["sections"][number] }) {
  return (
    <div className="mb-5 lg:hidden">
      <div className="mb-2 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white">{section.title}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.3rem,1fr))] gap-1.5">
        {section.questions.map((q) => (
          <QuestionTile key={q.no} q={q} />
        ))}
      </div>
    </div>
  );
}

function fmt(n: number, digits: number) {
  return Number(n ?? 0).toFixed(digits);
}

function SummaryBlock({ result }: { result: ExamResult }) {
  return (
    <div className="mt-2">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 px-4 py-3 text-white">
        <span className="text-sm font-semibold uppercase tracking-wide">Ümumi bal</span>
        <span className="text-3xl font-extrabold text-gold-200">{fmt(result.umumiBal, 2)}</span>
      </div>

      {/* Telefon: hər fənn ayrıca kart */}
      <div className="space-y-2 md:hidden">
        {result.summary.map((row) => (
          <div key={row.fenn} className="rounded-xl border border-brand-100 p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-semibold text-brand-800">{row.fenn}</span>
              <span className="text-sm text-gray-500">
                Fənn balı <b className="text-base text-brand-800">{fmt(row.fennBali, 2)}</b>
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <Stat label="Sual sayı" value={String(row.sualSayi)} />
              <Stat label="Yazı balları" value={fmt(row.yaziBallarinCemi, 2)} />
              <Stat label="Qapalı düz" value={fmt(row.qapaliDuzSayi, 1)} />
              <Stat label="Qapalı səhv" value={fmt(row.qapaliSehvSayi, 1)} />
              <Stat label="Açıq düz" value={fmt(row.aciqDuzSayi, 1)} />
              <Stat label="Açıq səhv" value={fmt(row.aciqSehvSayi, 1)} />
            </dl>
          </div>
        ))}
      </div>

      {/* Kompüter: cədvəl (enə sığır, scroll yoxdur) */}
      <table className="hidden w-full table-fixed overflow-hidden rounded-xl text-center text-xs md:table">
        <thead>
          <tr className="bg-brand-50 text-brand-800">
            <th className="w-[16%] px-2 py-2 text-left font-semibold">Fənlər</th>
            <th className="px-2 py-2 font-semibold">Sual sayı</th>
            <th className="px-2 py-2 font-semibold">Qapalı testlər üzrə düz sayı</th>
            <th className="px-2 py-2 font-semibold">Qapalı testlər üzrə səhv sayı</th>
            <th className="px-2 py-2 font-semibold">Açıq testlər üzrə düz sayı</th>
            <th className="px-2 py-2 font-semibold">Açıq testlər üzrə səhv sayı</th>
            <th className="px-2 py-2 font-semibold">Yazı testləri üzrə balların cəmi</th>
            <th className="px-2 py-2 font-semibold">Fənn balı</th>
          </tr>
        </thead>
        <tbody>
          {result.summary.map((row) => (
            <tr key={row.fenn} className="border-t border-brand-100">
              <td className="px-2 py-2 text-left font-semibold text-brand-800">{row.fenn}</td>
              <td className="px-2 py-2">{row.sualSayi}</td>
              <td className="px-2 py-2">{fmt(row.qapaliDuzSayi, 1)}</td>
              <td className="px-2 py-2">{fmt(row.qapaliSehvSayi, 1)}</td>
              <td className="px-2 py-2">{fmt(row.aciqDuzSayi, 1)}</td>
              <td className="px-2 py-2">{fmt(row.aciqSehvSayi, 1)}</td>
              <td className="px-2 py-2">{fmt(row.yaziBallarinCemi, 2)}</td>
              <td className="px-2 py-2 font-bold text-brand-800">{fmt(row.fennBali, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-gray-100 py-0.5">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-brand-900">{value}</dd>
    </div>
  );
}

const EXPORT_WIDTH = 1000;

export default function ResultSheet({ exam, result }: { exam: Exam; result: ExamResult }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "img" | null>(null);

  async function handleExport(kind: "pdf" | "img") {
    if (!sheetRef.current) return;
    setExporting(kind);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      // Fayl hər cihazda eyni, kompüter enində yaradılır; loqolu başlıq yalnız faylda görünür
      const canvas = await html2canvas(sheetRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        windowWidth: EXPORT_WIDTH + 100,
        onclone: (_doc, el) => {
          el.style.width = `${EXPORT_WIDTH}px`;
          el.style.boxShadow = "none";
          const header = el.querySelector<HTMLElement>("[data-export-header]");
          if (header) header.style.display = "flex";
        },
      });
      const fileBase = `netice-${result.isNomresi}`;

      if (kind === "img") {
        const link = document.createElement("a");
        link.download = `${fileBase}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        const { jsPDF } = await import("jspdf");
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? "l" : "p",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileBase}.pdf`);
      }
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-brand-800">Nəticəniz hazırdır</h2>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            {exporting === "pdf" ? "Hazırlanır…" : "PDF kimi yüklə"}
          </button>
          <button
            onClick={() => handleExport("img")}
            disabled={exporting !== null}
            className="rounded-full border border-gold-400 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-gold-50 disabled:opacity-50"
          >
            {exporting === "img" ? "Hazırlanır…" : "Şəkil kimi yüklə"}
          </button>
        </div>
      </div>

      <div ref={sheetRef} className="rounded-2xl border border-brand-100 bg-white p-3 shadow-sm sm:p-6">
        {/* Yalnız PDF/şəkil faylında görünür (onclone-da açılır) */}
        <div data-export-header className="mb-4 hidden items-center gap-4 border-b-2 border-gold-400 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- html2canvas üçün adi img */}
          <img src="/logo-256.png" alt="" width={88} height={88} className="h-[88px] w-[88px] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xl font-extrabold tracking-wide text-brand-700">QARABAĞ TƏDRİS MƏRKƏZİ</div>
            <div className="mt-1 text-sm text-gray-500">{exam.name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-gray-400">İş nömrəsi</div>
            <div className="text-2xl font-extrabold text-brand-800">{result.isNomresi}</div>
          </div>
        </div>

        <div className="mb-4 rounded-lg border-b-2 border-gold-400 bg-brand-50 px-3 py-2 text-center text-base font-bold tracking-wide text-brand-800 sm:text-lg">
          İMTAHAN NƏTİCƏ VƏRƏQİ
        </div>

        <div className="mb-5 grid grid-cols-1 gap-x-6 text-sm sm:grid-cols-2">
          {/* Kompüterdə iki sütun (DOM sırası); telefonda bir sütun — order ilə şəxsi məlumatlar əvvəl */}
          <InfoRow label="İmtahan" value={result.imtahan} order="order-7" />
          <InfoRow label="İş nömrəsi" value={result.isNomresi} order="order-3" />
          <InfoRow label="Keçirilmə tarixi" value={result.kecirilmeTarixi} order="order-8" />
          <InfoRow label="Bölmə" value={result.bolme} order="order-6" />
          <InfoRow label="Soyadı" value={result.soyadi} order="order-1" />
          <InfoRow label="Sinif" value={result.sinif} order="order-4" />
          <InfoRow label="Adı" value={result.adi} order="order-2" />
          <InfoRow label="Variant" value={result.variant} order="order-5" />
        </div>

        {result.sections.map((section) => (
          <div key={section.title}>
            <SectionTable section={section} />
            <SectionBlock section={section} />
          </div>
        ))}

        <SummaryBlock result={result} />

        <p className="mt-4 text-center text-[11px] text-gray-400">{exam.name}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, order }: { label: string; value: string; order: string }) {
  return (
    <div className={`flex justify-between gap-3 border-b border-gray-100 py-1.5 ${order} sm:order-none`}>
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right font-medium text-brand-900">{value}</span>
    </div>
  );
}
