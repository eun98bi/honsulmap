import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMIT = 20;

interface PostMeta {
  id: string;
  created_at: string;
  nickname: string;
  title: string;
  view_count: number;
  bar_id: string | null;
  bar_name: string | null;
  comment_count: number;
}

function formatDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams?.page ?? "1"));

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, count, error } = await client
    .from("posts_with_meta")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * LIMIT, page * LIMIT - 1);

  const posts: PostMeta[] = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>혼술스팟</Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>지도</Link>
          <span className={styles.navCurrent}>커뮤니티</span>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>커뮤니티</h1>
          <Link href="/community/write" className={styles.writeBtn}>글쓰기</Link>
        </div>

        {error ? (
          <div className={styles.empty}>
            <p>글 목록을 불러오지 못했어요.</p>
            <p style={{ fontSize: "12px", color: "#e07070", marginTop: "8px" }}>{error.message}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <p>아직 작성된 글이 없어요.</p>
            <p>첫 글을 남겨보세요.</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => (
              <li key={post.id} className={styles.item}>
                <Link href={`/community/${post.id}`} className={styles.itemLink}>
                  <div className={styles.itemMain}>
                    {post.bar_name && (
                      <span className={styles.barBadge}>{post.bar_name}</span>
                    )}
                    <span className={styles.itemTitle}>{post.title}</span>
                    {post.comment_count > 0 && (
                      <span className={styles.commentCount}>
                        [{post.comment_count}]
                      </span>
                    )}
                  </div>
                  <div className={styles.itemMeta}>
                    <span>{post.nickname}</span>
                    <span className={styles.dot}>·</span>
                    <span>{formatDate(post.created_at)}</span>
                    <span className={styles.dot}>·</span>
                    <span>조회 {post.view_count}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            {page > 1 && (
              <Link href={`/community?page=${page - 1}`} className={styles.pageBtn}>
                이전
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/community?page=${p}`}
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link href={`/community?page=${page + 1}`} className={styles.pageBtn}>
                다음
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
