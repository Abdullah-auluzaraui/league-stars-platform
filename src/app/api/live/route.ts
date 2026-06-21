import { NextRequest } from 'next/server';
import { prisma } from '@/core/lib/prisma';

// GET /api/live?tournamentId=xxx — SSE للبث المباشر
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // إرسال البيانات الأولية
      const sendData = async () => {
        try {
          const where = tournamentId
            ? { tournamentId, status: { in: ['live', 'finished'] } }
            : { status: { in: ['live', 'finished'] } };

          const matches = await prisma.match.findMany({
            where,
            select: {
              id: true,
              homeScore: true,
              awayScore: true,
              status: true,
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
            },
          });

          const data = JSON.stringify({ type: 'scores', matches, timestamp: Date.now() });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('SSE error:', error);
        }
      };

      // إرسال فوري
      await sendData();

      // تحديث كل 10 ثوانٍ
      const interval = setInterval(sendData, 10000);

      // heartbeat كل 30 ثانية لمنع انتهاء الاتصال
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      // التنظيف عند إغلاق الاتصال
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx: لا تخزن مؤقتاً
    },
  });
}

// هذا الـ route لا يحتاج static generation
export const dynamic = 'force-dynamic';
