# QTM Nəticə

İmtahan nəticələrinin iş nömrəsi ilə axtarışı üçün veb tətbiq.

## Yerli işə salma

```bash
npm install
npm run dev
```

http://localhost:3000 ünvanında açılır.

## Struktur

- `src/app/page.tsx` — axtarış səhifəsi (imtahan seçimi + iş nömrəsi)
- `src/components/ResultSheet.tsx` — nəticə vərəqi görünüşü, PDF/şəkil export
- `src/lib/mockData.ts` — nümunə məlumatlar (MVP demo üçün). Real məlumatlar Supabase-ə keçəndə bu fayl API sorğusu ilə əvəz olunacaq.

## Nümunə iş nömrələri (demo)

- 27001, 27002, 27003

## Növbəti addımlar

- Supabase layihəsi qurulub `exams` / `results` cədvəlləri yaradılacaq
- Admin panelində CSV yükləmə əlavə olunacaq
- Vercel-ə deploy
