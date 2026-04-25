import { getBarLocationLabel, type BarRow } from "@/lib/db";
import { getTodayHours, MENU_CONFIG, modeConfig } from "@/lib/data";
import styles from "./BarCard.module.css";

interface BarCardProps {
  bar: BarRow;
  topTags: string[];
  selected: boolean;
  onClick: () => void;
  onViewDetail: () => void;
}

export default function BarCard({ bar, topTags, selected, onClick, onViewDetail }: BarCardProps) {
  const cfg = modeConfig[bar.mode];
  const todayHours = getTodayHours(bar.hours);
  const locationLabel = getBarLocationLabel(bar);

  return (
    <div
      id={`bar-card-${bar.id}`}
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onClick}
    >
      <div className={styles.modeBadge} style={{ background: cfg.bg, color: cfg.color }}>
        <span>{cfg.emoji}</span>
        <span className={styles.modeLabel}>{cfg.label}</span>
      </div>

      <h3 className={styles.name}>{bar.name}</h3>
      {locationLabel && <p className={styles.district}>{locationLabel}</p>}

      <div className={styles.infoRow}>
        {bar.can_request_song && <span className={styles.chip}>신청곡 가능</span>}
        {bar.allows_outside_food && <span className={styles.chip}>외부 음식 가능</span>}
      </div>

      {bar.menu_types?.length > 0 && (
        <div className={styles.menuRow}>
          {bar.menu_types.map((menu) => (
            <span key={menu} className={styles.menuChip}>
              {MENU_CONFIG[menu]?.emoji} {MENU_CONFIG[menu]?.label}
            </span>
          ))}
        </div>
      )}

      <div className={styles.tags}>
        {topTags.map((tag) => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>

      <div className={styles.bottom}>
        <span className={styles.hours}>{todayHours}</span>
        <button
          className={styles.viewDetailBtn}
          onClick={(event) => {
            event.stopPropagation();
            onViewDetail();
          }}
          type="button"
        >
          자세히 보기
        </button>
      </div>
    </div>
  );
}
