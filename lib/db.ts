import { supabase } from "./supabase";
import type { HonsulMode, MenuType, WeeklyHours } from "./data";

export interface BarRow {
  id: string;
  name: string;
  address: string;
  region?: string;
  districts: string[];
  lat: number;
  lng: number;
  phone?: string;
  naver_map_url?: string;
  hours: WeeklyHours | null;
  description: string;
  mode: HonsulMode;
  can_request_song?: boolean;
  allows_outside_food: boolean;
  menu_types: MenuType[];
  tags: string[];
  is_published: boolean;
  votes_quiet: number;
  votes_social: number;
  votes_mixed: number;
}

export interface BarFilters {
  mode?: HonsulMode | "all";
  district?: string;
}

export function getBarRegion(bar: Pick<BarRow, "region" | "address">): string {
  if (bar.region?.trim()) return bar.region.trim();
  return bar.address?.trim().split(/\s+/)[0] ?? "";
}

export function getPrimaryDistrict(bar: Pick<BarRow, "districts">): string {
  return bar.districts?.find(Boolean)?.trim() ?? "";
}

export function getBarLocationLabel(bar: Pick<BarRow, "region" | "address" | "districts">): string {
  const region = getBarRegion(bar);
  const district = getPrimaryDistrict(bar);
  return [region, district].filter(Boolean).join(" · ");
}

export async function fetchBars(filters: BarFilters = {}): Promise<BarRow[]> {
  let query = supabase
    .from("bars_with_votes")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (filters.mode && filters.mode !== "all") query = query.eq("mode", filters.mode);
  if (filters.district && filters.district !== "전체") query = query.contains("districts", [filters.district]);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BarRow[];
}

export async function fetchAllBarsAdmin(): Promise<BarRow[]> {
  const { data, error } = await supabase
    .from("bars_with_votes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BarRow[];
}

export async function fetchDistricts(): Promise<string[]> {
  const { data, error } = await supabase
    .from("bars")
    .select("districts")
    .eq("is_published", true);
  if (error) return [];
  const all = (data ?? []).flatMap((row: { districts?: string[] }) => row.districts ?? []);
  return Array.from(new Set(all));
}

export async function fetchBarById(id: string): Promise<BarRow | null> {
  const { data, error } = await supabase
    .from("bars_with_votes")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();
  if (error) return null;
  return data as BarRow;
}

export async function voteMode(barId: string, mode: HonsulMode): Promise<void> {
  const { error } = await supabase.from("mode_votes").insert({ bar_id: barId, mode });
  if (error) throw error;
}

export interface TagVoteCounts {
  [tag: string]: number;
}

export async function fetchTagVoteCounts(barId: string): Promise<TagVoteCounts> {
  const { data, error } = await supabase
    .from("tag_votes")
    .select("tag")
    .eq("bar_id", barId);
  if (error || !data) return {};
  return data.reduce<TagVoteCounts>((acc, row: { tag: string }) => {
    acc[row.tag] = (acc[row.tag] ?? 0) + 1;
    return acc;
  }, {});
}

export async function fetchTopTagsByBar(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase.from("tag_votes").select("bar_id, tag");
  if (error || !data) return {};

  const counts: Record<string, Record<string, number>> = {};
  for (const row of data as { bar_id: string; tag: string }[]) {
    if (!counts[row.bar_id]) counts[row.bar_id] = {};
    counts[row.bar_id][row.tag] = (counts[row.bar_id][row.tag] ?? 0) + 1;
  }

  const result: Record<string, string[]> = {};
  for (const [barId, tagCounts] of Object.entries(counts)) {
    result[barId] = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
  }
  return result;
}
