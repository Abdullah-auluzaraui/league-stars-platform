'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction } from '@/core/lib/validation';
import { createPlayerSchema, updatePlayerSchema } from './schemas';

// ── إنشاء لاعب ──
export async function createPlayer(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  const result = validateAction(createPlayerSchema, {
    name: formData.get('name'),
    jerseyNumber: formData.get('jerseyNumber'),
    teamId: formData.get('teamId'),
    position: formData.get('position'),
    photoUrl: formData.get('photoUrl'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  try {
    const player = await prisma.player.create({
      data: {
        name: result.data.name,
        jerseyNumber: result.data.jerseyNumber,
        teamId: result.data.teamId,
        position: result.data.position ?? null,
        photoUrl: result.data.photoUrl ?? null,
      },
    });

    revalidateTag('teams', 'everyone');
    revalidateTag('scorers', 'everyone');
    return { success: true, playerId: player.id };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return { error: `رقم القميص ${result.data.jerseyNumber} مستخدم مسبقاً في هذا الفريق` };
    }
    return { error: 'حدث خطأ أثناء إنشاء اللاعب' };
  }
}

// ── تحديث لاعب ──
export async function updatePlayer(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  const result = validateAction(updatePlayerSchema, {
    playerId: formData.get('playerId'),
    name: formData.get('name'),
    jerseyNumber: formData.get('jerseyNumber'),
    position: formData.get('position'),
    photoUrl: formData.get('photoUrl'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  try {
    await prisma.player.update({
      where: { id: result.data.playerId },
      data: {
        ...(result.data.name && { name: result.data.name }),
        ...(result.data.jerseyNumber !== undefined && { jerseyNumber: result.data.jerseyNumber }),
        ...(result.data.position !== undefined && { position: result.data.position }),
        ...(result.data.photoUrl !== undefined && { photoUrl: result.data.photoUrl }),
      },
    });

    revalidateTag('teams', 'everyone');
    revalidateTag('scorers', 'everyone');
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return { error: 'رقم القميص مستخدم مسبقاً في هذا الفريق' };
    }
    return { error: 'حدث خطأ أثناء تحديث اللاعب' };
  }
}

// ── حذف لاعب ──
export async function deletePlayer(playerId: string) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  try {
    await prisma.player.delete({ where: { id: playerId } });
    revalidateTag('teams', 'everyone');
    revalidateTag('scorers', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء حذف اللاعب' };
  }
}

// ── جلب الهدافين ──
export async function getTopScorers(limit = 20) {
  const players = await prisma.player.findMany({
    include: {
      team: { select: { id: true, name: true, logoUrl: true } },
      goals: {
        where: { type: { not: 'own_goal' } }, // لا نحسب الأهداف العكسية
        select: { id: true, type: true },
      },
    },
  });

  return players
    .map((p) => {
      const goalsCount = p.goals.length;
      const penaltyGoalsCount = p.goals.filter((g) => g.type === 'penalty').length;
      const openPlayGoalsCount = goalsCount - penaltyGoalsCount;

      return {
        id: p.id,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
        position: p.position,
        team: p.team,
        goalsCount,
        openPlayGoalsCount,
      };
    })
    .filter((p) => p.goalsCount > 0)
    .sort((a, b) => {
      // 1. الفرز الأساسي: عدد الأهداف الإجمالي (تنازلي)
      if (b.goalsCount !== a.goalsCount) {
        return b.goalsCount - a.goalsCount;
      }
      // 2. كسر التعادل: عدد أهداف اللعب المفتوح (تنازلي)
      if (b.openPlayGoalsCount !== a.openPlayGoalsCount) {
        return b.openPlayGoalsCount - a.openPlayGoalsCount;
      }
      // 3. كسر التعادل النهائي: الترتيب الأبجدي
      return a.name.localeCompare(b.name, 'ar');
    })
    .slice(0, limit);
}
