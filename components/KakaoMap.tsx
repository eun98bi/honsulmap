"use client";

import { useEffect, useRef } from "react";
import { HonsulMode, modeConfig } from "@/lib/data";
import type { BarRow } from "@/lib/db";

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  bars: BarRow[];
  selectedBar: BarRow | null;
  onSelectBar: (bar: BarRow) => void;
}

function makeMarkerHTML(bar: BarRow, selected: boolean): string {
  const cfg = modeConfig[bar.mode as HonsulMode];
  const scale = selected ? "scale(1.15)" : "scale(1)";
  const shadow = selected
    ? `0 4px 16px ${cfg.color}55, 0 2px 6px rgba(0,0,0,0.5)`
    : "0 2px 8px rgba(0,0,0,0.45)";
  const border = selected
    ? "2px solid rgba(255,255,255,0.7)"
    : "1.5px solid rgba(255,255,255,0.18)";
  const zIndex = selected ? "10" : "1";

  return `
    <div style="
      display:flex; flex-direction:column; align-items:center;
      cursor:pointer; transform:${scale}; transition:transform 0.18s ease;
      position:relative; z-index:${zIndex};
    ">
      <div style="
        background:${cfg.color};
        color:#fff;
        border-radius:20px;
        padding:5px 11px;
        font-size:12px;
        font-weight:700;
        white-space:nowrap;
        box-shadow:${shadow};
        border:${border};
        font-family:'Gmarket Sans',sans-serif;
        letter-spacing:-0.2px;
        line-height:1.4;
      ">
        ${cfg.emoji} ${bar.name}
      </div>
      <div style="
        width:0; height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:6px solid ${cfg.color};
        margin-top:-1px;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
      "></div>
    </div>
  `;
}

export default function KakaoMap({ bars, selectedBar, onSelectBar }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, { overlay: any; bar: BarRow }>>(new Map());
  const onSelectBarRef = useRef(onSelectBar);

  const focusSelectedBar = (map: any, bar: BarRow | null) => {
    if (!map || !bar?.lat || !bar?.lng) return;
    map.panTo(new window.kakao.maps.LatLng(bar.lat, bar.lng));
    if (map.getLevel() > 5) map.setLevel(5);
  };

  useEffect(() => {
    onSelectBarRef.current = onSelectBar;
  }, [onSelectBar]);

  useEffect(() => {
    const init = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.5512, 126.9882),
          level: 7,
        });

        mapInstanceRef.current = map;
        focusSelectedBar(map, selectedBar);
      });
    };

    if (window.kakao?.maps) {
      init();
    } else {
      const id = setInterval(() => {
        if (window.kakao?.maps) {
          clearInterval(id);
          init();
        }
      }, 200);

      return () => clearInterval(id);
    }
  }, [selectedBar]);

  useEffect(() => {
    const renderMarkers = (map: any) => {
      overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
      overlaysRef.current.clear();

      bars.forEach((bar) => {
        if (!bar.lat || !bar.lng) return;

        const isSelected = selectedBar?.id === bar.id;
        const content = document.createElement("div");
        content.innerHTML = makeMarkerHTML(bar, isSelected);
        content.addEventListener("click", () => {
          onSelectBarRef.current(bar);
        });

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(bar.lat, bar.lng),
          content,
          yAnchor: 1,
          zIndex: isSelected ? 10 : 1,
        });

        overlay.setMap(map);
        overlaysRef.current.set(bar.id, { overlay, bar });
      });

      focusSelectedBar(map, selectedBar);
    };

    if (mapInstanceRef.current) {
      renderMarkers(mapInstanceRef.current);
      return;
    }

    const id = setInterval(() => {
      if (mapInstanceRef.current) {
        clearInterval(id);
        renderMarkers(mapInstanceRef.current);
      }
    }, 200);

    return () => clearInterval(id);
  }, [bars, selectedBar]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    overlaysRef.current.forEach(({ overlay, bar }) => {
      const isSelected = selectedBar?.id === bar.id;
      const element = overlay.getContent() as HTMLDivElement;
      if (element) element.innerHTML = makeMarkerHTML(bar, isSelected);
      overlay.setZIndex(isSelected ? 10 : 1);
    });

    focusSelectedBar(map, selectedBar);
  }, [selectedBar]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
