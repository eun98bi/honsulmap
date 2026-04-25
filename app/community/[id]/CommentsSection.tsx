"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Comment {
  id: string;
  created_at: string;
  nickname: string;
  content: string;
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

export default function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (password.length < 4) {
      setSubmitError("비밀번호는 4자 이상이어야 해요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password, content }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg: Record<string, string> = {
          invalid: "필수 항목을 모두 입력해주세요.",
          pw_too_short: "비밀번호는 4자 이상이어야 해요.",
          too_long: "댓글은 500자 이내로 작성해주세요.",
        };
        setSubmitError(msg[json.error] ?? "오류가 발생했어요.");
        return;
      }
      setComments((prev) => [...prev, json]);
      setNickname("");
      setPassword("");
      setContent("");
    } catch {
      setSubmitError("네트워크 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment() {
    if (!deleteTarget || !deletePw) return;
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/comments/${deleteTarget}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: deletePw }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setDeleteError(
          json.error === "wrong_password" ? "비밀번호가 틀렸어요." : "오류가 발생했어요."
        );
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== deleteTarget));
      setDeleteTarget(null);
      setDeletePw("");
    } catch {
      setDeleteError("네트워크 오류가 발생했어요.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className={styles.comments}>
      <h2 className={styles.commentsTitle}>
        댓글 <span className={styles.commentsCount}>{comments.length}</span>
      </h2>

      {/* 댓글 목록 */}
      {loading ? (
        <p className={styles.commentsLoading}>불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className={styles.commentsEmpty}>아직 댓글이 없어요.</p>
      ) : (
        <ul className={styles.commentList}>
          {comments.map((c) => (
            <li key={c.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.commentNick}>{c.nickname}</span>
                <span className={styles.commentDate}>{formatDate(c.created_at)}</span>
                <button
                  className={styles.commentDelBtn}
                  onClick={() => {
                    setDeleteTarget(c.id);
                    setDeletePw("");
                    setDeleteError("");
                  }}
                >
                  삭제
                </button>
              </div>
              <p className={styles.commentContent}>{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmitComment} className={styles.commentForm}>
        <div className={styles.commentFormTop}>
          <input
            className={styles.commentInput}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={20}
            required
          />
          <input
            className={styles.commentInput}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (4자↑)"
            required
          />
        </div>
        <div className={styles.commentFormBottom}>
          <textarea
            className={styles.commentTextarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요."
            maxLength={500}
            rows={3}
            required
          />
          <button type="submit" className={styles.commentSubmitBtn} disabled={submitting}>
            {submitting ? "..." : "등록"}
          </button>
        </div>
        <div className={styles.commentFormMeta}>
          <span className={styles.charCount}>{content.length} / 500</span>
          {submitError && <span className={styles.commentError}>{submitError}</span>}
        </div>
      </form>

      {/* 댓글 삭제 모달 */}
      {deleteTarget && (
        <div
          className={styles.modal}
          onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className={styles.modalBox}>
            <h3 className={styles.modalTitle}>댓글 삭제</h3>
            <p className={styles.modalDesc}>비밀번호를 입력하면 삭제돼요.</p>
            <input
              className={styles.modalInput}
              type="password"
              value={deletePw}
              onChange={(e) => setDeletePw(e.target.value)}
              placeholder="비밀번호"
              onKeyDown={(e) => e.key === "Enter" && handleDeleteComment()}
              autoFocus
            />
            {deleteError && <p className={styles.modalError}>{deleteError}</p>}
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setDeleteTarget(null)}
              >
                취소
              </button>
              <button
                className={`${styles.modalConfirmBtn} ${styles.modalConfirmDelete}`}
                onClick={handleDeleteComment}
                disabled={deleting}
              >
                {deleting ? "처리 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
