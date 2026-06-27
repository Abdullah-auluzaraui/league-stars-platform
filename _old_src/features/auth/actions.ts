'use server';

import { redirect } from 'next/navigation';
import { compare } from 'bcryptjs';
import { prisma } from '@/core/lib/prisma';
import { signToken, setAuthCookie, clearAuthCookie } from '@/core/lib/auth';
import { validateAction } from '@/core/lib/validation';
import { loginSchema } from './schemas';

// ── تسجيل الدخول ──
export async function login(formData: FormData) {
  const result = validateAction(loginSchema, {
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return { error: result.errors[0]?.message ?? 'بيانات غير صحيحة' };
  }

  const { username, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  const isValid = await compare(password, user.passwordHash);

  if (!isValid) {
    return { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  const token = await signToken({ userId: user.id, username: user.username, role: user.role });
  await setAuthCookie(token);

  redirect('/');
}

// ── تسجيل الخروج ──
export async function logout() {
  await clearAuthCookie();
  redirect('/');
}

// ── التحقق من الجلسة (للـ Client Components) ──
export async function getSession() {
  try {
    const { verifyAdmin } = await import('@/core/lib/auth');
    const payload = await verifyAdmin();
    if (!payload) return null;
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}
