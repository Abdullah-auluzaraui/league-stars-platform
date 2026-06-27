import { NextRequest } from 'next/server';
import { prisma } from '@/core/lib/prisma';

// الذاكرة المؤقتة العالمية لمنع الـ DDoSing على قاعدة البيانات
let cachedScores: any = null;
let lastFetchTime = 0;
let pendingFetch: Promise<any> | null = null;

async function getCachedMatches(tournamentId: string | null) {
  const now = Date.now();

  if (pendingFetch) {
    return pendingFetch;
  }

  // تحديث الذاكرة المؤقتة كل 5 ثوانٍ كحد أقصى
  if (!cachedScores || now - lastFetchTime > 5000) {
    pendingFetch = (async () => {
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
            homeTeam: { select: { id: true, name: true, logoUrl: true } },
            awayTeam: { select: { id: true, name: true, logoUrl: true } },
          },
        });
        cachedScores = matches;
        lastFetchTime = Date.now();
        return matches;
      } finally {
        pendingFetch = null;
      }
    })();
    return pendingFetch;
  }

  return cachedScores;
}

// GET /api/live?tournamentId=xxx — SSE للبث المباشر
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // إرسال البيانات
      const sendData = async () => {
        try {
          const matches = await getCachedMatches(tournamentId);
          const data = JSON.stringify({ type: 'scores', matches, timestamp: Date.now() });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('SSE send error:', error);
        }
      };

      // إرسال فوري عند الاتصال
      await sendData();

      // تحديث دوري كل 5 ثوانٍ
      const interval = setInterval(sendData, 5000);

      // Heartbeat كل 15 ثانية للتأكد من حيوية الاتصال
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          // تجاهل الخطأ في حال إغلاق الاتصال بالفعل
        }
      }, 15000);

      // إنهاء الاتصال بعد 45 ثانية لتفادي مهلة خوادم Serverless (Vercel Timeout)
      const connectionTimeout = setTimeout(() => {
        clearInterval(interval);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (e) {}
      }, 45000);

      // التنظيف عند إلغاء الاتصال من جهة العميل
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        clearTimeout(connectionTimeout);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export const dynamic = 'force-dynamic';
