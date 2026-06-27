'use client';

import { useEffect, useState, useRef } from 'react';

export interface LiveMatchData {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeTeam: { id: string; name: string; logoUrl?: string | null };
  awayTeam: { id: string; name: string; logoUrl?: string | null };
}

export function useLiveScore(tournamentId?: string | null) {
  const [liveMatches, setLiveMatches] = useState<Record<string, LiveMatchData>>({});
  const [updatedMatchId, setUpdatedMatchId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let active = true;

    function connect() {
      if (!active) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = tournamentId
        ? `/api/live?tournamentId=${tournamentId}`
        : '/api/live';

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'scores' && Array.isArray(data.matches)) {
            setLiveMatches((prev) => {
              const next: Record<string, LiveMatchData> = {};
              data.matches.forEach((m: LiveMatchData) => {
                next[m.id] = m;
                // تحديد ما إذا كانت النتيجة قد تغيرت لتفعيل أنيميشن الوميض
                const prevMatch = prev[m.id];
                if (
                  prevMatch &&
                  (prevMatch.homeScore !== m.homeScore || prevMatch.awayScore !== m.awayScore)
                ) {
                  setUpdatedMatchId(m.id);
                  // إعادة تعيين كود المباراة بعد انتهاء الأنيميشن
                  setTimeout(() => {
                    setUpdatedMatchId((curr) => (curr === m.id ? null : curr));
                  }, 1500);
                }
              });
              return next;
            });
          }
        } catch (error) {
          console.error('Error parsing live match scores:', error);
        }
      };

      es.onerror = () => {
        // EventSource سيعيد الاتصال تلقائياً، هذا السلوك طبيعي عند قطع الاتصال الدوري بعد 45 ثانية
        console.log('SSE connection timeout/reconnecting...');
      };
    }

    connect();

    // إعادة الاتصال فقط عند تنشيط التبويب لتوفير استهلاك البيانات والبطارية
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        connect();
      } else {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [tournamentId]);

  return { liveMatches, updatedMatchId };
}
