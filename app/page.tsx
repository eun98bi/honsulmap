"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { fetchBars, fetchTopTagsByBar, getBarRegion, type BarRow } from "@/lib/db";
import { HonsulMode, modeConfig } from "@/lib/data";
import BarCard from "@/components/BarCard";
import BarDetail from "@/components/BarDetail";
import CoupangBanner from "@/components/CoupangBanner";
import styles from "./page.module.css";

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%", background: "#0F0E0B" }} />,
});

type ModeFilter = HonsulMode | "all";

export default function HomePage() {
  const [allBars, setAllBars] = useState<BarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [regionFilter, setRegionFilter] = useState("전체");
  const [districtFilter, setDistrictFilter] = useState("전체");
  const [selectedBar, setSelectedBar] = useState<BarRow | null>(null);
  const [detailBar, setDetailBar] = useState<BarRow | null>(null);
  const [mobileTagsOpen, setMobileTagsOpen] = useState(false);
  const [topTagsByBar, setTopTagsByBar] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchBars().then(setAllBars).finally(() => setLoading(false));
    fetchTopTagsByBar().then(setTopTagsByBar);
  }, []);

  const regions = useMemo(
    () => Array.from(new Set(allBars.map((bar) => getBarRegion(bar)).filter(Boolean))).sort(),
    [allBars],
  );

  const districts = useMemo(() => {
    const scopedBars = regionFilter === "전체"
      ? allBars
      : allBars.filter((bar) => getBarRegion(bar) === regionFilter);

    return Array.from(new Set(scopedBars.flatMap((bar) => bar.districts ?? []).filter(Boolean))).sort();
  }, [allBars, regionFilter]);

  useEffect(() => {
    if (districtFilter !== "전체" && !districts.includes(districtFilter)) {
      setDistrictFilter("전체");
    }
  }, [districtFilter, districts]);

  const filtered = useMemo(() => {
    return allBars.filter((bar) => {
      if (modeFilter !== "all" && bar.mode !== modeFilter) return false;
      if (regionFilter !== "전체" && getBarRegion(bar) !== regionFilter) return false;
      if (districtFilter !== "전체" && !bar.districts?.includes(districtFilter)) return false;
      return true;
    });
  }, [allBars, modeFilter, regionFilter, districtFilter]);

  const resetSelection = () => {
    setSelectedBar(null);
    setDetailBar(null);
  };

  const handleSelectBar = (bar: BarRow) => {
    setSelectedBar(bar);
    setDetailBar(null);
    setTimeout(() => {
      document.getElementById(`bar-card-${bar.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const handleViewDetail = (bar: BarRow) => {
    setSelectedBar(bar);
    setDetailBar(bar);
  };

  const handleListBlankClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) {
      resetSelection();
    }
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>🍶</span>
          <span className={styles.logoText}>혼술스팟</span>
        </Link>
        <p className={styles.tagline}>혼술러가 검증한 바 지도</p>
        <div className={styles.headerActions}>
          <Link href="/community" className={styles.communityBtn}>커뮤니티</Link>
          <Link href="/contact?type=info" className={styles.headerBtn}>정보 수정 문의</Link>
          <Link href="/contact?type=ad" className={styles.headerBtn}>광고 문의</Link>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.filtersWrapper}>
          <button
            className={styles.mobileTagsToggle}
            onClick={() => setMobileTagsOpen((open) => !open)}
            type="button"
          >
            <span>필터</span>
            <span className={`${styles.toggleArrow} ${mobileTagsOpen ? styles.toggleOpen : ""}`}>▾</span>
          </button>

          <div className={`${styles.filters} ${mobileTagsOpen ? styles.filtersOpen : ""}`}>
            <div className={styles.filterLabel}>지역</div>
            <div className={styles.filterGroup}>
              {["전체", ...regions].map((region) => (
                <button
                  key={region}
                  className={`${styles.pill} ${regionFilter === region ? styles.pillActive : ""}`}
                  onClick={() => {
                    setRegionFilter(region);
                    setDistrictFilter("전체");
                    resetSelection();
                  }}
                  type="button"
                >
                  {region}
                </button>
              ))}
            </div>

            <div className={styles.filterDivider} />

            <div className={styles.filterLabel}>동네</div>
            <div className={styles.filterGroup}>
              {["전체", ...districts].map((district) => (
                <button
                  key={district}
                  className={`${styles.pill} ${districtFilter === district ? styles.pillActive : ""}`}
                  onClick={() => {
                    setDistrictFilter(district);
                    resetSelection();
                  }}
                  type="button"
                >
                  {district}
                </button>
              ))}
            </div>

            <div className={styles.filterDivider} />

            <div className={styles.filterLabel}>혼술 모드</div>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.pill} ${modeFilter === "all" ? styles.pillActive : ""}`}
                onClick={() => setModeFilter("all")}
                type="button"
              >
                전체
              </button>
              {(["quiet", "social", "mixed"] as HonsulMode[]).map((mode) => {
                const cfg = modeConfig[mode];
                return (
                  <button
                    key={mode}
                    className={`${styles.pill} ${modeFilter === mode ? styles.pillActive : ""}`}
                    style={modeFilter === mode ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}}
                    onClick={() => setModeFilter(mode)}
                    type="button"
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`${styles.mapArea} ${detailBar ? styles.mapAreaDetail : ""}`}>
          <div className={styles.mapKakao}>
            {detailBar ? (
              <BarDetail bar={detailBar} onClose={() => setDetailBar(null)} />
            ) : (
              <KakaoMap bars={filtered} selectedBar={selectedBar} onSelectBar={handleViewDetail} />
            )}
          </div>
          {!detailBar && (
            <div className={styles.mapAdSlot}>
              <CoupangBanner />
            </div>
          )}
        </div>

        {!detailBar && (
          <div className={styles.mobileAdSlot}>
            <CoupangBanner />
          </div>
        )}

        <div className={styles.listWrapper} onClick={handleListBlankClick}>
          <p className={styles.resultCount}>
            {regionFilter !== "전체" && <span className={styles.resultDistrict}>{regionFilter}</span>}
            {regionFilter !== "전체" && districtFilter !== "전체" && <span className={styles.resultDivider}> · </span>}
            {districtFilter !== "전체" && <span className={styles.resultDistrict}>{districtFilter}</span>}
            {(regionFilter !== "전체" || districtFilter !== "전체") && <span className={styles.resultDivider}> · </span>}
            {loading ? "불러오는 중..." : `${filtered.length}개의 혼술 바`}
          </p>
          <div className={styles.list} onClick={handleListBlankClick}>
            {loading ? (
              <div className={styles.empty}>
                <p>로딩 중</p>
                <p className={styles.emptySub}>혼술 바 목록을 불러오고 있어요.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <p>조건에 맞는 바가 없어요.</p>
                <p className={styles.emptySub}>필터를 조금 넓혀보세요.</p>
              </div>
            ) : (
              filtered.map((bar) => (
                <BarCard
                  key={bar.id}
                  bar={bar}
                  topTags={topTagsByBar[bar.id] ?? bar.tags?.slice(0, 3) ?? []}
                  selected={selectedBar?.id === bar.id}
                  onClick={() => handleSelectBar(bar)}
                  onViewDetail={() => handleViewDetail(bar)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
