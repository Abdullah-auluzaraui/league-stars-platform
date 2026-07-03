import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { ActionError } from './validation';

let jwtSecretCache: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (jwtSecretCache) return jwtSecretCache;
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
  }
  jwtSecretCache = new TextEncoder().encode(
    secret ?? 'fallback-secret-change-in-production-league-stars'
  );
  return jwtSecretCache;
}

const COOKIE_NAME = 'adminToken';

// ─── توليد JWT Token ─────────────────────────────────────────────────────────
export async function signToken(payload: {
  userId: string;
  username: string;
  role: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

// ─── التحقق من JWT Token ─────────────────────────────────────────────────────
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { userId: string; username: string; role: string };
  } catch {
    return null;
  }
}

// ─── جلب التوكن من الكوكيز ──────────────────────────────────────────────────
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

// ─── التحقق من صلاحيات المشرف (للاستخدام في Server Actions) ────────────────
export async function verifyAdmin() {
  const token = await getTokenFromCookies();
  if (!token) {
    throw new ActionError('UNAUTHORIZED', 'يجب تسجيل الدخول للقيام بهذا الإجراء');
  }
  const payload = await verifyToken(token);
  if (!payload) {
    throw new ActionError('INVALID_TOKEN', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
  }
  return payload;
}

// ─── حفظ التوكن في الكوكيز ──────────────────────────────────────────────────
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 أيام
    path: '/',
  });
}

// ─── حذف التوكن (تسجيل الخروج) ─────────────────────────────────────────────
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
