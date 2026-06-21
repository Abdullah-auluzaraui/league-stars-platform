'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction } from '@/core/lib/validation';
import { createTeamSchema, updateTeamSchema } from './schemas';

// ── إنشاء فريق ──
export async function createTeam(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  const result = validateAction(createTeamSchema, {
    name: formData.get('name'),
    logoUrl: formData.get('logoUrl'),
    tournamentId: formData.get('tournamentId'),
    groupName: formData.get('groupName'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  try {
    const team = await prisma.team.create({
      data: {
        name: result.data.name,
        logoUrl: result.data.logoUrl ?? null,
      },
    });

    // إضافة الفريق للبطولة إذا تم تحديدها
    if (result.data.tournamentId) {
      await prisma.tournamentTeam.create({
        data: {
          teamId: team.id,
          tournamentId: result.data.tournamentId,
          groupName: result.data.groupName ?? null,
        },
      });
    }

    revalidateTag('teams', 'everyone');
    return { success: true, teamId: team.id };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return { error: 'يوجد فريق بهذا الاسم مسبقاً' };
    }
    return { error: 'حدث خطأ أثناء إنشاء الفريق' };
  }
}

// ── تحديث فريق ──
export async function updateTeam(formData: FormData) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  const result = validateAction(updateTeamSchema, {
    teamId: formData.get('teamId'),
    name: formData.get('name'),
    logoUrl: formData.get('logoUrl'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  try {
    await prisma.team.update({
      where: { id: result.data.teamId },
      data: {
        ...(result.data.name && { name: result.data.name }),
        ...(result.data.logoUrl !== undefined && { logoUrl: result.data.logoUrl }),
      },
    });

    revalidateTag('teams', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء تحديث الفريق' };
  }
}

// ── حذف فريق ──
export async function deleteTeam(teamId: string) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'غير مصرح' };

  try {
    await prisma.team.delete({ where: { id: teamId } });
    revalidateTag('teams', 'everyone');
    revalidateTag('standings', 'everyone');
    return { success: true };
  } catch {
    return { error: 'حدث خطأ أثناء حذف الفريق — قد يكون للفريق بيانات مرتبطة' };
  }
}

// ── جلب الفرق ──
export async function getTeams(tournamentId?: string) {
  if (tournamentId) {
    const tt = await prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: {
        team: {
          include: { players: { select: { id: true, name: true, jerseyNumber: true } } },
        },
      },
      orderBy: { groupName: 'asc' },
    });
    return tt.map((t) => ({ ...t.team, groupName: t.groupName }));
  }

  return prisma.team.findMany({
    include: { players: { select: { id: true, name: true, jerseyNumber: true } } },
    orderBy: { name: 'asc' },
  });
}
