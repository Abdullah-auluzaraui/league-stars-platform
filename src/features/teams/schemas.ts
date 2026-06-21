import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z
    .string({ error: 'اسم الفريق مطلوب' })
    .min(2, 'اسم الفريق قصير جداً')
    .max(100, 'اسم الفريق طويل جداً'),
  logoUrl: z.string().url('رابط الشعار غير صحيح').optional().nullable(),
  tournamentId: z.string().cuid().optional().nullable(),
  groupName: z.string().optional().nullable(),
});

export const updateTeamSchema = z.object({
  teamId: z.string({ error: 'معرّف الفريق مطلوب' }).cuid(),
  name: z.string().min(2, 'اسم الفريق قصير جداً').optional(),
  logoUrl: z.string().url('رابط الشعار غير صحيح').optional().nullable(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
