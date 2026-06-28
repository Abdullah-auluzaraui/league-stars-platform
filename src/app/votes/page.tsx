import { prisma } from "@/core/lib/prisma";
import VotesClient from "./VotesClient";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ACTIVE: VotingPageData = {
  state: "active",
  goals: [
    {
      id: "g1",
      playerName: "محمد السهلاوي",
      teamName: "فرسان نجد",
      teamLogoUrl: null,
      videoUrl: null,
      minute: 23,
      type: "normal",
      voteCount: 0,
    },
    {
      id: "g2",
      playerName: "ياسر القحطاني",
      teamName: "صقور الرياض",
      teamLogoUrl: null,
      videoUrl: null,
      minute: 67,
      type: "free_kick",
      voteCount: 0,
    },
    {
      id: "g3",
      playerName: "يوسف السالم",
      teamName: "زعيم الجنوب",
      teamLogoUrl: null,
      videoUrl: null,
      minute: 45,
      type: "penalty",
      voteCount: 0,
    },
  ],
};

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getVotingData(): Promise<VotingPageData> {
  try {
    // Check for active nominated goals (current voting session)
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
      // Active voting session
      const goals: NominatedGoal[] = nominatedGoals.map((g) => ({
        id: g.id,
        playerName: g.player.name,
        teamName: g.team.name,
        teamLogoUrl: g.team.logoUrl,
        videoUrl: g.videoUrl,
        minute: g.minute,
        type: g.type,
        voteCount: g.votes.length,
      }));
      return { state: "active", goals };
    }

    // No active session — check for past winners (archived goals with votes)
    // We treat goals with votes but not currently nominated as archive
    const pastWinners = await prisma.goal.findMany({
      where: {
        isNominated: false,
        votes: { some: {} },
      },
      include: {
        player: { select: { name: true } },
        team: { select: { name: true, logoUrl: true } },
        votes: { select: { id: true } },
        match: {
          select: {
            stage: true,
            groupName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (pastWinners.length > 0) {
      const winners: ArchivedWinner[] = pastWinners.map((g, idx) => ({
        id: g.id,
        roundLabel: `الجولة ${idx + 1}`,
        playerName: g.player.name,
        teamName: g.team.name,
        teamLogoUrl: g.team.logoUrl,
        videoUrl: g.videoUrl,
        totalVotes: g.votes.length,
      }));
      return { state: "archive", winners };
    }

    // No data at all — use mock active for demo purposes
    return MOCK_ACTIVE;
  } catch {
    return MOCK_ACTIVE;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata = {
  title: "هدف الجولة | League Stars",
  description: "صوّت لأفضل هدف في الجولة وشاهد معرض الأهداف الفائزة بالجولات السابقة.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VotesPage() {
  const data = await getVotingData();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
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
