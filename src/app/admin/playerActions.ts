'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction, handleActionError } from '@/core/lib/validation';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const playerSchema = z.object({
  name: z
    .string()
    .min(2, 'اسم اللاعب يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم اللاعب طويل جداً')
    .trim(),
  teamId: z.string().min(1, 'يجب اختيار فريق للاعب'),
  jerseyNumber: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      return Number(val);
    },
    z.number().int().min(1, 'رقم اللاعب يجب أن يكون 1 على الأقل').max(99, 'رقم اللاعب يجب ألا يتجاوز 99').nullable()
  ),
  position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']).nullable().optional(),
  photoUrl: z.string().optional().nullable(),
});

async function saveUploadedFile(file: File): Promise<string | null> {
  if (!file || file.size === 0 || !file.name) return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'players');
    await mkdir(uploadDir, { recursive: true });

    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueFilename = `${Date.now()}-${cleanName}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await writeFile(filePath, buffer);
    return `/uploads/players/${uniqueFilename}`;
  } catch (err) {
    console.error('Error saving player photo:', err);
    return null;
  }
}

export async function getPlayers(includeArchivedTeams = false) {
  try {
    return await prisma.player.findMany({
      where: {
        team: {
          archivedAt: includeArchivedTeams ? undefined : null,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            archivedAt: true,
          },
        },
        _count: {
          select: {
            goals: true,
            cards: true,
          },
        },
      },
      orderBy: [
        { team: { name: 'asc' } },
        { jerseyNumber: 'asc' },
        { name: 'asc' },
      ],
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    throw new Error('فشل جلب اللاعبين من قاعدة البيانات');
  }
}

export async function createPlayer(formData: FormData) {
  try {
    await verifyAdmin();

    const photoFile = formData.get('photoFile') as File | null;
    let finalPhotoUrl = (formData.get('photoUrl') || '') as string;

    if (photoFile && photoFile.size > 0 && photoFile.name) {
      const uploadedPath = await saveUploadedFile(photoFile);
      if (uploadedPath) finalPhotoUrl = uploadedPath;
    }

    const result = validateAction(playerSchema, {
      name: formData.get('name'),
      teamId: formData.get('teamId'),
      jerseyNumber: formData.get('jerseyNumber'),
      position: formData.get('position') || null,
      photoUrl: finalPhotoUrl || null,
    });

    if (!result.success) {
      return { success: false, error: result.errors?.[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const { name, teamId, jerseyNumber, position, photoUrl } = result.data;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return { success: false, error: 'الفريق المحدد غير موجود' };
    }

    if (jerseyNumber !== null) {
      const duplicateNumber = await prisma.player.findFirst({
        where: { teamId, jerseyNumber },
      });
      if (duplicateNumber) {
        return { success: false, error: 'يوجد لاعب آخر في نفس الفريق يحمل هذا الرقم' };
      }
    }

    const player = await prisma.player.create({
      data: {
        name,
        teamId,
        jerseyNumber,
        position: position ?? null,
        photoUrl: photoUrl || null,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true, playerId: player.id };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updatePlayer(formData: FormData) {
  try {
    await verifyAdmin();

    const id = formData.get('id') as string;
    if (!id) return { success: false, error: 'معرّف اللاعب غير صحيح' };

    const photoFile = formData.get('photoFile') as File | null;
    let finalPhotoUrl = (formData.get('photoUrl') || '') as string;

    if (photoFile && photoFile.size > 0 && photoFile.name) {
      const uploadedPath = await saveUploadedFile(photoFile);
      if (uploadedPath) finalPhotoUrl = uploadedPath;
    }

    const result = validateAction(playerSchema, {
      name: formData.get('name'),
      teamId: formData.get('teamId'),
      jerseyNumber: formData.get('jerseyNumber'),
      position: formData.get('position') || null,
      photoUrl: finalPhotoUrl || null,
    });

    if (!result.success) {
      return { success: false, error: result.errors?.[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const existingPlayer = await prisma.player.findUnique({ where: { id } });
    if (!existingPlayer) {
      return { success: false, error: 'اللاعب غير موجود' };
    }

    const { name, teamId, jerseyNumber, position, photoUrl } = result.data;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return { success: false, error: 'الفريق المحدد غير موجود' };
    }

    if (jerseyNumber !== null) {
      const duplicateNumber = await prisma.player.findFirst({
        where: {
          teamId,
          jerseyNumber,
          id: { not: id },
        },
      });
      if (duplicateNumber) {
        return { success: false, error: 'يوجد لاعب آخر في نفس الفريق يحمل هذا الرقم' };
      }
    }

    await prisma.player.update({
      where: { id },
      data: {
        name,
        teamId,
        jerseyNumber,
        position: position ?? null,
        photoUrl: photoUrl || null,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deletePlayer(playerId: string) {
  try {
    await verifyAdmin();

    const existingPlayer = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        _count: {
          select: {
            goals: true,
            cards: true,
          },
        },
      },
    });

    if (!existingPlayer) {
      return { success: false, error: 'اللاعب غير موجود' };
    }

    if (existingPlayer._count.goals > 0 || existingPlayer._count.cards > 0) {
      return {
        success: false,
        error: 'لا يمكن حذف لاعب لديه أهداف أو بطاقات مسجلة حفاظاً على السجل التاريخي',
      };
    }

    await prisma.player.delete({ where: { id: playerId } });

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
