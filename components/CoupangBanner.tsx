"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CoupangBanner.module.css";

type BannerSize = {
  height: number;
  width: number;
};

export default function CoupangBanner() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [bannerSize, setBannerSize] = useState<BannerSize | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateBannerSize = () => {
      const containerWidth = wrapper.clientWidth;
      if (!containerWidth) return;

      setBannerSize({
        width: Math.max(160, Math.min(containerWidth - 24, 960)),
        height: containerWidth >= 500 ? 100 : 100,
      });
    };

    updateBannerSize();

    const resizeObserver = new ResizeObserver(() => {
      updateBannerSize();
    });

    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, []);

  const srcDoc = useMemo(() => {
    if (!bannerSize) return "";

    return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: ${bannerSize.height}px;
        overflow: hidden;
        background: transparent;
      }
      body {
        display: flex;
        align-items: flex-start;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <script src="https://ads-partners.coupang.com/g.js"><\/script>
    <script>
      new PartnersCoupang.G({
        id: 983530,
        template: "carousel",
        trackingCode: "AF9566167",
        width: "${bannerSize.width}",
        height: "${bannerSize.height}",
        tsource: ""
      });
    <\/script>
  </body>
</html>`;
  }, [bannerSize]);

  return (
    <div className={styles.adSection}>
      <div ref={wrapperRef} className={styles.bannerWrapper}>
        {bannerSize ? (
          <iframe
            key={`${bannerSize.width}x${bannerSize.height}`}
            className={styles.bannerFrame}
            srcDoc={srcDoc}
            title="쿠팡 파트너스 배너"
            loading="lazy"
            scrolling="no"
          />
        ) : null}
      </div>
      <p className={styles.disclosure}>
        이 배너는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  );
}
