"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminApi, AdminError, shrinkImage, type AdminStudent, type Me, type OverviewRow, type Rejected } from "@/lib/adminApi";

const ERRORS: Record<string, string> = {
  invalid_credentials: "İstifadəçi adı və ya şifrə yanlışdır.",
  too_many_requests: "Çox sayda cəhd. Bir dəqiqə sonra yenidən cəhd edin.",
  locked: "Çox sayda səhv cəhd. Hesab 15 dəqiqəlik bağlanıb.",
  image_encode: "Şəkil emal oluna bilmədi. Başqa formatda (JPG) yoxlayın.",
  not_found: "Bu iş nömrəsi ilə tələbə tapılmadı.",
  too_many_files: "Bir tələbəyə ən çox 30 fayl yükləmək olar.",
  no_exam: "Aktiv imtahan yoxdur.",
  network: "İnternet bağlantısını yoxlayın.",
};
const REJECT_REASONS: Record<Rejected["reason"], string> = {
  bad_type: "yalnız şəkil (JPG, PNG, WEBP) və PDF qəbul olunur",
  too_large: "fayl çox böyükdür",
  upload_error: "yüklənmədi",
};

function errorText(e: unknown) {
  const code = e instanceof AdminError ? e.code : "server";
  return ERRORS[code] ?? "Xəta baş verdi, yenidən cəhd edin.";
}

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-brand-900 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100";
const primaryButton =
  "rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 px-6 py-3 font-semibold text-white shadow-md shadow-brand-700/20 transition hover:from-brand-800 hover:to-brand-600 disabled:opacity-60";

export default function AdminPanel() {
  // Admin panel yalnız əsas hostinqdə (PHP) işləyir; Vercel/Supabase versiyasında bağlıdır
  const unavailable = process.env.BACKEND === "supabase";
  const [phase, setPhase] = useState<"loading" | "login" | "ready" | "unavailable">(unavailable ? "unavailable" : "loading");
  const [me, setMe] = useState<Me | null>(null);

  const handleAuthError = useCallback((e: unknown) => {
    if (e instanceof AdminError && e.status === 401) {
      setMe(null);
      setPhase("login");
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (unavailable) return;
    adminApi
      .me()
      .then((m) => {
        setMe(m);
        setPhase("ready");
      })
      .catch((e) => {
        if (!handleAuthError(e)) setPhase("login");
      });
  }, [handleAuthError, unavailable]);

  async function logout() {
    await adminApi.logout().catch(() => {});
    setMe(null);
    setPhase("login");
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-brand-50/70 via-background to-gold-50/60 px-3 pb-10 sm:px-6">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- statik loqo */}
          <img src="/logo-256.png" alt="Qarabağ Tədris Mərkəzi" className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-brand-800 sm:text-xl">Admin panel</div>
            {me?.exam && <div className="truncate text-xs text-gray-500 sm:text-sm">{me.exam.name}</div>}
          </div>
        </div>
        {phase === "ready" && me && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden font-medium text-gray-700 capitalize sm:inline">{me.user}</span>
            <button type="button" onClick={logout} className="rounded-full border border-brand-200 bg-white px-4 py-2 font-medium text-brand-800 hover:bg-brand-50">
              Çıxış
            </button>
          </div>
        )}
      </header>

      {phase === "loading" && <p className="py-20 text-center text-gray-500">Yüklənir…</p>}
      {phase === "unavailable" && (
        <p className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center text-gray-600 shadow">
          Admin panel yalnız əsas saytda (qtmnetice.az) işləyir.
        </p>
      )}
      {phase === "login" && (
        <LoginForm
          onSuccess={async () => {
            const m = await adminApi.me();
            setMe(m);
            setPhase("ready");
          }}
        />
      )}
      {phase === "ready" && me && <Workspace onAuthError={handleAuthError} />}
    </main>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminApi.login(username.trim(), password);
      await onSuccess();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl shadow-brand-900/10 sm:mt-16 sm:p-8">
      <h1 className="text-center text-2xl font-extrabold text-brand-800">Müəllim girişi</h1>
      <p className="mt-1 text-center text-sm text-gray-500">Açıq tipli cavabları yükləmək üçün daxil olun.</p>
      <div className="mt-6 space-y-3">
        <input className={inputClass} placeholder="İstifadəçi adı" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input
          className={inputClass}
          type="password"
          placeholder="Şifrə"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={`${primaryButton} mt-5 w-full`}>
        {busy ? "Yoxlanılır…" : "Daxil ol"}
      </button>
    </form>
  );
}

