import { prisma } from "@/core/lib/prisma";
import StandingsClient from "./StandingsClient";

export type TeamStanding = {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  groupName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type KnockoutMatch = {
  id: string;
  stage: string;
  homeTeam: { id: string; name: string; logoUrl: string | null };
  awayTeam: { id: string; name: string; logoUrl: string | null };
  homeScore: number | null;
  awayScore: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
  status: string;
};

export type TeamWithPlayers = {
  id: string;
  name: string;
  logoUrl: string | null;
  players: {
    id: string;
    name: string;
    jerseyNumber: number | null;
    position: string | null;
  }[];
};

export type TopScorer = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  goals: number;
};

export type StandingsData = {
  standings: Record<string, TeamStanding[]>;
  knockoutMatches: KnockoutMatch[];
  teams: TeamWithPlayers[];
  topScorers: TopScorer[];
};

// --- Mock Data ---

const MOCK_DATA: StandingsData = {
  standings: {
    A: [
      { teamId: "t1", teamName: "فرسان نجد", logoUrl: null, groupName: "A", played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 7, goalsAgainst: 2, goalDiff: 5, points: 7 },
      { teamId: "t2", teamName: "صقور الرياض", logoUrl: null, groupName: "A", played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 4, goalsAgainst: 4, goalDiff: 0, points: 4 },
      { teamId: "t5", teamName: "عميد الغربية", logoUrl: null, groupName: "A", played: 3, won: 0, drawn: 1, lost: 2, goalsFor: 2, goalsAgainst: 7, goalDiff: -5, points: 1 },
    ],
    B: [
      { teamId: "t3", teamName: "زعيم الجنوب", logoUrl: null, groupName: "B", played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 9, goalsAgainst: 1, goalDiff: 8, points: 9 },
      { teamId: "t4", teamName: "نجوم المدينة", logoUrl: null, groupName: "B", played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 3, goalsAgainst: 5, goalDiff: -2, points: 4 },
      { teamId: "t6", teamName: "أسود الشرقية", logoUrl: null, groupName: "B", played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 7, goalDiff: -6, points: 0 },
    ],
  },
  knockoutMatches: [
    { id: "km1", stage: "semi", homeTeam: { id: "t1", name: "فرسان نجد", logoUrl: null }, awayTeam: { id: "t3", name: "زعيم الجنوب", logoUrl: null }, homeScore: null, awayScore: null, homePenalty: null, awayPenalty: null, status: "scheduled" },
    { id: "km2", stage: "semi", homeTeam: { id: "t2", name: "صقور الرياض", logoUrl: null }, awayTeam: { id: "t4", name: "نجوم المدينة", logoUrl: null }, homeScore: 2, awayScore: 0, homePenalty: null, awayPenalty: null, status: "finished" },
    { id: "km3", stage: "final", homeTeam: { id: "t2", name: "صقور الرياض", logoUrl: null }, awayTeam: { id: "t1", name: "فرسان نجد", logoUrl: null }, homeScore: null, awayScore: null, homePenalty: null, awayPenalty: null, status: "scheduled" },
  ],
  teams: [
    { id: "t1", name: "فرسان نجد", logoUrl: null, players: [{ id: "p1", name: "عبدالله القحطاني", jerseyNumber: 1, position: "goalkeeper" }, { id: "p2", name: "محمد السهلاوي", jerseyNumber: 9, position: "forward" }, { id: "p3", name: "نايف هزازي", jerseyNumber: 5, position: "defender" }, { id: "p4", name: "سلطان الغامدي", jerseyNumber: 8, position: "midfielder" }] },
    { id: "t2", name: "صقور الرياض", logoUrl: null, players: [{ id: "p5", name: "فراس البريكان", jerseyNumber: 1, position: "goalkeeper" }, { id: "p6", name: "ياسر القحطاني", jerseyNumber: 10, position: "forward" }, { id: "p7", name: "علي الشهراني", jerseyNumber: 3, position: "defender" }, { id: "p8", name: "تيسير الجاسم", jerseyNumber: 7, position: "midfielder" }] },
    { id: "t3", name: "زعيم الجنوب", logoUrl: null, players: [{ id: "p9", name: "خالد المولد", jerseyNumber: 1, position: "goalkeeper" }, { id: "p10", name: "يوسف السالم", jerseyNumber: 11, position: "forward" }, { id: "p11", name: "بدر الدين", jerseyNumber: 4, position: "defender" }, { id: "p12", name: "وليد عزيز", jerseyNumber: 6, position: "midfielder" }] },
    { id: "t4", name: "نجوم المدينة", logoUrl: null, players: [{ id: "p13", name: "أحمد الدوسري", jerseyNumber: 1, position: "goalkeeper" }, { id: "p14", name: "سالم الدوسري", jerseyNumber: 10, position: "forward" }, { id: "p15", name: "فهد المطيري", jerseyNumber: 2, position: "defender" }] },
    { id: "t5", name: "عميد الغربية", logoUrl: null, players: [{ id: "p16", name: "إبراهيم الصقر", jerseyNumber: 1, position: "goalkeeper" }, { id: "p17", name: "وليد عبدالله", jerseyNumber: 9, position: "forward" }, { id: "p18", name: "رائد العمري", jerseyNumber: 6, position: "midfielder" }] },
    { id: "t6", name: "أسود الشرقية", logoUrl: null, players: [{ id: "p19", name: "منصور الخالدي", jerseyNumber: 1, position: "goalkeeper" }, { id: "p20", name: "عمر الحربي", jerseyNumber: 10, position: "forward" }] },
  ],
  topScorers: [
    { playerId: "p10", playerName: "يوسف السالم", teamId: "t3", teamName: "زعيم الجنوب", logoUrl: null, goals: 5 },
    { playerId: "p6", playerName: "ياسر القحطاني", teamId: "t2", teamName: "صقور الرياض", logoUrl: null, goals: 4 },
    { playerId: "p2", playerName: "محمد السهلاوي", teamId: "t1", teamName: "فرسان نجد", logoUrl: null, goals: 3 },
    { playerId: "p17", playerName: "وليد عبدالله", teamId: "t5", teamName: "عميد الغربية", logoUrl: null, goals: 2 },
    { playerId: "p14", playerName: "سالم الدوسري", teamId: "t4", teamName: "نجوم المدينة", logoUrl: null, goals: 2 },
    { playerId: "p8", playerName: "تيسير الجاسم", teamId: "t2", teamName: "صقور الرياض", logoUrl: null, goals: 1 },
    { playerId: "p20", playerName: "عمر الحربي", teamId: "t6", teamName: "أسود الشرقية", logoUrl: null, goals: 1 },
  ],
};

