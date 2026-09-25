# QTM Nəticə

İmtahan nəticələrinin iş nömrəsi ilə axtarışı üçün veb tətbiq.

- **Sayt:** Next.js, statik export (`out/`)
- **Backend:** PHP + MySQL (`api/`), cPanel hostinqdə işləyir

Sayt həmişə ən son dərc olunmuş (`exams.published = 1`) imtahanı göstərir.

**Müvəqqəti:** Vercel-də yığılanda (`VERCEL=1`) sayt datanı Supabase-dən oxuyur (`src/lib/supabaseBackend.ts`), cPanel hostinqi aktivləşənə qədər. Başqa yerdə yığılanda PHP API istifadə olunur. Əl ilə seçmək üçün: `BACKEND=php` və ya `BACKEND=supabase`.

## Struktur

- `src/app/page.tsx` — axtarış səhifəsi
- `src/components/ResultSheet.tsx` — nəticə vərəqi (PDF-dən oxunmuş nəticələr), PDF/şəkil export
- `src/components/ResultFile.tsx` — yüklənmiş şəkil/PDF nəticə faylı
- `src/lib/db.ts` — PHP API sorğuları
- `api/` — PHP API (`exam.php`, `result.php`, `file.php`)
- `database/schema.sql` — MySQL cədvəlləri
- `scripts/results-to-sql.mjs` — nəticələri phpMyAdmin üçün SQL-ə çevirir

## Lokal işə salma (XAMPP)

1. XAMPP Control Panel → **Apache** və **MySQL** → Start
2. http://localhost/phpmyadmin → `qtm` bazası yaradın (utf8mb4_unicode_ci) → Import → `database/schema.sql`, sonra nəticə SQL faylı
3. `api/config.sample.php` → `api/config.php` kopyalayın, `db_name = qtm`, `db_user = root`, `db_pass = ''`, `cors_origin = 'http://localhost:3000'`
4. `C:\xampp\htdocs\qtm-api` → `api/` qovluğuna junction (bir dəfəlik):
   `mklink /J C:\xampp\htdocs\qtm-api C:\path\to\qtmnetice\api`
5. `.env.local`: `NEXT_PUBLIC_API_BASE=http://localhost/qtm-api`
6. `npm install && npm run dev` → http://localhost:3000

## cPanel-ə yükləmə

1. **Baza:** cPanel → MySQL Databases → baza + istifadəçi yaradın, istifadəçiyə bazada ALL PRIVILEGES verin.
   phpMyAdmin → bazanı seçin → Import → `database/schema.sql`, sonra nəticə SQL faylı.
2. **Sayt:** `.env.local`-da `NEXT_PUBLIC_API_BASE` sətrini silin və ya şərhə alın, sonra `npm run build`.
   `out/` qovluğunun **içindəkiləri** `public_html/`-ə yükləyin.
3. **API:** `api/` qovluğunu `public_html/api/` kimi yükləyin (`.htaccess` daxil).
   Serverdə `api/config.sample.php` → `api/config.php` kopyalayın və baza məlumatlarını yazın. `cors_origin` boş qalsın.
4. **Yoxlama:** `https://domeniniz/api/exam.php` imtahanı JSON kimi qaytarmalıdır.

## Yeni nəticələrin yüklənməsi

**PDF (optik oxuyucunun mətnli PDF-i):**

```bash
node scripts/pdf-items.mjs /yol/Netice.pdf items.json
node scripts/parse-pdf.mjs items.json parsed.json
node scripts/results-to-sql.mjs parsed.json "Qarabağ Tədris Mərkəzi — 04.10.2026 sınaq imtahanı" 2026-10-04 netice.sql
```

`netice.sql`-i phpMyAdmin → Import ilə yükləyin. Yeni imtahan avtomatik yaradılır və saytda ən son imtahan kimi görünür.

**Şəkil/PDF fayllar (hər tələbə üçün ayrı fayl):**

1. İmtahanı yaradın (phpMyAdmin → `exams` → Insert) və onun `id`-sini qeyd edin.
2. File Manager ilə faylları `config.php`-dəki `files_dir` qovluğuna, `<imtahan id>/` alt qovluğuna yükləyin.
   Fayl adı iş nömrəsi olmalıdır: `1125.png`, `1126.jpg`, `1127.pdf`.
3. `files_dir` **public_html-dən kənarda** olmalıdır, əks halda fayllar birbaşa URL ilə açıla bilər.

Eyni iş nömrəsi həm bazada, həm də fayl kimi varsa, bazadakı nəticə göstərilir.

Nəticələri gizlətmək üçün: `exams.published = 0` (bütün imtahan) və ya `results.published = 0` (tək nəticə).
