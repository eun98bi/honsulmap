"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Mode = "edit" | "delete" | null;

interface EditForm {
  title: string;
  content: string;
}

export default function PostActions({
  postId,
  initialTitle,
  initialContent,
}: {
  postId: string;
  initialTitle: string;
  initialContent: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [password, setPassword] = useState("");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function openModal(m: Mode) {
    setMode(m);
    setPassword("");
    setEditForm(null);
    setError("");
  }

  async function handleDeleteConfirm() {
    if (!password) return;
    setError("");
    setLoading(true);
    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error === "wrong_password" ? "비밀번호가 틀렸어요." : "오류가 발생했어요.");
      return;
    }
    router.push("/community");
    router.refresh();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm || !password) return;
    setError("");
    setLoading(true);

    const res = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        title: editForm.title,
        content: editForm.content,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error === "wrong_password" ? "비밀번호가 틀렸어요." : "오류가 발생했어요.");
      return;
    }
    setMode(null);
    router.refresh();
  }

  if (!mode) {
    return (
      <div className={styles.postActionsBtns}>
        <button className={styles.actionBtn} onClick={() => openModal("edit")}>
          수정
        </button>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
          onClick={() => openModal("delete")}
        >
          삭제
        </button>
      </div>
    );
  }

  return (
    <div className={styles.modal} onClick={(e) => e.target === e.currentTarget && setMode(null)}>
      <div className={styles.modalBox}>
        {mode === "delete" && (
          <>
            <h3 className={styles.modalTitle}>글 삭제</h3>
            <p className={styles.modalDesc}>비밀번호를 입력하면 삭제돼요.</p>
            <input
              className={styles.modalInput}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
              autoFocus
            />
            {error && <p className={styles.modalError}>{error}</p>}
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setMode(null)}>
                취소
              </button>
              <button
                className={`${styles.modalConfirmBtn} ${styles.modalConfirmDelete}`}
                onClick={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? "처리 중..." : "삭제"}
              </button>
            </div>
          </>
        )}

        {mode === "edit" && !editForm && (
          <>
            <h3 className={styles.modalTitle}>글 수정</h3>
            <p className={styles.modalDesc}>비밀번호를 입력하면 수정할 수 있어요.</p>
            <input
              className={styles.modalInput}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoFocus
            />
            {error && <p className={styles.modalError}>{error}</p>}
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setMode(null)}>
                취소
              </button>
              <button
                className={styles.modalConfirmBtn}
                onClick={() =>
                  setEditForm({ title: initialTitle, content: initialContent })
                }
                disabled={!password}
              >
                다음
              </button>
            </div>
          </>
        )}

        {mode === "edit" && editForm && (
          <form onSubmit={handleEdit} className={styles.editForm}>
            <h3 className={styles.modalTitle}>글 수정</h3>
            <div className={styles.editField}>
              <label className={styles.editLabel}>제목</label>
              <input
                className={styles.modalInput}
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>내용</label>
              <textarea
                className={styles.editTextarea}
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                maxLength={2000}
                rows={8}
                required
              />
            </div>
            {error && <p className={styles.modalError}>{error}</p>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancelBtn} onClick={() => setMode(null)}>
                취소
              </button>
              <button type="submit" className={styles.modalConfirmBtn} disabled={loading}>
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
