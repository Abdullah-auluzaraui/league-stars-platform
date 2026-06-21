import { z } from 'zod';

export const createPlayerSchema = z.object({
  name: z
    .string({ error: 'اسم اللاعب مطلوب' })
    .min(2, 'الاسم قصير جداً')
    .max(100, 'الاسم طويل جداً'),
  jerseyNumber: z.coerce
    .number({ error: 'رقم القميص مطلوب' })
    .int()
    .min(1, 'رقم القميص يجب أن يكون 1 على الأقل')
    .max(99, 'رقم القميص يجب أن يكون 99 كحد أقصى'),
  teamId: z.string({ error: 'الفريق مطلوب' }).cuid(),
  position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']).optional(),
  photoUrl: z.string().url().optional().nullable(),
});

export const updatePlayerSchema = z.object({
  playerId: z.string({ error: 'معرّف اللاعب مطلوب' }).cuid(),
  name: z.string().min(2).max(100).optional(),
  jerseyNumber: z.coerce.number().int().min(1).max(99).optional(),
  position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
