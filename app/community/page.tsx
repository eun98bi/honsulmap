import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { COMMUNITY_REGIONS } from "@/lib/data";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMIT = 10;

type Category = "자유" | "후기" | "실시간 현황";

const CATEGORIES: { label: string; value: Category | null }[] = [
  { label: "전체", value: null },
  { label: "실시간 현황", value: "실시간 현황" },
  { label: "후기", value: "후기" },
  { label: "자유", value: "자유" },
];


const CAT_CLASS: Record<Category, string> = {
  "실시간 현황": "catLive",
  "후기": "catReview",
  "자유": "catFree",
};

interface PostMeta {
  id: string;
  created_at: string;
  nickname: string;
  title: string;
  category: Category;
  region: string | null;
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

function buildHref(params: { category?: string | null; region?: string | null; search?: string }) {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.region) q.set("region", params.region);
  if (params.search) q.set("search", params.search);
  const str = q.toString();
  return `/community${str ? `?${str}` : ""}`;
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams?: { page?: string; category?: string; region?: string; search?: string };
}) {
  const page = Math.max(1, parseInt(searchParams?.page ?? "1"));
  const rawCategory = searchParams?.category ?? null;
  const rawRegion = searchParams?.region ?? null;
  const search = searchParams?.search?.trim() ?? "";

  const category: Category | null =
    rawCategory === "자유" || rawCategory === "후기" || rawCategory === "실시간 현황"
      ? rawCategory
      : null;
  const region = (COMMUNITY_REGIONS as readonly string[]).includes(rawRegion ?? "") ? rawRegion : null;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = client
    .from("posts_with_meta")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * LIMIT, page * LIMIT - 1);

  if (category) query = query.eq("category", category);
  if (region) query = query.eq("region", region);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, count, error } = await query;

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

        {/* 검색 */}
        <form action="/community" method="GET" className={styles.searchForm}>
          {category && <input type="hidden" name="category" value={category} />}
          {region && <input type="hidden" name="region" value={region} />}
          <div className={styles.searchBar}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              name="search"
              defaultValue={search}
              placeholder="제목 검색..."
              autoComplete="off"
            />
            {search && (
              <Link href={buildHref({ category, region })} className={styles.searchClear} aria-label="검색 초기화">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Link>
            )}
            <button type="submit" className={styles.searchBtn}>검색</button>
          </div>
        </form>

        {/* 카테고리 탭 */}
        <div className={styles.filterSection}>
          <span className={styles.filterSectionLabel}>카테고리</span>
          <div className={styles.tabs}>
            {CATEGORIES.map(({ label, value }) => {
              const isActive = category === value;
              return (
                <Link
                  key={label}
                  href={buildHref({ category: value, region, search })}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 지역 탭 */}
        <div className={styles.filterSection}>
          <span className={styles.filterSectionLabel}>지역</span>
          <div className={styles.tabs}>
            <Link
              href={buildHref({ category, region: null, search })}
              className={`${styles.tab} ${!region ? styles.tabActive : ""}`}
            >
              전체
            </Link>
            {COMMUNITY_REGIONS.map((r) => (
              <Link
                key={r}
                href={buildHref({ category, region: r, search })}
                className={`${styles.tab} ${region === r ? styles.tabActive : ""}`}
              >
                {r}
              </Link>
            ))}
          </div>
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
                    <span className={`${styles.catBadge} ${styles[CAT_CLASS[post.category] ?? "catFree"]}`}>
                      {post.category}
                    </span>
                    {post.region && (
                      <span className={styles.regionBadge}>{post.region}</span>
                    )}
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
              <Link
                href={`${buildHref({ category, region, search })}&page=${page - 1}`}
                className={styles.pageBtn}
              >
                이전
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`${buildHref({ category, region, search })}&page=${p}`}
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={`${buildHref({ category, region, search })}&page=${page + 1}`}
                className={styles.pageBtn}
              >
                다음
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
