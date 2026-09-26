// Admin panel (müəllim) üçün PHP API sorğuları. Sessiya cookie ilə saxlanılır.
import { API_BASE } from "./db";

const ADMIN_BASE = `${API_BASE}/admin`;

export type AdminFile = { id: number; mime: string; name: string; size: number };
export type AdminStudent = { no: string; soyadi: string; adi: string; sinif: string; files: AdminFile[] };
export type OverviewRow = { no: string; soyadi: string; adi: string; sinif: string; files: number };
export type Me = { user: string; exam: { id: number; name: string; date: string } | null };
export type Rejected = { name: string; reason: "bad_type" | "too_large" | "upload_error" };

export class AdminError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ADMIN_BASE}/${path}`, {
    ...init,
    credentials: "include",
    // X-QTM başlığı: dəyişiklik sorğularının bizim səhifədən gəldiyini göstərir (CSRF qoruması)
    headers: { "X-QTM": "1", ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminError(res.status, (data as { error?: string }).error ?? "server");
  return data as T;
}

export const adminApi = {
  me: () => request<Me>("me.php"),
  login: (username: string, password: string) =>
    request<{ user: string }>("login.php", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: true }>("logout.php", { method: "POST" }),
  overview: () => request<{ students: OverviewRow[] }>("overview.php"),
  student: (no: string) => request<AdminStudent>(`student.php?no=${encodeURIComponent(no)}`),
  remove: (id: number) => request<{ files: AdminFile[] }>("delete.php", { method: "POST", body: JSON.stringify({ id }) }),
  fileUrl: (id: number) => `${ADMIN_BASE}/file.php?id=${id}`,

  // Fayllar bir-bir göndərilir: serverin ümumi sorğu limiti (post_max_size) aşılmasın, faiz də dəqiq olsun
  async upload(no: string, files: File[], onProgress: (percent: number) => void) {
    const total = files.reduce((sum, f) => sum + f.size, 0) || 1;
    let done = 0;
    // Heç bir sorğu uğurlu olmasa null qalır — mövcud siyahı dəyişmir
    let latest: AdminFile[] | null = null;
    const rejected: Rejected[] = [];
    for (const file of files) {
      try {
        const res = await uploadOne(no, file, (loaded) => onProgress(Math.round(((done + loaded) / total) * 100)));
        latest = res.files;
        rejected.push(...res.rejected);
      } catch (e) {
        // Serverin öz limiti (413) — bu faylı rədd edib davam edirik
        if (e instanceof AdminError && e.code === "too_large") rejected.push({ name: file.name, reason: "too_large" });
        else throw e;
      }
      done += file.size;
    }
    return { files: latest, rejected };
  },
};

function uploadOne(no: string, file: File, onLoaded: (bytes: number) => void) {
  return new Promise<{ files: AdminFile[]; rejected: Rejected[] }>((resolve, reject) => {
    const form = new FormData();
    form.append("no", no);
    form.append("files[]", file, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${ADMIN_BASE}/upload.php`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-QTM", "1");
    xhr.upload.onprogress = (e) => e.lengthComputable && onLoaded(Math.min(e.loaded, file.size));
    xhr.onload = () => {
      let data: { error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as { files: AdminFile[]; rejected: Rejected[] });
      else reject(new AdminError(xhr.status, data.error ?? (xhr.status === 413 ? "too_large" : "server")));
    };
    xhr.onerror = () => reject(new AdminError(0, "network"));
    xhr.send(form);
  });
}

// Şəkillər yükləmədən əvvəl brauzerdə yenidən kodlanır:
// - telefon fotosundakı EXIF (GPS koordinatları, cihaz, tarix) silinir — tələbəyə müəllimin yeri çatmasın;
// - böyük fotolar 2000 px-ə kiçildilir (5 MB -> ~400 KB). PDF olduğu kimi qalır.
const MAX_SIDE = 2000;

export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  let bitmap: ImageBitmap;
  try {
    // EXIF-dəki fırlanma nəzərə alınır, şəkil düz görünür
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // brauzer oxuya bilmirsə (məs. HEIC), server növünü yoxlayıb rədd edəcək
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // şəffaf PNG-lər JPEG-də qara olmasın
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  // Kodlama alınmasa orijinalı göndərmirik — metadata sızmasın
  if (!blob) throw new AdminError(0, "image_encode");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
