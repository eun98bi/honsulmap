-- ================================================================
-- 커뮤니티 게시판 스키마
-- Supabase 대시보드 > SQL Editor 에서 실행하세요
-- ================================================================

-- ── 1. posts 테이블 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  nickname      TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
  password_hash TEXT NOT NULL,
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  bar_id        UUID REFERENCES bars(id) ON DELETE SET NULL,
  view_count    INTEGER DEFAULT 0 NOT NULL,
  is_deleted    BOOLEAN DEFAULT FALSE NOT NULL
);

-- ── 2. comments 테이블 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  post_id       UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  nickname      TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
  password_hash TEXT NOT NULL,
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  is_deleted    BOOLEAN DEFAULT FALSE NOT NULL
);

-- ── 3. 인덱스 ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_created_at
  ON posts(created_at DESC) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_bar_id
  ON posts(bar_id) WHERE is_deleted = FALSE AND bar_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_post_id
  ON comments(post_id) WHERE is_deleted = FALSE;

-- ── 4. 조회수 증가 함수 ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_post_view(post_id UUID)
RETURNS void AS $$
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id AND is_deleted = FALSE;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── 5. 목록 뷰 (댓글 수 + 바 이름 포함) ─────────────────────────
CREATE OR REPLACE VIEW posts_with_meta AS
SELECT
  p.id,
  p.created_at,
  p.nickname,
  p.title,
  p.view_count,
  p.bar_id,
  b.name AS bar_name,
  (
    SELECT COUNT(*)::INTEGER
    FROM comments c
    WHERE c.post_id = p.id AND c.is_deleted = FALSE
  ) AS comment_count
FROM posts p
LEFT JOIN bars b ON b.id = p.bar_id
WHERE p.is_deleted = FALSE;

-- ── 6. RLS 정책 ──────────────────────────────────────────────────
ALTER TABLE posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- posts
DROP POLICY IF EXISTS "posts_anon_read"   ON posts;
DROP POLICY IF EXISTS "posts_anon_insert" ON posts;
DROP POLICY IF EXISTS "posts_service_all" ON posts;

CREATE POLICY "posts_anon_read"
  ON posts FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "posts_anon_insert"
  ON posts FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "posts_service_all"
  ON posts FOR ALL TO service_role USING (TRUE);

-- comments
DROP POLICY IF EXISTS "comments_anon_read"   ON comments;
DROP POLICY IF EXISTS "comments_anon_insert" ON comments;
DROP POLICY IF EXISTS "comments_service_all" ON comments;

CREATE POLICY "comments_anon_read"
  ON comments FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "comments_anon_insert"
  ON comments FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "comments_service_all"
  ON comments FOR ALL TO service_role USING (TRUE);