// --- Data Fetching ---

async function getStandingsData(): Promise<StandingsData> {
  try {
    const groupMatches = await prisma.match.findMany({
      where: { stage: "group", status: { in: ["finished", "live"] } },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    const standingsMap: Record<string, Record<string, TeamStanding>> = {};

    const ensureTeam = (groupName: string, team: { id: string; name: string; logoUrl: string | null }) => {
      if (!standingsMap[groupName]) standingsMap[groupName] = {};
      if (!standingsMap[groupName][team.id]) {
        standingsMap[groupName][team.id] = {
          teamId: team.id, teamName: team.name, logoUrl: team.logoUrl, groupName,
          played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
        };
      }
    };

    for (const m of groupMatches) {
      if (!m.groupName) continue;
      ensureTeam(m.groupName, m.homeTeam);
      ensureTeam(m.groupName, m.awayTeam);
      const hs = m.homeScore ?? 0;
      const as_ = m.awayScore ?? 0;
      const hr = standingsMap[m.groupName][m.homeTeamId];
      const ar = standingsMap[m.groupName][m.awayTeamId];
      hr.played++; ar.played++;
      hr.goalsFor += hs; hr.goalsAgainst += as_;
      ar.goalsFor += as_; ar.goalsAgainst += hs;
      if (hs > as_) { hr.won++; ar.lost++; hr.points += 3; }
      else if (hs < as_) { ar.won++; hr.lost++; ar.points += 3; }
      else { hr.drawn++; ar.drawn++; hr.points++; ar.points++; }
    }

    const standings: Record<string, TeamStanding[]> = {};
    for (const [group, teams] of Object.entries(standingsMap)) {
      const rows = Object.values(teams).map((r) => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }));
      rows.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
      standings[group] = rows;
    }

    if (Object.keys(standings).length === 0) Object.assign(standings, MOCK_DATA.standings);

    const knockoutRaw = await prisma.match.findMany({
      where: { stage: { notIn: ["group"] } },
      orderBy: { matchDate: "asc" },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    const knockoutMatches: KnockoutMatch[] = knockoutRaw.length > 0
      ? knockoutRaw.map((m) => ({ id: m.id, stage: m.stage, homeTeam: m.homeTeam, awayTeam: m.awayTeam, homeScore: m.homeScore, awayScore: m.awayScore, homePenalty: m.homePenalty, awayPenalty: m.awayPenalty, status: m.status }))
      : MOCK_DATA.knockoutMatches;

    const teamsRaw = await prisma.team.findMany({
      orderBy: { name: "asc" },
      include: {
        players: { select: { id: true, name: true, jerseyNumber: true, position: true }, orderBy: { jerseyNumber: "asc" } },
      },
    });

    const teams: TeamWithPlayers[] = teamsRaw.length > 0 ? teamsRaw : MOCK_DATA.teams;

    const playersRaw = await prisma.player.findMany({
      where: { goalsCount: { gt: 0 } },
      orderBy: { goalsCount: "desc" },
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
    });

    const topScorers: TopScorer[] = playersRaw.length > 0
      ? playersRaw.map((p) => ({ playerId: p.id, playerName: p.name, teamId: p.team.id, teamName: p.team.name, logoUrl: p.team.logoUrl, goals: p.goalsCount }))
      : MOCK_DATA.topScorers;

    return { standings, knockoutMatches, teams, topScorers };
  } catch {
    return MOCK_DATA;
  }
}

export const metadata = {
  title: "المنافسات والأرقام | League Stars",
  description: "جدول ترتيب المجموعات، الأدوار الإقصائية، دليل الفرق واللاعبين، وقائمة الهدافين.",
};

export default async function StandingsPage() {
  const data = await getStandingsData();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <span className="section-accent-line" />
          <h1 className="text-2xl sm:text-3xl font-black text-gold-gradient tracking-tight">
            المنافسات والأرقام
          </h1>
        </div>
        <p className="text-white/40 text-sm font-medium pr-6">
          مسار البطولة · الفرق والتشكيلات · لائحة الهدافين
        </p>
      </div>
      <StandingsClient data={data} />
    </div>
  );
}
