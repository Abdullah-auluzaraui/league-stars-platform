import { z } from 'zod';

export const submitVoteSchema = z.object({
  goalId: z.string({ error: 'معرّف الهدف مطلوب' }).cuid(),
  fingerprint: z
    .string({ error: 'بصمة المتصفح مطلوبة' })
    .min(10, 'بصمة غير صحيحة'),
  token: z.string({ error: 'رمز التحقق البشري مطلوب' }),
});

export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;