function Workspace({ onAuthError }: { onAuthError: (e: unknown) => boolean }) {
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [filter, setFilter] = useState("");
  const [no, setNo] = useState("");
  const [student, setStudent] = useState<AdminStudent | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const fail = useCallback(
    (e: unknown) => {
      if (!onAuthError(e)) setMessage({ type: "error", text: errorText(e) });
    },
    [onAuthError],
  );

  useEffect(() => {
    adminApi
      .overview()
      .then((d) => setRows(d.students))
      .catch(fail);
  }, [fail]);

  function updateCount(studentNo: string, count: number) {
    setRows((rs) => rs.map((r) => (r.no === studentNo ? { ...r, files: count } : r)));
  }

  async function openStudent(target: string) {
    const value = target.trim();
    if (!value) return;
    setNo(value);
    setLoadingStudent(true);
    setMessage(null);
    try {
      setStudent(await adminApi.student(value));
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setStudent(null);
      fail(e);
    } finally {
      setLoadingStudent(false);
    }
  }

  async function upload(list: FileList | File[] | null) {
    if (!student || !list || list.length === 0) return;
    setMessage(null);
    setProgress(0);
    try {
      const prepared = await Promise.all(Array.from(list).map(shrinkImage));
      const res = await adminApi.upload(student.no, prepared, setProgress);
      if (res.files) {
        setStudent({ ...student, files: res.files });
        updateCount(student.no, res.files.length);
      }
      const added = prepared.length - res.rejected.length;
      if (res.rejected.length) {
        setMessage({
          type: "error",
          text: res.rejected.map((r) => `${r.name}: ${REJECT_REASONS[r.reason]}`).join(" · ") + (added ? ` (${added} fayl yükləndi)` : ""),
        });
      } else {
        setMessage({ type: "ok", text: `${added} fayl yükləndi.` });
      }
    } catch (e) {
      fail(e);
    } finally {
      setProgress(null);
      if (fileInput.current) fileInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
    }
  }

  async function remove(id: number) {
    if (!student || !window.confirm("Bu faylı silmək istədiyinizə əminsiniz?")) return;
    try {
      const res = await adminApi.remove(id);
      setStudent({ ...student, files: res.files });
      updateCount(student.no, res.files.length);
    } catch (e) {
      fail(e);
    }
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase("az");
    if (!q) return rows;
    return rows.filter((r) => `${r.no} ${r.soyadi} ${r.adi}`.toLocaleLowerCase("az").includes(q));
  }, [rows, filter]);
  const doneCount = rows.filter((r) => r.files > 0).length;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_360px]">
      {/* tələbə və yükləmə */}
      <section ref={editorRef} className="scroll-mt-4 rounded-3xl bg-white p-4 shadow-xl shadow-brand-900/5 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            openStudent(no);
          }}
          className="flex gap-2"
        >
          <input
            className={inputClass}
            inputMode="numeric"
            placeholder="İş nömrəsi"
            aria-label="İş nömrəsi"
            value={no}
            onChange={(e) => setNo(e.target.value)}
          />
          <button type="submit" disabled={loadingStudent} className={`${primaryButton} shrink-0 px-5`}>
            {loadingStudent ? "…" : "Aç"}
          </button>
        </form>

        {message && (
          <p className={`mt-3 rounded-xl px-4 py-2 text-sm ${message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </p>
        )}

        {!student && !loadingStudent && (
          <p className="mt-8 pb-6 text-center text-sm text-gray-500">İş nömrəsini yazın və ya siyahıdan tələbə seçin.</p>
        )}

        {student && (
          <div className="mt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-100 pb-3">
              <div>
                <div className="text-lg font-bold text-brand-900">
                  {student.soyadi} {student.adi}
                </div>
                <div className="text-sm text-gray-500">
                  İş nömrəsi <b className="text-brand-800">{student.no}</b>
                  {student.sinif && <> · {student.sinif}-cu sinif</>}
                </div>
              </div>
              <span className="text-sm text-gray-500">{student.files.length} fayl</span>
            </div>

            {/* yükləmə sahəsi */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                upload(e.dataTransfer.files);
              }}
              className={`mt-4 rounded-2xl border-2 border-dashed p-5 text-center transition ${dragOver ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-brand-50/40"}`}
            >
              {progress !== null ? (
                <div>
                  <div className="text-sm font-medium text-brand-800">Yüklənir… {progress}%</div>
                  <div className="mx-auto mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-brand-100">
                    <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Açıq tipli cavabların şəklini və ya PDF-ini bura sürükləyin</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className={`${primaryButton} flex items-center gap-2 px-5 py-2.5 text-sm`}
                    >
                      <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Fayl seç
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInput.current?.click()}
                      className="flex items-center gap-2 rounded-xl border border-gold-400 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-gold-50"
                    >
                      <svg aria-hidden className="h-6 w-6 text-brand-700" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 8a2 2 0 0 1 2-2h1.5l1.4-2h6.2l1.4 2H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                      Şəkil çək
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">JPG, PNG, WEBP, PDF · bir neçə faylı birdən seçmək olar</p>
                </>
              )}
              <input ref={fileInput} type="file" multiple accept="image/*,application/pdf" hidden onChange={(e) => upload(e.target.files)} />
              <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => upload(e.target.files)} />
            </div>

            {/* yüklənmiş fayllar */}
            {student.files.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {student.files.map((f, i) => (
                  <div key={f.id} className="overflow-hidden rounded-xl border border-brand-100 bg-white">
                    <a href={adminApi.fileUrl(f.id)} target="_blank" rel="noopener" className="block aspect-[3/4] bg-gray-50">
                      {f.mime.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element -- API-dən gələn fayl
                        <img src={adminApi.fileUrl(f.id)} alt={f.name} loading="lazy" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-brand-700">PDF</div>
                      )}
                    </a>
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
                      <span className="truncate text-gray-500" title={f.name}>
                        {i + 1}. {formatSize(f.size)}
                      </span>
                      <button type="button" onClick={() => remove(f.id)} className="shrink-0 font-medium text-red-600 hover:text-red-800">
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* tələbə siyahısı */}
      <aside className="rounded-3xl bg-white p-4 shadow-xl shadow-brand-900/5 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold text-brand-800">Tələbələr</h2>
          <span className="text-xs text-gray-500">
            {doneCount} / {rows.length} yüklənib
          </span>
        </div>
        <input className={`${inputClass} py-2 text-sm`} placeholder="Axtar: ad, soyad, nömrə" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <ul className="mt-3 max-h-[60vh] divide-y divide-brand-50 overflow-y-auto">
          {filtered.map((r) => (
            <li key={r.no}>
              <button
                type="button"
                onClick={() => openStudent(r.no)}
                className={`flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm transition hover:bg-brand-50 ${student?.no === r.no ? "bg-brand-50" : ""}`}
              >
                <span className="min-w-0 truncate">
                  <b className="text-brand-800">{r.no}</b> <span className="text-gray-600">{r.soyadi} {r.adi}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${r.files ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}
                >
                  {r.files}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="py-4 text-center text-sm text-gray-400">Tapılmadı</li>}
        </ul>
      </aside>
    </div>
  );
}
