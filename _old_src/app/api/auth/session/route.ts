import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/core/lib/auth';
import { prisma } from '@/core/lib/prisma';

// GET /api/auth/session — التحقق من الجلسة
export async function GET(request: NextRequest) {
  const token = request.cookies.get('adminToken')?.value;

  if (!token) {
    return NextResponse.json({ isAdmin: false });
  }

  const payload = await verifyToken(token);

  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ isAdmin: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ isAdmin: false });
  }

  return NextResponse.json({
    isAdmin: true,
    user: { userId: user.id, username: user.username, role: user.role },
  });
}
