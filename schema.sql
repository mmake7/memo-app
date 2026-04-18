-- ============================================
-- 메모장 앱 - Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에서 실행하세요
-- ============================================

-- 1) notes 테이블 생성
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body  text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notes_set_updated_at on public.notes;
create trigger trg_notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

-- 3) RLS (Row Level Security) 활성화
alter table public.notes enable row level security;

-- 4) 개발용 정책: anon 키로 모든 CRUD 허용
--    ⚠️ 프로덕션에서는 auth.uid() 기반 정책으로 교체할 것
drop policy if exists "allow anon all" on public.notes;
create policy "allow anon all"
on public.notes
for all
to anon
using (true)
with check (true);

-- 5) 최신순 조회를 위한 인덱스
create index if not exists idx_notes_updated_at on public.notes (updated_at desc);

-- 6) 초기 확인용 시드 데이터 (원하지 않으면 주석 처리)
insert into public.notes (title, body) values
  ('환영합니다 👋', '메모장에 오신 것을 환영합니다.\n\nSupabase에 연결된 메모입니다.'),
  ('첫 번째 메모', '여기에 내용을 적어보세요.')
on conflict do nothing;

-- 확인
select id, title, updated_at from public.notes order by updated_at desc;
