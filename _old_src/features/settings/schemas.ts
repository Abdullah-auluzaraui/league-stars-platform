import { z } from 'zod';

export const updateSettingSchema = z.object({
  key: z.string({ error: 'مفتاح الإعداد مطلوب' }).min(1),
  value: z.string({ error: 'قيمة الإعداد مطلوبة' }),
});

export const updateHeroSchema = z.object({
  title: z.string().min(2, 'العنوان قصير جداً').max(200).optional(),
  body: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url('رابط الصورة غير صحيح').optional().nullable(),
});

export const updateColorsSchema = z.object({
  primary: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Ø§Ù„Ù„ÙˆÙ† ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¨ØµÙŠØºØ© HEX Ù…Ø«Ù„ #750722')
    .optional(),
  accent: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Ø§Ù„Ù„ÙˆÙ† ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¨ØµÙŠØºØ© HEX Ù…Ø«Ù„ #C92142')
    .optional(),
  background: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const updateSponsorSchema = z.object({
  sponsorId: z.string().cuid().optional(),
  name: z.string().min(2, 'Ø§Ø³Ù… Ø§Ù„Ø±Ø§Ø¹ÙŠ Ù…Ø·Ù„ÙˆØ¨').max(100),
  logoUrl: z.string().url('Ø±Ø§Ø¨Ø· Ø§Ù„Ø´Ø¹Ø§Ø± ØºÙŠØ± ØµØ­ÙŠØ­'),
  websiteUrl: z.string().url('Ø§Ù„Ø±Ø§Ø¨Ø· ØºÙŠØ± ØµØ­ÙŠØ­').optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type UpdateHeroInput = z.infer<typeof updateHeroSchema>;
export type UpdateColorsInput = z.infer<typeof updateColorsSchema>;
export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>;

