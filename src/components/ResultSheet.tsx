"use client";

import { useRef, useState } from "react";
import type { ExamResult, Exam } from "@/lib/types";

function Mark({ correct }: { correct: boolean | null }) {
  if (correct === null) {
    return <span className="text-gray-300">—</span>;
  }
  return correct ? (
    <span className="text-emerald-600 font-semibold">+</span>
  ) : (
    <span className="text-red-500 font-semibold">−</span>
  );
}

function SectionTable({ section }: { section: ExamResult["sections"][number] }) {
  return (
    <div className="mb-6">
      <div className="rounded-t-lg bg-[#17213b] px-4 py-2 text-sm font-semibold text-white">
        {section.title}
      </div>
      <div className="overflow-x-auto border border-t-0 border-gray-200 rounded-b-lg">
        <table className="min-w-full text-center text-xs">
          <tbody>
            <tr className="bg-gray-50 text-gray-500">
              <td className="sticky left-0 bg-gray-50 px-2 py-1 font-medium border-r border-gray-200">№</td>
              {section.questions.map((q) => (
                <td key={`no-${q.no}`} className="px-2 py-1 min-w-[28px] border-r border-gray-100 last:border-r-0">
                  {q.no}
                </td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 bg-white px-2 py-1 font-medium text-gray-500 border-r border-gray-200">Açar</td>
              {section.questions.map((q) => (
                <td key={`key-${q.no}`} className="px-2 py-1 border-r border-gray-100 last:border-r-0 text-gray-700">
                  {q.key}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="sticky left-0 bg-gray-50 px-2 py-1 font-medium text-gray-500 border-r border-gray-200">Cavab</td>
              {section.questions.map((q) => (
                <td key={`ans-${q.no}`} className="px-2 py-1 border-r border-gray-100 last:border-r-0 text-gray-700">
                  {q.answer || "–"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 bg-white px-2 py-1 font-medium text-gray-500 border-r border-gray-200">Nəticə</td>
              {section.questions.map((q) => (
                <td key={`mark-${q.no}`} className="px-2 py-1 border-r border-gray-100 last:border-r-0">
                  <Mark correct={q.correct} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ResultSheet({ exam, result }: { exam: Exam; result: ExamResult }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "img" | null>(null);

  async function handleExport(kind: "pdf" | "img") {
    if (!sheetRef.current) return;
    setExporting(kind);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(sheetRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#17213b]">Nəticəniz hazırdır</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="rounded-full bg-[#17213b] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {exporting === "pdf" ? "Hazırlanır…" : "PDF kimi yüklə"}
          </button>
          <button
            onClick={() => handleExport("img")}
            disabled={exporting !== null}
            className="rounded-full border border-[#17213b]/20 bg-white px-4 py-2 text-sm font-medium text-[#17213b] transition hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting === "img" ? "Hazırlanır…" : "Şəkil kimi yüklə"}
          </button>
        </div>
      </div>

      <div ref={sheetRef} className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 rounded-lg bg-gray-100 px-4 py-2 text-center text-lg font-bold tracking-wide text-[#17213b]">
          İMTAHAN NƏTİCƏ VƏRƏQİ
        </div>

        <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <InfoRow label="İmtahan" value={result.imtahan} />
          <InfoRow label="İş nömrəsi" value={result.isNomresi} />
          <InfoRow label="Keçirilmə tarixi" value={result.kecirilmeTarixi} />
          <InfoRow label="Bölmə" value={result.bolme} />
          <InfoRow label="Soyadı" value={result.soyadi} />
          <InfoRow label="Sinif" value={result.sinif} />
          <InfoRow label="Adı" value={result.adi} />
          <InfoRow label="Variant" value={result.variant} />
        </div>

        {result.sections.map((section) => (
          <SectionTable key={section.title} section={section} />
        ))}

        <div className="mt-2">
          <div className="rounded-t-lg bg-gray-100 px-4 py-2 text-center text-sm font-bold text-[#17213b]">
            ÜMUMİ NƏTİCƏLƏR
          </div>
          <div className="overflow-x-auto border border-t-0 border-gray-200 rounded-b-lg">
            <table className="min-w-full text-center text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">Fənlər</th>
                  <th className="px-3 py-2 font-medium">Sual sayı</th>
                  <th className="px-3 py-2 font-medium">Qapalı testlər üzrə düz sayı</th>
                  <th className="px-3 py-2 font-medium">Qapalı testlər üzrə səhv sayı</th>
                  <th className="px-3 py-2 font-medium">Açıq testlər üzrə düz sayı</th>
                  <th className="px-3 py-2 font-medium">Açıq testlər üzrə səhv sayı</th>
                  <th className="px-3 py-2 font-medium">Yazı testləri üzrə balların cəmi</th>
                  <th className="px-3 py-2 font-medium">Fənn balı</th>
                  <th rowSpan={result.summary.length + 1} className="border-l border-gray-200 px-4 py-2 align-middle font-medium">
                    <div className="text-sm text-gray-500">Ümumi bal</div>
                    <div className="mt-1 text-2xl font-extrabold text-orange-500">{result.umumiBal.toFixed(2)}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.summary.map((row) => (
                  <tr key={row.fenn} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-left font-medium text-[#17213b]">{row.fenn}</td>
                    <td className="px-3 py-2">{row.sualSayi}</td>
                    <td className="px-3 py-2">{row.qapaliDuzSayi.toFixed(1)}</td>
                    <td className="px-3 py-2">{row.qapaliSehvSayi.toFixed(1)}</td>
                    <td className="px-3 py-2">{row.aciqDuzSayi.toFixed(1)}</td>
                    <td className="px-3 py-2">{row.aciqSehvSayi.toFixed(1)}</td>
                    <td className="px-3 py-2">{row.yaziBallarinCemi.toFixed(2)}</td>
                    <td className="px-3 py-2 font-semibold">{row.fennBali.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-400">{exam.name}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-[#17213b]">{value}</span>
    </div>
  );
}
