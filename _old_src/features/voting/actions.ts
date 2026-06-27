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
    token: formData.get('token'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  const { goalId, fingerprint, token } = result.data;

  // ─── التحقق من رمز Turnstile البشري ───
  try {
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${token}&remoteip=${visitorIp}`,
    });

    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      return { error: 'فشل التحقق من الهوية البشرية، يرجى المحاولة مجدداً' };
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { error: 'فشل الاتصال بخادم التحقق من الهوية البشرية' };
  }

  // 1. جلب الهدف المراد التصويت له للتأكد من أنه مرشح حالياً
  const targetGoal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { id: true, isNominated: true, match: { select: { tournamentId: true } } },
  });

  if (!targetGoal || !targetGoal.isNominated) {
    return { error: 'هذا الهدف غير مدرج في التصويت الحالي' };
  }

  const tournamentId = targetGoal.match.tournamentId;

  // 2. التحقق مما إذا كان المستخدم قد صوّت لأي هدف مرشح حالياً في هذه البطولة مسبقاً
  const nominatedGoals = await prisma.goal.findMany({
    where: { isNominated: true, match: { tournamentId } },
    select: { id: true },
  });

  const nominatedGoalIds = nominatedGoals.map((g) => g.id);

  const existingVote = await prisma.goalVote.findFirst({
    where: {
      fingerprint,
      goalId: { in: nominatedGoalIds },
    },
  });

  if (existingVote) {
    return { error: 'لقد شاركت في تصويت هذه الجولة مسبقاً' };
  }

  try {
    await prisma.goalVote.create({
      data: { goalId, fingerprint, visitorIp },
    });

    revalidateTag('votes', 'max');
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
  try {
    const { verifyAdmin } = await import('@/core/lib/auth');
    await verifyAdmin();

    await prisma.goal.update({
      where: { id: goalId },
      data: { isNominated: nominated },
    });
    revalidateTag('votes', 'max');
    return { success: true };
  } catch (error) {
    const { handleActionError } = await import('@/core/lib/validation');
    return handleActionError(error);
  }
}

// ── التحقق من تصويت المستخدم ──
export async function checkUserVote(fingerprint: string, tournamentId: string) {
  try {
    const nominatedGoals = await prisma.goal.findMany({
      where: { isNominated: true, match: { tournamentId } },
      select: { id: true },
    });
    const nominatedGoalIds = nominatedGoals.map((g) => g.id);

    const vote = await prisma.goalVote.findFirst({
      where: {
        fingerprint,
        goalId: { in: nominatedGoalIds },
      },
      select: { goalId: true },
    });

    return vote ? vote.goalId : null;
  } catch {
    return null;
  }
}
