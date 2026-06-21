import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { ActionError } from './validation';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-change-in-production'
);
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
    .sign(JWT_SECRET);
}

// ─── التحقق من JWT Token ─────────────────────────────────────────────────────
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
