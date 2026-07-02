import { prisma } from "@/core/lib/prisma";
import VotesClient from "./VotesClient";

export type NominatedGoal = {
  id: string; // votingRoundGoalId
  goalId: string;
  playerName: string;
  teamName: string;
  teamLogoUrl: string | null;
  videoUrl: string | null;
  minute: number;
  type: string;
  voteCount: number;
};

export type ArchivedWinner = {
  id: string; // roundId
  roundLabel: string;
  playerName: string;
  teamName: string;
  teamLogoUrl: string | null;
  videoUrl: string | null;
  totalVotes: number;
};

export type VotingPageData =
  | { state: "empty" }
  | { state: "active"; roundTitle: string; showResultsMode: string; goals: NominatedGoal[] }
  | { state: "archive"; winners: ArchivedWinner[] };

async function getVotingData(): Promise<VotingPageData> {
  try {
    // 1. جلب الجولة النشطة حالياً
    const activeRound = await prisma.votingRound.findFirst({
      where: { status: "active" },
      include: {
        goals: {
          include: {
            goal: {
              include: {
                player: { select: { name: true } },
                team: { select: { name: true, logoUrl: true } },
              },
            },
            votes: { select: { id: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (activeRound) {
      const goals: NominatedGoal[] = activeRound.goals.map((rg) => ({
        id: rg.id, // معرف ربط الهدف بالجولة المستخدم للتصويت
        goalId: rg.goalId,
        playerName: rg.goal.player.name,
        teamName: rg.goal.team.name,
        teamLogoUrl: rg.goal.team.logoUrl,
        videoUrl: rg.videoUrl || rg.goal.videoUrl,
        minute: rg.goal.minute,
        type: rg.goal.type,
        voteCount: rg.votes.length,
      }));

      return {
        state: "active",
        roundTitle: activeRound.title,
        showResultsMode: activeRound.showResultsMode,
        goals,
      };
    }

    // 2. إذا لم تكن هناك جولة نشطة، نجلب الفائزين من الأرشيف
    const archivedRounds = await prisma.votingRound.findMany({
      where: { status: "archived" },
      include: {
        goals: {
          include: {
            goal: {
              include: {
                player: { select: { name: true } },
                team: { select: { name: true, logoUrl: true } },
              },
            },
            votes: { select: { id: true } },
          },
        },
      },
      orderBy: { closedAt: "desc" },
    });

    const winners: ArchivedWinner[] = archivedRounds
      .map((round) => {
        const winnerGoalObj = round.goals.find((rg) => rg.goalId === round.winnerGoalId);
        if (!winnerGoalObj) return null;

        return {
          id: round.id,
          roundLabel: round.title,
          playerName: winnerGoalObj.goal.player.name,
          teamName: winnerGoalObj.goal.team.name,
          teamLogoUrl: winnerGoalObj.goal.team.logoUrl,
          videoUrl: winnerGoalObj.videoUrl || winnerGoalObj.goal.videoUrl,
          totalVotes: winnerGoalObj.votes.length,
        };
      })
      .filter(Boolean) as ArchivedWinner[];

    if (winners.length > 0) {
      return { state: "archive", winners };
    }

    return { state: "empty" };
  } catch (error) {
    console.error("Error fetching voting data:", error);
    return { state: "empty" };
  }
}

export const metadata = {
  title: "هدف الجولة | League Stars",
  description: "صوّت لأفضل هدف في الجولة وشاهد معرض الأهداف الفائزة بالجولات السابقة.",
};

export default async function VotesPage() {
  const data = await getVotingData();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <span className="section-accent-line" />
          <h1 className="text-2xl sm:text-3xl font-black text-gold-gradient tracking-tight">
            {data.state === "archive" ? "معرض الأهداف" : "هدف الجولة"}
          </h1>
        </div>
        <p className="text-white/40 text-sm font-medium pr-6">
          {data.state === "empty" && "في انتظار انطلاق المنافسات وترشيح الأهداف"}
          {data.state === "active" && `صوّت للهدف الأجمل في الجولة الحالية (${data.roundTitle})`}
          {data.state === "archive" && "سجل الأهداف الفائزة بجولات البطولة"}
        </p>
      </div>

      <VotesClient data={data} />
    </div>
  );
}
