-- Artıq qurulmuş baza üçün: yeni nəticə formatının əlavə sahələri (bir dəfə işə salın).
-- Yeni quruluşda lazım deyil — schema.sql bunu özündə saxlayır.
ALTER TABLE results ADD COLUMN extra LONGTEXT NULL AFTER umumi_bal;
