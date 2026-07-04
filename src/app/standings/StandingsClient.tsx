"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Trophy, Star, Shield, X, Search } from "lucide-react";
import type { StandingsData, TeamStanding, TeamWithPlayers } from "./page";

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


function cleanPlayerName(playerName: string) {
  if (!playerName) return "";
  return playerName.split(" - ")[0];
}


// ─── TeamAvatar ───────────────────────────────────────────────────────────────

function TeamAvatar({ name, logoUrl, size = "md" }: { name: string; logoUrl: string | null; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? 28 : size === "lg" ? 64 : 40;
  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-lg" : "text-xs";
  
  // Check if logoUrl is a valid image path/URL to prevent rendering text placeholders like "1"
  const hasValidLogo = logoUrl && (logoUrl.startsWith("/") || logoUrl.startsWith("http") || logoUrl.includes("."));

  return (
    <div
      className="relative rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 transition-transform duration-300"
      style={{
        width: dim,
        height: dim,
        background: size === "lg" 
          ? "linear-gradient(135deg, rgba(201,151,26,0.15) 0%, rgba(255,255,255,0.03) 100%)" 
          : "rgba(255,255,255,0.04)",
        border: size === "lg"
          ? "2px solid rgba(201,151,26,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: size === "lg" ? "0 8px 24px -6px rgba(201, 151, 26, 0.25)" : "none"
      }}
    >
      {hasValidLogo ? (
        <Image src={logoUrl} alt={name} fill sizes={`${dim}px`} className="object-contain p-1" />
      ) : (
        <span 
          className={`${textSize} font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-[#C9971A]/70`}
          style={{ textShadow: "0 2px 10px rgba(255,255,255,0.1)" }}
        >
          {getInitials(name)}
        </span>
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
      className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-bold transition-all duration-300 cursor-pointer sm:gap-2 sm:text-xs md:flex-1 md:px-3 ${
        active
          ? "text-[#F0C040] bg-[#C9971A]/15 border border-[#C9971A]/35"
          : "text-white/55 hover:text-white/70 border border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="min-w-0 truncate leading-tight text-center">{label}</span>
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
          <p className="text-[11px] font-bold text-white/50 mb-3 tracking-widest uppercase">دور المجموعات</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  className="grid grid-cols-[1fr_34px_38px_40px] px-3 py-1.5 text-[9px] font-black text-white/20 tracking-wider uppercase md:grid-cols-[1fr_28px_28px_28px_28px_36px_36px_28px_36px]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span>الفريق</span>
                  <span className="text-center">لع</span>
                  <span className="hidden text-center md:block">ف</span>
                  <span className="hidden text-center md:block">ت</span>
                  <span className="hidden text-center md:block">خ</span>
                  <span className="hidden text-center md:block">له</span>
                  <span className="hidden text-center md:block">عه</span>
                  <span className="text-center">فا</span>
                  <span className="text-center font-black text-[#C9971A]/60">نق</span>
                </div>

                {/* Rows */}
                {data.standings[group].map((row, idx) => {
                  const isTop2 = idx < 2;
                  return (
                    <div
                      key={row.teamId}
                      className="grid grid-cols-[1fr_34px_38px_40px] items-center px-3 py-2.5 md:grid-cols-[1fr_28px_28px_28px_28px_36px_36px_28px_36px]"
                      style={{
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
                            className="w-1 h-5 rounded-full flex-shrink-0"
                            style={{ background: "linear-gradient(to bottom, #F0C040, #C9971A)" }}
                          />
                        )}
                        <TeamAvatar name={row.teamName} logoUrl={row.logoUrl} size="sm" />
                        <span className="text-xs font-bold text-white/85 truncate">{row.teamName}</span>
                      </div>
                      <span className="text-center text-[11px] font-semibold text-white/45 score-number">{row.played}</span>
                      <span className="hidden text-center text-[11px] font-semibold text-white/45 score-number md:block">{row.won}</span>
                      <span className="hidden text-center text-[11px] font-semibold text-white/45 score-number md:block">{row.drawn}</span>
                      <span className="hidden text-center text-[11px] font-semibold text-white/45 score-number md:block">{row.lost}</span>
                      <span className="hidden text-center text-[11px] font-semibold text-white/45 score-number md:block">{row.goalsFor}</span>
                      <span className="hidden text-center text-[11px] font-semibold text-white/45 score-number md:block">{row.goalsAgainst}</span>
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
          <p className="text-[11px] font-bold text-white/50 mb-3 tracking-widest uppercase">الأدوار الإقصائية</p>
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
                                  <span className="text-white/40 font-medium">–</span>
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
                              <span className="text-xs font-black text-white/35">VS</span>
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
          <p className="text-white/50 font-semibold text-sm">لا توجد بيانات ترتيب بعد</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Teams & Squads ────────────────────────────────────────────────────

interface TeamsTabProps {
  teams: TeamWithPlayers[];
  standings: Record<string, TeamStanding[]>;
}

function TeamsTab({ teams, standings }: TeamsTabProps) {
  const [activeTeam, setActiveTeam] = useState<TeamWithPlayers | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  // Map teamId -> groupName
  const teamGroups = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(standings).forEach(([groupName, groupTeams]) => {
      groupTeams.forEach((t) => {
        map[t.teamId] = groupName;
      });
    });
    return map;
  }, [standings]);

  // Unique groups
  const groups = useMemo(() => {
    const g = new Set<string>();
    teams.forEach((t) => {
      const grp = teamGroups[t.id];
      if (grp) g.add(grp);
    });
    return Array.from(g).sort();
  }, [teams, teamGroups]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const grp = teamGroups[team.id];
      const matchesGroup = selectedGroup === "all" || grp === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [teams, searchQuery, selectedGroup, teamGroups]);

  return (
    <div className="space-y-5">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث عن فريق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-[#C9971A]/50 focus:bg-white/[0.06] text-xs font-semibold text-[#F3EED9] placeholder-white/20 outline-none transition-all duration-300"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>

        {/* Group Filter Pills */}
        {groups.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedGroup("all")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex-shrink-0 ${
                selectedGroup === "all"
                  ? "bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/40"
                  : "text-white/45 border border-white/[0.07] hover:text-white/70 hover:border-white/15 bg-white/[0.02]"
              }`}
            >
              الكل
            </button>
            {groups.map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex-shrink-0 ${
                  selectedGroup === grp
                    ? "bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/40"
                    : "text-white/45 border border-white/[0.07] hover:text-white/70 hover:border-white/15 bg-white/[0.02]"
                }`}
              >
                المجموعة {grp}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center animate-fade-in-up">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-white/50 font-semibold text-xs">لم نجد أي فريق يطابق بحثك</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3.5 animate-fade-in-up">
          {filteredTeams.map((team) => {
            const groupName = teamGroups[team.id];
            return (
              <div
                key={team.id}
                onClick={() => setActiveTeam(team)}
                className="glass-card rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center hover-lift cursor-pointer group relative overflow-hidden min-h-[154px] md:min-h-0"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#C9971A]/0 to-[#C9971A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <TeamAvatar name={team.name} logoUrl={team.logoUrl} size="lg" />
                
                <h3 className="text-xs sm:text-sm font-black text-white/90 mt-3 md:mt-3.5 group-hover:text-[#F0C040] transition-colors duration-300 leading-snug">
                  {team.name}
                </h3>
                
                {groupName && (
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 md:mt-2.5"
                    style={{
                      background: "rgba(201,151,26,0.1)",
                      color: "#F0C040",
                      border: "1px solid rgba(201,151,26,0.25)"
                    }}
                  >
                    المجموعة {groupName}
                  </span>
                )}
                
                <span className="text-[10px] text-white/50 font-bold mt-1.5 md:mt-2">
                  {team.players.length} لاعب مسجل
                </span>

                <span className="hidden md:flex text-[9px] font-bold text-[#F0C040]/0 group-hover:text-[#F0C040]/100 transition-all duration-300 mt-2 items-center gap-1">
                  استعراض التشكيلة ←
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Squad Modal */}
      {activeTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300">
          <div className="absolute inset-0" onClick={() => setActiveTeam(null)} />
          
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh] z-10">
            {/* Close Button */}
            <button
              onClick={() => setActiveTeam(null)}
              className="absolute top-4 left-4 p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all duration-300 z-20 cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header: Focused on Squad list without redundant giant team name */}
            <div
              className="px-6 py-6 flex flex-col items-center text-center relative"
              style={{
                background: "linear-gradient(to bottom, rgba(201, 151, 26, 0.12), transparent)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
              }}
            >
              <TeamAvatar name={activeTeam.name} logoUrl={activeTeam.logoUrl} size="lg" />
              
              {/* Squad Title */}
              <h3 className="text-sm font-black text-white/90 mt-3.5">التشكيلة الرسمية للاعبين</h3>
              
              {/* Integrated Subtitle showing Team and Group */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black text-[#F0C040] bg-[#C9971A]/10 px-2 py-0.5 rounded-lg border border-[#C9971A]/20">
                  {activeTeam.name}
                </span>
                {teamGroups[activeTeam.id] && (
                  <span className="text-[10px] font-bold text-white/40">
                    المجموعة {teamGroups[activeTeam.id]}
                  </span>
                )}
                <span className="text-white/20">·</span>
                <span className="text-[10px] text-white/45 font-bold">
                  {activeTeam.players.length} لاعب
                </span>
              </div>
            </div>

            {/* Modal Body / Players List */}
            <div className="overflow-y-auto p-4 space-y-1 flex-1 max-h-[55vh] custom-scrollbar">
              {activeTeam.players.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-white/50 text-xs font-bold">لا يوجد لاعبون مسجلون في هذا الفريق بعد</p>
                </div>
              ) : (
                <>
                  {/* Table Column Headers */}
                  <div
                    className="px-3 py-2 grid text-[9px] font-black text-white/25 tracking-widest uppercase items-center"
                    style={{ gridTemplateColumns: "36px 1fr 60px 80px" }}
                  >
                    <span className="text-center">الرقم</span>
                    <span>الاسم</span>
                    <span className="text-center">الأهداف</span>
                    <span className="text-left pl-2">المركز</span>
                  </div>

                  {/* Player Rows */}
                  {activeTeam.players.map((player: TeamWithPlayers["players"][number], idx: number) => (
                    <div
                      key={player.id}
                      className="px-3 py-2 grid items-center hover:bg-white/[0.02] rounded-xl transition-colors duration-200"
                      style={{
                        gridTemplateColumns: "36px 1fr 60px 80px",
                        borderBottom: idx < activeTeam.players.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      }}
                    >
                      {/* Jersey Number */}
                      <div className="flex justify-center">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black score-number"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.55)",
                            border: "1px solid rgba(255,255,255,0.06)"
                          }}
                        >
                          {player.jerseyNumber ?? "—"}
                        </div>
                      </div>

                      {/* Name */}
                      <span className="text-xs font-bold text-white/85 pr-2 truncate">{cleanPlayerName(player.name)}</span>

                      {/* Goals Count Column */}
                      <div className="flex justify-center">
                        {(player.goalsCount ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] font-black text-green-400 score-number">
                            ⚽ {player.goalsCount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/10 font-bold">—</span>
                        )}
                      </div>

                      {/* Position */}
                      <div className="flex justify-end">
                        {player.position ? (
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              color: getPositionColor(player.position),
                              background: `${getPositionColor(player.position).replace("0.9", "0.12")}`,
                              border: `1px solid ${getPositionColor(player.position).replace("0.9", "0.25")}`,
                            }}
                          >
                            {getPositionLabel(player.position)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/15 pl-4 font-bold">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Tab 3: Top Scorers ───────────────────────────────────────────────────────

function TopScorersTab({ data }: { data: StandingsData }) {
  const scorers = data.topScorers;

  if (scorers.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <div className="text-3xl mb-3">⚽</div>
        <p className="text-white/50 font-semibold text-sm">لا توجد إحصائيات هدافين بعد</p>
      </div>
    );
  }

  const podiumColors = [
    { bg: "linear-gradient(135deg, rgba(201,151,26,0.18) 0%, rgba(201,151,26,0.05) 100%)", border: "rgba(201,151,26,0.6)", text: "#F0C040", label: "🥇", heightClass: "py-7 sm:py-9 scale-105 z-10 border-2" },
    { bg: "linear-gradient(135deg, rgba(148,163,184,0.12) 0%, rgba(148,163,184,0.03) 100%)", border: "rgba(148,163,184,0.4)", text: "#94a3b8", label: "🥈", heightClass: "py-5 sm:py-6 mt-4 border" },
    { bg: "linear-gradient(135deg, rgba(180,100,40,0.12) 0%, rgba(180,100,40,0.03) 100%)", border: "rgba(180,100,40,0.4)", text: "#b47030", label: "🥉", heightClass: "py-4 sm:py-5 mt-6 border" },
  ];

  return (
    <div className="space-y-5">
      {/* Dynamic Podium for Top 3 */}
      {scorers.length >= 3 && (
        <div className="grid grid-cols-3 gap-2.5 items-end px-1.5 py-4 animate-fade-in-up relative">
          {[1, 0, 2].map((realIdx) => {
            const scorer = scorers[realIdx];
            if (!scorer) return null;
            const config = podiumColors[realIdx];
            return (
              <div
                key={scorer.playerId}
                className={`flex flex-col items-center gap-2 rounded-2xl text-center relative transition-all duration-300 ${config.heightClass}`}
                style={{ background: config.bg, borderColor: config.border }}
              >
                {/* Crown glow for 1st place */}
                {realIdx === 0 && (
                  <div className="absolute -top-4 w-10 h-10 bg-[#C9971A]/30 blur-xl rounded-full pointer-events-none" />
                )}
                
                <span className="text-2xl leading-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">{config.label}</span>
                
                <TeamAvatar name={scorer.teamName} logoUrl={scorer.logoUrl} size="sm" />
                
                <div className="min-w-0 px-1 mt-0.5">
                  <p className="text-[11px] font-black text-white/90 truncate max-w-full leading-tight">
                    {cleanPlayerName(scorer.playerName)}
                  </p>
                  <p className="text-[10px] text-white/55 font-bold truncate max-w-full mt-0.5">
                    {scorer.teamName}
                  </p>
                </div>
                
                <div
                  className="font-black score-number text-center mt-1.5 flex items-baseline gap-0.5"
                  style={{ color: config.text }}
                >
                  <span className="text-xl sm:text-2xl">{scorer.goals}</span>
                  <span className="text-[10px] font-bold text-white/50">أهداف</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scorers List */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        {/* Header */}
        <div className="grid grid-cols-[32px_1fr_48px] px-3 py-3 text-[9px] font-black text-white/25 tracking-widest uppercase items-center md:grid-cols-[36px_1fr_140px_60px] md:px-4 [&>span:nth-child(3)]:hidden md:[&>span:nth-child(3)]:block">
          <span className="text-center">الترتيب</span>
          <span>اللاعب</span>
          <span>الفريق</span>
          <span className="text-center">الأهداف</span>
        </div>

        {scorers.map((scorer, idx) => {
          const isTop3 = idx < 3;
          const config = podiumColors[idx] ?? { text: "rgba(255,255,255,0.65)" };

          return (
            <div
              key={scorer.playerId}
              className="grid grid-cols-[32px_1fr_48px] items-center px-3 py-3.5 hover:bg-white/[0.02] transition-colors duration-200 md:grid-cols-[36px_1fr_140px_60px] md:px-4"
              style={{
                borderBottom: idx < scorers.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}
            >
              {/* Rank */}
              <div className="flex justify-center">
                {isTop3 ? (
                  <span className="text-lg leading-none">{config.label}</span>
                ) : (
                  <span className="text-xs font-black text-white/45 score-number">
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Player Name */}
              <div className="min-w-0 pr-2 [&>p:last-child]:hidden md:[&>p:last-child]:block">
                <p className="text-xs font-bold text-white/90 truncate">{cleanPlayerName(scorer.playerName)}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-0.5 truncate md:hidden">{scorer.teamName}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-0.5">لاعب مسجل</p>
              </div>

              {/* Team Info */}
              <div className="hidden items-center gap-2 min-w-0 md:flex">
                <TeamAvatar name={scorer.teamName} logoUrl={scorer.logoUrl} size="sm" />
                <span className="text-xs font-bold text-white/80 truncate">{scorer.teamName}</span>
              </div>

              {/* Goals count */}
              <div className="flex items-center justify-center">
                <span
                  className="text-sm font-black score-number px-2.5 py-1 rounded-lg"
                  style={{
                    color: isTop3 ? config.text : "rgba(255,255,255,0.85)",
                    background: isTop3 ? `${config.border.replace("0.6", "0.08").replace("0.4", "0.05")}` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isTop3 ? config.border.replace("0.6", "0.15").replace("0.4", "0.1") : "rgba(255,255,255,0.05)"}`
                  }}
                >
                  {scorer.goals}
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
        className="mb-5 grid grid-cols-3 gap-1.5 rounded-2xl p-1.5 animate-fade-in-up md:mb-6 md:flex md:gap-2"
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
      {activeTab === "teams" && <TeamsTab teams={data.teams} standings={data.standings} />}
      {activeTab === "scorers" && <TopScorersTab data={data} />}
    </div>
  );
}
