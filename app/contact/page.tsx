import type { Metadata } from "next";
import Link from "next/link";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "문의하기 — 혼술스팟",
  description: "혼술스팟 정보 수정 문의 및 광고 문의",
};

const EMAIL = "awfolove@gmail.com";

export default function ContactPage() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>혼</span>
          <span className={styles.logoText}>술스팟</span>
        </Link>
        <Link href="/" className={styles.back}>← 지도로 돌아가기</Link>
      </header>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>문의하기</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>정보 수정 문의</h2>
          <p className={styles.desc}>
            바 정보가 잘못되었거나 업데이트가 필요한 경우 이메일로 알려주세요.<br />
            바 이름, 수정이 필요한 항목, 올바른 정보를 함께 보내주시면 빠르게 반영하겠습니다.
          </p>
          <a
            href={`mailto:${EMAIL}?subject=혼술스팟 정보 수정 문의`}
            className={styles.emailBtn}
          >
            📧 정보 수정 문의하기
          </a>
          <p className={styles.emailAddr}>{EMAIL}</p>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>광고 문의</h2>
          <p className={styles.desc}>
            지역 태그 클릭 시 목록 상단에 노출되는 광고를 진행하실 수 있습니다.<br />
            예: '연남동' 태그를 클릭하면 해당 지역 목록 최상단에 우선 노출됩니다.
          </p>
          <a
            href={`mailto:${EMAIL}?subject=혼술스팟 광고 문의`}
            className={styles.emailBtn}
          >
            📧 광고 문의하기
          </a>
          <p className={styles.emailAddr}>{EMAIL}</p>
        </div>
      </main>
    </div>
  );
}
