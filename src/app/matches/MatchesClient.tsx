'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { MapPin, Clock, ChevronDown, ChevronUp, Goal, Shield, AlertTriangle, Zap, Calendar, Tv } from 'lucide-react';
import type { MatchWithEvents } from './page';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

function getGoalTypeLabel(type: string) {
  switch (type) {
    case 'penalty': return '(ض.ج)';
    case 'own_goal': return '(هدف عكسي)';
    case 'free_kick': return '(ركلة حرة)';
    default: return '';
  }
}

function getStageName(stage: string) {
  switch (stage) {
    case 'group': return 'دور المجموعات';
    case 'round_16': return 'دور الـ 16';
    case 'quarter': return 'ربع النهائي';
    case 'semi': return 'نصف النهائي';
    case 'final': return 'النهائي';
    default: return stage;
  }
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'live' | 'scheduled' | 'finished';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'live', label: 'مباشر' },
  { value: 'scheduled', label: 'قادمة' },
  { value: 'finished', label: 'منتهية' },
];

// ─── TeamAvatar ────────────────────────────────────────────────────────────────

function TeamAvatar({ name, logoUrl, size = 'md' }: { name: string; logoUrl: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 32 : 42;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  return (
    <div
      className={`relative rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0`}
      style={{ width: dim, height: dim, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={name} fill sizes={`${dim}px`} className="object-contain p-1" />
      ) : (
        <span className={`${textSize} font-black text-white/70`}>{getInitials(name)}</span>
      )}
    </div>
  );
}

// ─── MatchTimeline ─────────────────────────────────────────────────────────────

function MatchTimeline({ match }: { match: MatchWithEvents }) {
  const events = useMemo(() => {
    const g = match.goals.map((g) => ({ ...g, eventType: 'goal' as const, minute: g.minute }));
    const c = match.cards.map((c) => ({ ...c, eventType: 'card' as const, minute: c.minute }));
    return [...g, ...c].sort((a, b) => a.minute - b.minute);
  }, [match]);

  if (events.length === 0) return null;

  const isHomeEvent = (teamId: string) => teamId === match.homeTeam.id;

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] font-bold text-white/55 mb-3 tracking-wider uppercase">أحداث المباراة</p>
      <div className="space-y-1.5">
        {events.map((ev) => {
          const isHome = isHomeEvent(ev.teamId);
          return (
            <div key={ev.id} className={`flex items-center gap-2.5 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Minute bubble */}
              <div
                className="flex-shrink-0 w-8 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
              >
                {ev.minute}&apos;
              </div>

              {/* Center dot on timeline line */}
              <div className="relative flex-shrink-0 flex flex-col items-center">
                {ev.eventType === 'goal' ? (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.45)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgb(34,197,94)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/>
                    </svg>
                  </div>
                ) : ev.type === 'yellow' ? (
                  <div className="w-4 h-5 rounded-sm" style={{ background: '#EAB308', boxShadow: '0 0 8px rgba(234,179,8,0.6)' }} />
                ) : ev.type === 'red' ? (
                  <div className="w-4 h-5 rounded-sm" style={{ background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }} />
                ) : (
                  <div className="w-4 h-5 rounded-sm relative overflow-hidden" style={{ background: '#EAB308' }}>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: '#EF4444' }} />
                  </div>
                )}
              </div>

              {/* Player name + goal type */}
              <div className={`flex flex-col ${isHome ? 'items-start' : 'items-end'} min-w-0`}>
                <span className="text-xs font-bold text-white/85 truncate max-w-[120px]">{ev.player.name}</span>
                {ev.eventType === 'goal' && getGoalTypeLabel(ev.type) && (
                  <span className="text-[10px] text-white/55 font-medium">{getGoalTypeLabel(ev.type)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MatchCard ─────────────────────────────────────────────────────────────────

function MatchCard({ match, index }: { match: MatchWithEvents; index: number }) {
  const [expanded, setExpanded] = useState(match.status === 'live');
  const [showStream, setShowStream] = useState(match.status === 'live');
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const hasEvents = match.goals.length > 0 || match.cards.length > 0;
  const hasPenalty = match.homePenalty !== null && match.awayPenalty !== null;

  return (
    <div
      className={`rounded-2xl overflow-hidden animate-fade-in-up ${
        isLive
          ? 'glass-card-burgundy match-live-glow'
          : match.status === 'scheduled'
          ? 'glass-card-gold match-upcoming-glow'
          : 'glass-card'
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="p-4">
        {/* ── Meta row ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <span className="live-badge">
                <span className="live-dot" />
                مباشر الآن
              </span>
            ) : isFinished ? (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
              >
                انتهت
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(201,151,26,0.15)', color: 'rgba(201,151,26,0.9)', border: '1px solid rgba(201,151,26,0.3)' }}
              >
                <Calendar className="w-3 h-3" />
                {formatDateShort(match.matchDate)} — {formatTime(match.matchDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/50 font-medium">
            {match.groupName && <span>المجموعة {match.groupName}</span>}
            {match.groupName && <span>·</span>}
            <span>{getStageName(match.stage)}</span>
          </div>
        </div>

        {/* ── Teams & Score ── */}
        <div className="flex items-center justify-between gap-3">
          {/* Home team */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <TeamAvatar name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} />
            <span className="text-xs font-bold text-white/80 text-center leading-tight line-clamp-2">{match.homeTeam.name}</span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-2">
            {isLive || isFinished ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-3xl sm:text-4xl font-black score-number"
                    style={{ color: isLive ? '#fc8181' : '#F3EED9', textShadow: isLive ? '0 0 20px rgba(239,68,68,0.4)' : 'none' }}
                  >
                    {match.homeScore ?? 0}
                  </span>
                  <span className="text-xl font-medium text-white/40">:</span>
                  <span
                    className="text-3xl sm:text-4xl font-black score-number"
                    style={{ color: isLive ? '#fc8181' : '#F3EED9', textShadow: isLive ? '0 0 20px rgba(239,68,68,0.4)' : 'none' }}
                  >
                    {match.awayScore ?? 0}
                  </span>
                </div>
                {hasPenalty && (
                  <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'rgba(201,151,26,0.85)' }}>
                    <span>ر.ت</span>
                    <span className="score-number">{match.homePenalty} – {match.awayPenalty}</span>
                  </div>
                )}
                {isLive && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-400/70 mt-0.5">
                    <Zap className="w-2.5 h-2.5 animate-live-blink" />
                    <span className="animate-live-blink">جارية</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-black text-white/40">VS</span>
                <span className="text-[11px] text-white/55 font-medium">{formatTime(match.matchDate)}</span>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <TeamAvatar name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} />
            <span className="text-xs font-bold text-white/80 text-center leading-tight line-clamp-2">{match.awayTeam.name}</span>
          </div>
        </div>

        {/* ── Venue + Date row ── */}
        {(match.venue || isFinished) && (
          <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-white/50 font-medium">
            {match.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {match.venue}
              </span>
            )}
            {isFinished && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(match.matchDate)}
                </span>
              </>
            )}
          </div>
        )}

        {/* ── Livestream Toggle/Player ── */}
        {isLive && match.streamUrl && (
          <div className="mt-4 border-t border-white/5 pt-4">
            {!showStream ? (
              <button
                onClick={() => setShowStream(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-l from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg hover:shadow-red-900/20 active:scale-[0.98] cursor-pointer"
              >
                <Tv className="w-4 h-4 text-white" />
                <span>عرض البث المباشر للمباراة</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-400 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span>بث مباشر جاري الآن</span>
                  </span>
                  <button
                    onClick={() => setShowStream(false)}
                    className="text-[10px] font-bold text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    إغلاق البث
                  </button>
                </div>
                
                {getYouTubeId(match.streamUrl) ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(match.streamUrl)}?autoplay=1`}
                      title="YouTube Live Stream"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-white/2 border border-white/5 rounded-xl text-center">
                    <p className="text-xs text-white/60 mb-2 font-semibold">رابط البث غير مدعوم للمشاهدة المباشرة بداخل الصفحة.</p>
                    <a
                      href={match.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#F0C040] hover:underline"
                    >
                      <span>الذهاب لرابط البث المباشر</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Expand / Collapse toggle ── */}
        {hasEvents && (
          <button
            id={`match-details-toggle-${match.id}`}
            onClick={() => setExpanded((v) => !v)}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 hover:bg-white/[0.04] cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
            aria-expanded={expanded}
            aria-label={expanded ? 'إخفاء أحداث المباراة' : 'عرض أحداث المباراة'}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>إخفاء الأحداث</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>عرض الأحداث ({match.goals.length + match.cards.length})</span>
              </>
            )}
          </button>
        )}

        {/* ── Timeline (expandable) ── */}
        {expanded && hasEvents && <MatchTimeline match={match} />}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterStatus }) {
  const messages: Record<FilterStatus, string> = {
    all: 'لا توجد مباريات مسجلة بعد',
    live: 'لا توجد مباريات تُلعب الآن',
    scheduled: 'لا توجد مباريات قادمة',
    finished: 'لا توجد مباريات منتهية',
  };
  return (
    <div className="glass-card rounded-2xl p-10 text-center">
      <div className="text-3xl mb-3">⚽</div>
      <p className="text-white/30 font-semibold text-sm">{messages[filter]}</p>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function MatchesClient({ matches }: { matches: MatchWithEvents[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  // Derive unique groups for a potential group filter
  const groups = useMemo(() => {
    const g = new Set<string>();
    matches.forEach((m) => { if (m.groupName) g.add(m.groupName); });
    return [...g].sort();
  }, [matches]);

  const [activeGroup, setActiveGroup] = useState<string>('all');

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const statusMatch = activeFilter === 'all' || m.status === activeFilter;
      const groupMatch = activeGroup === 'all' || m.groupName === activeGroup;
      return statusMatch && groupMatch;
    });
  }, [matches, activeFilter, activeGroup]);

  // Sort: live first, then scheduled, then finished
  const sorted = useMemo(() => {
    const order: Record<string, number> = { live: 0, scheduled: 1, finished: 2 };
    return [...filtered].sort((a, b) => {
      const orderDiff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
      if (orderDiff !== 0) return orderDiff;
      // Within scheduled: ascending date; within finished: descending date
      if (a.status === 'scheduled') return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
      return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
    });
  }, [filtered]);

  // Counts for filter badges
  const counts = useMemo(() => ({
    all: matches.length,
    live: matches.filter((m) => m.status === 'live').length,
    scheduled: matches.filter((m) => m.status === 'scheduled').length,
    finished: matches.filter((m) => m.status === 'finished').length,
  }), [matches]);

  return (
    <div>
      {/* ── Status Filters ── */}
      <div className="flex gap-2 mb-4 flex-wrap animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        {STATUS_FILTERS.map((f) => {
          const isActive = activeFilter === f.value;
          const count = counts[f.value];
          return (
            <button
              key={f.value}
              id={`filter-${f.value}`}
              onClick={() => setActiveFilter(f.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                isActive
                  ? f.value === 'live'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/40'
                  : 'text-white/35 hover:text-white/70 border border-white/[0.06] hover:border-white/15 bg-white/[0.03]'
              }`}
            >
              {f.value === 'live' && isActive && <span className="live-dot w-1.5 h-1.5" />}
              {f.label}
              {count > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full score-number ${
                    isActive ? 'bg-white/10 text-white/70' : 'bg-white/[0.05] text-white/20'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Group Filters (if multiple groups exist) ── */}
      {groups.length > 1 && (
        <div className="flex gap-1.5 mb-5 flex-wrap animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <button
            id="group-filter-all"
            onClick={() => setActiveGroup('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
              activeGroup === 'all'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/25 hover:text-white/50 border border-white/[0.05]'
            }`}
          >
            جميع المجموعات
          </button>
          {groups.map((g) => (
            <button
              key={g}
              id={`group-filter-${g}`}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                activeGroup === g
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/25 hover:text-white/50 border border-white/[0.05]'
              }`}
            >
              المجموعة {g}
            </button>
          ))}
        </div>
      )}

      {/* ── Matches List ── */}
      {sorted.length === 0 ? (
        <EmptyState filter={activeFilter} />
      ) : (
        <div className="space-y-3">
          {sorted.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
