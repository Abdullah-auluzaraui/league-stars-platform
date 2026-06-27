import { z } from 'zod';

// ── إنشاء مباراة ──
export const createMatchSchema = z.object({
  tournamentId: z.string({ error: 'البطولة مطلوبة' }).cuid(),
  homeTeamId: z.string({ error: 'الفريق المضيف مطلوب' }).cuid(),
  awayTeamId: z.string({ error: 'الفريق الضيف مطلوب' }).cuid(),
  matchDate: z.string({ error: 'تاريخ المباراة مطلوب' }),
  venue: z.string().min(2, 'اسم الملعب مطلوب').default('ملعب البطولة'),
  stage: z.enum(['group', 'round_16', 'quarter', 'semi', 'final'], {
    error: 'مرحلة المباراة مطلوبة',
  }),
  groupName: z.string().optional().nullable(),
}).refine((data) => data.homeTeamId !== data.awayTeamId, {
  message: 'لا يمكن أن يتواجه الفريق مع نفسه',
  path: ['awayTeamId'],
});

// ── تحديث نتيجة ──
export const updateScoreSchema = z.object({
  matchId: z.string({ error: 'معرّف المباراة مطلوب' }).cuid(),
  homeScore: z.coerce.number().int().min(0, 'الرقم لا يمكن أن يكون سالباً'),
  awayScore: z.coerce.number().int().min(0, 'الرقم لا يمكن أن يكون سالباً'),
  homePenalty: z.coerce.number().int().min(0).optional().nullable(),
  awayPenalty: z.coerce.number().int().min(0).optional().nullable(),
  status: z.enum(['scheduled', 'live', 'finished', 'cancelled']).optional(),
});

// ── إضافة هدف ──
export const addGoalSchema = z.object({
  matchId: z.string().cuid(),
  playerId: z.string().cuid(),
  teamId: z.string().cuid(),
  type: z.enum(['normal', 'penalty', 'own_goal', 'free_kick']).default('normal'),
  minute: z.coerce.number().int().min(1).max(120),
  videoUrl: z.string().url('رابط الفيديو غير صحيح').optional().nullable(),
  isNominated: z.boolean().default(false),
});

// ── إضافة بطاقة ──
export const addCardSchema = z.object({
  matchId: z.string().cuid(),
  playerId: z.string().cuid(),
  teamId: z.string().cuid(),
  type: z.enum(['yellow', 'red', 'second_yellow']),
  minute: z.coerce.number().int().min(1).max(120),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateScoreInput = z.infer<typeof updateScoreSchema>;
export type AddGoalInput = z.infer<typeof addGoalSchema>;
export type AddCardInput = z.infer<typeof addCardSchema>;
