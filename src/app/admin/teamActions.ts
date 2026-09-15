'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction, handleActionError } from '@/core/lib/validation';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ─── مخطط التحقق من البيانات للفريق ──────────────────────────────────────────
const teamSchema = z.object({
  name: z
    .string()
    .min(2, 'اسم الفريق يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم الفريق طويل جداً')
    .trim(),
  logoUrl: z.string().optional().nullable(),
  tournamentId: z.string().optional().nullable(),
  groupDistribution: z.enum(['auto', 'manual']).optional().default('auto'),
  groupName: z.string().optional().nullable(),
  status: z.enum(['active', 'disqualified']).optional().default('active'),
});

// ─── دالة حفظ الملف المرفوع محلياً في مجلد public ──────────────────────────────
async function saveUploadedFile(file: File): Promise<string | null> {
  if (!file || file.size === 0 || !file.name) return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // مسار مجلد الرفع داخل المجلد العام (public)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    await mkdir(uploadDir, { recursive: true });

    // تنظيف اسم الملف وتوليد اسم فريد لتجنب التكرار
    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueFilename = `${Date.now()}-${cleanName}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await writeFile(filePath, buffer);

    // إرجاع المسار النسبي الذي يخدمه Next.js بشكل استاتيكي
    return `/uploads/logos/${uniqueFilename}`;
  } catch (err) {
    console.error('Error saving uploaded file:', err);
    return null;
  }
}

// ─── دالة حساب المجموعة الأقل عدداً بالفرق لتوازن التوزيع تلقائياً ──────────────
async function calculateAutoGroup(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament || tournament.type !== 'group_stage') {
    return null;
  }

  // توليد أسماء المجموعات المتاحة بناءً على عدد مجموعات البطولة (A, B, C...)
  const availableGroups = Array.from({ length: tournament.groupCount }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  // جلب جميع ارتباطات الفرق الحالية في البطولة
  const currentTeams = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    select: { groupName: true },
  });

  // حساب عدد الفرق في كل مجموعة
  const groupCounts: Record<string, number> = {};
  for (const g of availableGroups) {
    groupCounts[g] = 0;
  }
  for (const t of currentTeams) {
    if (t.groupName && t.groupName in groupCounts) {
      groupCounts[t.groupName]++;
    }
  }

  // العثور على المجموعة الأقل عدداً بالفرق (وفي حال التساوي نختار الأبجدية الأولى A قبل B)
  let bestGroup = availableGroups[0] || null;
  let minCount = Infinity;

  for (const g of availableGroups) {
    if (groupCounts[g] < minCount) {
      minCount = groupCounts[g];
      bestGroup = g;
    }
  }

  return bestGroup;
}

// ─── 1. جلب الفرق (عام) ────────────────────────────────────────────────────────
export async function getTeams(includeArchived = false) {
  try {
    return await prisma.team.findMany({
      where: {
        archivedAt: includeArchived ? undefined : null,
      },
      include: {
        tournaments: {
          include: {
            tournament: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw new Error('فشل جلب الفرق من قاعدة البيانات');
  }
}

// ─── 2. إنشاء فريق جديد (محمي) ──────────────────────────────────────────────────
export async function createTeam(formData: FormData) {
  try {
    await verifyAdmin();

    const logoFile = formData.get('logoFile') as File | null;
    let finalLogoUrl = (formData.get('logoUrl') || '') as string;

    // إذا رفع المستخدم ملفاً، نقوم بحفظه محلياً واستخدام مساره
    if (logoFile && logoFile.size > 0 && logoFile.name) {
      const uploadedPath = await saveUploadedFile(logoFile);
      if (uploadedPath) {
        finalLogoUrl = uploadedPath;
      }
    }

    const result = validateAction(teamSchema, {
      name: formData.get('name'),
      logoUrl: finalLogoUrl,
      tournamentId: formData.get('tournamentId') || null,
      groupDistribution: formData.get('groupDistribution') || 'auto',
      groupName: formData.get('groupName') || null,
      status: formData.get('status') || 'active',
    });

    if (!result.success) {
      return { success: false, error: result.errors?.[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const { name, logoUrl, tournamentId, groupDistribution, groupName, status } = result.data;

    // فحص تكرار اسم الفريق
    const existing = await prisma.team.findUnique({
      where: { name },
    });

    if (existing) {
      return { success: false, error: 'يوجد فريق آخر مسجل بنفس الاسم حالياً' };
    }

    const team = await prisma.team.create({
      data: {
        name,
        logoUrl: logoUrl || null,
      },
    });

    // ربط بالبطولة إذا تم تحديدها
    if (tournamentId && tournamentId !== 'none') {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      let finalGroupName = null;
      if (tournament && tournament.type === 'group_stage') {
        if (groupDistribution === 'auto') {
          finalGroupName = await calculateAutoGroup(tournamentId);
        } else {
          finalGroupName = groupName;
        }
      }

      await prisma.tournamentTeam.create({
        data: {
          teamId: team.id,
          tournamentId,
          groupName: finalGroupName,
          status: status || 'active',
        },
      });
    }

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true, teamId: team.id };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── 3. تحديث بيانات فريق (محمي) ─────────────────────────────────────────────────
export async function updateTeam(formData: FormData) {
  try {
    await verifyAdmin();
    const id = formData.get('id') as string;

    const logoFile = formData.get('logoFile') as File | null;
    let finalLogoUrl = (formData.get('logoUrl') || '') as string;

    // إذا رفع المستخدم ملفاً، نقوم بحفظه محلياً واستخدام مساره
    if (logoFile && logoFile.size > 0 && logoFile.name) {
      const uploadedPath = await saveUploadedFile(logoFile);
      if (uploadedPath) {
        finalLogoUrl = uploadedPath;
      }
    }

    const result = validateAction(teamSchema, {
      name: formData.get('name'),
      logoUrl: finalLogoUrl,
      tournamentId: formData.get('tournamentId') || null,
      groupDistribution: formData.get('groupDistribution') || 'auto',
      groupName: formData.get('groupName') || null,
      status: formData.get('status') || 'active',
    });

    if (!result.success || !id) {
      return { success: false, error: result.errors?.[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const { name, logoUrl, tournamentId, groupDistribution, groupName, status } = result.data;

    const existingTeam = await prisma.team.findUnique({
      where: { id },
    });

    if (!existingTeam) {
      return { success: false, error: 'الفريق غير موجود' };
    }

    // فحص الاسم المكرر
    if (name !== existingTeam.name) {
      const duplicate = await prisma.team.findUnique({
        where: { name },
      });
      if (duplicate) {
        return { success: false, error: 'يوجد فريق آخر مسجل بنفس الاسم حالياً' };
      }
    }

    // تحديث بيانات الفريق الأساسية
    await prisma.team.update({
      where: { id },
      data: {
        name,
        logoUrl: logoUrl || null,
      },
    });

    // التعامل مع ربط البطولة
    if (!tournamentId || tournamentId === 'none') {
      // إزالة أي ارتباط بالبطولات لهذا الفريق
      await prisma.tournamentTeam.deleteMany({
        where: { teamId: id },
      });
    } else {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      let finalGroupName = null;
      if (tournament && tournament.type === 'group_stage') {
        if (groupDistribution === 'auto') {
          // حساب المجموعة الأقل عدداً بالفرق
          finalGroupName = await calculateAutoGroup(tournamentId);
        } else {
          finalGroupName = groupName;
        }
      }

      // إلغاء الارتباطات القديمة لإنشاء ارتباط جديد نظيف (افتراض بطولة نشطة واحدة)
      await prisma.tournamentTeam.deleteMany({
        where: { teamId: id },
      });

      await prisma.tournamentTeam.create({
        data: {
          teamId: id,
          tournamentId,
          groupName: finalGroupName,
          status: status || 'active',
        },
      });
    }

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

const CORE_TEAM_NAMES = [
  'نجوم اليرموك',
  'صقور العاصمة',
  'أسود طويق',
  'شعلة النخيل',
  'درع الصحراء',
  'فهود نجد',
  'أمل المروج',
  'فرسان الملز',
];

// ─── 4. أرشفة فريق (محمي) ────────────────────────────────────────────────────────
export async function archiveTeam(teamId: string) {
  try {
    await verifyAdmin();

    if (process.env.DEMO_MODE === 'true' && process.env.DEMO_DATABASE === 'true') {
      const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
      if (team && CORE_TEAM_NAMES.includes(team.name)) {
        return {
          success: false,
          error: 'عفواً، هذا الفريق من الفرق الأساسية في نسخة العرض ومحمي من الأرشفة لضمان استقرار جداول الترتيب والهدافين. يمكنك إنشاء فرق جديدة وأرشفتها بحرية!',
        };
      }
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { archivedAt: new Date() },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── 5. إلغاء أرشفة فريق (محمي) ───────────────────────────────────────────────────
export async function unarchiveTeam(teamId: string) {
  try {
    await verifyAdmin();

    await prisma.team.update({
      where: { id: teamId },
      data: { archivedAt: null },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── 6. حذف فريق (محمي مع تحويل ذكي للأرشفة عند الحاجة) ───────────────────────────
export async function deleteTeam(teamId: string) {
  try {
    await verifyAdmin();

    if (process.env.DEMO_MODE === 'true' && process.env.DEMO_DATABASE === 'true') {
      const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
      if (team && CORE_TEAM_NAMES.includes(team.name)) {
        return {
          success: false,
          error: 'عفواً، هذا الفريق أساسي في نسخة العرض التجريبية ومحمي من الحذف. يمكنك إنشاء فرق جديدة وحذفها بحرية!',
        };
      }
    }

    // فحص ما إذا كان للفريق أي مباريات مسجلة لحماية البيانات التاريخية
    const matchCount = await prisma.match.count({
      where: {
        OR: [
          { homeTeamId: teamId },
          { awayTeamId: teamId },
        ],
      },
    });

    if (matchCount > 0) {
      return {
        success: false,
        requireArchive: true,
        error: 'هذا الفريق لديه سجل مباريات في المنصة ولا يمكن حذفه نهائياً لحفظ البيانات التاريخية.',
      };
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    revalidatePath('/admin');
    revalidatePath('/standings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
