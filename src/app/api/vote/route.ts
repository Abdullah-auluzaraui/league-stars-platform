import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { votingRoundGoalId, fingerprint } = body;

    if (!votingRoundGoalId || !fingerprint) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // الحصول على عنوان IP للزائر
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const visitorIp = forwarded
      ? forwarded.split(",")[0].trim()
      : headersList.get("x-real-ip") ?? "unknown";

    // 1. التحقق من صحة الهدف وجلب معرف الجولة المرتبطة به
    const currentRoundGoal = await prisma.votingRoundGoal.findUnique({
      where: { id: votingRoundGoalId },
      select: { roundId: true },
    });

    if (!currentRoundGoal) {
      return NextResponse.json({ error: "invalid_goal" }, { status: 400 });
    }

    const roundId = currentRoundGoal.roundId;

    // 2. التحقق مما إذا كان هذا الزائر قد صوت بالفعل لهذا الهدف في هذه الجولة
    const existingVote = await prisma.goalVote.findUnique({
      where: { votingRoundGoalId_fingerprint: { votingRoundGoalId, fingerprint } },
    });

    if (existingVote) {
      return NextResponse.json({ error: "already_voted" }, { status: 409 });
    }

    // 3. جلب كل الأهداف المرشحة في هذه الجولة لمنع التصويت المتعدد في الجولة نفسها
    const roundGoals = await prisma.votingRoundGoal.findMany({
      where: { roundId },
      select: { id: true },
    });

    const roundGoalIds = roundGoals.map((rg) => rg.id);

    if (roundGoalIds.length > 0) {
      const previousVote = await prisma.goalVote.findFirst({
        where: {
          fingerprint,
          votingRoundGoalId: { in: roundGoalIds },
        },
      });

      if (previousVote) {
        return NextResponse.json({ error: "already_voted_session" }, { status: 409 });
      }
    }

    // 4. تسجيل الصوت
    await prisma.goalVote.create({
      data: {
        votingRoundGoalId,
        visitorIp,
        fingerprint,
      },
    });

    // 5. جلب إجمالي الأصوات المحدثة لأهداف الجولة
    const roundGoalVotes = await prisma.goalVote.groupBy({
      by: ["votingRoundGoalId"],
      where: { votingRoundGoalId: { in: roundGoalIds } },
      _count: { id: true },
    });

    const voteCounts: Record<string, number> = {};
    // تهيئة جميع الأهداف بصفر أصوات كقيمة افتراضية
    for (const rg of roundGoals) {
      voteCounts[rg.id] = 0;
    }
    for (const v of roundGoalVotes) {
      voteCounts[v.votingRoundGoalId] = v._count.id;
    }

    return NextResponse.json({
      success: true,
      voteCounts,
      votedGoalId: votingRoundGoalId,
    });
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
