import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string({ error: 'اسم المستخدم مطلوب' })
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(50, 'اسم المستخدم طويل جداً'),
  password: z
    .string({ error: 'كلمة المرور مطلوبة' })
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export type LoginInput = z.infer<typeof loginSchema>;
