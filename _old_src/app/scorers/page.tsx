import { getTopScorers } from '@/features/players/actions';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'قائمة الهدافين — نجوم الدوري',
  description: 'ترتيب هدافي البطولة وتفاصيل إحصائيات الأهداف المسجلة',
};

const POSITION_MAP: Record<string, string> = {
  goalkeeper: 'حارس مرمى',
  defender: 'مدافع',
  midfielder: 'وسط',
  forward: 'مهاجم',
};

export default async function ScorersPage() {
  const players = await getTopScorers();

  // فحص تواجد البيانات ديناميكياً لتطبيق التوجه الذكي
  const hasAnyJersey = players.some(
    (p) => p.jerseyNumber !== null && p.jerseyNumber !== undefined
  );
  const hasAnyPosition = players.some(
    (p) => p.position !== null && p.position !== undefined
  );

  // تصنيف المراكز الثلاثة الأولى
  const topThree = players.slice(0, 3);
  const remainingPlayers = players.slice(3);

  return (
    <div className="scorers-page">
      {/* ─── رأس الصفحة (Hero Section) ─── */}
      <header className="scorers-header">
        <div className="scorers-header-inner">
          <span className="scorers-header-badge">🏆 إحصائيات البطولة</span>
          <h1 className="scorers-title">قائمة الهدافين</h1>
          <p className="scorers-subtitle">صراع القمة على لقب هداف البطولة</p>
        </div>
      </header>

      {/* ─── منصة التتويج / الثلاثة الأوائل (Top 3 Showcase) ─── */}
      {players.length > 0 && (
        <section className="top-scorers-showcase" aria-label="أفضل ثلاثة هدافين">
          <div className="showcase-container">
            {/* المركز الثاني 🥈 */}
            {topThree[1] && (
              <div className="podium-card rank-second">
                <div className="podium-avatar-wrapper">
                  <span className="podium-medal">🥈</span>
                  <div className="podium-avatar-placeholder">
                    {topThree[1].name.charAt(0)}
                  </div>
                </div>
                <h3 className="podium-name">{topThree[1].name}</h3>
                <div className="podium-team">
                  {topThree[1].team.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={topThree[1].team.logoUrl} alt="" className="podium-team-logo" />
                  )}
                  <span>{topThree[1].team.name}</span>
                </div>
                {hasAnyPosition && topThree[1].position && (
                  <span className="podium-pos">{POSITION_MAP[topThree[1].position] || topThree[1].position}</span>
                )}
                {hasAnyJersey && topThree[1].jerseyNumber !== null && (
                  <span className="podium-jersey">رقم {topThree[1].jerseyNumber}</span>
                )}
                <div className="podium-goals">
                  <span className="goals-num">{topThree[1].goalsCount}</span>
                  <span className="goals-lbl">أهداف</span>
                </div>
              </div>
            )}

            {/* المركز الأول 🥇 */}
            {topThree[0] && (
              <div className="podium-card rank-first">
                <div className="podium-avatar-wrapper">
                  <span className="podium-medal">🥇</span>
                  <div className="podium-avatar-placeholder">
                    {topThree[0].name.charAt(0)}
                  </div>
                </div>
                <h3 className="podium-name">{topThree[0].name}</h3>
                <div className="podium-team">
                  {topThree[0].team.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={topThree[0].team.logoUrl} alt="" className="podium-team-logo" />
                  )}
                  <span>{topThree[0].team.name}</span>
                </div>
                {hasAnyPosition && topThree[0].position && (
                  <span className="podium-pos">{POSITION_MAP[topThree[0].position] || topThree[0].position}</span>
                )}
                {hasAnyJersey && topThree[0].jerseyNumber !== null && (
                  <span className="podium-jersey">رقم {topThree[0].jerseyNumber}</span>
                )}
                <div className="podium-goals">
                  <span className="goals-num">{topThree[0].goalsCount}</span>
                  <span className="goals-lbl">أهداف</span>
                </div>
              </div>
            )}

            {/* المركز الثالث 🥉 */}
            {topThree[2] && (
              <div className="podium-card rank-third">
                <div className="podium-avatar-wrapper">
                  <span className="podium-medal">🥉</span>
                  <div className="podium-avatar-placeholder">
                    {topThree[2].name.charAt(0)}
                  </div>
                </div>
                <h3 className="podium-name">{topThree[2].name}</h3>
                <div className="podium-team">
                  {topThree[2].team.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={topThree[2].team.logoUrl} alt="" className="podium-team-logo" />
                  )}
                  <span>{topThree[2].team.name}</span>
                </div>
                {hasAnyPosition && topThree[2].position && (
                  <span className="podium-pos">{POSITION_MAP[topThree[2].position] || topThree[2].position}</span>
                )}
                {hasAnyJersey && topThree[2].jerseyNumber !== null && (
                  <span className="podium-jersey">رقم {topThree[2].jerseyNumber}</span>
                )}
                <div className="podium-goals">
                  <span className="goals-num">{topThree[2].goalsCount}</span>
                  <span className="goals-lbl">أهداف</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── قائمة الهدافين بالكامل (Responsive Table & Cards) ─── */}
      <section className="scorers-list-section" aria-label="ترتيب الهدافين">
        {players.length === 0 ? (
          <div className="scorers-empty">
            <span className="empty-icon">👟</span>
            <p>لا يوجد هدافون مسجلون حالياً</p>
            <Link href="/" className="btn-primary">
              العودة للرئيسية
            </Link>
          </div>
        ) : (
          <div className="scorers-container">
            {/* عرض الجوال (Mobile Cards - List View) */}
            <div className="scorers-mobile-list">
              {players.map((player, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                return (
                  <div
                    key={player.id}
                    className={`scorer-mobile-card rank-${rank} ${isTop3 ? 'highlight-rank' : ''}`}
                  >
                    <div className="card-right">
                      <span className="card-rank">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                      </span>
                      <div className="card-player-info">
                        <span className="card-player-name">{player.name}</span>
                        <div className="card-team-info">
                          {player.team.logoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={player.team.logoUrl} alt="" className="card-team-logo" />
                          )}
                          <span>{player.team.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-left">
                      <div className="card-meta">
                        {hasAnyJersey && player.jerseyNumber !== null && (
                          <span className="meta-jersey">#{player.jerseyNumber}</span>
                        )}
                        {hasAnyPosition && player.position && (
                          <span className="meta-pos">{POSITION_MAP[player.position]}</span>
                        )}
                      </div>
                      <div className="card-goals">
                        <span className="card-goals-num">{player.goalsCount}</span>
                        <span className="card-goals-lbl">أهداف</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* عرض شاشات الكمبيوتر والتابلت (Desktop Table View) */}
            <div className="scorers-desktop-table">
              <table className="scorers-table">
                <thead>
                  <tr>
                    <th className="th-rank">الترتيب</th>
                    <th className="th-player">اللاعب</th>
                    <th className="th-team">النادي</th>
                    {hasAnyPosition && <th className="th-pos">المركز</th>}
                    {hasAnyJersey && <th className="th-jersey">رقم القميص</th>}
                    <th className="th-goals">الأهداف</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, idx) => {
                    const rank = idx + 1;
                    const isTop3 = rank <= 3;
                    return (
                      <tr
                        key={player.id}
                        className={`table-row rank-${rank} ${isTop3 ? 'highlight-row' : ''}`}
                      >
                        <td className="td-rank-val">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                        </td>
                        <td className="td-player-val">
                          <div className="player-flex">
                            <div className="player-avatar">
                              {player.name.charAt(0)}
                            </div>
                            <span className="player-name-txt">{player.name}</span>
                          </div>
                        </td>
                        <td className="td-team-val">
                          <div className="team-flex">
                            {player.team.logoUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={player.team.logoUrl} alt="" className="team-logo-sm" />
                            )}
                            <span>{player.team.name}</span>
                          </div>
                        </td>
                        {hasAnyPosition && (
                          <td className="td-pos-val">
                            {player.position ? (
                              <span className={`pos-badge ${player.position}`}>
                                {POSITION_MAP[player.position]}
                              </span>
                            ) : (
                              <span className="empty-dash">-</span>
                            )}
                          </td>
                        )}
                        {hasAnyJersey && (
                          <td className="td-jersey-val">
                            {player.jerseyNumber !== null ? (
                              <span className="jersey-num">#{player.jerseyNumber}</span>
                            ) : (
                              <span className="empty-dash">-</span>
                            )}
                          </td>
                        )}
                        <td className="td-goals-val">
                          <div className="goals-badge-wrapper">
                            <span className="goals-badge">{player.goalsCount}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
