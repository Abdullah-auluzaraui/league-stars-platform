import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goalId, fingerprint } = body;

    if (!goalId || !fingerprint) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Get visitor IP
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const visitorIp = forwarded
      ? forwarded.split(",")[0].trim()
      : headersList.get("x-real-ip") ?? "unknown";

    // Check if this fingerprint already voted for this goal
    const existingVote = await prisma.goalVote.findUnique({
      where: { goalId_fingerprint: { goalId, fingerprint } },
    });

    if (existingVote) {
      return NextResponse.json({ error: "already_voted" }, { status: 409 });
    }

    // Also check if this fingerprint voted for ANY nominated goal in current session
    // (one vote per session policy)
    const activeGoals = await prisma.goal.findMany({
      where: { isNominated: true },
      select: { id: true },
    });

    const activeGoalIds = activeGoals.map((g) => g.id);

    if (activeGoalIds.length > 0) {
      const previousVote = await prisma.goalVote.findFirst({
        where: {
          fingerprint,
          goalId: { in: activeGoalIds },
        },
      });

      if (previousVote) {
        return NextResponse.json({ error: "already_voted_session" }, { status: 409 });
      }
    }

    // Cast the vote
    await prisma.goalVote.create({
      data: { goalId, visitorIp, fingerprint },
    });

    // Return updated vote counts
    const goalVotes = await prisma.goalVote.groupBy({
      by: ["goalId"],
      where: { goalId: { in: activeGoalIds } },
      _count: { id: true },
    });

    const voteCounts: Record<string, number> = {};
    for (const v of goalVotes) {
      voteCounts[v.goalId] = v._count.id;
    }

    return NextResponse.json({ success: true, voteCounts, votedGoalId: goalId });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
