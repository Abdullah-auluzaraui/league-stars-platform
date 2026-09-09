import { Suspense } from "react";
import { prisma } from "@/core/lib/prisma";
import StandingsClient from "./StandingsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export type TournamentData = {
  id: string;
  name: string;
  type: string;
  status: string;
  standings: Record<string, TeamStanding[]>;
  knockoutMatches: KnockoutMatch[];
  champion: {
    name: string;
    logoUrl: string | null;
    runnerUpName: string;
    score: string;
  } | null;
};

export type StandingsData = {
  tournaments: TournamentData[];
  standings: Record<string, TeamStanding[]>;
  knockoutMatches: KnockoutMatch[];
  teams: TeamWithPlayers[];
  topScorers: TopScorer[];
};

async function getStandingsData(): Promise<StandingsData> {
  try {
    const [tournamentsRaw, groupMatches, knockoutRaw, teams, playersRaw] = await Promise.all([
      prisma.tournament.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, type: true, status: true },
      }),
      prisma.match.findMany({
        where: { stage: "group", status: { in: ["finished", "live"] } },
        include: {
          homeTeam: { select: { id: true, name: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true } },
        },
      }),
      prisma.match.findMany({
        where: { stage: { notIn: ["group"] } },
        orderBy: { matchDate: "asc" },
        include: {
          homeTeam: { select: { id: true, name: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true } },
        },
      }),
      prisma.team.findMany({
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
      }),
      prisma.player.findMany({
        where: { goalsCount: { gt: 0 }, team: { archivedAt: null } },
        orderBy: { goalsCount: "desc" },
        include: { team: { select: { id: true, name: true, logoUrl: true } } },
      }),
    ]);

    // Sort tournaments: active first, then completed, then others
    const sortedTournaments = [...tournamentsRaw].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return 0;
    });

    const tournaments: TournamentData[] = sortedTournaments.map((t) => {
      const tGroupMatches = groupMatches.filter((m) => m.tournamentId === t.id);
      const tKnockoutMatches = knockoutRaw.filter((m) => m.tournamentId === t.id);

      // Compute group standings for this tournament
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

      for (const match of tGroupMatches) {
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

      const knockoutMatches: KnockoutMatch[] = tKnockoutMatches.map((m) => ({
        id: m.id,
        stage: m.stage,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homePenalty: m.homePenalty,
        awayPenalty: m.awayPenalty,
        status: m.status,
      }));

      // Calculate champion if final match completed
      const finalMatch = tKnockoutMatches.find(
        (m) => m.stage === "final" && m.status === "finished"
      );
      let champion = null;
      if (finalMatch) {
        const homeScore = finalMatch.homeScore ?? 0;
        const awayScore = finalMatch.awayScore ?? 0;
        const homePen = finalMatch.homePenalty ?? 0;
        const awayPen = finalMatch.awayPenalty ?? 0;
        const homeWon =
          homeScore > awayScore ||
          (homeScore === awayScore && homePen > awayPen);
        const winner = homeWon ? finalMatch.homeTeam : finalMatch.awayTeam;
        const runnerUp = homeWon ? finalMatch.awayTeam : finalMatch.homeTeam;
        champion = {
          name: winner.name,
          logoUrl: winner.logoUrl,
          runnerUpName: runnerUp.name,
          score: `${homeScore} - ${awayScore}${
            finalMatch.homePenalty !== null ? ` (${homePen} - ${awayPen} ركلات)` : ""
          }`,
        };
      }

      return {
        id: t.id,
        name: t.name,
        type: t.type,
        status: t.status,
        standings,
        knockoutMatches,
        champion,
      };
    });

    const activeTournament =
      tournaments.find((t) => t.status === "active") || tournaments[0];

    const topScorers: TopScorer[] = playersRaw.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      teamId: player.team.id,
      teamName: player.team.name,
      logoUrl: player.team.logoUrl,
      goals: player.goalsCount,
    }));

    return {
      tournaments,
      standings: activeTournament ? activeTournament.standings : {},
      knockoutMatches: activeTournament ? activeTournament.knockoutMatches : [],
      teams,
      topScorers,
    };
  } catch (error) {
    console.error("Failed to load standings data", error);
    return {
      tournaments: [],
      standings: {},
      knockoutMatches: [],
      teams: [],
      topScorers: [],
    };
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
      <Suspense fallback={<div className="p-8 text-center text-white/40">جاري تحميل البيانات...</div>}>
        <StandingsClient data={data} />
      </Suspense>
    </div>
  );
}
