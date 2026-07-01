import { prisma } from "@/core/lib/prisma";
import VotesClient from "./VotesClient";

export type NominatedGoal = {
  id: string;
  playerName: string;
  teamName: string;
  teamLogoUrl: string | null;
  videoUrl: string | null;
  minute: number;
  type: string;
  voteCount: number;
};

export type ArchivedWinner = {
  id: string;
  roundLabel: string;
  playerName: string;
  teamName: string;
  teamLogoUrl: string | null;
  videoUrl: string | null;
  totalVotes: number;
};

export type VotingPageData =
  | { state: "empty" }
  | { state: "active"; goals: NominatedGoal[] }
  | { state: "archive"; winners: ArchivedWinner[] };

async function getVotingData(): Promise<VotingPageData> {
  try {
    const nominatedGoals = await prisma.goal.findMany({
      where: { isNominated: true },
      include: {
        player: { select: { name: true } },
        team: { select: { name: true, logoUrl: true } },
        votes: { select: { id: true } },
      },
      orderBy: { minute: "asc" },
    });

    if (nominatedGoals.length > 0) {
      const goals: NominatedGoal[] = nominatedGoals.map((goal) => ({
        id: goal.id,
        playerName: goal.player.name,
        teamName: goal.team.name,
        teamLogoUrl: goal.team.logoUrl,
        videoUrl: goal.videoUrl,
        minute: goal.minute,
        type: goal.type,
        voteCount: goal.votes.length,
      }));

      return { state: "active", goals };
    }

    const pastWinners = await prisma.goal.findMany({
      where: {
        isNominated: false,
        votes: { some: {} },
      },
      include: {
        player: { select: { name: true } },
        team: { select: { name: true, logoUrl: true } },
        votes: { select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (pastWinners.length > 0) {
      const winners: ArchivedWinner[] = pastWinners.map((goal, index) => ({
        id: goal.id,
        roundLabel: `الجولة ${index + 1}`,
        playerName: goal.player.name,
        teamName: goal.team.name,
        teamLogoUrl: goal.team.logoUrl,
        videoUrl: goal.videoUrl,
        totalVotes: goal.votes.length,
      }));

      return { state: "archive", winners };
    }

    return { state: "empty" };
  } catch {
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
          {data.state === "active" && "صوّت للهدف الأجمل في الجولة الحالية"}
          {data.state === "archive" && "سجل الأهداف الفائزة بجولات البطولة"}
        </p>
      </div>

      <VotesClient data={data} />
    </div>
  );
}
