import { NextResponse } from 'next/server';
import { prisma } from '@/core/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Keep Supabase active by executing a lightweight query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        service: 'league-stars',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
