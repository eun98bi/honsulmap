import Link from "next/link";
import { getBarLocationLabel, type BarRow } from "@/lib/db";
import { DAY_KEYS, DAY_LABELS, MENU_CONFIG, modeConfig } from "@/lib/data";
import VoteSection from "./VoteSection";
import styles from "./BarDetail.module.css";

function getMapLinks(bar: BarRow) {
  const query = encodeURIComponent(`${bar.name} ${bar.address}`);
  return {
    kakao: `https://map.kakao.com/link/search/${encodeURIComponent(bar.name)}`,
    naver: bar.naver_map_url || `https://map.naver.com/v5/search/${query}`,
  };
}

interface BarDetailProps {
  bar: BarRow;
  onClose: () => void;
}

export default function BarDetail({ bar, onClose }: BarDetailProps) {
  const cfg = modeConfig[bar.mode];
  const { kakao, naver } = getMapLinks(bar);
  const locationLabel = getBarLocationLabel(bar);

  return (
    <div className={styles.panel}>
      <div className={styles.topActions}>
        <Link href={`/bars/${bar.id}`} className={styles.shareLink} target="_blank" rel="noopener noreferrer">
          개별 페이지 공유
        </Link>
        <button className={styles.close} onClick={onClose} type="button">닫기</button>
      </div>

      <div className={styles.header}>
        <div className={styles.modeBig} style={{ color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </div>
        <h2 className={styles.name}>{bar.name}</h2>
        {locationLabel && <p className={styles.location}>{locationLabel}</p>}
        <p className={styles.address}>{bar.address}</p>
      </div>

      {bar.description && <p className={styles.desc}>{bar.description}</p>}

      <div className={styles.mapLinks}>
        <a href={kakao} target="_blank" rel="noopener noreferrer" className={styles.mapBtn} data-service="kakao">
          카카오맵에서 검색
        </a>
        <a href={naver} target="_blank" rel="noopener noreferrer" className={styles.mapBtn} data-service="naver">
          네이버지도에서 검색
        </a>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>기본 정보</h4>
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
          <h4 className={styles.sectionTitle}>메뉴 종류</h4>
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
          <h4 className={styles.sectionTitle}>영업시간</h4>
          <div className={styles.hoursTable}>
            {DAY_KEYS.map((day) => {
              const hours = bar.hours?.[day];
              const isToday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()] === day;
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
    </div>
  );
}
