'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';

// ─── 1. جلب المباريات ──────────────────────────────────────────────────────────
export async function getMatches(tournamentId?: string) {
  try {
    return await prisma.match.findMany({
      where: tournamentId && tournamentId !== 'all' ? { tournamentId } : {},
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: true,
        goals: {
          include: {
            player: true,
          },
        },
        cards: {
          include: {
            player: true,
          },
        },
      },
      orderBy: { matchDate: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw new Error('فشل جلب المباريات من قاعدة البيانات');
  }
}

const STAGE_LIMITS: Record<string, number> = {
  round_16: 8,
  quarter: 4,
  semi: 2,
  final: 1,
};

async function validateKnockoutLimit(tournamentId: string, stage: string, excludeMatchId?: string) {
  const limit = STAGE_LIMITS[stage];
  if (limit === undefined) {
    return { valid: true };
  }

  const count = await prisma.match.count({
    where: {
      tournamentId,
      stage,
      id: excludeMatchId ? { not: excludeMatchId } : undefined,
    },
  });

  if (count >= limit) {
    const stageNames: Record<string, string> = {
      round_16: 'دور الـ 16',
      quarter: 'ربع النهائي',
      semi: 'نصف النهائي',
      final: 'النهائي',
    };
    return {
      valid: false,
      error: `لا يمكن إضافة مباراة جديدة في ${stageNames[stage]}، الحد الأقصى هو ${limit} مباراة فقط.`,
    };
  }

  return { valid: true };
}

// ─── 2. جدولة مباراة جديدة (محمي) ────────────────────────────────────────────────
export async function scheduleMatch(formData: FormData) {
  try {
    await verifyAdmin();

    const tournamentId = formData.get('tournamentId') as string;
    const homeTeamId = formData.get('homeTeamId') as string;
    const awayTeamId = formData.get('awayTeamId') as string;
    const matchDateStr = formData.get('matchDate') as string;
    const venue = formData.get('venue') as string;
    const stage = formData.get('stage') as string;
    const groupName = formData.get('groupName') as string | null;

    if (!tournamentId || !homeTeamId || !awayTeamId || !matchDateStr) {
      return { success: false, error: 'يرجى إكمال جميع الحقول المطلوبة' };
    }

    if (homeTeamId === awayTeamId) {
      return { success: false, error: 'لا يمكن جدولة مباراة لفريق ضد نفسه' };
    }

    // التحقق من الحد الأقصى للأدوار الإقصائية
    const limitCheck = await validateKnockoutLimit(tournamentId, stage);
    if (!limitCheck.valid) {
      return { success: false, error: limitCheck.error };
    }

    const matchDate = new Date(matchDateStr);

    const match = await prisma.match.create({
      data: {
        tournamentId,
        homeTeamId,
        awayTeamId,
        matchDate,
        venue: venue || null,
        stage,
        groupName: groupName || null,
        status: 'scheduled',
        homeScore: null,
        awayScore: null,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error('Error scheduling match:', error);
    return { success: false, error: 'حدث خطأ أثناء جدولة المباراة' };
  }
}

// ─── 3. تحديث إعدادات جدولة المباراة (محمي) ────────────────────────────────────────
export async function updateMatchSettings(formData: FormData) {
  try {
    await verifyAdmin();

    const id = formData.get('id') as string;
    const matchDateStr = formData.get('matchDate') as string;
    const venue = formData.get('venue') as string;
    const stage = formData.get('stage') as string;
    const groupName = formData.get('groupName') as string | null;
    const streamUrl = formData.get('streamUrl') as string | null;

    if (!id || !matchDateStr) {
      return { success: false, error: 'بيانات ناقصة' };
    }

    // جلب تفاصيل المباراة الحالية لمعرفة البطولة
    const existingMatch = await prisma.match.findUnique({
      where: { id },
      select: { tournamentId: true },
    });

    if (!existingMatch) {
      return { success: false, error: 'المباراة غير موجودة' };
    }

    // التحقق من الحد الأقصى للأدوار الإقصائية
    const limitCheck = await validateKnockoutLimit(existingMatch.tournamentId, stage, id);
    if (!limitCheck.valid) {
      return { success: false, error: limitCheck.error };
    }

    const matchDate = new Date(matchDateStr);

    await prisma.match.update({
      where: { id },
      data: {
        matchDate,
        venue: venue || null,
        streamUrl: streamUrl || null,
        stage,
        groupName: groupName || null,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    return { success: true };
  } catch (error) {
    console.error('Error updating match settings:', error);
    return { success: false, error: 'حدث خطأ أثناء تحديث بيانات المباراة' };
  }
}

// ─── 4. حذف مباراة (محمي) ────────────────────────────────────────────────────────
export async function deleteMatch(matchId: string) {
  try {
    await verifyAdmin();

    // جلب الأهداف لإنقاص أهداف اللاعبين قبل الحذف
    const goals = await prisma.goal.findMany({
      where: { matchId },
    });

    // إنقاص أهداف اللاعبين
    for (const goal of goals) {
      await prisma.player.update({
        where: { id: goal.playerId },
        data: { goalsCount: { decrement: 1 } },
      });
    }

    await prisma.match.delete({
      where: { id: matchId },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting match:', error);
    return { success: false, error: 'فشل حذف المباراة' };
  }
}

// ─── 5. بدء المباراة (محمي) ──────────────────────────────────────────────────────
export async function startMatch(matchId: string) {
  try {
    await verifyAdmin();

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'live',
        homeScore: 0,
        awayScore: 0,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    return { success: true };
  } catch (error) {
    console.error('Error starting match:', error);
    return { success: false, error: 'فشل بدء المباراة' };
  }
}

// ─── 6. إنهاء المباراة (محمي) ────────────────────────────────────────────────────
export async function finishMatch(matchId: string) {
  try {
    await verifyAdmin();

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'finished',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    console.error('Error finishing match:', error);
    return { success: false, error: 'فشل إنهاء المباراة' };
  }
}

// ─── 7. تسجيل هدف (محمي مع معالجة الهدف العكسي وتحديث النتيجة والأرقام) ───────────────────
export async function recordGoal(
  matchId: string,
  playerId: string,
  playerTeamId: string,
  type: string,
  minute: number
) {
  try {
    await verifyAdmin();

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return { success: false, error: 'المباراة غير موجودة' };
    }

    // تحديد الفريق المستفيد من الهدف
    let beneficiaryTeamId = playerTeamId;
    if (type === 'own_goal') {
      beneficiaryTeamId = playerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    }

    // إنشاء سجل الهدف
    const goal = await prisma.goal.create({
      data: {
        matchId,
        playerId,
        teamId: beneficiaryTeamId,
        type,
        minute,
      },
    });

    // زيادة عداد الأهداف الفردية للاعب المسجل
    await prisma.player.update({
      where: { id: playerId },
      data: { goalsCount: { increment: 1 } },
    });

    // تحديث نتيجة المباراة تلقائياً
    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;

    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: beneficiaryTeamId === match.homeTeamId ? homeScore + 1 : homeScore,
        awayScore: beneficiaryTeamId === match.awayTeamId ? awayScore + 1 : awayScore,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    revalidatePath('/standings');
    return { success: true, goalId: goal.id };
  } catch (error) {
    console.error('Error recording goal:', error);
    return { success: false, error: 'فشل تسجيل الهدف' };
  }
}

// ─── 8. حذف هدف مسجل (محمي وتخفيض النتيجة تلقائياً) ──────────────────────────────────
export async function deleteGoal(goalId: string) {
  try {
    await verifyAdmin();

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return { success: false, error: 'الهدف غير موجود' };
    }

    const match = await prisma.match.findUnique({
      where: { id: goal.matchId },
    });

    if (!match) {
      return { success: false, error: 'المباراة غير موجودة' };
    }

    // تقليص عداد أهداف اللاعب
    await prisma.player.update({
      where: { id: goal.playerId },
      data: { goalsCount: { decrement: 1 } },
    });

    // تحديث النتيجة بالتقليص
    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;

    await prisma.match.update({
      where: { id: goal.matchId },
      data: {
        homeScore: goal.teamId === match.homeTeamId ? Math.max(0, homeScore - 1) : homeScore,
        awayScore: goal.teamId === match.awayTeamId ? Math.max(0, awayScore - 1) : awayScore,
      },
    });

    // حذف السجل
    await prisma.goal.delete({
      where: { id: goalId },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting goal:', error);
    return { success: false, error: 'فشل حذف الهدف' };
  }
}

// ─── 9. تسجيل بطاقة (محمي) ───────────────────────────────────────────────────────
export async function recordCard(
  matchId: string,
  playerId: string,
  teamId: string,
  type: string,
  minute: number
) {
  try {
    await verifyAdmin();

    const card = await prisma.card.create({
      data: {
        matchId,
        playerId,
        teamId,
        type,
        minute,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    return { success: true, cardId: card.id };
  } catch (error) {
    console.error('Error recording card:', error);
    return { success: false, error: 'فشل تسجيل البطاقة' };
  }
}

// ─── 10. حذف بطاقة مسجلة (محمي) ──────────────────────────────────────────────────
export async function deleteCard(cardId: string) {
  try {
    await verifyAdmin();

    await prisma.card.delete({
      where: { id: cardId },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    return { success: true };
  } catch (error) {
    console.error('Error deleting card:', error);
    return { success: false, error: 'فشل حذف البطاقة' };
  }
}

// ─── 11. تحديث نتيجة ركلات الترجيح (محمي) ──────────────────────────────────────────
export async function updatePenaltyScore(
  matchId: string,
  homePenalty: number | null,
  awayPenalty: number | null
) {
  try {
    await verifyAdmin();

    await prisma.match.update({
      where: { id: matchId },
      data: {
        homePenalty,
        awayPenalty,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    console.error('Error updating penalty score:', error);
    return { success: false, error: 'فشل تحديث ركلات الترجيح' };
  }
}

// ─── 12. تحديث رابط البث المباشر للمباراة (محمي) ──────────────────────────────────────────
export async function updateMatchStreamUrl(matchId: string, streamUrl: string | null) {
  try {
    await verifyAdmin();

    await prisma.match.update({
      where: { id: matchId },
      data: {
        streamUrl: streamUrl || null,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/matches');
    return { success: true };
  } catch (error) {
    console.error('Error updating match stream url:', error);
    return { success: false, error: 'فشل تحديث رابط البث المباشر' };
  }
}
