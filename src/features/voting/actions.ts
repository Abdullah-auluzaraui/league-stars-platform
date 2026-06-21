'use server';

import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { validateAction } from '@/core/lib/validation';
import { submitVoteSchema } from './schemas';

// ── تقديم تصويت ──
export async function submitVote(formData: FormData) {
  const headersList = await headers();
  const visitorIp =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    '0.0.0.0';

  const result = validateAction(submitVoteSchema, {
    goalId: formData.get('goalId'),
    fingerprint: formData.get('fingerprint'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  const { goalId, fingerprint } = result.data;

  // التحقق من تفرد التصويت (بصمة + هدف)
  const existing = await prisma.goalVote.findUnique({
    where: { goalId_fingerprint: { goalId, fingerprint } },
  });

  if (existing) {
    return { error: 'لقد صوّت جهازك لهذا الهدف مسبقاً' };
  }

  try {
    await prisma.goalVote.create({
      data: { goalId, fingerprint, visitorIp },
    });

    revalidateTag('votes', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء تسجيل التصويت' };
  }
}

// ── جلب إحصائيات التصويت لهدف الجولة ──
export async function getVoteStats(roundGoalIds: string[]) {
  if (roundGoalIds.length === 0) return [];

  const votes = await prisma.goalVote.groupBy({
    by: ['goalId'],
    where: { goalId: { in: roundGoalIds } },
    _count: { goalId: true },
    orderBy: { _count: { goalId: 'desc' } },
  });

  const total = votes.reduce((sum, v) => sum + v._count.goalId, 0);

  return votes.map((v) => ({
    goalId: v.goalId,
    voteCount: v._count.goalId,
    percentage: total > 0 ? Math.round((v._count.goalId / total) * 100) : 0,
  }));
}

// ── جلب الأهداف المرشحة لهدف الجولة ──
export async function getNominatedGoals(tournamentId: string) {
  return prisma.goal.findMany({
    where: {
      isNominated: true,
      match: { tournamentId },
    },
    include: {
      player: { select: { id: true, name: true, jerseyNumber: true } },
      team: { select: { id: true, name: true, logoUrl: true } },
      match: {
        select: {
          id: true,
          matchDate: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
      votes: { select: { id: true } },
    },
    orderBy: { votes: { _count: 'desc' } },
  });
}

// ── ترشيح هدف لهدف الجولة ──
export async function nominateGoal(goalId: string, nominated: boolean) {
  const { verifyAdmin } = await import('@/core/lib/auth');
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  try {
    await prisma.goal.update({
      where: { id: goalId },
      data: { isNominated: nominated },
    });
    revalidateTag('votes', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء ترشيح الهدف' };
  }
}
