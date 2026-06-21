import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/core/lib/auth';
import { prisma } from '@/core/lib/prisma';
import { submitVoteSchema } from '@/features/voting/schemas';

// POST /api/vote — تقديم تصويت
export async function POST(request: NextRequest) {
  const visitorIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '0.0.0.0';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
  }

  const result = submitVoteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'بيانات غير صحيحة' },
      { status: 400 }
    );
  }

  const { goalId, fingerprint } = result.data;

  // التحقق من تفرد التصويت
  const existing = await prisma.goalVote.findUnique({
    where: { goalId_fingerprint: { goalId, fingerprint } },
  });

  if (existing) {
    return NextResponse.json({ error: 'لقد صوّت جهازك لهذا الهدف مسبقاً' }, { status: 409 });
  }

  // التحقق من أن الهدف مرشح
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { isNominated: true },
  });

  if (!goal?.isNominated) {
    return NextResponse.json({ error: 'هذا الهدف غير مرشح للتصويت' }, { status: 400 });
  }

  await prisma.goalVote.create({
    data: { goalId, fingerprint, visitorIp },
  });

  // إرجاع الإحصائيات المحدثة
  const votes = await prisma.goalVote.groupBy({
    by: ['goalId'],
    where: {
      goal: { match: { goals: { some: { matchId: goalId } } } },
    },
    _count: { goalId: true },
  });

  return NextResponse.json({ success: true, votes });
}

// GET /api/vote?goalIds=id1,id2 — جلب إحصائيات التصويت
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const goalIdsParam = searchParams.get('goalIds');

  if (!goalIdsParam) {
    return NextResponse.json({ error: 'goalIds مطلوب' }, { status: 400 });
  }

  const goalIds = goalIdsParam.split(',').filter(Boolean);

  const votes = await prisma.goalVote.groupBy({
    by: ['goalId'],
    where: { goalId: { in: goalIds } },
    _count: { goalId: true },
    orderBy: { _count: { goalId: 'desc' } },
  });

  const total = votes.reduce((sum, v) => sum + v._count.goalId, 0);

  return NextResponse.json({
    votes: votes.map((v) => ({
      goalId: v.goalId,
      count: v._count.goalId,
      percentage: total > 0 ? Math.round((v._count.goalId / total) * 100) : 0,
    })),
    total,
  });
}
