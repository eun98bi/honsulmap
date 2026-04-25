"use client";

import { useEffect, useState } from "react";
import { modeConfig, PRESET_TAGS } from "@/lib/data";
import type { HonsulMode } from "@/lib/data";
import type { BarRow, TagVoteCounts } from "@/lib/db";
import { fetchTagVoteCounts } from "@/lib/db";
import {
  getVoterId,
  getVotedState,
  saveVotedMode,
  saveVotedTag,
  type VotedState,
} from "@/lib/voter";
import styles from "./VoteSection.module.css";

interface ModeCounts {
  quiet: number;
  social: number;
  mixed: number;
}

interface Props {
  bar: BarRow;
}

export default function VoteSection({ bar }: Props) {
  const cfg = modeConfig[bar.mode];
  const [voted, setVoted] = useState<VotedState>({ tags: [] });
  const [modeCounts, setModeCounts] = useState<ModeCounts>({
    quiet: bar.votes_quiet ?? 0,
    social: bar.votes_social ?? 0,
    mixed: bar.votes_mixed ?? 0,
  });
  const [tagCounts, setTagCounts] = useState<TagVoteCounts>({});
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    setVoted(getVotedState(bar.id));
    fetchTagVoteCounts(bar.id).then(setTagCounts);
  }, [bar.id]);

  async function handleModeVote(mode: HonsulMode) {
    if (voted.mode || voting) return;
    setVoting(true);
    try {
      const res = await fetch("/api/vote/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barId: bar.id, mode, voterId: getVoterId() }),
      });
      const data = await res.json();
      if (data.ok) {
        setModeCounts((prev) => ({ ...prev, [mode]: prev[mode] + 1 }));
      }
      if (data.ok || data.alreadyVoted) {
        saveVotedMode(bar.id, mode);
        setVoted((prev) => ({ ...prev, mode }));
      }
    } finally {
      setVoting(false);
    }
  }

  async function handleTagVote(tag: string) {
    if (voted.tags.includes(tag) || voting) return;
    setVoting(true);
    try {
      const res = await fetch("/api/vote/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barId: bar.id, tag, voterId: getVoterId() }),
      });
      const data = await res.json();
      if (data.ok) {
        setTagCounts((prev) => ({ ...prev, [tag]: (prev[tag] ?? 0) + 1 }));
      }
      if (data.ok || data.alreadyVoted) {
        saveVotedTag(bar.id, tag);
        setVoted((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      }
    } finally {
      setVoting(false);
    }
  }

  const totalModeVotes = modeCounts.quiet + modeCounts.social + modeCounts.mixed;
  const modesHaveVotes = totalModeVotes > 0;

  return (
    <div className={styles.root}>
      {/* 분위기 투표 */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>분위기 투표</h4>
        {!voted.mode && (
          <p className={styles.hint}>이 바의 분위기가 어떤가요?</p>
        )}
        <div className={styles.modeGrid}>
          {(Object.keys(modeConfig) as HonsulMode[]).map((m) => {
            const mcfg = modeConfig[m];
            const count = modeCounts[m];
            const isVoted = voted.mode === m;
            const hasVoted = !!voted.mode;
            return (
              <button
                key={m}
                className={`${styles.modeBtn} ${isVoted ? styles.modeBtnVoted : ""} ${hasVoted && !isVoted ? styles.modeBtnDone : ""}`}
                style={
                  isVoted
                    ? { borderColor: mcfg.color, background: `${mcfg.color}18` }
                    : {}
                }
                onClick={() => handleModeVote(m)}
                disabled={hasVoted || voting}
                aria-pressed={isVoted}
              >
                <span className={styles.modeEmoji}>{mcfg.emoji}</span>
                <span className={styles.modeLabel}>{mcfg.label}</span>
                {(hasVoted || modesHaveVotes) && (
                  <span
                    className={styles.modeCount}
                    style={isVoted ? { color: mcfg.color } : {}}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 태그 투표 */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>태그 투표</h4>
        {voted.tags.length === 0 && (
          <p className={styles.hint}>공감하는 태그를 골라주세요 (복수 선택 가능)</p>
        )}
        <div className={styles.tagGrid}>
            {PRESET_TAGS.map((tag) => {
              const count = tagCounts[tag] ?? 0;
              const isVoted = voted.tags.includes(tag);
              return (
                <button
                  key={tag}
                  className={`${styles.tagBtn} ${isVoted ? styles.tagBtnVoted : ""}`}
                  style={
                    isVoted
                      ? { borderColor: cfg.color, background: `${cfg.color}18` }
                      : {}
                  }
                  onClick={() => handleTagVote(tag)}
                  disabled={isVoted || voting}
                  aria-pressed={isVoted}
                >
                  <span
                    className={styles.tagDot}
                    style={{ background: isVoted ? cfg.color : "var(--text-dim)" }}
                  />
                  <span className={styles.tagText}>{tag}</span>
                  {count > 0 && (
                    <span
                      className={styles.tagCount}
                      style={isVoted ? { color: cfg.color } : {}}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
