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
    goalsCount?: number;
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

    const ensureTeam = (
      groupName: string,
      team: { id: string; name: string; logoUrl: string | null }
    ) => {
      if (!standingsMap[groupName]) standingsMap[groupName] = {};
      if (!standingsMap[groupName][team.id]) {
        standingsMap[groupName][team.id] = {
          teamId: team.id,
          teamName: team.name,
          logoUrl: team.logoUrl,
          groupName,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDiff: 0,
          points: 0,
        };
      }
    };

    for (const match of groupMatches) {
      if (!match.groupName) continue;

      ensureTeam(match.groupName, match.homeTeam);
      ensureTeam(match.groupName, match.awayTeam);

      const homeScore = match.homeScore ?? 0;
      const awayScore = match.awayScore ?? 0;
      const homeRow = standingsMap[match.groupName][match.homeTeamId];
      const awayRow = standingsMap[match.groupName][match.awayTeamId];

      homeRow.played += 1;
      awayRow.played += 1;
      homeRow.goalsFor += homeScore;
      homeRow.goalsAgainst += awayScore;
      awayRow.goalsFor += awayScore;
      awayRow.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        homeRow.won += 1;
        awayRow.lost += 1;
        homeRow.points += 3;
      } else if (homeScore < awayScore) {
        awayRow.won += 1;
        homeRow.lost += 1;
        awayRow.points += 3;
      } else {
        homeRow.drawn += 1;
        awayRow.drawn += 1;
        homeRow.points += 1;
        awayRow.points += 1;
      }
    }

    const standings: Record<string, TeamStanding[]> = {};
    for (const [groupName, rowsByTeam] of Object.entries(standingsMap)) {
      const rows = Object.values(rowsByTeam).map((row) => ({
        ...row,
        goalDiff: row.goalsFor - row.goalsAgainst,
      }));

      rows.sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDiff - a.goalDiff ||
          b.goalsFor - a.goalsFor
      );

      standings[groupName] = rows;
    }

    const knockoutRaw = await prisma.match.findMany({
      where: { stage: { notIn: ["group"] } },
      orderBy: { matchDate: "asc" },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    const knockoutMatches: KnockoutMatch[] = knockoutRaw.map((match) => ({
      id: match.id,
      stage: match.stage,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homePenalty: match.homePenalty,
      awayPenalty: match.awayPenalty,
      status: match.status,
    }));

    const teams = await prisma.team.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      include: {
        players: {
          select: {
            id: true,
            name: true,
            jerseyNumber: true,
            position: true,
            goalsCount: true,
          },
          orderBy: { jerseyNumber: "asc" },
        },
      },
    });

    const playersRaw = await prisma.player.findMany({
      where: { goalsCount: { gt: 0 }, team: { archivedAt: null } },
      orderBy: { goalsCount: "desc" },
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
    });

    const topScorers: TopScorer[] = playersRaw.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      teamId: player.team.id,
      teamName: player.team.name,
      logoUrl: player.team.logoUrl,
      goals: player.goalsCount,
    }));

    return { standings, knockoutMatches, teams, topScorers };
  } catch {
    return { standings: {}, knockoutMatches: [], teams: [], topScorers: [] };
  }
}

export const metadata = {
  title: "المنافسات والأرقام | League Stars",
  description: "جدول ترتيب المجموعات، الأدوار الإقصائية، دليل الفرق واللاعبين، وقائمة الهدافين.",
};

export default async function StandingsPage() {
  const data = await getStandingsData();

  return (
    <div className="max-w-2xl mx-auto pb-20 md:max-w-none md:pb-0">
      <div className="mb-5 md:mb-8 animate-fade-in-up">
        <div className="flex items-center gap-2.5 md:gap-3 mb-1.5 md:mb-2">
          <span className="section-accent-line" />
          <h1 className="text-xl sm:text-3xl font-black text-gold-gradient tracking-tight">
            المنافسات والأرقام
          </h1>
        </div>
        <p className="text-white/55 text-xs sm:text-sm font-medium pr-5 md:pr-6 leading-5">
          مسار البطولة · الفرق والتشكيلات · لائحة الهدافين
        </p>
      </div>
      <StandingsClient data={data} />
    </div>
  );
}
