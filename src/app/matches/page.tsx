import Link from 'next/link';
import { prisma } from '@/core/lib/prisma';
import {
  computeGroupStandings,
  type MatchRow,
  type CardRow,
} from '@/features/matches/lib/standings-engine';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المباريات والترتيب — نجوم الدوري',
  description: 'تابع جميع المباريات وجدول ترتيب الفرق مع نتائج محدّثة بالوقت الفعلي',
};

// ─── جلب بيانات الصفحة ────────────────────────────────────────────────────────
async function getMatchesPageData() {
  const [tournament, matches, cards, tournamentTeams] = await Promise.all([
    prisma.tournament.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.match.findMany({
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: [{ groupName: 'asc' }, { matchDate: 'asc' }],
    }),
    prisma.card.findMany({ select: { teamId: true, type: true } }),
    prisma.tournamentTeam.findMany({
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
      orderBy: { groupName: 'asc' },
    }),
  ]);

  return { tournament, matches, cards, tournamentTeams };
}

// ─── ترتيب المراحل الإقصائية ─────────────────────────────────────────────────
const STAGE_ORDER: Record<string, number> = {
  group: 0,
  round_16: 1,
  quarter: 2,
  semi: 3,
  final: 4,
};

const STAGE_LABELS: Record<string, string> = {
  group: 'دور المجموعات',
  round_16: 'دور الـ 16',
  quarter: 'ربع النهائي',
  semi: 'نصف النهائي',
  final: 'النهائي',
};

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'قادمة',  cls: 'status-scheduled' },
  live:      { label: 'مباشر', cls: 'status-live'      },
  finished:  { label: 'انتهت', cls: 'status-finished'  },
  cancelled: { label: 'ملغاة', cls: 'status-cancelled' },
};

// ─── مساعدات ──────────────────────────────────────────────────────────────────
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('ar-SA', {
    month: 'short', day: 'numeric',
  }).format(new Date(date));
}

// ─── مكوّن بطاقة مباراة (مشترك) ──────────────────────────────────────────────
function MatchCard({ match }: {
  match: Awaited<ReturnType<typeof getMatchesPageData>>['matches'][number];
}) {
  const statusInfo = STATUS_STYLES[match.status] ?? STATUS_STYLES.scheduled;
  const isFinished = match.status === 'finished';
  const isLive     = match.status === 'live';

  return (
    <article className={`match-card-full ${isLive ? 'match-live' : ''}`}>
      {/* رأس البطاقة */}
      <div className="match-card-header">
        <span className={`match-status ${statusInfo.cls}`}>
          {isLive && <span className="live-indicator" />}
          {statusInfo.label}
        </span>
        <span className="match-date-str">{formatShortDate(match.matchDate)}</span>
        {match.venue && <span className="match-venue">📍 {match.venue}</span>}
      </div>

      {/* الفريقان والنتيجة */}
      <div className="match-card-body">
        <div className="match-team home">
          {match.homeTeam.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.homeTeam.logoUrl} alt="" className="team-logo" />
          )}
          <span className="team-name">{match.homeTeam.name}</span>
        </div>

        <div className="match-score-block">
          {isFinished || isLive ? (
            <>
              <span className="score-num">{match.homeScore ?? 0}</span>
              <span className="score-sep">-</span>
              <span className="score-num">{match.awayScore ?? 0}</span>
              {match.homePenalty !== null && match.awayPenalty !== null && (
                <div className="penalty-note">
                  (ر.ج: {match.homePenalty} - {match.awayPenalty})
                </div>
              )}
            </>
          ) : (
            <span className="score-vs">vs</span>
          )}
        </div>

        <div className="match-team away">
          <span className="team-name">{match.awayTeam.name}</span>
          {match.awayTeam.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={match.awayTeam.logoUrl} alt="" className="team-logo" />
          )}
        </div>
      </div>

      {/* وقت المباراة القادمة */}
      {!isFinished && (
        <div className="match-card-footer">{formatDate(match.matchDate)}</div>
      )}
    </article>
  );
}

