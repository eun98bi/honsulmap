const VOTER_KEY = "honsulmap_voter_id";

export function getVoterId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VOTER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

export interface VotedState {
  mode?: string;
  tags: string[];
}

function storageKey(barId: string) {
  return `honsulmap_voted_${barId}`;
}

export function getVotedState(barId: string): VotedState {
  if (typeof window === "undefined") return { tags: [] };
  try {
    const raw = localStorage.getItem(storageKey(barId));
    return raw ? JSON.parse(raw) : { tags: [] };
  } catch {
    return { tags: [] };
  }
}

export function saveVotedMode(barId: string, mode: string) {
  const state = getVotedState(barId);
  localStorage.setItem(storageKey(barId), JSON.stringify({ ...state, mode }));
}

export function saveVotedTag(barId: string, tag: string) {
  const state = getVotedState(barId);
  if (!state.tags.includes(tag)) state.tags.push(tag);
  localStorage.setItem(storageKey(barId), JSON.stringify(state));
}
