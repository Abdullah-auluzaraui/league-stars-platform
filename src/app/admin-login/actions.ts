'use server';

import { isDemoEnabled, DEMO_ADMIN_USERNAME } from '@/core/lib/demo';
import { redirect } from 'next/navigation';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/core/lib/prisma';
import { signToken, setAuthCookie, clearAuthCookie } from '@/core/lib/auth';
import { validateAction } from '@/core/lib/validation';

// ─── مخطط التحقق من البيانات (Login Schema) ──────────────────────────────────
const loginSchema = z.object({
  username: z
    .string({ error: 'اسم المستخدم مطلوب' })
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(50, 'اسم المستخدم طويل جداً')
    .trim(),
  password: z
    .string({ error: 'كلمة المرور مطلوبة' })
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

// ─── تسجيل الدخول (Login Server Action) ───────────────────────────────────────
export async function login(prevState: any, formData: FormData) {
  const usernameInput = formData.get('username');
  const passwordInput = formData.get('password');

  const result = validateAction(loginSchema, {
    username: usernameInput,
    password: passwordInput,
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  const { username, password } = result.data;
  if (username === DEMO_ADMIN_USERNAME && !isDemoEnabled()) {
    return { error: 'وضع الديمو معطّل' };
  }

  try {
    // البحث عن المستخدم في قاعدة البيانات
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      // رسالة مبهمة لأسباب أمنية لمنع تخمين أسماء المستخدمين
      return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    // التحقق من كلمة المرور المشفرة
    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
      return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    // التحقق من الصلاحية (يجب أن يكون مشرفاً)
    if (user.role !== 'admin') {
      return { error: 'غير مصرح لك بالدخول إلى لوحة التحكم' };
    }

    // توليد وحفظ التوكن
    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    
    await setAuthCookie(token);
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'تعذّر تسجيل الدخول، يرجى المحاولة لاحقًا' };
  }

  // التوجيه إلى لوحة التحكم بعد نجاح تسجيل الدخول
  redirect('/admin');
}

// ─── تسجيل الخروج (Logout Server Action) ──────────────────────────────────────
export async function logout() {
  await clearAuthCookie();
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.delete('admin_preview');
  } catch {}
  redirect('/admin-login');
}

// ─── الدخول السريع كمسؤول في وضع الديمو (Demo Login Server Action) ────────────
export async function demoLogin() {
  if (!isDemoEnabled()) {
    return { error: 'وضع الديمو معطّل' };
  }

  try {
    const adminUser = await prisma.user.findFirst({
      where: { username: DEMO_ADMIN_USERNAME, role: 'admin' },
    });

    if (!adminUser) {
      return { error: 'لم يتم العثور على حساب مشرف في قاعدة البيانات' };
    }

    const token = await signToken({
      userId: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
    });

    await setAuthCookie(token);
  } catch (error) {
    console.error('Demo login error:', error);
    return { error: 'تعذّر الدخول التجريبي، يرجى المحاولة لاحقًا' };
  }

  redirect('/admin');
}