// ─── الصفحة ───────────────────────────────────────────────────────────────────
export default async function MatchesPage() {
  const { tournament, matches, cards, tournamentTeams } = await getMatchesPageData();

  const isKnockout    = tournament?.type === 'knockout';
  const isGroupStage  = !isKnockout; // افتراضي أو group_stage صريح
  const liveMatches   = matches.filter((m) => m.status === 'live');

  // ── بيانات محرك الترتيب (مجموعات فقط) ──
  const matchRows: MatchRow[] = matches.map((m) => ({
    id: m.id, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId,
    homeScore: m.homeScore, awayScore: m.awayScore,
    status: m.status, groupName: m.groupName, stage: m.stage,
  }));
  const cardRows: CardRow[] = cards.map((c) => ({ teamId: c.teamId, type: c.type }));
  const teamsWithGroup = tournamentTeams.map((tt) => ({ id: tt.teamId, groupName: tt.groupName }));
  const groupStandings = isGroupStage && teamsWithGroup.length > 0
    ? computeGroupStandings(teamsWithGroup, matchRows, cardRows)
    : {};

  // ── تجميع المباريات ──
  let sectionedMatches: { key: string; label: string; matches: typeof matches }[] = [];

  if (isKnockout) {
    // إقصائي: تُجمَّع بالمرحلة بالترتيب المنطقي
    const byStage = matches.reduce<Record<string, typeof matches>>((acc, m) => {
      const s = m.stage;
      if (!acc[s]) acc[s] = [];
      acc[s].push(m);
      return acc;
    }, {});
    sectionedMatches = Object.entries(byStage)
      .sort(([a], [b]) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99))
      .map(([stage, ms]) => ({
        key: stage,
        label: STAGE_LABELS[stage] ?? stage,
        matches: ms,
      }));
  } else {
    // مجموعات: تُجمَّع بالمجموعة ثم تُعرض المجموعات بالترتيب
    const byGroup = matches.reduce<Record<string, typeof matches>>((acc, m) => {
      const g = m.groupName ?? 'عام';
      if (!acc[g]) acc[g] = [];
      acc[g].push(m);
      return acc;
    }, {});
    sectionedMatches = Object.entries(byGroup)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([g, ms]) => ({
        key: g,
        label: `المجموعة ${g}`,
        matches: ms,
      }));
  }

  return (
    <div className="matches-page">

      {/* رأس الصفحة */}
      <div className="matches-header">
        <div className="matches-header-inner">
          <div>
            <h1 className="matches-title">
              {isKnockout ? 'المباريات الإقصائية' : 'المباريات والترتيب'}
            </h1>
            {tournament && <p className="matches-subtitle">{tournament.name}</p>}
          </div>

          <div className="matches-header-badges">
            {/* شارة نوع البطولة */}
            <span className={`tournament-type-badge ${isKnockout ? 'knockout' : 'group'}`}>
              {isKnockout ? '⚡ إقصائية' : '📊 دوري'}
            </span>

            {/* شارة المباريات المباشرة */}
            {liveMatches.length > 0 && (
              <div className="live-count-badge">
                <span className="live-indicator" />
                {liveMatches.length} مباشر
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          تخطيط الصفحة — يتغير بحسب نوع البطولة
      ══════════════════════════════════════════════════════ */}
      <div className={`matches-layout ${isKnockout ? 'layout-full' : ''}`}>

        {/* ────────────────────────────────────────
            العمود الرئيسي — المباريات
        ──────────────────────────────────────── */}
        <section className="matches-main" aria-label="جدول المباريات">

          {/* ── رسم الإقصائية — شجرة المراحل ── */}
          {isKnockout && sectionedMatches.length > 0 && (
            <div className="knockout-stages-nav">
              {sectionedMatches.map((s) => (
                <a key={s.key} href={`#stage-${s.key}`} className="stage-pill">
                  {s.label}
                </a>
              ))}
            </div>
          )}

          {sectionedMatches.length === 0 ? (
            <div className="matches-empty">
              <span className="matches-empty-icon">📅</span>
              <p>لا توجد مباريات بعد</p>
            </div>
          ) : (
            sectionedMatches.map((section) => (
              <div key={section.key} className="match-group" id={`stage-${section.key}`}>
                <h2 className={`match-group-title ${isKnockout ? 'knockout-stage-title' : ''}`}>
                  {isKnockout && (
                    <span className="stage-icon">
                      {section.key === 'final' ? '🏆' : '⚡'}
                    </span>
                  )}
                  {section.label}
                </h2>

                <div className={`match-cards ${isKnockout ? 'knockout-cards' : ''}`}>
                  {section.matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {/* ────────────────────────────────────────
            الشريط الجانبي — الترتيب (مجموعات فقط)
        ──────────────────────────────────────── */}
        {isGroupStage && (
          <aside className="standings-sidebar" aria-label="جدول الترتيب">
            <div className="standings-wrapper">
              <h2 className="standings-main-title">
                <span>🏆</span> جدول الترتيب
              </h2>

              {Object.keys(groupStandings).length === 0 ? (
                <p className="standings-empty">لا يوجد ترتيب بعد</p>
              ) : (
                Object.entries(groupStandings).map(([groupName, rows]) => (
                  <div key={groupName} className="standings-group">
                    <h3 className="standings-group-title">المجموعة {groupName}</h3>
                    <div className="standings-table-wrapper">
                      <table className="standings-table-full">
                        <thead>
                          <tr>
                            <th className="col-rank">#</th>
                            <th className="col-team">الفريق</th>
                            <th className="col-stat" title="لعب">ل</th>
                            <th className="col-stat" title="فوز">ف</th>
                            <th className="col-stat" title="تعادل">ت</th>
                            <th className="col-stat" title="خسارة">خ</th>
                            <th className="col-stat" title="فارق الأهداف">+/-</th>
                            <th className="col-pts">نق</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, idx) => {
                            const teamInfo = tournamentTeams.find(
                              (tt) => tt.teamId === row.teamId
                            )?.team;
                            const isTop    = idx === 0;
                            const isSecond = idx === 1;
                            return (
                              <tr
                                key={row.teamId}
                                className={`standings-row ${isTop ? 'rank-first' : ''} ${isSecond ? 'rank-second' : ''}`}
                              >
                                <td className="col-rank-val">
                                  {isTop ? '🥇' : isSecond ? '🥈' : idx + 1}
                                </td>
                                <td className="col-team-val">
                                  {teamInfo?.logoUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={teamInfo.logoUrl} alt="" className="team-logo-sm" />
                                  )}
                                  <span>{teamInfo?.name ?? row.teamId}</span>
                                </td>
                                <td>{row.played}</td>
                                <td>{row.won}</td>
                                <td>{row.drawn}</td>
                                <td>{row.lost}</td>
                                <td className={row.goalDifference > 0 ? 'gd-pos' : row.goalDifference < 0 ? 'gd-neg' : ''}>
                                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                </td>
                                <td className="col-pts-val">{row.points}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}

              <Link href="/matches" className="standings-full-link">
                عرض جدول الترتيب الكامل ←
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
