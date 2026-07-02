'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';

// ─── 1. جلب جولات التصويت ───────────────────────────────────────────────────────
export async function getVotingRounds() {
  try {
    return await prisma.votingRound.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        goals: {
          include: {
            goal: {
              include: {
                player: { select: { name: true } },
                team: { select: { name: true, logoUrl: true } },
                match: {
                  include: {
                    homeTeam: { select: { name: true } },
                    awayTeam: { select: { name: true } },
                    tournament: { select: { name: true } },
                  },
                },
              },
            },
            votes: { select: { id: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  } catch (error) {
    console.error('Error in getVotingRounds:', error);
    throw new Error('فشل جلب جولات التصويت من قاعدة البيانات');
  }
}

// ─── 2. إنشاء جولة تصويت جديدة (مسودة) ──────────────────────────────────────────
export async function createVotingRound(formData: FormData) {
  try {
    await verifyAdmin();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const tournamentId = formData.get('tournamentId') as string | null;

    if (!title) {
      return { success: false, error: 'اسم الجولة مطلوب' };
    }

    const round = await prisma.votingRound.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        tournamentId: tournamentId || null,
        showResultsMode: 'after_vote',
        status: 'draft',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true, roundId: round.id };
  } catch (error) {
    console.error('Error in createVotingRound:', error);
    return { success: false, error: 'حدث خطأ أثناء إنشاء الجولة' };
  }
}

// ─── 3. تعديل إعدادات جولة التصويت ────────────────────────────────────────────────
export async function updateVotingRound(formData: FormData) {
  try {
    await verifyAdmin();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const tournamentId = formData.get('tournamentId') as string | null;

    if (!id || !title) {
      return { success: false, error: 'اسم الجولة مطلوب والبيانات ناقصة' };
    }

    await prisma.votingRound.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        tournamentId: tournamentId || null,
        showResultsMode: 'after_vote',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in updateVotingRound:', error);
    return { success: false, error: 'حدث خطأ أثناء تعديل بيانات الجولة' };
  }
}

// ─── 4. إضافة هدف للجولة ────────────────────────────────────────────────────────
export async function addGoalToRound(roundId: string, goalId: string, videoUrl?: string) {
  try {
    await verifyAdmin();
    if (!roundId || !goalId) {
      return { success: false, error: 'معلومات الجولة أو الهدف غير مكتملة' };
    }

    // التحقق من عدم وجوده مسبقاً
    const existing = await prisma.votingRoundGoal.findUnique({
      where: { roundId_goalId: { roundId, goalId } },
    });
    if (existing) {
      return { success: false, error: 'هذا الهدف مضاف بالفعل في هذه الجولة' };
    }

    // جلب الترتيب الأخير
    const agg = await prisma.votingRoundGoal.aggregate({
      where: { roundId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (agg._max.sortOrder ?? -1) + 1;

    // الحصول على رابط الفيديو من الهدف نفسه إذا لم يتم تحديده
    let finalVideoUrl = videoUrl || null;
    if (!finalVideoUrl) {
      const g = await prisma.goal.findUnique({ where: { id: goalId }, select: { videoUrl: true } });
      finalVideoUrl = g?.videoUrl || null;
    }

    await prisma.votingRoundGoal.create({
      data: {
        roundId,
        goalId,
        videoUrl: finalVideoUrl,
        sortOrder: nextSortOrder,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in addGoalToRound:', error);
    return { success: false, error: 'حدث خطأ أثناء إضافة الهدف للجولة' };
  }
}

// ─── 5. إزالة هدف من الجولة ──────────────────────────────────────────────────────
export async function removeGoalFromRound(roundId: string, goalId: string) {
  try {
    await verifyAdmin();
    if (!roundId || !goalId) {
      return { success: false, error: 'معلومات الجولة أو الهدف غير مكتملة' };
    }

    await prisma.votingRoundGoal.delete({
      where: { roundId_goalId: { roundId, goalId } },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in removeGoalFromRound:', error);
    return { success: false, error: 'حدث خطأ أثناء إزالة الهدف من الجولة' };
  }
}

// ─── 6. تحديث رابط فيديو الهدف داخل الجولة ──────────────────────────────────────────
export async function updateRoundGoalVideo(roundGoalId: string, videoUrl: string) {
  try {
    await verifyAdmin();
    if (!roundGoalId) {
      return { success: false, error: 'معرف الهدف المرشح غير صحيح' };
    }

    await prisma.votingRoundGoal.update({
      where: { id: roundGoalId },
      data: {
        videoUrl: videoUrl ? videoUrl.trim() : null,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in updateRoundGoalVideo:', error);
    return { success: false, error: 'حدث خطأ أثناء تحديث رابط الفيديو' };
  }
}

// ─── 7. تفعيل جولة التصويت (Active) ─────────────────────────────────────────────
export async function activateVotingRound(roundId: string) {
  try {
    await verifyAdmin();
    if (!roundId) {
      return { success: false, error: 'معرف الجولة غير صحيح' };
    }

    // التحقق من وجود أهداف مرشحة
    const goalsCount = await prisma.votingRoundGoal.count({
      where: { roundId },
    });
    if (goalsCount < 1) {
      return { success: false, error: 'لا يمكن فتح التصويت لجولة خالية من الأهداف المرشحة' };
    }

    // إغلاق أي جولة نشطة أخرى تلقائياً
    await prisma.votingRound.updateMany({
      where: { status: 'active' },
      data: { status: 'closed', closedAt: new Date() },
    });

    // تفعيل الجولة الحالية
    await prisma.votingRound.update({
      where: { id: roundId },
      data: {
        status: 'active',
        startsAt: new Date(),
        closedAt: null,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in activateVotingRound:', error);
    return { success: false, error: 'حدث خطأ أثناء فتح التصويت للجولة' };
  }
}

// ─── 8. إيقاف/إغلاق جولة التصويت (Closed) ──────────────────────────────────────────
export async function closeVotingRound(roundId: string) {
  try {
    await verifyAdmin();
    if (!roundId) {
      return { success: false, error: 'معرف الجولة غير صحيح' };
    }

    await prisma.votingRound.update({
      where: { id: roundId },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in closeVotingRound:', error);
    return { success: false, error: 'حدث خطأ أثناء إغلاق جولة التصويت' };
  }
}

// ─── 9. اعتماد الفائز وأرشفة الجولة (Archived) ────────────────────────────────────
export async function archiveVotingRound(roundId: string, winnerGoalId: string) {
  try {
    await verifyAdmin();
    if (!roundId || !winnerGoalId) {
      return { success: false, error: 'بيانات غير مكتملة لاعتماد الفائز' };
    }

    await prisma.votingRound.update({
      where: { id: roundId },
      data: {
        status: 'archived',
        winnerGoalId,
        closedAt: new Date(),
      },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in archiveVotingRound:', error);
    return { success: false, error: 'حدث خطأ أثناء أرشفة الجولة' };
  }
}

// ─── 10. تصفير أصوات جولة معينة ──────────────────────────────────────────────────
export async function resetRoundVotes(roundId: string) {
  try {
    await verifyAdmin();
    if (!roundId) {
      return { success: false, error: 'معرف الجولة غير صحيح' };
    }

    await prisma.goalVote.deleteMany({
      where: {
        votingRoundGoal: {
          roundId,
        },
      },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in resetRoundVotes:', error);
    return { success: false, error: 'حدث خطأ أثناء تصفير أصوات الجولة' };
  }
}

// ─── 11. حذف جولة التصويت ────────────────────────────────────────────────────────
export async function deleteVotingRound(roundId: string) {
  try {
    await verifyAdmin();
    if (!roundId) {
      return { success: false, error: 'معرف الجولة غير صحيح' };
    }

    const round = await prisma.votingRound.findUnique({
      where: { id: roundId },
    });
    if (!round) {
      return { success: false, error: 'الجولة غير موجودة' };
    }
    if (round.status === 'active') {
      return { success: false, error: 'لا يمكن حذف جولة تصويت نشطة حالياً' };
    }

    await prisma.votingRound.delete({
      where: { id: roundId },
    });

    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteVotingRound:', error);
    return { success: false, error: 'حدث خطأ أثناء حذف جولة التصويت' };
  }
}

// ─── 12. جلب الأهداف لترشيحها مع التصفية ──────────────────────────────────────────
export async function getGoalsForNomination(
  roundId: string,
  filters: { tournamentId?: string; query?: string } = {}
) {
  try {
    await verifyAdmin();

    const whereClause: any = {};

    if (filters.tournamentId && filters.tournamentId !== 'all') {
      whereClause.match = { tournamentId: filters.tournamentId };
    }

    if (filters.query) {
      whereClause.OR = [
        { player: { name: { contains: filters.query, mode: 'insensitive' } } },
        { team: { name: { contains: filters.query, mode: 'insensitive' } } },
      ];
    }

    const goals = await prisma.goal.findMany({
      where: whereClause,
      include: {
        player: { select: { name: true } },
        team: { select: { name: true, logoUrl: true } },
        match: {
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            tournament: { select: { name: true } },
          },
        },
        votingRoundGoals: {
          where: { roundId },
        },
      },
      orderBy: { minute: 'asc' },
    });

    return goals.map((g) => ({
      id: g.id,
      minute: g.minute,
      type: g.type,
      videoUrl: g.videoUrl,
      player: g.player,
      team: g.team,
      match: g.match,
      isNominatedInRound: g.votingRoundGoals.length > 0,
      roundGoalId: g.votingRoundGoals[0]?.id || null,
      roundGoalVideoUrl: g.votingRoundGoals[0]?.videoUrl || null,
    }));
  } catch (error) {
    console.error('Error in getGoalsForNomination:', error);
    throw new Error('فشل جلب الأهداف للترشيح');
  }
}
