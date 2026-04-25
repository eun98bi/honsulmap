export type HonsulMode = "quiet" | "social" | "mixed";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface DayHours {
  open: string;
  close: string;
}

export type WeeklyHours = Partial<Record<DayKey, DayHours>>;

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const modeConfig = {
  quiet: {
    label: "혼자만의 시간",
    emoji: "🔵",
    color: "#6B8CAE",
    bg: "#EEF3F8",
    desc: "말을 많이 하지 않아도 편한 조용한 혼술 바",
  },
  social: {
    label: "열린 혼술",
    emoji: "🟠",
    color: "#C07B54",
    bg: "#FBF0EA",
    desc: "바텐더나 옆자리와 자연스럽게 대화가 이어지는 혼술 바",
  },
  mixed: {
    label: "그날의 기분",
    emoji: "🟢",
    color: "#7B9E7B",
    bg: "#EEF4EE",
    desc: "시간대나 요일에 따라 분위기가 달라지는 혼술 바",
  },
} as const;

export type MenuType = "whiskey" | "cocktail" | "beer" | "wine" | "sake" | "nonalcohol";

export const MENU_CONFIG: Record<MenuType, { label: string; emoji: string }> = {
  whiskey: { label: "위스키", emoji: "🥃" },
  cocktail: { label: "칵테일", emoji: "🍸" },
  beer: { label: "맥주", emoji: "🍺" },
  wine: { label: "와인", emoji: "🍷" },
  sake: { label: "사케·전통주", emoji: "🍶" },
  nonalcohol: { label: "논알콜", emoji: "🧃" },
};

export const MENU_KEYS = Object.keys(MENU_CONFIG) as MenuType[];

export const PRESET_TAGS = [
  "말 안 걸어도 편해요",
  "각자만의 템포가 있어요",
  "조용해서 좋았어요",
  "책 읽기 좋아요",
  "혼자만의 공간 같아요",
  "바텐더가 말 걸어줘요",
  "옆자리랑 친해졌어요",
  "혼자 와도 같이 마시게 돼요",
  "직원분이 자연스럽게 대해줘요",
  "혼자 가도 어색하지 않아요",
  "평일엔 조용, 주말엔 활기",
  "기분 따라 분위기가 달라요",
  "가벼운 안주 있어요",
] as const;

export function getTodayHours(hours: WeeklyHours | null): string {
  if (!hours) return "영업시간 미등록";

  const days: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = days[new Date().getDay()];
  const current = hours[today];

  if (!current || current.open === "휴무" || !current.open) return "오늘 휴무";
  return `${current.open} - ${current.close}`;
}

export function summarizeHours(hours: WeeklyHours | null): string {
  if (!hours) return "";

  const values = Object.values(hours).filter((value): value is DayHours => Boolean(value && value.open && value.open !== "휴무"));
  if (values.length === 0) return "휴무";

  const first = values[0];
  const allSame = values.every((value) => value.open === first.open && value.close === first.close);

  if (allSame && Object.keys(hours).length === 7) {
    return `매일 ${first.open}-${first.close}`;
  }

  return "요일별 상이";
}
