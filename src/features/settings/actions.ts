'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/core/lib/prisma';
import { verifyAdmin } from '@/core/lib/auth';
import { validateAction, handleActionError } from '@/core/lib/validation';
import { updateSettingSchema, updateHeroSchema, updateSponsorSchema } from './schemas';

// ── جلب جميع الإعدادات ──
export async function getSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

// ── جلب إعداد واحد ──
export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

// ── تحديث إعداد ──
export async function updateSetting(formData: FormData) {
  try {
    await verifyAdmin();

    const result = validateAction(updateSettingSchema, {
      key: formData.get('key'),
      value: formData.get('value'),
    });

    if (!result.success) {
      return { success: false, error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
    }

    await prisma.setting.upsert({
      where: { key: result.data.key },
      update: { value: result.data.value },
      create: { key: result.data.key, value: result.data.value },
    });
    revalidateTag('settings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ── تحديث هيرو الصفحة الرئيسية ──
export async function updateHero(formData: FormData) {
  try {
    await verifyAdmin();

    const result = validateAction(updateHeroSchema, {
      title: formData.get('title'),
      body: formData.get('body'),
      imageUrl: formData.get('imageUrl'),
    });

    if (!result.success) {
      return { success: false, error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
    }

    const updates: Array<Promise<unknown>> = [];

    if (result.data.title !== undefined) {
      updates.push(
        prisma.content.upsert({
          where: { section: 'hero_title' },
          update: { title: result.data.title },
          create: { section: 'hero_title', title: result.data.title, body: '' },
        })
      );
    }

    if (result.data.body !== undefined) {
      updates.push(
        prisma.content.upsert({
          where: { section: 'hero_body' },
          update: { body: result.data.body ?? '' },
          create: { section: 'hero_body', title: 'وصف البطولة', body: result.data.body ?? '' },
        })
      );
    }

    if (result.data.imageUrl !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'hero_image' },
          update: { value: result.data.imageUrl ?? '' },
          create: { key: 'hero_image', value: result.data.imageUrl ?? '' },
        })
      );
    }

    await Promise.all(updates);
    revalidateTag('settings');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ── إدارة الرعاة ──
export async function upsertSponsor(formData: FormData) {
  try {
    await verifyAdmin();

    const result = validateAction(updateSponsorSchema, {
      sponsorId: formData.get('sponsorId'),
      name: formData.get('name'),
      logoUrl: formData.get('logoUrl'),
      websiteUrl: formData.get('websiteUrl'),
      displayOrder: formData.get('displayOrder'),
      isActive: formData.get('isActive') === 'true',
    });

    if (!result.success) {
      return { success: false, error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
    }

    if (result.data.sponsorId) {
      await prisma.sponsor.update({
        where: { id: result.data.sponsorId },
        data: {
          name: result.data.name,
          logoUrl: result.data.logoUrl,
          websiteUrl: result.data.websiteUrl ?? null,
          displayOrder: result.data.displayOrder,
          isActive: result.data.isActive,
        },
      });
    } else {
      await prisma.sponsor.create({
        data: {
          name: result.data.name,
          logoUrl: result.data.logoUrl,
          websiteUrl: result.data.websiteUrl ?? null,
          displayOrder: result.data.displayOrder,
          isActive: result.data.isActive,
        },
      });
    }

    revalidateTag('sponsors');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteSponsor(sponsorId: string) {
  try {
    await verifyAdmin();
    await prisma.sponsor.delete({ where: { id: sponsorId } });
    revalidateTag('sponsors');
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ── جلب الرعاة ──
export async function getSponsors(activeOnly = true) {
  return prisma.sponsor.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { displayOrder: 'asc' },
  });
}
