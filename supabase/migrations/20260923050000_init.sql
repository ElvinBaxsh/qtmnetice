-- Imtahanlar ve netice vereqleri

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exam_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  is_nomresi text not null,
  soyadi text not null,
  adi text not null,
  sinif text,
  bolme text,
  variant text,
  sections jsonb not null default '[]',
  summary jsonb not null default '[]',
  umumi_bal numeric,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (exam_id, is_nomresi)
);

create index if not exists results_lookup_idx on results (exam_id, is_nomresi);

alter table exams enable row level security;
alter table results enable row level security;

-- Hamı imtahan siyahisini gorsun (dropdown ucun)
create policy "exams are publicly readable"
  on exams for select
  using (true);

-- Yalniz elan olunmus (published = true) neticeler herkese gorunsun
create policy "published results are publicly readable"
  on results for select
  using (published = true);

-- Yazma/yenileme yalniz service_role (admin yuklemesi) ile, RLS-i bypass edir
