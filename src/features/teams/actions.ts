'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction, handleActionError } from '@/core/lib/validation';
import { createTeamSchema, updateTeamSchema } from './schemas';

// ── إنشاء فريق ──
export async function createTeam(formData: FormData) {
  try {
    await verifyAdmin();

    const result = validateAction(createTeamSchema, {
      name: formData.get('name'),
      logoUrl: formData.get('logoUrl'),
      tournamentId: formData.get('tournamentId'),
      groupName: formData.get('groupName'),
    });

    if (!result.success) {
      return { success: false, error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
    }

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

    revalidateTag('teams');
    return { success: true, teamId: team.id };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return { success: false, error: 'يوجد فريق بهذا الاسم مسبقاً', code: 'UNIQUE_CONSTRAINT' };
    }
    return handleActionError(e);
  }
}

// ── تحديث فريق ──
export async function updateTeam(formData: FormData) {
  try {
    await verifyAdmin();

    const result = validateAction(updateTeamSchema, {
      teamId: formData.get('teamId'),
      name: formData.get('name'),
      logoUrl: formData.get('logoUrl'),
    });

    if (!result.success) {
      return { success: false, error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
    }

    await prisma.team.update({
      where: { id: result.data.teamId },
      data: {
        ...(result.data.name && { name: result.data.name }),
        ...(result.data.logoUrl !== undefined && { logoUrl: result.data.logoUrl }),
      },
    });

    revalidateTag('teams');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ── حذف فريق ──
export async function deleteTeam(teamId: string) {
  try {
    await verifyAdmin();
    await prisma.team.delete({ where: { id: teamId } });
    revalidateTag('teams');
    revalidateTag('standings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
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
