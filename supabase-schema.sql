-- =============================================
-- 혼술스팟 Supabase Schema v3
-- Supabase 대시보드 > SQL Editor에 붙여넣고 실행
-- =============================================

create table bars (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),

  -- 기본 정보
  name                text not null,
  branch              text,
  address             text not null,
  district            text not null,
  lat                 double precision,
  lng                 double precision,
  phone               text,
  naver_map_url       text,

  -- 영업시간 (요일별 JSONB)
  -- 예: {"mon":{"open":"18:00","close":"02:00"}, "sun":{"open":"휴무","close":""}}
  hours               jsonb,

  description         text,

  -- 혼술 특화
  mode                text not null check (mode in ('quiet', 'social', 'mixed')),
  has_counter         boolean default false,       -- 카운터석
  has_single_portion  boolean default false,       -- 1인 안주 있음
  allows_outside_food boolean default false,       -- 외부 음식 가능

  -- 메뉴 종류 (복수 선택)
  -- 예: {"whiskey", "cocktail", "beer"}
  menu_types          text[] default '{}',

  -- 태그 및 관리
  tags                text[] default '{}',
  is_published        boolean default false
);

-- 분위기 투표
create table mode_votes (
  id         uuid primary key default gen_random_uuid(),
  bar_id     uuid references bars(id) on delete cascade,
  mode       text not null check (mode in ('quiet', 'social', 'mixed')),
  created_at timestamptz default now()
);

-- =============================================
-- RLS
-- =============================================
alter table bars enable row level security;
alter table mode_votes enable row level security;

create policy "bars_public_read"    on bars       for select using (is_published = true);
create policy "mode_votes_read"     on mode_votes for select using (true);
create policy "mode_votes_insert"   on mode_votes for insert with check (true);

-- =============================================
-- 투표 집계 뷰
-- =============================================
create view bars_with_votes as
select
  b.*,
  coalesce(q.cnt, 0) as votes_quiet,
  coalesce(s.cnt, 0) as votes_social,
  coalesce(m.cnt, 0) as votes_mixed
from bars b
left join (select bar_id, count(*) cnt from mode_votes where mode='quiet'  group by bar_id) q on q.bar_id = b.id
left join (select bar_id, count(*) cnt from mode_votes where mode='social' group by bar_id) s on s.bar_id = b.id
left join (select bar_id, count(*) cnt from mode_votes where mode='mixed'  group by bar_id) m on m.bar_id = b.id;

-- =============================================
-- v4 투표 시스템 마이그레이션
-- Supabase SQL Editor에서 실행
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

-- =============================================
-- 기존 테이블에 컬럼 추가하는 경우 (이미 v2 스키마 적용한 경우만 실행)
-- =============================================
-- alter table bars add column if not exists menu_types text[] default '{}';
-- alter table bars drop column if exists price;

-- =============================================
-- 샘플 데이터
-- =============================================
insert into bars (
  name, address, district, lat, lng, mode,
  has_counter, has_single_portion, allows_outside_food,
  menu_types, hours, description, tags, is_published
) values (
  '바 소요',
  '서울 마포구 연남동 227-15',
  '연남동',
  37.5601, 126.9244,
  'quiet',
  true, true, false,
  ARRAY['whiskey', 'cocktail', 'wine'],
  '{"mon":{"open":"18:00","close":"01:00"},"tue":{"open":"18:00","close":"01:00"},"wed":{"open":"18:00","close":"01:00"},"thu":{"open":"18:00","close":"01:00"},"fri":{"open":"18:00","close":"02:00"},"sat":{"open":"18:00","close":"02:00"},"sun":{"open":"휴무","close":""}}',
  '연남동 골목 안 작은 바. 카운터 6석. 바텐더가 조용히 술만 만들어줘서 혼자 생각 정리하기 좋은 곳.',
  ARRAY['말 안 걸어요', '조용해서 좋아요', '혼자 가도 어색하지 않아요'],
  true
);
