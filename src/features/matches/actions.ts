'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction } from '@/core/lib/validation';
import {
  createMatchSchema,
  updateScoreSchema,
  addGoalSchema,
  addCardSchema,
} from './schemas';

// ── إنشاء مباراة ──
export async function createMatch(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  const result = validateAction(createMatchSchema, {
    tournamentId: formData.get('tournamentId'),
    homeTeamId: formData.get('homeTeamId'),
    awayTeamId: formData.get('awayTeamId'),
    matchDate: formData.get('matchDate'),
    venue: formData.get('venue'),
    stage: formData.get('stage'),
    groupName: formData.get('groupName'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  try {
    const match = await prisma.match.create({
      data: {
        tournamentId: result.data.tournamentId,
        homeTeamId: result.data.homeTeamId,
        awayTeamId: result.data.awayTeamId,
        matchDate: new Date(result.data.matchDate),
        venue: result.data.venue,
        stage: result.data.stage,
        groupName: result.data.groupName ?? null,
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0,
      },
    });

    revalidateTag('matches', 'everyone');
    revalidateTag('standings', 'everyone');
    return { success: true, matchId: match.id };
  } catch {
    return { error: 'حدث خطأ أثناء إنشاء المباراة' };
  }
}

// ── تحديث النتيجة ──
export async function updateScore(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  const result = validateAction(updateScoreSchema, {
    matchId: formData.get('matchId'),
    homeScore: formData.get('homeScore'),
    awayScore: formData.get('awayScore'),
    homePenalty: formData.get('homePenalty'),
    awayPenalty: formData.get('awayPenalty'),
    status: formData.get('status'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  try {
    await prisma.match.update({
      where: { id: result.data.matchId },
      data: {
        homeScore: result.data.homeScore,
        awayScore: result.data.awayScore,
        homePenalty: result.data.homePenalty ?? null,
        awayPenalty: result.data.awayPenalty ?? null,
        ...(result.data.status && { status: result.data.status }),
      },
    });

    revalidateTag('matches', 'everyone');
    revalidateTag('standings', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء تحديث النتيجة' };
  }
}

// ── تحديث حالة المباراة فقط ──
export async function updateMatchStatus(
  matchId: string,
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  try {
    await prisma.match.update({
      where: { id: matchId },
      data: { status },
    });
    revalidateTag('matches', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء تحديث الحالة' };
  }
}

// ── حذف مباراة ──
export async function deleteMatch(matchId: string) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  try {
    await prisma.match.delete({ where: { id: matchId } });
    revalidateTag('matches', 'everyone');
    revalidateTag('standings', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء حذف المباراة' };
  }
}

// ── إضافة هدف ──
export async function addGoal(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  const result = validateAction(addGoalSchema, {
    matchId: formData.get('matchId'),
    playerId: formData.get('playerId'),
    teamId: formData.get('teamId'),
    type: formData.get('type'),
    minute: formData.get('minute'),
    videoUrl: formData.get('videoUrl'),
    isNominated: formData.get('isNominated') === 'true',
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  try {
    // نحدث النتيجة تلقائياً بناءً على الفريق المسجّل
    const match = await prisma.match.findUnique({
      where: { id: result.data.matchId },
    });
    if (!match) return { error: 'المباراة غير موجودة' };

    const goal = await prisma.goal.create({
      data: {
        matchId: result.data.matchId,
        playerId: result.data.playerId,
        teamId: result.data.teamId,
        type: result.data.type,
        minute: result.data.minute,
        videoUrl: result.data.videoUrl ?? null,
        isNominated: result.data.isNominated,
      },
    });

    // تحديث النتيجة — إذا كانت هدف عكسي يُحسب للفريق الآخر
    const isOwnGoal = result.data.type === 'own_goal';
    const scoringTeamId = isOwnGoal
      ? result.data.teamId === match.homeTeamId
        ? match.awayTeamId
        : match.homeTeamId
      : result.data.teamId;

    if (scoringTeamId === match.homeTeamId) {
      await prisma.match.update({
        where: { id: match.id },
        data: { homeScore: { increment: 1 } },
      });
    } else {
      await prisma.match.update({
        where: { id: match.id },
        data: { awayScore: { increment: 1 } },
      });
    }

    revalidateTag('matches', 'everyone');
    revalidateTag('standings', 'everyone');
    revalidateTag('scorers', 'everyone');
    return { success: true, goalId: goal.id };
  } catch {
    return { error: 'حدث خطأ أثناء إضافة الهدف' };
  }
}

// ── حذف هدف ──
export async function deleteGoal(goalId: string) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { match: true },
    });
    if (!goal) return { error: 'الهدف غير موجود' };

    await prisma.goal.delete({ where: { id: goalId } });

    // خصم الهدف من النتيجة
    const isOwnGoal = goal.type === 'own_goal';
    const scoringTeamId = isOwnGoal
      ? goal.teamId === goal.match.homeTeamId
        ? goal.match.awayTeamId
        : goal.match.homeTeamId
      : goal.teamId;

    if (scoringTeamId === goal.match.homeTeamId) {
      await prisma.match.update({
        where: { id: goal.matchId },
        data: { homeScore: { decrement: 1 } },
      });
    } else {
      await prisma.match.update({
        where: { id: goal.matchId },
        data: { awayScore: { decrement: 1 } },
      });
    }

    revalidateTag('matches', 'everyone');
    revalidateTag('standings', 'everyone');
    revalidateTag('scorers', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء حذف الهدف' };
  }
}

// ── إضافة بطاقة ──
export async function addCard(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  const result = validateAction(addCardSchema, {
    matchId: formData.get('matchId'),
    playerId: formData.get('playerId'),
    teamId: formData.get('teamId'),
    type: formData.get('type'),
    minute: formData.get('minute'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  try {
    await prisma.card.create({ data: result.data });
    revalidateTag('standings', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء إضافة البطاقة' };
  }
}

// ── جلب المباريات ──
export async function getMatches(tournamentId?: string) {
  const where = tournamentId ? { tournamentId } : {};
  return prisma.match.findMany({
    where,
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
      goals: { include: { player: { select: { name: true } } } },
    },
    orderBy: { matchDate: 'asc' },
  });
}

// ── جلب مباريات اليوم ──
export async function getTodayMatches() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.match.findMany({
    where: {
      matchDate: { gte: today, lt: tomorrow },
    },
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
    },
    orderBy: { matchDate: 'asc' },
  });
}
