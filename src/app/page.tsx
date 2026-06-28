import { prisma } from '@/core/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy, Calendar, ChevronLeft,
  Star, Vote, Zap, Eye,
} from 'lucide-react';
import HeroStats from './components/HeroStats';

// ─── Data Fetching ──────────────────────────────────────────────────────────

async function getHomeData() {
  try {
    const [hero, tournament, liveMatches, nextMatch, lastFinishedMatch, activeVoteGoal, topScorers, sponsors] =
      await Promise.all([
        prisma.content.findUnique({ where: { section: 'hero' } }).catch(() => null),
        prisma.tournament.findFirst({ where: { status: 'active' }, orderBy: { createdAt: 'desc' } }).catch(() => null),
        prisma.match.findMany({
          where: { status: 'live' },
          include: { homeTeam: { select: { name: true, logoUrl: true } }, awayTeam: { select: { name: true, logoUrl: true } } },
          take: 3,
        }).catch(() => []),
        prisma.match.findFirst({
          where: { status: 'scheduled' },
          include: { homeTeam: { select: { name: true, logoUrl: true } }, awayTeam: { select: { name: true, logoUrl: true } } },
          orderBy: { matchDate: 'asc' },
        }).catch(() => null),
        prisma.match.findFirst({
          where: { status: 'finished' },
          include: { homeTeam: { select: { name: true, logoUrl: true } }, awayTeam: { select: { name: true, logoUrl: true } } },
          orderBy: { matchDate: 'desc' },
        }).catch(() => null),
        prisma.goal.findFirst({
          where: { isNominated: true },
          include: {
            player: { select: { name: true } },
            team: { select: { name: true } },
            match: { include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
          },
        }).catch(() => null),
        prisma.player.findMany({
          where: { goalsCount: { gt: 0 } },
          include: { team: { select: { name: true, logoUrl: true } } },
          orderBy: { goalsCount: 'desc' },
          take: 5,
        }).catch(() => []),
        prisma.sponsor.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }).catch(() => []),
      ]);

    return { hero, tournament, liveMatches, nextMatch, lastFinishedMatch, activeVoteGoal, topScorers, sponsors };
  } catch {
    return {
      hero: null, tournament: null, liveMatches: [], nextMatch: null,
      lastFinishedMatch: null, activeVoteGoal: null, topScorers: [], sponsors: [],
    };
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK = {
  tournament: { name: 'بطولة نجوم الدوري الرمضانية الأولى' },
  hero: { body: 'المنصة الرسمية الأولى لمتابعة تفاصيل البطولة — رصد حي للنتائج، وجدول ترتيب تفاعلي، ومساحة تصويت لاختيار هدف الجولة.' },
  liveMatches: [
    { id: 'm1', status: 'live', homeScore: 2, awayScore: 1, matchDate: new Date().toISOString(), venue: 'ملعب الجوهرة', homeTeam: { name: 'فرسان نجد', logoUrl: null }, awayTeam: { name: 'صقور الرياض', logoUrl: null } },
  ],
  nextMatch: { id: 'm2', status: 'scheduled', homeScore: 0, awayScore: 0, matchDate: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), venue: 'ملعب الأمير فيصل', homeTeam: { name: 'عميد الغربية', logoUrl: null }, awayTeam: { name: 'أسود الشرقية', logoUrl: null } },
  lastFinishedMatch: { id: 'm3', status: 'finished', homeScore: 3, awayScore: 0, matchDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), venue: 'ملعب الجنوب', homeTeam: { name: 'زعيم الجنوب', logoUrl: null }, awayTeam: { name: 'نجوم المدينة', logoUrl: null } },
  topScorers: [
    { id: 'p1', name: 'ياسر القحطاني', goalsCount: 7, team: { name: 'صقور الرياض', logoUrl: null } },
    { id: 'p2', name: 'محمد السهلاوي', goalsCount: 5, team: { name: 'فرسان نجد', logoUrl: null } },
    { id: 'p3', name: 'نايف هزازي', goalsCount: 4, team: { name: 'عميد الغربية', logoUrl: null } },
    { id: 'p4', name: 'يوسف السالم', goalsCount: 3, team: { name: 'أسود الشرقية', logoUrl: null } },
    { id: 'p5', name: 'تيسير الجاسم', goalsCount: 2, team: { name: 'زعيم الجنوب', logoUrl: null } },
  ],
  sponsors: [
    { id: 's1', name: 'أرامكو السعودية' }, { id: 's2', name: 'روشن العقارية' },
    { id: 's3', name: 'طيران الرياض' }, { id: 's4', name: 'مشاريع القدية' },
    { id: 's5', name: 'صندوق الاستثمارات' },
  ],
  activeVoteGoal: null as { player: { name: string }; team: { name: string }; id: string } | null,
};

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
  homeScore: number;
  awayScore: number;
  matchDate: Date | string;
  venue: string;
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
      className={`block rounded-2xl p-5 hover-lift animate-fade-in-up ${cardClass} ${extraGlow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] text-white/40 font-semibold font-outfit flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-white/25 inline-block" />
          {match.venue}
        </span>
        {isLive && (
          <span className="live-badge">
            <span className="live-dot" />
            مباشر
          </span>
        )}
        {isScheduled && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F0C040] bg-[#C9971A]/12 border border-[#C9971A]/35 px-2.5 py-1 rounded-full">
            <Zap className="w-3 h-3" />
            قادم
          </span>
        )}
        {isFinished && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/35 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            منتهية
          </span>
        )}
      </div>

      {/* Teams VS Score */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/[0.07] border border-white/12 flex items-center justify-center font-outfit font-black text-xs text-white">
            {match.homeTeam.logoUrl
              ? <Image src={match.homeTeam.logoUrl} alt={match.homeTeam.name} width={32} height={32} className="object-contain rounded" />
              : getInitials(match.homeTeam.name)}
          </div>
          <span className="text-xs font-bold text-white/90 text-center leading-tight line-clamp-2">{match.homeTeam.name}</span>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center shrink-0 px-1">
          {isLive || isFinished ? (
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black font-outfit score-number leading-none ${isLive ? 'text-white' : 'text-white/80'}`}>{match.homeScore}</span>
              <span className="text-white/20 text-xl font-light">—</span>
              <span className={`text-3xl font-black font-outfit score-number leading-none ${isLive ? 'text-white' : 'text-white/80'}`}>{match.awayScore}</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-lg font-black text-[#F0C040] font-outfit">{formatTime(match.matchDate)}</div>
              <div className="text-[10px] text-white/35 font-semibold mt-0.5">{formatDate(match.matchDate)}</div>
            </div>
          )}
          <span className="text-[9px] font-black tracking-widest text-white/18 mt-2 font-outfit">VS</span>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/[0.07] border border-white/12 flex items-center justify-center font-outfit font-black text-xs text-white">
            {match.awayTeam.logoUrl
              ? <Image src={match.awayTeam.logoUrl} alt={match.awayTeam.name} width={32} height={32} className="object-contain rounded" />
              : getInitials(match.awayTeam.name)}
          </div>
          <span className="text-xs font-bold text-white/90 text-center leading-tight line-clamp-2">{match.awayTeam.name}</span>
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
        <div className="text-[10px] text-white/35 font-semibold truncate mt-0.5">{player.team.name}</div>
        {/* Progress */}
        <div className="mt-1.5 h-[2px] w-full bg-white/[0.07] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
        </div>
      </div>

      {/* Goals */}
      <div className="flex items-baseline gap-0.5 shrink-0">
        <span className={`text-xl font-black font-outfit score-number leading-none ${rankColor}`}>{player.goalsCount}</span>
        <span className="text-[9px] text-white/25 font-bold">هدف</span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const data = await getHomeData();

  const tournament  = data.tournament ?? MOCK.tournament;
  const heroBody    = data.hero?.body ?? MOCK.hero.body;
  const liveMatches = (data.liveMatches?.length ? data.liveMatches : MOCK.liveMatches) as MatchData[];
  const nextMatch   = (data.nextMatch  ?? MOCK.nextMatch) as MatchData;
  const lastFin     = (data.lastFinishedMatch ?? MOCK.lastFinishedMatch) as MatchData;
  const scorers     = data.topScorers.length > 0 ? data.topScorers : MOCK.topScorers;
  const sponsors    = data.sponsors.length  > 0 ? data.sponsors  : MOCK.sponsors;
  const voteGoal    = data.activeVoteGoal ?? MOCK.activeVoteGoal;

  const allMatches: MatchData[] = [
    ...liveMatches,
    ...(nextMatch ? [nextMatch] : []),
    lastFin,
  ].filter(Boolean) as MatchData[];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 sm:space-y-10 pb-10">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center text-center pt-8 sm:pt-12 pb-2">

        {/* Ambient glow behind trophy */}
        <div
          className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(92,19,31,0.38) 0%, rgba(201,151,26,0.06) 50%, transparent 75%)',
          }}
        />

        {/* Tournament badge */}
        <div className="relative animate-fade-in-up mb-12 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
            style={{ 
              background: 'rgba(255,255,255,0.04)', 
              borderColor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9971A] animate-glow-pulse" />
            <span className="text-xs font-bold text-[#F0C040] tracking-wide">{tournament.name}</span>
          </div>
        </div>

        {/* Trophy — main visual */}
        <div className="relative z-10 mb-8 animate-trophy-float w-40 h-40 sm:w-48 sm:h-48 mx-auto">
          {/* Trophy image */}
          <div className="relative w-full h-full">
            <Image
              src="/شعار البطولة.png"
              alt="شعار بطولة نجوم الدوري"
              fill
              sizes="(max-width:640px) 160px, 192px"
              className="object-contain"
              style={{ filter: 'drop-shadow(0 0 28px rgba(201,151,26,0.6)) drop-shadow(0 4px 16px rgba(0,0,0,0.8))' }}
              priority
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className="relative z-10 text-4xl sm:text-5xl font-black tracking-tight text-gold-gradient animate-fade-in-up mb-3"
          style={{ animationDelay: '100ms' }}
        >
          League Stars
        </h1>

        {/* Subtitle */}
        <p
          className="relative z-10 text-sm sm:text-base text-white/50 max-w-xs sm:max-w-sm leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          {heroBody}
        </p>



        {/* Quick stats */}
        <HeroStats goals={48} teams={12} matches={32} />
      </section>

      {/* ══ MATCHES ═══════════════════════════════════════════ */}
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

        <div className="space-y-3">
          {allMatches.slice(0, 3).map((m, i) => (
            <MatchCard key={m.id} match={m} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ══ TOP SCORERS ═══════════════════════════════════════ */}
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

        {/* Podium */}
        {scorers.length >= 3 && (
          <div className="glass-card rounded-2xl p-5 mb-3 animate-scale-in">
            <div className="flex items-end justify-center gap-4 h-[170px]">

              {/* 2nd */}
              <div className="flex flex-col items-center flex-1 max-w-[88px]">
                <div className="text-xl mb-1.5">🥈</div>
                <div className="w-10 h-10 rounded-xl bg-slate-500/18 border-2 border-slate-400/40 flex items-center justify-center font-outfit font-black text-xs text-slate-300 mb-1.5">
                  {getInitials(scorers[1].name)}
                </div>
                <div className="text-[10px] font-bold text-white/75 text-center leading-tight line-clamp-2 mb-2">{scorers[1].name}</div>
                <div className="w-full podium-bar-2 rounded-t-xl h-[60px] flex items-end justify-center pb-2.5">
                  <span className="text-sm font-black text-slate-300 font-outfit score-number">{scorers[1].goalsCount}</span>
                </div>
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center flex-1 max-w-[100px]">
                <div className="text-2xl mb-1 animate-bounce">👑</div>
                <div className="w-12 h-12 rounded-2xl bg-[#C9971A]/22 border-2 border-[#C9971A]/60 flex items-center justify-center font-outfit font-black text-sm text-[#F0C040] mb-1.5 animate-pulse-ring"
                  style={{ boxShadow: '0 0 18px rgba(201,151,26,0.35)' }}>
                  {getInitials(scorers[0].name)}
                </div>
                <div className="text-[10px] font-bold text-white text-center leading-tight line-clamp-2 mb-2">{scorers[0].name}</div>
                <div className="w-full podium-bar-1 rounded-t-xl h-[88px] flex items-end justify-center pb-2.5">
                  <span className="text-base font-black text-[#F0C040] font-outfit score-number"
                    style={{ textShadow: '0 0 12px rgba(201,151,26,0.6)' }}>
                    {scorers[0].goalsCount}
                  </span>
                </div>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center flex-1 max-w-[88px]">
                <div className="text-xl mb-1.5">🥉</div>
                <div className="w-10 h-10 rounded-xl bg-amber-700/18 border-2 border-amber-600/40 flex items-center justify-center font-outfit font-black text-xs text-amber-500 mb-1.5">
                  {getInitials(scorers[2].name)}
                </div>
                <div className="text-[10px] font-bold text-white/75 text-center leading-tight line-clamp-2 mb-2">{scorers[2].name}</div>
                <div className="w-full podium-bar-3 rounded-t-xl h-[48px] flex items-end justify-center pb-2.5">
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
              {scorers.slice(3).map((p, i) => (
                <ScorerRow key={p.id} player={p} rank={i + 4} delay={i * 70} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══ VOTE ══════════════════════════════════════════════ */}
      {voteGoal ? (
        <section>
          <div className="flex items-center gap-2.5 mb-4 px-0.5">
            <span className="section-accent-line-red" />
            <h2 className="text-base sm:text-lg font-black text-white">تصويت هدف الجولة</h2>
            <span className="w-2 h-2 rounded-full bg-[#C9971A] animate-glow-pulse" />
          </div>
          <div className="glass-card-gold rounded-2xl p-5 animate-fade-in-up">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(201,151,26,0.15)', border: '2px solid rgba(201,151,26,0.4)', boxShadow: '0 0 16px rgba(201,151,26,0.2)' }}>
                <Star className="w-6 h-6 text-[#F0C040] fill-[#C9971A]/60" />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-black text-[#F0C040] uppercase tracking-wider mb-1">تصويت مفتوح</div>
                <div className="text-sm font-bold text-white">صوّت لأفضل هدف في الجولة</div>
                <div className="text-[11px] text-white/45 mt-0.5">هدف {voteGoal.player.name} — {voteGoal.team.name}</div>
              </div>
            </div>
            <Link href={`/matches?voteGoalId=${voteGoal.id}`} className="btn-trophy w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl">
              <Vote className="w-4 h-4" />
              صوّت الآن
            </Link>
          </div>
        </section>
      ) : (
        <section>
          <Link href="/matches" className="block">
            <div className="glass-card-burgundy rounded-2xl p-4 flex items-center gap-4 hover-lift animate-fade-in-up">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(220,38,60,0.15)', border: '1px solid rgba(220,38,60,0.3)' }}>
                <Vote className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">تصويت هدف الجولة</div>
                <div className="text-[11px] text-white/40 mt-0.5">سيُفتح التصويت بعد انتهاء الجولة القادمة</div>
              </div>
              <Eye className="w-4 h-4 text-white/20 shrink-0" />
            </div>
          </Link>
        </section>
      )}

      {/* ══ SPONSORS ══════════════════════════════════════════ */}
      {sponsors.length > 0 && (
        <section className="py-2">
          <div className="section-divider mb-4">
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/25 uppercase">شركاء النجاح</span>
          </div>
          <div className="overflow-hidden">
            <div className="sponsors-track">
              {[...sponsors, ...sponsors].map((s, i) => (
                <span key={i} className="text-xs font-black text-white/25 hover:text-[#C9971A] transition-colors duration-300 cursor-default whitespace-nowrap">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
