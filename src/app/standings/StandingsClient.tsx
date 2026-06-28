"use client";

import { useState } from "react";
import Image from "next/image";
import { Trophy, Star, Shield } from "lucide-react";
import type { StandingsData, TeamWithPlayers } from "./page";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getStageName(stage: string) {
  switch (stage) {
    case "round_32": return "دور الـ 32";
    case "round_16": return "دور الـ 16";
    case "quarter": return "ربع النهائي";
    case "semi": return "نصف النهائي";
    case "final": return "النهائي";
    default: return stage;
  }
}

function getPositionLabel(pos: string | null) {
  switch (pos) {
    case "goalkeeper": return "حارس مرمى";
    case "defender": return "مدافع";
    case "midfielder": return "وسط";
    case "forward": return "مهاجم";
    default: return "—";
  }
}

function getPositionColor(pos: string | null) {
  switch (pos) {
    case "goalkeeper": return "rgba(201,151,26,0.9)";
    case "defender": return "rgba(59,130,246,0.9)";
    case "midfielder": return "rgba(34,197,94,0.9)";
    case "forward": return "rgba(239,68,68,0.9)";
    default: return "rgba(255,255,255,0.3)";
  }
}

// ─── TeamAvatar ───────────────────────────────────────────────────────────────

function TeamAvatar({ name, logoUrl, size = "md" }: { name: string; logoUrl: string | null; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? 28 : size === "lg" ? 56 : 36;
  const textSize = size === "sm" ? "text-[9px]" : size === "lg" ? "text-base" : "text-[11px]";
  return (
    <div
      className={`relative rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0`}
      style={{ width: dim, height: dim, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={name} fill sizes={`${dim}px`} className="object-contain p-0.5" />
      ) : (
        <span className={`${textSize} font-black text-white/70`}>{getInitials(name)}</span>
      )}
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ id, active, onClick, icon: Icon, label }: { id: string; active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
        active
          ? "text-[#F0C040] bg-[#C9971A]/15 border border-[#C9971A]/35"
          : "text-white/35 hover:text-white/60 border border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="leading-tight text-center">{label}</span>
    </button>
  );
}

// ─── Tab 1: Standings (Groups + Knockout) ────────────────────────────────────

const STAGE_ORDER = ["round_32", "round_16", "quarter", "semi", "final"];

function StandingsTab({ data }: { data: StandingsData }) {
  const groups = Object.keys(data.standings).sort();
  const hasKnockout = data.knockoutMatches.length > 0;

  // Group knockout matches by stage in correct order
  const knockoutByStage: Record<string, typeof data.knockoutMatches> = {};
  for (const m of data.knockoutMatches) {
    if (!knockoutByStage[m.stage]) knockoutByStage[m.stage] = [];
    knockoutByStage[m.stage].push(m);
  }

  const orderedStages = STAGE_ORDER.filter((s) => knockoutByStage[s]);

  return (
    <div className="space-y-6">
      {/* ── Group Stage ── */}
      {groups.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-white/30 mb-3 tracking-widest uppercase">دور المجموعات</p>
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group} className="glass-card rounded-2xl overflow-hidden animate-fade-in-up">
                {/* Group header */}
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ background: "rgba(201,151,26,0.08)", borderBottom: "1px solid rgba(201,151,26,0.15)" }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black"
                    style={{ background: "rgba(201,151,26,0.2)", color: "#F0C040", border: "1px solid rgba(201,151,26,0.3)" }}
                  >
                    {group}
                  </div>
                  <span className="text-xs font-bold text-white/60">المجموعة {group}</span>
                </div>

                {/* Column headers */}
                <div
                  className="px-3 py-1.5 grid text-[9px] font-black text-white/20 tracking-wider uppercase"
                  style={{ gridTemplateColumns: "1fr 28px 28px 28px 28px 36px 36px 28px 36px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span>الفريق</span>
                  <span className="text-center">لع</span>
                  <span className="text-center">ف</span>
                  <span className="text-center">ت</span>
                  <span className="text-center">خ</span>
                  <span className="text-center">له</span>
                  <span className="text-center">عه</span>
                  <span className="text-center">فا</span>
                  <span className="text-center font-black text-[#C9971A]/60">نق</span>
                </div>

                {/* Rows */}
                {data.standings[group].map((row, idx) => {
                  const isTop2 = idx < 2;
                  return (
                    <div
                      key={row.teamId}
                      className="px-3 py-2.5 grid items-center"
                      style={{
                        gridTemplateColumns: "1fr 28px 28px 28px 28px 36px 36px 28px 36px",
                        borderBottom: idx < data.standings[group].length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        background: isTop2 ? "rgba(201,151,26,0.04)" : "transparent",
                      }}
                    >
                      {/* Team */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[10px] font-black w-4 flex-shrink-0 score-number"
                          style={{ color: isTop2 ? "rgba(201,151,26,0.85)" : "rgba(255,255,255,0.18)" }}
                        >
                          {idx + 1}
                        </span>
                        {isTop2 && (
                          <div
                            className="w-1 h-4 rounded-full flex-shrink-0"
                            style={{ background: "linear-gradient(to bottom, #F0C040, #C9971A)" }}
                          />
                        )}
                        <TeamAvatar name={row.teamName} logoUrl={row.logoUrl} size="sm" />
                        <span className="text-xs font-bold text-white/85 truncate">{row.teamName}</span>
                      </div>
                      <span className="text-center text-[11px] font-semibold text-white/45 score-number">{row.played}</span>
                      <span className="text-center text-[11px] font-semibold text-white/45 score-number">{row.won}</span>
                      <span className="text-center text-[11px] font-semibold text-white/45 score-number">{row.drawn}</span>
                      <span className="text-center text-[11px] font-semibold text-white/45 score-number">{row.lost}</span>
                      <span className="text-center text-[11px] font-semibold text-white/45 score-number">{row.goalsFor}</span>
                      <span className="text-center text-[11px] font-semibold text-white/45 score-number">{row.goalsAgainst}</span>
                      <span
                        className="text-center text-[11px] font-bold score-number"
                        style={{ color: row.goalDiff > 0 ? "rgba(34,197,94,0.85)" : row.goalDiff < 0 ? "rgba(239,68,68,0.75)" : "rgba(255,255,255,0.35)" }}
                      >
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </span>
                      <span
                        className="text-center text-sm font-black score-number"
                        style={{ color: "#F0C040" }}
                      >
                        {row.points}
                      </span>
                    </div>
                  );
                })}

                {/* Qualify line */}
                <div
                  className="px-4 py-1.5 flex items-center gap-2"
                  style={{ borderTop: "1px dashed rgba(201,151,26,0.2)", background: "rgba(201,151,26,0.04)" }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: "rgba(201,151,26,0.7)" }} />
                  <span className="text-[9px] font-bold text-white/25 tracking-wide">المتأهلون للدور التالي</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Knockout Bracket ── */}
      {hasKnockout && (
        <div>
          <p className="text-[11px] font-bold text-white/30 mb-3 tracking-widest uppercase">الأدوار الإقصائية</p>
          <div className="space-y-3">
            {orderedStages.map((stage) => (
              <div key={stage}>
                {/* Stage label */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                    style={{
                      background: stage === "final" ? "rgba(201,151,26,0.2)" : "rgba(255,255,255,0.06)",
                      color: stage === "final" ? "#F0C040" : "rgba(255,255,255,0.4)",
                      border: stage === "final" ? "1px solid rgba(201,151,26,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {stage === "final" ? "🏆 " : ""}{getStageName(stage)}
                  </div>
                </div>

                {/* Matches for this stage */}
                <div className="space-y-2">
                  {knockoutByStage[stage].map((m) => {
                    const isFinished = m.status === "finished";
                    const hasPenalty = m.homePenalty !== null && m.awayPenalty !== null;
                    const homeWon = isFinished && ((m.homeScore ?? 0) > (m.awayScore ?? 0) || (hasPenalty && (m.homePenalty ?? 0) > (m.awayPenalty ?? 0)));
                    const awayWon = isFinished && !homeWon;

                    return (
                      <div
                        key={m.id}
                        className={`rounded-2xl p-3.5 ${stage === "final" ? "glass-card-gold" : "glass-card"} ${m.status === "live" ? "match-live-glow" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Home Team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TeamAvatar name={m.homeTeam.name} logoUrl={m.homeTeam.logoUrl} size="sm" />
                            <span
                              className="text-xs font-bold truncate"
                              style={{ color: homeWon ? "#F0C040" : "rgba(255,255,255,0.8)" }}
                            >
                              {m.homeTeam.name}
                            </span>
                            {homeWon && <span className="text-[10px]">✓</span>}
                          </div>

                          {/* Score */}
                          <div className="flex items-center gap-1.5 flex-shrink-0 px-1">
                            {isFinished || m.status === "live" ? (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <span
                                    className="text-lg font-black score-number"
                                    style={{ color: m.status === "live" ? "#fc8181" : "#F3EED9" }}
                                  >
                                    {m.homeScore ?? 0}
                                  </span>
                                  <span className="text-white/20 font-light">–</span>
                                  <span
                                    className="text-lg font-black score-number"
                                    style={{ color: m.status === "live" ? "#fc8181" : "#F3EED9" }}
                                  >
                                    {m.awayScore ?? 0}
                                  </span>
                                </div>
                                {hasPenalty && (
                                  <span className="text-[9px] font-bold" style={{ color: "rgba(201,151,26,0.8)" }}>
                                    ر.ت {m.homePenalty}–{m.awayPenalty}
                                  </span>
                                )}
                                {m.status === "live" && (
                                  <span className="live-badge mt-0.5" style={{ fontSize: 9 }}>
                                    <span className="live-dot" style={{ width: 5, height: 5 }} />
                                    مباشر
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-black text-white/15">VS</span>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            {awayWon && <span className="text-[10px]">✓</span>}
                            <span
                              className="text-xs font-bold truncate"
                              style={{ color: awayWon ? "#F0C040" : "rgba(255,255,255,0.8)" }}
                            >
                              {m.awayTeam.name}
                            </span>
                            <TeamAvatar name={m.awayTeam.name} logoUrl={m.awayTeam.logoUrl} size="sm" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups.length === 0 && !hasKnockout && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">🏟️</div>
          <p className="text-white/30 font-semibold text-sm">لا توجد بيانات ترتيب بعد</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Teams & Squads ────────────────────────────────────────────────────

function TeamsTab({ teams }: { teams: TeamWithPlayers[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams[0]?.id ?? null);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="space-y-4">
      {/* Team Selector */}
      <div className="flex gap-2 flex-wrap animate-fade-in-up">
        {teams.map((team) => {
          const isActive = selectedTeamId === team.id;
          return (
            <button
              key={team.id}
              id={`team-select-${team.id}`}
              onClick={() => setSelectedTeamId(team.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/40"
                  : "text-white/40 border border-white/[0.07] hover:text-white/70 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <TeamAvatar name={team.name} logoUrl={team.logoUrl} size="sm" />
              {team.name}
            </button>
          );
        })}
      </div>

      {/* Squad Table */}
      {selectedTeam && (
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up">
          {/* Team Header */}
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(201,151,26,0.07)", borderBottom: "1px solid rgba(201,151,26,0.14)" }}
          >
            <TeamAvatar name={selectedTeam.name} logoUrl={selectedTeam.logoUrl} size="md" />
            <div>
              <p className="text-sm font-black text-white/90">{selectedTeam.name}</p>
              <p className="text-[10px] text-white/35 font-semibold">{selectedTeam.players.length} لاعب مسجل</p>
            </div>
          </div>

          {/* Column headers */}
          <div
            className="px-4 py-2 grid text-[9px] font-black text-white/20 tracking-widest uppercase"
            style={{ gridTemplateColumns: "36px 1fr auto", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <span className="text-center">رقم</span>
            <span>اللاعب</span>
            <span>المركز</span>
          </div>

          {/* Players */}
          {selectedTeam.players.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/25 text-sm font-semibold">لا يوجد لاعبون مسجلون</p>
            </div>
          ) : (
            <div>
              {selectedTeam.players.map((player: TeamWithPlayers["players"][number], idx: number) => (
                <div
                  key={player.id}
                  className="px-4 py-3 grid items-center hover:bg-white/[0.02] transition-colors duration-200"
                  style={{
                    gridTemplateColumns: "36px 1fr auto",
                    borderBottom: idx < selectedTeam.players.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  {/* Jersey Number */}
                  <div className="flex justify-center">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black score-number"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {player.jerseyNumber ?? "—"}
                    </div>
                  </div>

                  {/* Name */}
                  <span className="text-sm font-semibold text-white/85">{player.name}</span>

                  {/* Position */}
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: getPositionColor(player.position),
                      background: `${getPositionColor(player.position).replace("0.9", "0.12")}`,
                      border: `1px solid ${getPositionColor(player.position).replace("0.9", "0.25")}`,
                    }}
                  >
                    {getPositionLabel(player.position)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {teams.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">⚽</div>
          <p className="text-white/30 font-semibold text-sm">لا توجد فرق مسجلة بعد</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Top Scorers ───────────────────────────────────────────────────────

function TopScorersTab({ data }: { data: StandingsData }) {
  const scorers = data.topScorers;
  const maxGoals = scorers[0]?.goals ?? 1;

  if (scorers.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <div className="text-3xl mb-3">⚽</div>
        <p className="text-white/30 font-semibold text-sm">لا توجد إحصائيات هدافين بعد</p>
      </div>
    );
  }

  const podiumColors = [
    { bg: "rgba(201,151,26,0.18)", border: "rgba(201,151,26,0.55)", text: "#F0C040", label: "🥇" },
    { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.4)", text: "#94a3b8", label: "🥈" },
    { bg: "rgba(180,100,40,0.12)", border: "rgba(180,100,40,0.4)", text: "#b47030", label: "🥉" },
  ];

  return (
    <div className="space-y-4">
      {/* Podium cards for top 3 */}
      {scorers.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
          {[1, 0, 2].map((realIdx, displayIdx) => {
            const scorer = scorers[realIdx];
            if (!scorer) return null;
            const colors = podiumColors[realIdx];
            const heights = [80, 100, 64]; // visual heights of podium bars
            const podiumHeight = heights[displayIdx];
            return (
              <div
                key={scorer.playerId}
                className="flex flex-col items-center gap-1.5 rounded-2xl p-3"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <span className="text-xl leading-none">{colors.label}</span>
                <TeamAvatar name={scorer.teamName} logoUrl={scorer.logoUrl} size="sm" />
                <p className="text-[10px] font-black text-white/90 text-center leading-tight">{scorer.playerName}</p>
                <p className="text-[9px] text-white/35 font-semibold text-center truncate w-full">{scorer.teamName}</p>
                <div
                  className="font-black score-number text-center"
                  style={{ color: colors.text, fontSize: realIdx === 0 ? 22 : 18 }}
                >
                  {scorer.goals}
                  <span className="text-[9px] font-bold text-white/30 mr-0.5">هدف</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        {/* Header */}
        <div
          className="px-4 py-2.5 grid text-[9px] font-black text-white/20 tracking-widest uppercase items-center"
          style={{ gridTemplateColumns: "24px 1fr auto 80px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span className="text-center">#</span>
          <span>اللاعب</span>
          <span className="text-center pl-2">الأهداف</span>
          <span className="text-center">النسبة</span>
        </div>

        {scorers.map((scorer, idx) => {
          const barPct = (scorer.goals / maxGoals) * 100;
          const colors = podiumColors[idx] ?? { text: "rgba(255,255,255,0.55)" };

          return (
            <div
              key={scorer.playerId}
              className="px-4 py-3 grid items-center hover:bg-white/[0.02] transition-colors duration-200"
              style={{
                gridTemplateColumns: "24px 1fr auto 80px",
                borderBottom: idx < scorers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              {/* Rank */}
              <span
                className="text-xs font-black text-center score-number"
                style={{ color: idx < 3 ? colors.text : "rgba(255,255,255,0.2)" }}
              >
                {idx + 1}
              </span>

              {/* Player + Team */}
              <div className="flex items-center gap-2 min-w-0">
                <TeamAvatar name={scorer.teamName} logoUrl={scorer.logoUrl} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white/90 truncate">{scorer.playerName}</p>
                  <p className="text-[9px] text-white/30 font-semibold truncate">{scorer.teamName}</p>
                </div>
              </div>

              {/* Goals count */}
              <div className="flex items-center justify-center pr-3">
                <span
                  className="text-sm font-black score-number"
                  style={{ color: idx < 3 ? colors.text : "rgba(255,255,255,0.7)" }}
                >
                  {scorer.goals}
                </span>
              </div>

              {/* Bar */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barPct}%`,
                      background: idx === 0
                        ? "linear-gradient(to right, #F0C040, #C9971A)"
                        : idx === 1
                        ? "linear-gradient(to right, #94a3b8, #64748b)"
                        : idx === 2
                        ? "linear-gradient(to right, #b47030, #8b5020)"
                        : "rgba(255,255,255,0.3)",
                    }}
                  />
                </div>
                <span className="text-[9px] font-bold text-white/25 score-number w-8 text-right">
                  {Math.round(barPct)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

type Tab = "standings" | "teams" | "scorers";

export default function StandingsClient({ data }: { data: StandingsData }) {
  const [activeTab, setActiveTab] = useState<Tab>("standings");

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "standings", icon: Trophy, label: "مسار البطولة" },
    { id: "teams", icon: Shield, label: "الفرق واللاعبين" },
    { id: "scorers", icon: Star, label: "الهدافون" },
  ];

  return (
    <div>
      {/* ── Tab Bar ── */}
      <div
        className="flex gap-2 mb-6 p-1.5 rounded-2xl animate-fade-in-up"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={`tab-${tab.id}`}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "standings" && <StandingsTab data={data} />}
      {activeTab === "teams" && <TeamsTab teams={data.teams} />}
      {activeTab === "scorers" && <TopScorersTab data={data} />}
    </div>
  );
}
