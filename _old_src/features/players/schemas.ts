import { z } from 'zod';

export const createPlayerSchema = z.object({
  name: z
    .string({ error: 'اسم اللاعب مطلوب' })
    .min(2, 'الاسم قصير جداً')
    .max(100, 'الاسم طويل جداً'),
  jerseyNumber: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z
      .number()
      .int()
      .min(1, 'رقم القميص يجب أن يكون 1 على الأقل')
      .max(99, 'رقم القميص يجب أن يكون 99 كحد أقصى')
      .nullable()
      .optional()
  ),
  teamId: z.string({ error: 'الفريق مطلوب' }).cuid(),
  position: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']).nullable().optional()
  ),
  photoUrl: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.string().url().nullable().optional()
  ),
});

export const updatePlayerSchema = z.object({
  playerId: z.string({ error: 'معرّف اللاعب مطلوب' }).cuid(),
  name: z.string().min(2).max(100).optional(),
  jerseyNumber: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number().int().min(1).max(99).nullable().optional()
  ),
  position: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']).nullable().optional()
  ),
  photoUrl: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.string().url().nullable().optional()
  ),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;


