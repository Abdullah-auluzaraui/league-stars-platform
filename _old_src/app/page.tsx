import Link from 'next/link';
import { prisma } from '@/core/lib/prisma';

// ─── جلب بيانات الصفحة الرئيسية ──────────────────────────────────────────────
async function getHomeData() {
  const [hero, tournament, upcomingMatches, recentMatches, topScorers] = await Promise.all([
    // محتوى الهيرو
    prisma.content.findUnique({ where: { section: 'hero' } }),

    // البطولة النشطة
    prisma.tournament.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    }),

    // المباريات القادمة (أقرب 3)
    prisma.match.findMany({
      where: { status: { in: ['scheduled', 'live'] } },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { matchDate: 'asc' },
      take: 3,
    }),

    // آخر النتائج (3 مباريات)
    prisma.match.findMany({
      where: { status: 'finished' },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { matchDate: 'desc' },
      take: 3,
    }),

    // أفضل 5 هدافين
    prisma.player.findMany({
      where: { goalsCount: { gt: 0 } },
      include: { team: { select: { name: true, logoUrl: true } } },
      orderBy: { goalsCount: 'desc' },
      take: 5,
    }),
  ]);

  return { hero, tournament, upcomingMatches, recentMatches, topScorers };
}

// ─── مساعد: تنسيق التاريخ ─────────────────────────────────────────────────────
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ar-SA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default async function HomePage() {
  const { hero, tournament, upcomingMatches, recentMatches, topScorers } =
    await getHomeData();

  return (
    <div className="home-page">

      {/* ══════════════════════════════════════════════════════
          قسم الهيرو
      ══════════════════════════════════════════════════════ */}
      <section className="hero-section" aria-label="قسم الترحيب">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-pattern" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            {tournament?.status === 'active' ? 'البطولة جارية' : 'نجوم الدوري'}
          </div>

          <h1 className="hero-title">
            {hero?.title ?? tournament?.name ?? 'نجوم الدوري'}
          </h1>

          <p className="hero-subtitle">
            {hero?.body ?? 'تابع نتائج وترتيب وأهداف البطولة بالوقت الفعلي'}
          </p>

          <div className="hero-cta">
            <Link href="/matches" className="btn-primary hero-btn-primary" id="hero-view-matches">
              <span>⚽</span> تابع المباريات
            </Link>
            <Link href="/scorers" className="btn-secondary hero-btn-secondary" id="hero-view-scorers">
              🏆 قائمة الهدافين
            </Link>
          </div>

          {/* إحصائيات سريعة */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">{topScorers.reduce((s, p) => s + p.goalsCount, 0)}</span>
              <span className="hero-stat-lbl">هدف مسجّل</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">{recentMatches.length + upcomingMatches.length}</span>
              <span className="hero-stat-lbl">مباراة</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">{topScorers.length}</span>
              <span className="hero-stat-lbl">هداف</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          المحتوى الرئيسي
      ══════════════════════════════════════════════════════ */}
      <div className="home-grid">

        {/* ── المباريات القادمة ── */}
        <section className="home-card" aria-label="المباريات القادمة">
          <div className="home-card-header">
            <h2 className="home-card-title">
              <span className="card-title-icon">📅</span>
              المباريات القادمة
            </h2>
            <Link href="/matches" className="home-card-link">عرض الكل ←</Link>
          </div>

          {upcomingMatches.length === 0 ? (
            <p className="home-empty">لا توجد مباريات قادمة حالياً</p>
          ) : (
            <div className="match-list">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="match-row">
                  {match.status === 'live' && (
                    <span className="live-badge">
                      <span className="live-indicator" />
                      مباشر
                    </span>
                  )}
                  <div className="match-row-teams">
                    <span className="match-team-name">{match.homeTeam.name}</span>
                    <span className="match-vs">
                      {match.status === 'live'
                        ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                        : 'vs'}
                    </span>
                    <span className="match-team-name">{match.awayTeam.name}</span>
                  </div>
                  <div className="match-row-date">{formatDate(match.matchDate)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── آخر النتائج ── */}
        <section className="home-card" aria-label="آخر النتائج">
          <div className="home-card-header">
            <h2 className="home-card-title">
              <span className="card-title-icon">🏁</span>
              آخر النتائج
            </h2>
            <Link href="/matches" className="home-card-link">عرض الكل ←</Link>
          </div>

          {recentMatches.length === 0 ? (
            <p className="home-empty">لا توجد نتائج بعد</p>
          ) : (
            <div className="match-list">
              {recentMatches.map((match) => (
                <div key={match.id} className="match-row finished">
                  <div className="match-row-teams">
                    <span className="match-team-name">{match.homeTeam.name}</span>
                    <span className="match-score">
                      {match.homeScore} - {match.awayScore}
                    </span>
                    <span className="match-team-name">{match.awayTeam.name}</span>
                  </div>
                  <div className="match-row-date">{formatDate(match.matchDate)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── أفضل الهدافين ── */}
        <section className="home-card scorers-card" aria-label="أفضل الهدافين">
          <div className="home-card-header">
            <h2 className="home-card-title">
              <span className="card-title-icon">👟</span>
              أفضل الهدافين
            </h2>
            <Link href="/scorers" className="home-card-link">عرض الكل ←</Link>
          </div>

          {topScorers.length === 0 ? (
            <p className="home-empty">لا يوجد هدافون بعد</p>
          ) : (
            <ol className="scorers-list">
              {topScorers.map((player, idx) => (
                <li key={player.id} className="scorer-row">
                  <span className={`scorer-rank rank-${idx + 1}`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <div className="scorer-info">
                    <span className="scorer-name">{player.name}</span>
                    <span className="scorer-team">{player.team.name}</span>
                  </div>
                  <span className="scorer-goals">
                    {player.goalsCount}
                    <span className="scorer-goals-lbl">هدف</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

      </div>

      {/* ══════════════════════════════════════════════════════
          CTA — هدف الجولة
      ══════════════════════════════════════════════════════ */}
      <section className="vote-cta" aria-label="التصويت لهدف الجولة">
        <div className="vote-cta-inner">
          <span className="vote-cta-icon">🗳️</span>
          <div>
            <h2 className="vote-cta-title">صوّت لهدف الجولة</h2>
            <p className="vote-cta-desc">شارك في اختيار أجمل هدف في هذه الجولة</p>
          </div>
          <Link href="/vote" className="btn-primary vote-cta-btn" id="hero-vote-cta">
            صوّت الآن
          </Link>
        </div>
      </section>

    </div>
  );
}
