# QTM Nəticə

İmtahan nəticələrinin iş nömrəsi ilə axtarışı üçün veb tətbiq.

Canlı: https://qtmnetice.vercel.app

## Yerli işə salma

```bash
npm install
npm run dev
```

http://localhost:3000 ünvanında açılır. `.env.local`-da Supabase açarları lazımdır (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

## Struktur

- `src/app/page.tsx` — axtarış səhifəsi (imtahan seçimi + iş nömrəsi)
- `src/components/ResultSheet.tsx` — nəticə vərəqi görünüşü, PDF/şəkil export
- `src/lib/db.ts` — Supabase sorğuları
- `supabase/migrations/` — DB sxemi (`exams`, `results`, RLS qaydaları)

## Nümunə iş nömrələri (demo)

PDF-dəki 30 real nəticə **27001–27030** iş nömrələri altında yüklənib (əsl iş nömrələri 1101–1130 idi, ardıcıllıqla 27xxx seriyasına köçürüldü). Tələbə adları məxfilik üçün burda qeyd olunmur — Supabase-də baxa bilərsiniz.

## PDF-dən nəticə idxalı

Eyni formatlı yeni bir nəticə PDF-i gələndə:

```bash
node scripts/pdf-items.mjs /path/to/Netice.pdf /tmp/pdf-items-all.json
node scripts/parse-pdf.mjs            # /tmp/parsed-results.json yaradır
node --env-file=.env.local scripts/seed-real.mjs
```

`seed-real.mjs` içindəki `examName` və başlanğıc iş nömrəsini (27001) lazım olduqca dəyişin.

## Növbəti addımlar

- Admin panelində CSV/PDF yükləmə UI-ı (hazırda skriptlə edilir)
- Yeni imtahanlar üçün ayrı `exams` sətri
