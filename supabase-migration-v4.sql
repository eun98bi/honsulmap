-- =============================================
-- 혼술스팟 v4 마이그레이션 — 투표 시스템
-- 이미 bars, mode_votes 테이블이 있는 경우 이 파일만 실행하세요
-- Supabase 대시보드 > SQL Editor에 붙여넣고 실행
-- =============================================

-- mode_votes에 voter 추적 컬럼 추가
alter table mode_votes add column if not exists voter_id text;
alter table mode_votes add column if not exists ip_hash  text;

-- voter_id 기준 중복 방지 (기존 null 행은 unique 제약에서 제외됨)
create unique index if not exists mode_votes_bar_voter_uniq
  on mode_votes(bar_id, voter_id)
  where voter_id is not null;

-- 태그 투표 테이블
create table if not exists tag_votes (
  id         uuid primary key default gen_random_uuid(),
  bar_id     uuid references bars(id) on delete cascade,
  tag        text not null,
  voter_id   text not null,
  ip_hash    text,
  created_at timestamptz default now()
);

create unique index if not exists tag_votes_bar_tag_voter_uniq
  on tag_votes(bar_id, tag, voter_id);

alter table tag_votes enable row level security;

create policy "tag_votes_read"   on tag_votes for select using (true);
create policy "tag_votes_insert" on tag_votes for insert with check (true);
