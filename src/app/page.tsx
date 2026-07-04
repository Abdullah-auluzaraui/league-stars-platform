import { prisma } from '@/core/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  Star, Vote, Zap, Eye, Tv
} from 'lucide-react';
import HeroStats from './components/HeroStats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── Data Fetching ──────────────────────────────────────────────────────────

async function getHomeData() {
  try {
    const [
      hero,
      tournament,
      liveMatches,
      nextMatch,
      lastFinishedMatch,
      activeVoteGoal,
      topScorers,
      sponsors,
      goalsCount,
      teamsCount,
      matchesCount,
      settingsList,
    ] =
      await Promise.all([
        prisma.content.findUnique({
          where: { section: 'hero' },
          select: { title: true, body: true },
        }).catch((error) => {
          console.error('Failed to load home hero content', error);
          return null;
        }),
        prisma.tournament.findFirst({
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          select: { name: true },
        }).catch((error) => {
          console.error('Failed to load active tournament', error);
          return null;
        }),
        prisma.match.findMany({
          where: { status: 'live' },
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
            matchDate: true,
            venue: true,
            streamUrl: true,
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } },
          },
          take: 3,
        }).catch((error) => {
          console.error('Failed to load live matches', error);
          return [];
        }),
        prisma.match.findFirst({
          where: { status: 'scheduled' },
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
            matchDate: true,
            venue: true,
            streamUrl: true,
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } },
          },
          orderBy: { matchDate: 'asc' },
        }).catch((error) => {
          console.error('Failed to load next match', error);
          return null;
        }),
        prisma.match.findFirst({
          where: { status: 'finished' },
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
            matchDate: true,
            venue: true,
            streamUrl: true,
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } },
          },
          orderBy: { matchDate: 'desc' },
        }).catch((error) => {
          console.error('Failed to load last finished match', error);
          return null;
        }),
        prisma.votingRoundGoal.findFirst({
          where: { round: { status: 'active' } },
          select: {
            goal: {
              select: {
                videoUrl: true,
                minute: true,
                type: true,
                player: { select: { name: true } },
                team: { select: { name: true } },
              },
            },
          },
        }).then((rg) => rg?.goal || null).catch((error) => {
          console.error('Failed to load active vote goal', error);
          return null;
        }),
        prisma.player.findMany({
          where: { goalsCount: { gt: 0 } },
          select: {
            id: true,
            name: true,
            goalsCount: true,
            team: { select: { name: true, logoUrl: true } },
          },
          orderBy: { goalsCount: 'desc' },
          take: 5,
        }).catch((error) => {
          console.error('Failed to load top scorers', error);
          return [];
        }),
        prisma.sponsor.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: { name: true, logoUrl: true, websiteUrl: true },
        }).catch((error) => {
          console.error('Failed to load sponsors', error);
          return [];
        }),
        prisma.goal.count().catch((error) => {
          console.error('Failed to count goals', error);
          return 0;
        }),
        prisma.team.count({ where: { archivedAt: null } }).catch((error) => {
          console.error('Failed to count teams', error);
          return 0;
        }),
        prisma.match.count().catch((error) => {
          console.error('Failed to count matches', error);
          return 0;
        }),
        prisma.setting.findMany({
          select: { key: true, value: true },
        }).catch((error) => {
          console.error('Failed to load home settings', error);
          return [];
        }),
      ]);

    const settingsMap: Record<string, string> = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return { hero, tournament, liveMatches, nextMatch, lastFinishedMatch, activeVoteGoal, topScorers, sponsors, goalsCount, teamsCount, matchesCount, settingsMap };
  } catch (error) {
    console.error('Failed to load home data', error);
    return {
      hero: null, tournament: null, liveMatches: [], nextMatch: null,
      lastFinishedMatch: null, activeVoteGoal: null, topScorers: [], sponsors: [],
      goalsCount: 0, teamsCount: 0, matchesCount: 0, settingsMap: {},
    };
  }
}


// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Types ──────────────────────────────────────────────────────────────────

type MatchData = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: Date | string;
  venue: string;
  streamUrl?: string | null;
  homeTeam: { name: string; logoUrl: string | null };
  awayTeam: { name: string; logoUrl: string | null };
};

// ─── Match Card ──────────────────────────────────────────────────────────────

function MatchCard({ match, delay = 0 }: { match: MatchData; delay?: number }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isScheduled = match.status === 'scheduled';

  let cardClass = 'glass-card';
  let extraGlow = '';
  if (isLive)     { cardClass = 'glass-card-burgundy'; extraGlow = 'match-live-glow'; }
  if (isScheduled){ cardClass = 'glass-card-gold';     extraGlow = 'match-upcoming-glow'; }

  return (
    <Link
      href="/matches"
      className={`block rounded-2xl p-4 md:p-5 hover-lift animate-fade-in-up ${cardClass} ${extraGlow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
        <span className="min-w-0 truncate text-[11px] md:text-xs text-white/60 font-medium font-outfit flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-white/40 inline-block" />
          {match.venue}
        </span>
        {isLive && (
          <div className="flex items-center gap-1.5">
            {match.streamUrl && (
              <span className="hidden min-[390px]:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 animate-pulse">
                <Tv className="w-2.5 h-2.5" />
                البث المباشر متوفر
              </span>
            )}
            <span className="live-badge">
              <span className="live-dot" />
              مباشر
            </span>
          </div>
        )}
        {isScheduled && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F0C040] bg-[#C9971A]/12 border border-[#C9971A]/35 px-2.5 py-1 rounded-full">
            <Zap className="w-3 h-3" />
            قادم
          </span>
        )}
        {isFinished && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/55 bg-white/8 border border-white/15 px-2.5 py-1 rounded-full">
            منتهية
          </span>
        )}
      </div>

      {/* Teams VS Score */}
      <div className="flex items-center gap-2.5 md:gap-3">
        {/* Home */}
        <div className="flex flex-col items-center gap-1.5 md:gap-2 flex-1 min-w-0">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/[0.07] border border-white/12 flex items-center justify-center font-outfit font-black text-xs text-white">
            {match.homeTeam.logoUrl
              ? <Image src={match.homeTeam.logoUrl} alt={match.homeTeam.name} width={32} height={32} className="object-contain rounded max-h-8" />
              : getInitials(match.homeTeam.name)}
          </div>
          <span className="text-[11px] md:text-xs font-bold text-white/90 text-center leading-tight line-clamp-2">{match.homeTeam.name}</span>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center shrink-0 min-w-[86px] px-1">
          {isLive || isFinished ? (
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className={`text-2xl md:text-3xl font-black font-outfit score-number leading-none ${isLive ? 'text-white' : 'text-white/80'}`}>{match.homeScore}</span>
              <span className="text-white/40 text-lg md:text-xl font-medium">—</span>
              <span className={`text-2xl md:text-3xl font-black font-outfit score-number leading-none ${isLive ? 'text-white' : 'text-white/80'}`}>{match.awayScore}</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-base md:text-lg font-black text-[#F0C040] font-outfit">{formatTime(match.matchDate)}</div>
              <div className="text-[10px] md:text-[11px] text-white/55 font-semibold mt-0.5">{formatDate(match.matchDate)}</div>
            </div>
          )}
          <span className="text-[10px] font-black tracking-widest text-white/35 mt-1.5 font-outfit">VS</span>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1.5 md:gap-2 flex-1 min-w-0">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/[0.07] border border-white/12 flex items-center justify-center font-outfit font-black text-xs text-white">
            {match.awayTeam.logoUrl
              ? <Image src={match.awayTeam.logoUrl} alt={match.awayTeam.name} width={32} height={32} className="object-contain rounded max-h-8" />
              : getInitials(match.awayTeam.name)}
          </div>
          <span className="text-[11px] md:text-xs font-bold text-white/90 text-center leading-tight line-clamp-2">{match.awayTeam.name}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Scorer Row ──────────────────────────────────────────────────────────────

function ScorerRow({ player, rank, delay }: {
  player: { id: string; name: string; goalsCount: number; team: { name: string; logoUrl: string | null } };
  rank: number;
  delay: number;
}) {
  const maxGoals = 10;
  const pct = Math.min((player.goalsCount / maxGoals) * 100, 100);
  const medals = ['🥇', '🥈', '🥉'];

  const rankColor =
    rank === 1 ? 'text-[#F0C040]' :
    rank === 2 ? 'text-slate-300' :
    rank === 3 ? 'text-amber-600' : 'text-white/40';

  const barColor =
    rank === 1 ? 'linear-gradient(to right, #C9971A, #F0C040)' :
    rank === 2 ? 'linear-gradient(to right, #64748b, #94a3b8)' :
    rank === 3 ? 'linear-gradient(to right, #92400e, #d97706)' :
                 'rgba(255,255,255,0.1)';

  return (
    <div
      className="animate-fade-in-up flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] rounded-xl transition-colors duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Rank */}
      <div className="w-6 shrink-0 text-center">
        {rank <= 3
          ? <span className="text-base leading-none">{medals[rank - 1]}</span>
          : <span className={`text-xs font-black font-outfit ${rankColor}`}>{rank}</span>}
      </div>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-outfit font-black text-[11px] shrink-0
        ${rank === 1
          ? 'bg-[#C9971A]/20 border-2 border-[#C9971A]/50 text-[#F0C040]'
          : rank === 2
          ? 'bg-slate-500/15 border border-slate-400/35 text-slate-300'
          : rank === 3
          ? 'bg-amber-700/15 border border-amber-600/35 text-amber-500'
          : 'bg-white/[0.06] border border-white/10 text-white/50'}`}
      >
        {getInitials(player.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white truncate">{player.name}</div>
        <div className="text-[11px] text-white/55 font-semibold truncate mt-0.5">{player.team.name}</div>
        {/* Progress */}
        <div className="mt-1.5 h-[2px] w-full bg-white/[0.07] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
        </div>
      </div>

      {/* Goals */}
      <div className="flex items-baseline gap-0.5 shrink-0">
        <span className={`text-xl font-black font-outfit score-number leading-none ${rankColor}`}>{player.goalsCount}</span>
        <span className="text-[10px] text-white/45 font-bold">هدف</span>
      </div>
    </div>
  );
}

// ─── Scorers Section ─────────────────────────────────────────────────────────

function ScorersSection({ scorers }: { scorers: ReturnType<typeof Array.prototype.filter> }) {
  if (scorers.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center text-xs font-semibold text-white/50">
        لا توجد أهداف مسجلة بعد.
      </div>
    );
  }

  return (
    <>
      {/* Podium */}
      {scorers.length >= 3 && (
        <div className="glass-card rounded-2xl p-4 md:p-5 mb-3 animate-scale-in">
          <div className="flex items-end justify-center gap-3 md:gap-4 h-[150px] md:h-[170px]">
            {/* 2nd */}
            <div className="flex flex-col items-center flex-1 max-w-[84px] md:max-w-[88px]">
              <div className="text-xl mb-1.5">🥈</div>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-500/18 border-2 border-slate-400/40 flex items-center justify-center font-outfit font-black text-xs text-slate-300 mb-1.5">
                {getInitials(scorers[1].name)}
              </div>
              <div className="text-[10px] font-bold text-white/75 text-center leading-tight line-clamp-2 mb-2">{scorers[1].name}</div>
              <div className="w-full podium-bar-2 rounded-t-xl h-[52px] md:h-[60px] flex items-end justify-center pb-2.5">
                <span className="text-sm font-black text-slate-300 font-outfit score-number">{scorers[1].goalsCount}</span>
              </div>
            </div>

            {/* 1st */}
            <div className="flex flex-col items-center flex-1 max-w-[94px] md:max-w-[100px]">
              <div className="text-2xl mb-1 animate-bounce">👑</div>
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-[#C9971A]/22 border-2 border-[#C9971A]/60 flex items-center justify-center font-outfit font-black text-sm text-[#F0C040] mb-1.5 animate-pulse-ring"
                style={{ boxShadow: '0 0 18px rgba(201,151,26,0.35)' }}>
                {getInitials(scorers[0].name)}
              </div>
              <div className="text-[10px] font-bold text-white text-center leading-tight line-clamp-2 mb-2">{scorers[0].name}</div>
              <div className="w-full podium-bar-1 rounded-t-xl h-[74px] md:h-[88px] flex items-end justify-center pb-2.5">
                <span className="text-base font-black text-[#F0C040] font-outfit score-number"
                  style={{ textShadow: '0 0 12px rgba(201,151,26,0.6)' }}>
                  {scorers[0].goalsCount}
                </span>
              </div>
            </div>

            {/* 3rd */}
            <div className="flex flex-col items-center flex-1 max-w-[84px] md:max-w-[88px]">
              <div className="text-xl mb-1.5">🥉</div>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-700/18 border-2 border-amber-600/40 flex items-center justify-center font-outfit font-black text-xs text-amber-500 mb-1.5">
                {getInitials(scorers[2].name)}
              </div>
              <div className="text-[10px] font-bold text-white/75 text-center leading-tight line-clamp-2 mb-2">{scorers[2].name}</div>
              <div className="w-full podium-bar-3 rounded-t-xl h-[42px] md:h-[48px] flex items-end justify-center pb-2.5">
                <span className="text-sm font-black text-amber-600 font-outfit score-number">{scorers[2].goalsCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {scorers.length > 3 && (
        <div className="glass-card rounded-2xl overflow-hidden py-1">
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {scorers.slice(3).map((p: { id: string; name: string; goalsCount: number; team: { name: string; logoUrl: string | null } }, i: number) => (
              <ScorerRow key={p.id} player={p} rank={i + 4} delay={i * 70} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sponsors Section ────────────────────────────────────────────────────────

function SponsorsSection({ sponsors }: { sponsors: { name: string; logoUrl: string | null; websiteUrl: string | null }[] }) {
  if (sponsors.length === 0) return null;
  return (
    <section className="py-2">
      <div className="section-divider mb-4">
        <span className="text-[10px] font-bold tracking-[0.18em] text-white/45 uppercase">شركاء النجاح</span>
      </div>
      <div className="overflow-hidden">
        <div className="sponsors-track flex items-center gap-8">
          {[...sponsors, ...sponsors].map((s, i) => (
            s.logoUrl ? (
              <a
                key={i}
                href={s.websiteUrl || '#'}
                target={s.websiteUrl ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center shrink-0 hover:scale-110 transition-transform duration-300 mx-4"
              >
                <Image
                  src={s.logoUrl}
                  alt={s.name}
                  width={120}
                  height={40}
                  sizes="120px"
                  className="h-7 sm:h-9 w-auto object-contain opacity-55 hover:opacity-100 transition-opacity duration-300"
                />
              </a>
            ) : (
              <span key={i} className="text-xs font-black text-white/45 hover:text-[#C9971A] transition-colors duration-300 cursor-default whitespace-nowrap mx-4">
                {s.name}
              </span>
            )
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const data = await getHomeData();

  const tournamentName = data.tournament?.name ?? 'League Stars';
  const heroTitle = data.hero?.title ?? 'League Stars';
  const heroBody = data.hero?.body ?? 'منصة إدارة ومتابعة البطولات.';
  const liveMatches = data.liveMatches as MatchData[];
  const nextMatch = data.nextMatch as MatchData | null;
  const lastFin = data.lastFinishedMatch as MatchData | null;
  const scorers = data.topScorers;
  const sponsors = data.sponsors;
  const votingEnabled = data.settingsMap['voting_enabled'] !== 'false';
  const voteGoal = votingEnabled ? data.activeVoteGoal : null;

  const allMatches: MatchData[] = [
    ...liveMatches,
    ...(nextMatch ? [nextMatch] : []),
    lastFin,
  ].filter(Boolean) as MatchData[];

  return (
    <div className="w-full space-y-8 md:space-y-12">

      {/* ══ SECTION 1: HERO (Full-Width, Centered) ═══════════════════════════ */}
      <section className="relative flex flex-col items-center text-center pt-2 sm:pt-12 md:pt-16 pb-4 md:pb-6">

        {/* Tournament badge */}
        <div className="relative animate-fade-in-up mb-5 md:mb-10 z-10">
          <div className="inline-flex max-w-full items-center gap-2 px-3.5 md:px-4 py-1.5 rounded-full border"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9971A] animate-glow-pulse" />
            <span className="truncate text-[11px] md:text-xs font-bold text-[#F0C040] tracking-wide">{tournamentName}</span>
          </div>
        </div>

        {/* Trophy - scaled up on desktop */}
        <div className="relative z-10 mb-5 md:mb-8 animate-trophy-float w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 mx-auto">
          <div className="relative w-full h-full">
            <Image
              src="/شعار البطولة.png"
              alt="شعار بطولة نجوم الدوري"
              fill
              sizes="(max-width:640px) 160px, (max-width:768px) 192px, 224px"
              className="object-contain"
              style={{ filter: 'drop-shadow(0 0 32px rgba(201,151,26,0.65)) drop-shadow(0 4px 20px rgba(0,0,0,0.85))' }}
              priority
            />
          </div>
        </div>

        {/* Title - larger typography on desktop */}
        <h1
          className="relative z-10 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-gold-gradient animate-fade-in-up mb-3 md:mb-4 leading-tight"
          style={{ animationDelay: '100ms' }}
        >
          {heroTitle}
        </h1>

        {/* Subtitle - wider max-width for elegancy on desktop */}
        <p
          className="relative z-10 text-[13px] sm:text-base md:text-lg text-white/55 max-w-[21rem] sm:max-w-md md:max-w-2xl leading-6 md:leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          {heroBody}
        </p>

        <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 w-full max-w-[350px] md:hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Link href="/matches" className="btn-trophy flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black">
            <Zap className="w-4 h-4" />
            المباريات
          </Link>
          <Link href="/standings" className="btn-glass flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black">
            <Star className="w-4 h-4" />
            الترتيب
          </Link>
        </div>

        {/* Quick stats */}
        <HeroStats goals={data.goalsCount} teams={data.teamsCount} matches={data.matchesCount} />
      </section>


      {/* ══ SECTION 2: CONTENT (Two-Column Layout) ═══════════════════════════ */}
      <div className="max-w-5xl mx-auto md:grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] md:gap-8 md:items-start">

        {/* ─── MAIN COLUMN (Matches & Votes) ───────────────────────────────── */}
        <div className="max-w-2xl mx-auto md:max-w-none space-y-6 sm:space-y-10 pb-6 w-full">

          {/* Matches Section */}
          <section>
            <div className="flex items-center justify-between mb-4 px-0.5">
              <div className="flex items-center gap-2.5">
                <span className="section-accent-line" />
                <h2 className="text-base sm:text-lg font-black text-white">لقاءات اليوم</h2>
              </div>
              <Link href="/matches" className="flex items-center gap-1 text-xs font-bold text-[#C9971A] hover:text-[#F0C040] transition-colors">
                كل المباريات <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            {liveMatches.length > 0 && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="live-dot" />
                <span className="text-xs font-bold text-red-400">{liveMatches.length} مباراة مباشرة الآن</span>
              </div>
            )}

            {allMatches.length > 0 ? (
              <div className="space-y-3">
                {allMatches.slice(0, 3).map((m, i) => (
                  <MatchCard key={m.id} match={m} delay={i * 80} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-5 text-center text-xs font-semibold text-white/50">
                لا توجد مباريات مسجلة حالياً.
              </div>
            )}
          </section>

          {/* Vote Section */}
          {votingEnabled && (
            voteGoal ? (
              <section>
                <div className="flex items-center gap-2.5 mb-4 px-0.5">
                  <span className="section-accent-line-red" />
                  <h2 className="text-base sm:text-lg font-black text-white">تصويت هدف الجولة</h2>
                  <span className="w-2 h-2 rounded-full bg-[#C9971A] animate-glow-pulse" />
                </div>
                <div className="glass-card-gold rounded-2xl p-4 md:p-5 animate-fade-in-up">
                  <div className="flex items-start gap-3 md:gap-4 mb-4">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(201,151,26,0.15)', border: '2px solid rgba(201,151,26,0.4)', boxShadow: '0 0 16px rgba(201,151,26,0.2)' }}>
                      <Star className="w-5 h-5 md:w-6 md:h-6 text-[#F0C040] fill-[#C9971A]/60" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-black text-[#F0C040] uppercase tracking-wider mb-1">تصويت مفتوح</div>
                      <div className="text-sm font-bold text-white">صوّت لأفضل هدف في الجولة</div>
                      <div className="text-[11px] text-white/45 mt-0.5">هدف {voteGoal.player.name} — {voteGoal.team.name}</div>
                    </div>
                  </div>
                  <Link href="/votes" className="btn-trophy w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl">
                    <Vote className="w-4 h-4" />
                    صوّت الآن
                  </Link>
                </div>
              </section>
            ) : (
              <section>
                <Link href="/matches" className="block">
                  <div className="glass-card-burgundy rounded-2xl p-4 flex items-center gap-3 md:gap-4 hover-lift animate-fade-in-up">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(220,38,60,0.15)', border: '1px solid rgba(220,38,60,0.3)' }}>
                      <Vote className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">تصويت هدف الجولة</div>
                      <div className="text-[11px] text-white/60 mt-0.5">سيُفتح التصويت بعد انتهاء الجولة القادمة</div>
                    </div>
                    <Eye className="w-4 h-4 text-white/40 shrink-0" />
                  </div>
                </Link>
              </section>
            )
          )}

          {/* Mobile-Only Scorers */}
          <div className="md:hidden space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4 px-0.5">
                <div className="flex items-center gap-2.5">
                  <span className="section-accent-line" />
                  <h2 className="text-base sm:text-lg font-black text-white">هدّافو البطولة</h2>
                </div>
                <Link href="/standings" className="flex items-center gap-1 text-xs font-bold text-[#C9971A] hover:text-[#F0C040] transition-colors">
                  الكل <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
              <ScorersSection scorers={scorers} />
            </section>
          </div>

        </div>{/* end main column */}


        {/* ─── SIDEBAR (Desktop Only: Scorers) ─────────────────────────────── */}
        <aside className="hidden md:flex flex-col gap-6 sticky top-28 pb-6 w-full">
          <section>
            <div className="flex items-center justify-between mb-4 px-0.5">
              <div className="flex items-center gap-2.5">
                <span className="section-accent-line" />
                <h2 className="text-base font-black text-white">هدّافو البطولة</h2>
              </div>
              <Link href="/standings" className="flex items-center gap-1 text-xs font-bold text-[#C9971A] hover:text-[#F0C040] transition-colors">
                الكل <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ScorersSection scorers={scorers} />
          </section>
        </aside>

      </div>{/* end grid */}


      {/* ══ SECTION 3: SPONSORS (Full-Width, Bottom) ═════════════════════════ */}
      <div className="max-w-5xl mx-auto pt-2 md:pt-4 pb-20 md:pb-10">
        <SponsorsSection sponsors={sponsors} />
      </div>

    </div>
  );
}
