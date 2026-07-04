'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction, handleActionError } from '@/core/lib/validation';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ─── Zod Schema for Sponsor ──────────────────────────────────────────────────
const sponsorSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').trim(),
  logoUrl: z.string().trim(),
  websiteUrl: z.string().trim().optional().nullable(),
  displayOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// Helper to save sponsor logo file
async function saveUploadedSponsorLogo(file: File): Promise<string | null> {
  if (!file || file.size === 0 || !file.name) return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'sponsors');
    await mkdir(uploadDir, { recursive: true });

    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueFilename = `${Date.now()}-${cleanName}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await writeFile(filePath, buffer);

    return `/uploads/sponsors/${uniqueFilename}`;
  } catch (err) {
    console.error('Error saving sponsor logo file:', err);
    return null;
  }
}

// ─── Sponsors Actions ────────────────────────────────────────────────────────

export async function getSponsors() {
  try {
    return await prisma.sponsor.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    throw new Error('فشل جلب قائمة الرعاة');
  }
}

export async function createSponsor(formData: FormData) {
  try {
    await verifyAdmin();

    const logoFile = formData.get('logoFile') as File | null;
    let finalLogoUrl = (formData.get('logoUrl') || '') as string;

    if (logoFile && logoFile.size > 0 && logoFile.name) {
      const uploadedPath = await saveUploadedSponsorLogo(logoFile);
      if (uploadedPath) {
        finalLogoUrl = uploadedPath;
      }
    }

    const rawDisplayOrder = formData.get('displayOrder');
    const displayOrder = rawDisplayOrder ? parseInt(rawDisplayOrder as string, 10) : 0;
    const isActive = formData.get('isActive') === 'true';

    const result = validateAction(sponsorSchema, {
      name: formData.get('name'),
      logoUrl: finalLogoUrl,
      websiteUrl: formData.get('websiteUrl') || null,
      displayOrder,
      isActive,
    });

    if (!result.success) {
      return { success: false, error: result.errors?.[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const sponsor = await prisma.sponsor.create({
      data: result.data,
    });

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true as const, sponsor };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSponsor(formData: FormData) {
  try {
    await verifyAdmin();

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'معرف الراعي مفقود' };
    }

    const logoFile = formData.get('logoFile') as File | null;
    let finalLogoUrl = (formData.get('logoUrl') || '') as string;

    if (logoFile && logoFile.size > 0 && logoFile.name) {
      const uploadedPath = await saveUploadedSponsorLogo(logoFile);
      if (uploadedPath) {
        finalLogoUrl = uploadedPath;
      }
    }

    const rawDisplayOrder = formData.get('displayOrder');
    const displayOrder = rawDisplayOrder ? parseInt(rawDisplayOrder as string, 10) : 0;
    const isActive = formData.get('isActive') === 'true';

    const result = validateAction(sponsorSchema, {
      name: formData.get('name'),
      logoUrl: finalLogoUrl,
      websiteUrl: formData.get('websiteUrl') || null,
      displayOrder,
      isActive,
    });

    if (!result.success) {
      return { success: false, error: result.errors?.[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: result.data,
    });

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true as const, sponsor };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function toggleSponsorStatus(id: string, isActive: boolean) {
  try {
    await verifyAdmin();
    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true as const, sponsor };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteSponsor(id: string) {
  try {
    await verifyAdmin();
    await prisma.sponsor.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true as const };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Settings Actions ────────────────────────────────────────────────────────

export async function getSettings() {
  try {
    const settings = await prisma.setting.findMany();
    // Convert array to key-value object
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw new Error('فشل جلب الإعدادات');
  }
}

export async function updateSettings(settings: Record<string, string>) {
  try {
    await verifyAdmin();

    const upserts = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

    await prisma.$transaction(upserts);

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/votes');
    return { success: true as const };
  } catch (error) {
    return handleActionError(error);
  }
}

// ─── Content Actions ─────────────────────────────────────────────────────────

export async function getHeroContent() {
  try {
    return await prisma.content.findUnique({
      where: { section: 'hero' },
    });
  } catch (error) {
    console.error('Error fetching hero content:', error);
    throw new Error('فشل جلب محتوى البطل');
  }
}

export async function updateHeroContent(title: string, body: string) {
  try {
    await verifyAdmin();

    const content = await prisma.content.upsert({
      where: { section: 'hero' },
      update: { title, body },
      create: { section: 'hero', title, body },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true as const, content };
  } catch (error) {
    return handleActionError(error);
  }
}
