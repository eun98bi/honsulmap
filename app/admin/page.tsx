"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BarRow } from "@/lib/db";
import { DAY_KEYS, DAY_LABELS, MENU_CONFIG, MENU_KEYS, PRESET_TAGS, type DayKey, type MenuType, type WeeklyHours } from "@/lib/data";
import styles from "./admin.module.css";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "honsul1234";

const EMPTY_HOURS: WeeklyHours = {
  mon: { open: "", close: "" },
  tue: { open: "", close: "" },
  wed: { open: "", close: "" },
  thu: { open: "", close: "" },
  fri: { open: "", close: "" },
  sat: { open: "", close: "" },
  sun: { open: "", close: "" },
};

const EMPTY_FORM = {
  name: "",
  branch: "",
  address: "",
  region: "",
  districts: [] as string[],
  lat: "",
  lng: "",
  phone: "",
  naver_map_url: "",
  hours: EMPTY_HOURS as WeeklyHours,
  description: "",
  mode: "quiet" as "quiet" | "social" | "mixed",
  can_request_song: false,
  allows_outside_food: false,
  menu_types: [] as MenuType[],
  tags: [] as string[],
  is_published: false,
};

type FormType = typeof EMPTY_FORM;

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [bars, setBars] = useState<BarRow[]>([]);
  const [form, setForm] = useState<FormType>(EMPTY_FORM);
  const [districtsText, setDistrictsText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"list" | "form">("list");
  const [toast, setToast] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "region" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [adminSearch, setAdminSearch] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setDistrictsText("");
    setEditId(null);
  };

  const loadBars = async () => {
    const { data } = await supabase.from("bars").select("*").order("created_at", { ascending: false });
    setBars((data ?? []) as BarRow[]);
  };

  useEffect(() => {
    if (authed) loadBars();
  }, [authed]);

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      return;
    }

    alert("비밀번호가 올바르지 않아요.");
  };

  const handleTagToggle = (tag: string) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag)
        ? current.tags.filter((value) => value !== tag)
        : [...current.tags, tag],
    }));
  };

  const handleHoursChange = (day: DayKey, field: "open" | "close", value: string) => {
    setForm((current) => ({
      ...current,
      hours: {
        ...current.hours,
        [day]: {
          ...(current.hours[day] ?? { open: "", close: "" }),
          [field]: value,
        },
      },
    }));
  };

  const handleSetHoliday = (day: DayKey) => {
    setForm((current) => ({
      ...current,
      hours: { ...current.hours, [day]: { open: "휴무", close: "" } },
    }));
  };

  const handleCopyAllDays = () => {
    const monday = form.hours.mon;
    if (!monday?.open) return;

    const updated = { ...form.hours };
    DAY_KEYS.forEach((day) => {
      updated[day] = { ...monday };
    });

    setForm((current) => ({ ...current, hours: updated }));
    showToast("월요일 영업시간을 월-일 전체에 복사했어요.");
  };

  const handleEdit = (bar: BarRow) => {
    const districts = bar.districts ?? [];
    setForm({
      name: bar.name,
      branch: bar.branch ?? "",
      address: bar.address,
      region: bar.region ?? "",
      districts,
      lat: bar.lat?.toString() ?? "",
      lng: bar.lng?.toString() ?? "",
      phone: bar.phone ?? "",
      naver_map_url: bar.naver_map_url ?? "",
      hours: bar.hours ? { ...EMPTY_HOURS, ...bar.hours } : EMPTY_HOURS,
      description: bar.description ?? "",
      mode: bar.mode,
      can_request_song: bar.can_request_song ?? false,
      allows_outside_food: bar.allows_outside_food,
      menu_types: bar.menu_types ?? [],
      tags: bar.tags ?? [],
      is_published: bar.is_published,
    });
    setDistrictsText(districts.join(", "));
    setEditId(bar.id);
    setTab("form");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}"을(를) 삭제할까요?`)) return;
    await supabase.from("bars").delete().eq("id", id);
    showToast("삭제했어요.");
    loadBars();
  };

  const handleSort = (col: "name" | "region") => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const filteredBars = adminSearch.trim()
    ? bars.filter((bar) => {
        const q = adminSearch.trim().toLowerCase();
        return (
          bar.name.toLowerCase().includes(q) ||
          (bar.branch ?? "").toLowerCase().includes(q) ||
          (bar.region ?? "").toLowerCase().includes(q)
        );
      })
    : bars;

  const sortedBars = sortBy
    ? [...filteredBars].sort((a, b) => {
        const valA = (sortBy === "name" ? a.name : (a.region ?? "")).toLowerCase();
        const valB = (sortBy === "name" ? b.name : (b.region ?? "")).toLowerCase();
        return sortDir === "asc" ? valA.localeCompare(valB, "ko") : valB.localeCompare(valA, "ko");
      })
    : filteredBars;

  const handleTogglePublish = async (bar: BarRow) => {
    await supabase.from("bars").update({ is_published: !bar.is_published }).eq("id", bar.id);
    showToast(bar.is_published ? "비공개로 변경했어요." : "공개했어요.");
    loadBars();
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.region || form.districts.length === 0) {
      alert("이름, 주소, 지역, 동네 태그는 필수예요.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        phone: form.phone || null,
        naver_map_url: form.naver_map_url || null,
      };

      if (editId) {
        const { error } = await supabase.from("bars").update(payload).eq("id", editId);
        if (error) throw error;
        showToast("수정했어요.");
      } else {
        const { error } = await supabase.from("bars").insert(payload);
        if (error) throw error;
        showToast("등록했어요.");
      }

      resetForm();
      setTab("list");
      loadBars();
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장 중 오류가 발생했어요.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (!authed) {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginBox}>
          <div className={styles.loginLogo}>🍶 혼술스팟 관리자</div>
          <input
            className={styles.input}
            type="password"
            placeholder="관리자 비밀번호"
            value={pw}
            onChange={(event) => setPw(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleLogin()}
          />
          <button className={styles.btnPrimary} onClick={handleLogin} type="button">입장</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <header className={styles.header}>
        <span className={styles.headerLogo}>🍶 혼술스팟 관리자</span>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "list" ? styles.tabActive : ""}`}
            onClick={() => {
              setTab("list");
              resetForm();
            }}
            type="button"
          >
            바 목록 ({bars.length})
          </button>
          <button
            className={`${styles.tab} ${tab === "form" ? styles.tabActive : ""}`}
            onClick={() => {
              setTab("form");
              resetForm();
            }}
            type="button"
          >
            + 새 바 등록
          </button>
        </div>
        <a href="/" className={styles.siteLink}>사이트로</a>
      </header>

      <main className={styles.main}>
        {tab === "list" && (
          <div className={styles.listWrap}>
            <div className={styles.listToolbar}>
              <input
                className={styles.adminSearch}
                type="text"
                placeholder="이름, 지점명, 지역 검색..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
              {adminSearch && (
                <button className={styles.adminSearchClear} onClick={() => setAdminSearch("")} type="button">✕</button>
              )}
              <span className={styles.adminSearchCount}>{sortedBars.length}개</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thSortable} onClick={() => handleSort("name")}>
                    이름 {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSort("region")}>
                    지역 {sortBy === "region" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th>동네 태그</th>
                  <th>모드</th>
                  <th>공개</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {sortedBars.length === 0 && (
                  <tr><td colSpan={6} className={styles.emptyRow}>{adminSearch ? "검색 결과가 없어요." : "등록된 바가 없어요."}</td></tr>
                )}
                {sortedBars.map((bar) => (
                  <tr key={bar.id} className={bar.is_published ? "" : styles.rowDraft}>
                    <td className={styles.tdName}>
                      {bar.name}
                      {bar.branch && <span className={styles.tdBranch}>{bar.branch}</span>}
                    </td>
                    <td>{bar.region ?? "-"}</td>
                    <td>{bar.districts?.join(", ") || "-"}</td>
                    <td>
                      <span className={styles[`mode_${bar.mode}`]}>
                        {{ quiet: "고독형", social: "소통형", mixed: "혼합형" }[bar.mode]}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`${styles.badge} ${bar.is_published ? styles.badgeOn : styles.badgeOff}`}
                        onClick={() => handleTogglePublish(bar)}
                        type="button"
                      >
                        {bar.is_published ? "공개" : "비공개"}
                      </button>
                    </td>
                    <td className={styles.tdActions}>
                      <button className={styles.btnEdit} onClick={() => handleEdit(bar)} type="button">수정</button>
                      <button className={styles.btnDelete} onClick={() => handleDelete(bar.id, bar.name)} type="button">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "form" && (
          <div className={styles.formWrap}>
            <h2 className={styles.formTitle}>{editId ? "바 수정" : "새 바 등록"}</h2>

            <div className={styles.formGrid}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>기본 정보</h3>

                <label className={styles.label}>바 이름 *</label>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="예: 바 도요"
                />

                <label className={styles.label}>지점명</label>
                <input
                  className={styles.input}
                  value={form.branch}
                  onChange={(event) => setForm({ ...form, branch: event.target.value })}
                  placeholder="예: 문래점, 홍대점 (없으면 비워두세요)"
                />

                <label className={styles.label}>주소 *</label>
                <input
                  className={styles.input}
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  placeholder="예: 서울 마포구 양화로 00길 00"
                />

                <label className={styles.label}>지역 *</label>
                <input
                  className={styles.input}
                  value={form.region}
                  onChange={(event) => setForm({ ...form, region: event.target.value })}
                  placeholder="예: 서울"
                />

                <label className={styles.label}>동네 태그 * (쉼표 구분)</label>
                <input
                  className={styles.input}
                  value={districtsText}
                  onChange={(event) => {
                    const districts = event.target.value.split(",").map((value) => value.trim()).filter(Boolean);
                    setDistrictsText(event.target.value);
                    setForm({ ...form, districts });
                  }}
                  onBlur={() => setDistrictsText(form.districts.join(", "))}
                  placeholder="예: 합정, 상수, 홍대"
                />

                <div className={styles.row2}>
                  <div>
                    <label className={styles.label}>위도</label>
                    <input
                      className={styles.input}
                      value={form.lat}
                      onChange={(event) => setForm({ ...form, lat: event.target.value })}
                      placeholder="37.550943"
                    />
                  </div>
                  <div>
                    <label className={styles.label}>경도</label>
                    <input
                      className={styles.input}
                      value={form.lng}
                      onChange={(event) => setForm({ ...form, lng: event.target.value })}
                      placeholder="126.913879"
                    />
                  </div>
                </div>

                <label className={styles.label}>전화번호</label>
                <input
                  className={styles.input}
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="02-123-4567"
                />

                <label className={styles.label}>네이버 지도 URL</label>
                <input
                  className={styles.input}
                  value={form.naver_map_url}
                  onChange={(event) => setForm({ ...form, naver_map_url: event.target.value })}
                  placeholder="https://map.naver.com/..."
                />

                <label className={styles.label}>설명</label>
                <textarea
                  className={styles.textarea}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="분위기와 추천 포인트를 적어주세요."
                  rows={3}
                />
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>혼술 정보</h3>

                <label className={styles.label}>혼술 모드</label>
                <div className={styles.modeGroup}>
                  {(["quiet", "social", "mixed"] as const).map((mode) => (
                    <button
                      key={mode}
                      data-mode={mode}
                      className={`${styles.modeBtn} ${form.mode === mode ? styles.modeBtnActive : ""}`}
                      onClick={() => setForm({ ...form, mode })}
                      type="button"
                    >
                      {{ quiet: "고독형", social: "소통형", mixed: "혼합형" }[mode]}
                    </button>
                  ))}
                </div>

                <label className={styles.label}>시설 정보</label>
                <div className={styles.checkCol}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={form.can_request_song} onChange={(event) => setForm({ ...form, can_request_song: event.target.checked })} />
                    신청곡 가능
                  </label>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={form.allows_outside_food} onChange={(event) => setForm({ ...form, allows_outside_food: event.target.checked })} />
                    외부 음식 가능
                  </label>
                </div>

                <label className={styles.label}>메뉴 종류</label>
                <div className={styles.menuGroup}>
                  {MENU_KEYS.map((menu) => {
                    const active = form.menu_types.includes(menu);
                    return (
                      <button
                        key={menu}
                        className={`${styles.menuBtn} ${active ? styles.menuBtnActive : ""}`}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            menu_types: active
                              ? current.menu_types.filter((value) => value !== menu)
                              : [...current.menu_types, menu],
                          }))
                        }
                        type="button"
                      >
                        {MENU_CONFIG[menu].emoji} {MENU_CONFIG[menu].label}
                      </button>
                    );
                  })}
                </div>

                <label className={styles.label}>혼술 태그</label>
                <div className={styles.tagGrid}>
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      className={`${styles.tagBtn} ${form.tags.includes(tag) ? styles.tagBtnActive : ""}`}
                      onClick={() => handleTagToggle(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <label className={styles.label}>공개 여부</label>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />
                  저장 후 바로 공개
                </label>
              </div>
            </div>

            <div className={`${styles.section} ${styles.sectionFull}`}>
              <div className={styles.hoursHeader}>
                <h3 className={styles.sectionTitle}>영업시간</h3>
                <button className={styles.btnCopy} onClick={handleCopyAllDays} type="button">
                  월요일 시간을 월-일 전체에 복사
                </button>
              </div>
              <div className={styles.hoursGrid}>
                {DAY_KEYS.map((day) => {
                  const hours = form.hours[day] ?? { open: "", close: "" };
                  const isHoliday = hours.open === "휴무";

                  return (
                    <div key={day} className={styles.hoursRow}>
                      <span className={styles.dayLabel}>{DAY_LABELS[day]}</span>
                      {isHoliday ? (
                        <>
                          <span className={styles.holidayBadge}>휴무</span>
                          <button
                            className={styles.btnUnholiday}
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                hours: { ...current.hours, [day]: { open: "", close: "" } },
                              }))
                            }
                            type="button"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <input className={styles.timeInput} value={hours.open} placeholder="18:00" onChange={(event) => handleHoursChange(day, "open", event.target.value)} />
                          <span className={styles.timeSep}>-</span>
                          <input className={styles.timeInput} value={hours.close} placeholder="02:00" onChange={(event) => handleHoursChange(day, "close", event.target.value)} />
                          <button className={styles.btnHoliday} onClick={() => handleSetHoliday(day)} type="button">휴무</button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.formFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setTab("list");
                  resetForm();
                }}
                type="button"
              >
                취소
              </button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving} type="button">
                {saving ? "저장 중..." : editId ? "수정 완료" : "등록하기"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
