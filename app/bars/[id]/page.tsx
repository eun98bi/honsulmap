import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchBarById, getBarLocationLabel } from "@/lib/db";
import { DAY_KEYS, DAY_LABELS, MENU_CONFIG, modeConfig } from "@/lib/data";
import VoteSection from "@/components/VoteSection";
import styles from "./bar.module.css";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bar = await fetchBarById(params.id);
  if (!bar) return { title: "혼술스팟" };

  const cfg = modeConfig[bar.mode];
  const locationLabel = getBarLocationLabel(bar);
  const desc = bar.description || `${locationLabel} ${cfg.emoji} ${cfg.label} 분위기의 혼술 바. ${bar.address}`;

  return {
    title: `${bar.name} | 혼술스팟`,
    description: desc,
    openGraph: {
      title: `${bar.name} | 혼술스팟`,
      description: desc,
      type: "website",
      locale: "ko_KR",
      siteName: "혼술스팟",
    },
    twitter: {
      card: "summary",
      title: bar.name,
      description: desc,
    },
  };
}

export default async function BarPage({ params }: Props) {
  const bar = await fetchBarById(params.id);
  if (!bar) notFound();

  const cfg = modeConfig[bar.mode];
  const kakaoUrl = `https://map.kakao.com/link/search/${encodeURIComponent(bar.name)}`;
  const naverUrl = bar.naver_map_url || `https://map.naver.com/v5/search/${encodeURIComponent(`${bar.name} ${bar.address}`)}`;
  const todayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const locationLabel = getBarLocationLabel(bar);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>🍶</span>
          <span className={styles.logoText}>혼술스팟</span>
        </Link>
        <Link href="/" className={styles.back}>지도로 돌아가기</Link>
      </header>

      <main className={styles.main}>
        <div className={styles.modeBig} style={{ color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </div>
        <h1 className={styles.name}>{bar.name}</h1>
        {locationLabel && <p className={styles.location}>{locationLabel}</p>}
        <p className={styles.address}>{bar.address}</p>

        {bar.description && <p className={styles.desc}>{bar.description}</p>}

        <div className={styles.mapLinks}>
          <a href={kakaoUrl} target="_blank" rel="noopener noreferrer" className={styles.mapBtn} data-service="kakao">
            카카오맵에서 검색
          </a>
          <a href={naverUrl} target="_blank" rel="noopener noreferrer" className={styles.mapBtn} data-service="naver">
            네이버지도에서 검색
          </a>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>기본 정보</h3>
          <div className={styles.chipRow}>
            {bar.region && <span className={styles.infoBadge}>지역 · {bar.region}</span>}
            {bar.districts?.map((district) => (
              <span key={district} className={styles.infoBadge}>동네 · {district}</span>
            ))}
            {bar.can_request_song && <span className={styles.infoBadge}>신청곡 가능</span>}
            {bar.allows_outside_food && <span className={styles.infoBadge}>외부 음식 가능</span>}
          </div>
          {bar.phone && <p className={styles.infoLine}>전화 {bar.phone}</p>}
        </div>

        {bar.menu_types?.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>메뉴 종류</h3>
            <div className={styles.menuGrid}>
              {bar.menu_types.map((menu) => (
                <span key={menu} className={styles.menuBadge}>
                  {MENU_CONFIG[menu]?.emoji} {MENU_CONFIG[menu]?.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {bar.hours && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>영업시간</h3>
            <div className={styles.hoursTable}>
              {DAY_KEYS.map((day) => {
                const hours = bar.hours?.[day];
                const isToday = todayKey === day;
                const isHoliday = !hours || hours.open === "휴무" || !hours.open;

                return (
                  <div key={day} className={`${styles.hoursRow} ${isToday ? styles.hoursToday : ""}`}>
                    <span className={styles.hoursDay}>{DAY_LABELS[day]}</span>
                    <span className={`${styles.hoursTime} ${isHoliday ? styles.hoursHoliday : ""}`}>
                      {isHoliday ? "휴무" : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <VoteSection bar={bar} />
        </div>

        <div className={styles.footer}>
          <Link href="/" className={styles.backBtn}>혼술스팟에서 더 많은 바 보기</Link>
        </div>
      </main>
    </div>
  );
}
