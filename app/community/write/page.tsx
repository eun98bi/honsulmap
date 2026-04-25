"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { COMMUNITY_REGIONS } from "@/lib/data";
import styles from "./page.module.css";

interface BarOption {
  id: string;
  name: string;
  districts: string[];
}

export default function WritePage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<"자유" | "후기" | "실시간 현황">("자유");
  const [region, setRegion] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [barQuery, setBarQuery] = useState("");
  const [barResults, setBarResults] = useState<BarOption[]>([]);
  const [selectedBar, setSelectedBar] = useState<BarOption | null>(null);
  const [showBarDrop, setShowBarDrop] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const barDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barQuery.length < 1) {
      setBarResults([]);
      setShowBarDrop(false);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("bars")
        .select("id, name, districts")
        .eq("is_published", true)
        .ilike("name", `%${barQuery}%`)
        .limit(8);
      setBarResults((data as BarOption[]) ?? []);
      setShowBarDrop(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [barQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (barDropRef.current && !barDropRef.current.contains(e.target as Node)) {
        setShowBarDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 4) {
      setError("비밀번호는 4자 이상이어야 해요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          password,
          title,
          content,
          barId: selectedBar?.id ?? null,
          category,
          region: region ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg: Record<string, string> = {
          invalid: "필수 항목을 모두 입력해주세요.",
          pw_too_short: "비밀번호는 4자 이상이어야 해요.",
          failed: "저장에 실패했어요. 다시 시도해주세요.",
        };
        setError(msg[json.error] ?? "오류가 발생했어요.");
        return;
      }
      router.push(`/community/${json.id}`);
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>혼술스팟</Link>
        <nav className={styles.nav}>
          <Link href="/community" className={styles.navLink}>← 커뮤니티</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>글쓰기</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 닉네임 + 비밀번호 */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>닉네임</label>
              <input
                className={styles.input}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="최대 20자"
                maxLength={20}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                비밀번호
                <span className={styles.labelHint}>수정·삭제 시 사용</span>
              </label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="4자 이상"
                required
              />
            </div>
          </div>

          {/* 바 연결 (선택) */}
          <div className={styles.field} ref={barDropRef}>
            <label className={styles.label}>
              연결할 바 <span className={styles.optional}>(선택)</span>
            </label>
            {selectedBar ? (
              <div className={styles.selectedBar}>
                <span>{selectedBar.name}</span>
                {selectedBar.districts[0] && (
                  <span className={styles.selectedDistrict}>
                    {selectedBar.districts[0]}
                  </span>
                )}
                <button
                  type="button"
                  className={styles.removeBar}
                  onClick={() => {
                    setSelectedBar(null);
                    setBarQuery("");
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className={styles.barSearchWrap}>
                <input
                  className={styles.input}
                  value={barQuery}
                  onChange={(e) => setBarQuery(e.target.value)}
                  onFocus={() => barResults.length > 0 && setShowBarDrop(true)}
                  placeholder="바 이름으로 검색..."
                />
                {showBarDrop && barResults.length > 0 && (
                  <ul className={styles.barDrop}>
                    {barResults.map((bar) => (
                      <li
                        key={bar.id}
                        className={styles.barDropItem}
                        onMouseDown={() => {
                          setSelectedBar(bar);
                          setBarQuery("");
                          setShowBarDrop(false);
                        }}
                      >
                        <span>{bar.name}</span>
                        {bar.districts[0] && (
                          <span className={styles.districtLabel}>
                            {bar.districts[0]}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 카테고리 */}
          <div className={styles.field}>
            <label className={styles.label}>카테고리</label>
            <div className={styles.categoryGroup}>
              {(["자유", "후기", "실시간 현황"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.categoryBtn} ${category === cat ? styles.categoryBtnActive : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 지역 */}
          <div className={styles.field}>
            <label className={styles.label}>
              지역 <span className={styles.optional}>(선택)</span>
            </label>
            <div className={styles.categoryGroup} style={{ flexWrap: "wrap", gap: "6px" }}>
              {COMMUNITY_REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`${styles.categoryBtn} ${region === r ? styles.categoryBtnActive : ""}`}
                  onClick={() => setRegion(region === r ? null : r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div className={styles.field}>
            <label className={styles.label}>제목</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="최대 100자"
              maxLength={100}
              required
            />
          </div>

          {/* 내용 */}
          <div className={styles.field}>
            <label className={styles.label}>내용</label>
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자유롭게 작성해주세요."
              maxLength={2000}
              rows={10}
              required
            />
            <span className={styles.charCount}>{content.length} / 2000</span>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.actions}>
            <Link href="/community" className={styles.cancelBtn}>취소</Link>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "저장 중..." : "등록하기"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
