'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction, handleActionError } from '@/core/lib/validation';
import { z } from 'zod';

// ─── مخطط التحقق من البيانات لإنشاء بطولة ──────────────────────────────────────
const createTournamentSchema = z.object({
  name: z
    .string()
    .min(2, 'اسم البطولة يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم البطولة طويل جداً')
    .trim(),
  type: z.enum(['group_stage', 'knockout']),
  groupCount: z.preprocess(
    (val) => (val ? Number(val) : 1),
    z.number().min(1, 'عدد المجموعات يجب أن يكون 1 على الأقل')
  ),
  qualifyingTeams: z.preprocess(
    (val) => (val ? Number(val) : 2),
    z.number().min(1, 'عدد الفرق المتأهلة يجب أن يكون 1 على الأقل')
  ),
});

// ─── مخطط التحقق من البيانات لتحديث بطولة ──────────────────────────────────────
const updateTournamentSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, 'اسم البطولة يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم البطولة طويل جداً')
    .trim()
    .optional(),
  type: z.enum(['group_stage', 'knockout']).optional(),
  groupCount: z.preprocess(
    (val) => (val !== undefined && val !== null ? Number(val) : undefined),
    z.number().min(1, 'عدد المجموعات يجب أن يكون 1 على الأقل').optional()
  ),
  qualifyingTeams: z.preprocess(
    (val) => (val !== undefined && val !== null ? Number(val) : undefined),
    z.number().min(1, 'عدد الفرق المتأهلة يجب أن يكون 1 على الأقل').optional()
  ),
});

// ─── 1. جلب البطولات (عام - بدون حماية صلاحيات) ──────────────────────────────────
export async function getTournaments() {
  try {
    return await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { teams: true, matches: true },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    throw new Error('فشل جلب البطولات من قاعدة البيانات');
  }
}

// ─── 2. إنشاء بطولة (محمي) ──────────────────────────────────────────────────────
export async function createTournament(formData: FormData) {
  try {
    await verifyAdmin();

    const result = validateAction(createTournamentSchema, {
      name: formData.get('name'),
      type: formData.get('type'),
      groupCount: formData.get('groupCount'),
      qualifyingTeams: formData.get('qualifyingTeams'),
    });

    if (!result.success) {
      return { success: false, error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const { name, type, groupCount, qualifyingTeams } = result.data;

    // لبطولات خروج المغلوب نقوم بإلغاء إعدادات المجموعات وحفظ قيم افتراضية
    const finalGroupCount = type === 'knockout' ? 1 : groupCount;
    const finalQualifyingTeams = type === 'knockout' ? 1 : qualifyingTeams;

    // التحقق من تكرار اسم البطولة
    const existing = await prisma.tournament.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return { success: false, error: 'توجد بطولة أخرى بنفس الاسم حالياً' };
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        type,
        groupCount: finalGroupCount,
        qualifyingTeams: finalQualifyingTeams,
        startDate: null,
        endDate: null,
        status: 'upcoming',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true, tournamentId: tournament.id };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── 3. تحديث بطولة (محمي) ──────────────────────────────────────────────────────
export async function updateTournament(formData: FormData) {
  try {
    await verifyAdmin();

    const result = validateAction(updateTournamentSchema, {
      id: formData.get('id'),
      name: formData.get('name'),
      type: formData.get('type') || undefined,
      groupCount: formData.get('groupCount') || undefined,
      qualifyingTeams: formData.get('qualifyingTeams') || undefined,
    });

    if (!result.success) {
      return { success: false, error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const { id, name, type, groupCount, qualifyingTeams } = result.data;

    const existing = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: 'البطولة غير موجودة' };
    }

    // إذا كانت البطولة نشطة أو منتهية، نمنع تعديل النوع أو المجموعات
    if (existing.status !== 'upcoming' && (type !== undefined || groupCount !== undefined || qualifyingTeams !== undefined)) {
      return {
        success: false,
        error: 'لا يمكن تعديل نوع البطولة أو المجموعات بعد بدئها أو انتهائها',
      };
    }

    // التحقق من تكرار الاسم في حال تم تغييره
    if (name && name !== existing.name) {
      const duplicate = await prisma.tournament.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (duplicate) {
        return { success: false, error: 'توجد بطولة أخرى بنفس الاسم حالياً' };
      }
    }

    await prisma.tournament.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type !== undefined && { type: type }),
        ...(groupCount !== undefined && { groupCount: type === 'knockout' ? 1 : groupCount }),
        ...(qualifyingTeams !== undefined && { qualifyingTeams: type === 'knockout' ? 1 : qualifyingTeams }),
      },
    });

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── 4. بدء بطولة (محمي) ────────────────────────────────────────────────────────
export async function startTournament(tournamentId: string) {
  try {
    await verifyAdmin();

    const existing = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!existing) {
      return { success: false, error: 'البطولة غير موجودة' };
    }

    if (existing.status !== 'upcoming') {
      return { success: false, error: 'يمكن بدء البطولات القادمة فقط' };
    }

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: 'active',
        startDate: new Date(), // تعيين تاريخ البدء عند الضغط على زر البدء
      },
    });

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── 5. إنهاء بطولة (محمي) ──────────────────────────────────────────────────────
export async function completeTournament(tournamentId: string) {
  try {
    await verifyAdmin();

    const existing = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!existing) {
      return { success: false, error: 'البطولة غير موجودة' };
    }

    if (existing.status !== 'active') {
      return { success: false, error: 'يمكن إنهاء البطولات النشطة فقط' };
    }

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: 'completed',
        endDate: new Date(), // تعيين تاريخ الانتهاء عند الضغط على زر الإنهاء
      },
    });

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── 6. حذف بطولة (محمي مع فحص أمان) ─────────────────────────────────────────────
export async function deleteTournament(tournamentId: string) {
  try {
    await verifyAdmin();

    const existing = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { matches: true },
        },
      },
    });

    if (!existing) {
      return { success: false, error: 'البطولة غير موجودة' };
    }

    // منع الحذف للبطولات النشطة أو التي تحتوي على مباريات مسجلة
    if (existing.status === 'active') {
      return { success: false, error: 'لا يمكن حذف بطولة نشطة حالياً. يرجى إنهائها أولاً' };
    }

    if (existing._count.matches > 0) {
      return {
        success: false,
        error: 'لا يمكن حذف بطولة تحتوي على مباريات مسجلة حفاظاً على سلامة البيانات التاريخية',
      };
    }

    await prisma.tournament.delete({
      where: { id: tournamentId },
    });

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
