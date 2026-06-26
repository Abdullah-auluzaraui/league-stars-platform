import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/core/lib/auth';

// المسارات التي تتطلب مصادقة
const PROTECTED_PATHS = ['/api/admin', '/admin'];

// المسارات العامة التي لا تحتاج فحص
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/live',
  '/api/vote',
  '/login',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // تخطي المسارات العامة
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // فحص المسارات المحمية فقط
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  // التحقق من التوكن
  const token = request.cookies.get('adminToken')?.value;

  if (!token) {
    // إعادة التوجيه لصفحة الدخول
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);

  if (!payload || payload.role !== 'admin') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // إضافة معلومات المستخدم للـ headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId as string);
  requestHeaders.set('x-user-role', payload.role as string);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    /*
     * تطابق جميع المسارات ما عدا:
     * - _next/static — ملفات ثابتة
     * - _next/image — تحسين الصور
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
