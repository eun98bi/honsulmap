import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import PostActions from "./PostActions";
import CommentsSection from "./CommentsSection";
import styles from "./page.module.css";

interface Bar {
  id: string;
  name: string;
  districts: string[];
}

interface Post {
  id: string;
  created_at: string;
  nickname: string;
  title: string;
  content: string;
  view_count: number;
  bar_id: string | null;
  bars: Bar | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function PostPage({
  params,
}: {
  params: { id: string };
}) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await client.rpc("increment_post_view", { post_id: params.id });

  const { data } = await client
    .from("posts")
    .select("id, created_at, nickname, title, content, view_count, bar_id, bars(id, name, districts)")
    .eq("id", params.id)
    .eq("is_deleted", false)
    .single();

  if (!data) notFound();

  const post = data as unknown as Post;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>혼술스팟</Link>
        <nav className={styles.nav}>
          <Link href="/community" className={styles.navLink}>← 커뮤니티</Link>
        </nav>
      </header>

      <main className={styles.main}>
        {/* 바 연결 배지 */}
        {post.bars && (
          <Link
            href={`/?bar=${post.bars.id}`}
            className={styles.barBadge}
          >
            {post.bars.name}
            {post.bars.districts?.[0] && (
              <span className={styles.barDistrict}> · {post.bars.districts[0]}</span>
            )}
          </Link>
        )}

        {/* 제목 */}
        <h1 className={styles.postTitle}>{post.title}</h1>

        {/* 메타 */}
        <div className={styles.postMeta}>
          <span className={styles.metaNickname}>{post.nickname}</span>
          <span className={styles.dot}>·</span>
          <span>{formatDate(post.created_at)}</span>
          <span className={styles.dot}>·</span>
          <span>조회 {post.view_count}</span>
        </div>

        {/* 수정 / 삭제 버튼 (클라이언트) */}
        <PostActions
          postId={post.id}
          initialTitle={post.title}
          initialContent={post.content}
        />

        {/* 구분선 */}
        <hr className={styles.divider} />

        {/* 본문 */}
        <div className={styles.content}>
          {post.content.split("\n").map((line, i) => (
            <p key={i}>{line || " "}</p>
          ))}
        </div>

        <hr className={styles.divider} />

        {/* 댓글 (클라이언트) */}
        <CommentsSection postId={post.id} />
      </main>
    </div>
  );
}
