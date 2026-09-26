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
- `src/components/AnswerFiles.tsx` — tələbənin açıq tipli cavab faylları (nəticənin altında)
- `src/app/admin/`, `src/components/admin/AdminPanel.tsx` — müəllim admin paneli (`/admin/`)
- `src/lib/db.ts`, `src/lib/adminApi.ts` — PHP API sorğuları
- `api/` — PHP API (`exam.php`, `result.php`, `file.php`, `answer-file.php`), `api/admin/` — admin endpointləri
- `database/schema.sql` — MySQL cədvəlləri
- `scripts/results-to-sql.mjs` — nəticələri phpMyAdmin üçün SQL-ə çevirir

## Lokal işə salma (XAMPP)

1. XAMPP Control Panel → **Apache** və **MySQL** → Start
2. http://localhost/phpmyadmin → `qtm` bazası yaradın (utf8mb4_unicode_ci) → Import → `database/schema.sql`, sonra nəticə SQL faylı
3. `api/config.sample.php` → `api/config.php` kopyalayın, `db_name = qtm`, `db_user = root`, `db_pass = ''`, `cors_origin = 'http://localhost:3000'`
4. `C:\xampp\htdocs\qtm-api` → `api/` qovluğuna junction (bir dəfəlik):
   `mklink /J C:\xampp\htdocs\qtm-api C:\path\to\qtmnetice\api`
5. `.env.development.local`: `NEXT_PUBLIC_API_BASE=http://localhost/qtm-api` (yalnız `npm run dev` üçün)
6. `npm install && npm run dev` → http://localhost:3000

## cPanel-ə yükləmə

1. **Baza:** cPanel → MySQL Databases → baza + istifadəçi yaradın, istifadəçiyə bazada ALL PRIVILEGES verin.
   phpMyAdmin → bazanı seçin → Import → `database/schema.sql`, sonra nəticə SQL faylı.
2. **Sayt:** `npm run build`.
   `out/` qovluğunun **içindəkiləri** `public_html/`-ə yükləyin.
3. **API:** `api/` qovluğunu `public_html/api/` kimi yükləyin (`.htaccess`, `.user.ini` daxil).
   **Konfiqurasiya public_html-dən kənarda:** `api/config.sample.php`-ni `/home/<istifadəçi>/qtm-config.php` kimi yükləyin
   (public_html-in yanına, içinə yox), baza məlumatlarını yazın, icazəsini `600` edin. `cors_origin` boş qalsın.
   (Alternativ: `public_html/api/config.php` — `.htaccess` ilə bağlıdır, amma kənarda saxlamaq daha təhlükəsizdir.)
4. **SSL:** cPanel → SSL/TLS Status → AutoSSL aktiv olmalıdır. `.htaccess` bütün sorğuları HTTPS-ə yönləndirir.
5. **Yoxlama:** `https://domeniniz/api/exam.php` imtahanı JSON kimi qaytarmalıdır.

Artıq qurulmuş bazaya admin paneli əlavə etmək üçün: phpMyAdmin → Import → `database/002_admin_panel.sql`.

## Admin panel (müəllimlər)

`https://domeniniz/admin/` — müəllim tələbənin iş nömrəsinə görə açıq tipli suallara cavablarının şəklini və ya PDF-ini yükləyir.
Tələbə öz iş nömrəsini yazanda həmin fayllar nəticə vərəqinin altında görünür (yalnız nəticəsi elan olunubsa).

**Müəllim hesabı əlavə etmək** — şifrənin hash-ini yaradın (XAMPP-da və ya cPanel Terminal-da):

```bash
php -r "echo password_hash('ŞİFRƏ', PASSWORD_DEFAULT);"
```

və serverdəki `api/config.php`-də `admins` siyahısına əlavə edin:

```php
'admins' => [
    'muellim1' => '$2y$10$...',
],
```

Şifrənin özü heç yerdə saxlanmır. Müəllimi silmək üçün sətri silin.

- Fayllar `files_dir/answers/<imtahan id>/<iş nömrəsi>/` qovluğunda saxlanır (public_html-dən kənarda).
- Qəbul olunur: JPG, PNG, WEBP, PDF (növ məzmuna görə yoxlanır), bir fayl ən çox `max_upload_mb`, bir tələbəyə ən çox 30 fayl.
- Böyük fotolar yükləmədən əvvəl brauzerdə 2000 px-ə kiçildilir.
- Girişdə bir IP-dən dəqiqədə 10 cəhd limiti var; bir hesaba 15 dəqiqədə 5 səhv cəhddən sonra hesab 15 dəqiqəlik bağlanır.
- Sessiya 2 saat fəaliyyətsizlikdən və ya girişdən 12 saat sonra bitir.
- Şəkillər brauzerdə yenidən kodlanır: EXIF (GPS koordinatları və s.) silinir.

## Təhlükəsizlik

- SQL: bütün sorğular parametrli (prepared statements).
- Axtarış limiti: bir IP-dən dəqiqədə 20, saatda 300 sorğu (`rate_limit_per_minute`, `rate_limit_per_hour`).
- Fayllar public_html-dən kənarda, təsadüfi adla; növ məzmuna görə yoxlanır; şəkillər `CSP: sandbox` ilə verilir.
- Tələbə yalnız öz iş nömrəsinin və yalnız elan olunmuş nəticənin fayllarını görə bilər.
- Admin: parol hash (bcrypt), sessiya cookie `Secure; HttpOnly; SameSite=Lax`, strict mode, CSRF üçün `X-QTM` başlığı.
- Sayt başlıqları (`public/.htaccess`): HTTPS yönləndirmə, CSP, X-Frame-Options, nosniff, Referrer-Policy.
- Xəta detalları istifadəçiyə göstərilmir, server loguna yazılır.
- **Məhdudiyyət:** nəticəyə yalnız iş nömrəsi ilə baxılır; nömrəni bilən hər kəs həmin nəticəni görə bilər.

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
