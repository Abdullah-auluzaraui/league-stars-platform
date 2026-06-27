import { prisma } from '@/core/lib/prisma';
import Link from 'next/link';
import { Trophy, Calendar, Vote, ChevronLeft, Sparkles, Activity, Award } from 'lucide-react';
import InteractiveHover from './components/InteractiveHover';
import HeroStats from './components/HeroStats';

// ─── جلب بيانات الصفحة الرئيسية بشكل ذكي وديناميكي ──────────────────────────────
async function getHomeData() {
  try {
    const [hero, tournament, liveMatch, nextMatch, lastFinishedMatch, activeVoteGoal, topScorers] = await Promise.all([
      // محتوى الهيرو
      prisma.content.findUnique({ where: { section: 'hero' } }).catch(() => null),

      // البطولة النشطة
      prisma.tournament.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null),

      // هل توجد مباراة مباشرة الآن؟
      prisma.match.findFirst({
        where: { status: 'live' },
        include: {
          homeTeam: { select: { name: true, logoUrl: true } },
          awayTeam: { select: { name: true, logoUrl: true } },
        },
      }).catch(() => null),

      // اللقاء القادم المجدول
      prisma.match.findFirst({
        where: { status: 'scheduled' },
        include: {
          homeTeam: { select: { name: true, logoUrl: true } },
          awayTeam: { select: { name: true, logoUrl: true } },
        },
        orderBy: { matchDate: 'asc' },
      }).catch(() => null),

      // آخر لقاء انتهى
      prisma.match.findFirst({
        where: { status: 'finished' },
        include: {
          homeTeam: { select: { name: true, logoUrl: true } },
          awayTeam: { select: { name: true, logoUrl: true } },
        },
        orderBy: { matchDate: 'desc' },
      }).catch(() => null),

      // هل يوجد هدف مرشح للتصويت؟
      prisma.goal.findFirst({
        where: { isNominated: true },
        include: {
          player: { select: { name: true } },
          team: { select: { name: true } },
          match: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      }).catch(() => null),

      // قائمة أفضل 5 هدافين للبطولة
      prisma.player.findMany({
        where: { goalsCount: { gt: 0 } },
        include: { team: { select: { name: true, logoUrl: true } } },
        orderBy: { goalsCount: 'desc' },
        take: 5,
      }).catch(() => []),
    ]);

    return { hero, tournament, liveMatch, nextMatch, lastFinishedMatch, activeVoteGoal, topScorers };
  } catch (error) {
    console.error('فشل الاتصال بقاعدة البيانات، جاري تشغيل المكون بالبيانات الاحتياطية:', error);
    return {
      hero: null,
      tournament: null,
      liveMatch: null,
      nextMatch: null,
      lastFinishedMatch: null,
      activeVoteGoal: null,
      topScorers: [],
    };
  }
}

// ─── بيانات محاكاة احتياطية (Premium Mock Data) ──────────────────────────────────
const MOCK_TOURNAMENT = {
  name: 'بطولة نجوم الدوري الرمضانية الأولى',
  status: 'active',
};

const MOCK_FEATURED_MATCH = {
  id: 'featured-1',
  status: 'live',
  homeTeam: { name: 'فرسان نجد', logoUrl: null },
  awayTeam: { name: 'صقور الرياض', logoUrl: null },
  homeScore: 2,
  awayScore: 1,
  matchDate: new Date().toISOString(),
  venue: 'ملعب الجوهرة الرئيسي',
};

const MOCK_TOP_SCORERS = [
  {
    id: 'p1',
    name: 'ياسر القحطاني',
    goalsCount: 6,
    team: { name: 'صقور الرياض', logoUrl: null },
  },
  {
    id: 'p2',
    name: 'محمد السهلاوي',
    goalsCount: 5,
    team: { name: 'فرسان نجد', logoUrl: null },
  },
  {
    id: 'p3',
    name: 'نايف هزازي',
    goalsCount: 4,
    team: { name: 'عميد الغربية', logoUrl: null },
  },
  {
    id: 'p4',
    name: 'يوسف السالم',
    goalsCount: 3,
    team: { name: 'أسود الشرقية', logoUrl: null },
  },
  {
    id: 'p5',
    name: 'تيسير الجاسم',
    goalsCount: 3,
    team: { name: 'زعيم الجنوب', logoUrl: null },
  },
];

const MOCK_STANDINGS = [
  { rank: 1, team: 'فرسان نجد', played: 5, gd: '+8', points: 13, medal: '🥇' },
  { rank: 2, team: 'صقور الرياض', played: 5, gd: '+4', points: 10, medal: '🥈' },
  { rank: 3, team: 'عميد الغربية', played: 5, gd: '+2', points: 9, medal: '🥉' },
  { rank: 4, team: 'زعيم الجنوب', played: 5, gd: '0', points: 7, medal: null },
];

const MOCK_SPONSORS = [
  { name: 'أرامكو السعودية' },
  { name: 'روشن العقارية' },
  { name: 'طيران الرياض' },
  { name: 'مشاريع القدية' },
];

// ─── مساعد: تنسيق التاريخ والوقت للعربية ──────────────────────────────────────
function formatMatchDateTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeStr = dateObj.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateFormatted = dateObj.toLocaleDateString('ar-SA', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return { time: timeStr, date: dateFormatted };
}

// ─── مساعد: استخراج أول حرفين لرمز الفريق المؤقت ──────────────────────────────────
function getTeamInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

// ─── المكون الرئيسي للصفحة ───────────────────────────────────────────────────
export default async function HomePage() {
  const data = await getHomeData();

  // دمج البيانات الحقيقية أو استخدام المحاكاة
  const activeTournament = data.tournament ?? MOCK_TOURNAMENT;
  const liveMatch = data.liveMatch;
  const activeVoteGoal = data.activeVoteGoal;
  
  // اختيار المباراة المميزة (المباشرة أولاً، ثم القادمة، ثم الأخيرة المنتهية، ثم المحاكاة)
  const featuredMatch = liveMatch ?? data.nextMatch ?? data.lastFinishedMatch ?? MOCK_FEATURED_MATCH;
  const scorers = data.topScorers.length > 0 ? data.topScorers : MOCK_TOP_SCORERS;

  // تقسيم الهدافين لمنصة التتويج ثلاثية الأبعاد
  const firstPlace = scorers[0];
  const secondPlace = scorers[1];
  const thirdPlace = scorers[2];
  const remainingScorers = scorers.slice(3);

  const isLive = featuredMatch.status === 'live';
  const { time, date } = formatMatchDateTime(featuredMatch.matchDate);

  return (
    <div className="space-y-16 sm:space-y-28 max-w-5xl mx-auto w-full box-border">
      {/* ══════════════════════════════════════════════════════
          1. قسم الهيرو الفاخر والمبسط (Hero Section)
      ══════════════════════════════════════════════════════ */}
      <section className="relative pt-8 sm:pt-16 text-center flex flex-col items-center justify-center space-y-8 sm:space-y-12 animate-fade-in-up w-full">
        {/* شارة البطولة */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/3 border border-white/8 text-sm sm:text-base font-bold text-[#E2B659]">
          <span className="w-2 h-2 rounded-full bg-[#E2B659] animate-pulse" />
          {activeTournament.name}
        </div>

        {/* العنوان الرئيسي والنبذة */}
        <div className="space-y-5 max-w-3xl w-full px-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight break-words text-gold-gradient">
            منصة نجوم الدوري
          </h1>
          <p className="text-base sm:text-xl lg:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            {data.hero?.body ??
              'الملتقى التفاعلي لمتابعة نتائج مباريات البطولة، رصد الترتيب بالوقت الفعلي، ومشاركة الجماهير في اختيار النجوم.'}
          </p>
        </div>

        {/* إحصائيات خطية ناعمة جداً متحركة (Count-Up) وتنزلق مع بقية النصوص */}
        <HeroStats goals={48} teams={12} matches={32} />

        {/* أزرار الهيرو الدائمة الفاخرة */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md pt-2 px-4 sm:px-0">
          <Link
            href="/matches"
            className="btn-gold px-10 py-4 text-base sm:text-lg flex items-center gap-2.5 w-full sm:w-auto justify-center font-black rounded-full"
          >
            <Calendar className="w-5.5 h-5.5" />
            جدول المباريات
          </Link>
          <Link
            href="/standings"
            className="btn-glass px-10 py-4 text-base sm:text-lg flex items-center gap-2.5 w-full sm:w-auto justify-center font-bold"
          >
            <Trophy className="w-5.5 h-5.5" />
            جدول الترتيب والفرق
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. البنر الإعلاني المؤقت للتصويت النشط (Active Vote Banner)
      ══════════════════════════════════════════════════════ */}
      {activeVoteGoal && (
        <section className="animate-fade-in-up w-full px-2">
          <div className="rounded-2xl glass-panel border border-[#E2B659]/20 bg-gradient-to-r from-[#E2B659]/5 via-transparent to-transparent p-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#E2B659]/10 border border-[#E2B659]/20 flex items-center justify-center text-[#E2B659] flex-shrink-0">
                <Vote className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-black text-white">التصويت مفتوح الآن!</h4>
                <p className="text-sm sm:text-base text-gray-300 font-medium">
                  صوّت لأفضل هدف للاعب <span className="text-[#E2B659] font-bold">{activeVoteGoal.player.name}</span> في لقاء {activeVoteGoal.match.homeTeam.name} ضد {activeVoteGoal.match.awayTeam.name}.
                </p>
              </div>
            </div>
            <Link
              href={`/matches?voteGoalId=${activeVoteGoal.id}`}
              className="btn-gold px-8 py-3 text-sm sm:text-base font-bold whitespace-nowrap"
            >
              اذهب للتصويت
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          3. قسم المباراة المميزة (Featured Match)
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-5 animate-fade-in-up animate-delay-100 w-full">
        <div className="flex items-center justify-between px-3">
          <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#E2B659]" />
            المباراة المميزة
          </h2>
          <Link
            href="/matches"
            className="text-sm sm:text-base text-[#E2B659] hover:text-[#F1D494] transition-colors flex items-center gap-0.5 font-bold"
          >
            جدول المباريات
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* كارت المباراة المميزة الفاخر مع تأثير التوهج الذكي للمؤشر وزيادة التباعد الداخلي للتنفس البصري */}
        <InteractiveHover className="rounded-3xl glass-panel glass-card-featured p-6 sm:p-12 w-full box-border">
          <div className="absolute inset-0 bg-gradient-to-b from-white/1 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center justify-center space-y-8 sm:space-y-10">
            {/* رأس الكارت */}
            <div className="flex items-center justify-between w-full border-b border-white/5 pb-4">
              <span className="text-sm sm:text-base text-gray-300 font-bold truncate max-w-[180px] sm:max-w-none">
                {featuredMatch.venue}
              </span>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs sm:text-sm font-black text-red-500">
                  <Activity className="w-4 h-4 animate-pulse" />
                  مباشر الآن
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-bold text-gray-400">
                  اللقاء المميز
                </span>
              )}
            </div>

            {/* مواجهة الفريقين مع زيادة التباعد الأفقي */}
            <div className="flex items-center justify-between w-full max-w-3xl gap-4 sm:gap-12">
              {/* الفريق الأول */}
              <div className="flex flex-col items-center gap-4 flex-1 text-center min-w-0">
                <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-white/8 to-white/3 border border-white/10 flex items-center justify-center text-lg sm:text-2xl font-black text-[#E2B659] shadow-inner font-outfit">
                  {getTeamInitials(featuredMatch.homeTeam.name)}
                </div>
                <span className="text-base sm:text-xl font-bold text-white truncate w-full px-1">
                  {featuredMatch.homeTeam.name}
                </span>
              </div>

              {/* النتيجة أو الوقت */}
              <div className="flex flex-col items-center justify-center px-1 sm:px-4">
                {isLive || featuredMatch.status === 'finished' ? (
                  <span className="text-3xl sm:text-5xl font-black text-white tracking-normal sm:tracking-widest font-outfit text-gold-gradient">
                    {featuredMatch.homeScore} - {featuredMatch.awayScore}
                  </span>
                ) : (
                  <div className="text-center space-y-2">
                    <span className="block text-lg sm:text-2xl font-bold text-[#E2B659] font-outfit">{time}</span>
                    <span className="block text-sm sm:text-base text-gray-400 font-semibold">{date}</span>
                  </div>
                )}
                <span className="text-xs sm:text-sm text-gray-500 font-bold tracking-widest mt-2">VS</span>
              </div>

              {/* الفريق الثاني */}
              <div className="flex flex-col items-center gap-4 flex-1 text-center min-w-0">
                <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-white/8 to-white/3 border border-white/10 flex items-center justify-center text-lg sm:text-2xl font-black text-[#E2B659] shadow-inner font-outfit">
                  {getTeamInitials(featuredMatch.awayTeam.name)}
                </div>
                <span className="text-base sm:text-xl font-bold text-white truncate w-full px-1">
                  {featuredMatch.awayTeam.name}
                </span>
              </div>
            </div>

            {/* تفاصيل مركز التغطية */}
            <div className="pt-2">
              <Link
                href="/matches"
                className="btn-glass px-8 py-3 text-sm sm:text-base flex items-center gap-2 font-bold"
              >
                مركز التغطية المباشرة
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </InteractiveHover>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. القسم الثنائي متناهي البساطة (Two-Column Split Section)
             يعرض صدارة الترتيب وصدارة الهدافين مع تباعد أوسع للعمودين لمنع الازدحام
      ══════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 animate-fade-in-up animate-delay-200 w-full">
        {/* العمود الأيمن: جدول الترتيب المبسط للقمة */}
        <div className="space-y-5 w-full">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#E2B659]" />
              صدارة مجموعات البطولة
            </h3>
            <Link href="/standings" className="text-sm sm:text-base text-[#E2B659] hover:underline font-bold">
              جدول الترتيب الكامل ←
            </Link>
          </div>

          <InteractiveHover className="rounded-2xl border border-white/5 glass-panel w-full overflow-hidden">
            {/* حاوية تمرير أفقي لحماية الشاشات الصغيرة جداً */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-right text-base sm:text-lg min-w-[360px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5 text-gray-300 text-sm sm:text-base font-bold">
                    <th className="py-4 px-5 text-center">المركز</th>
                    <th className="py-4 px-5">الفريق</th>
                    <th className="py-4 px-5 text-center font-outfit">لعب</th>
                    <th className="py-4 px-5 text-center font-outfit">فارق</th>
                    <th className="py-4 px-5 text-center font-outfit">نقاط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MOCK_STANDINGS.map((row) => (
                    <tr key={row.rank} className="hover:bg-white/3 transition-colors">
                      <td className="py-4.5 px-5 text-center font-outfit font-black text-lg">
                        {row.medal ?? row.rank}
                      </td>
                      <td className="py-4.5 px-5 font-black text-white">
                        {row.team}
                      </td>
                      <td className="py-4.5 px-5 text-center font-outfit text-gray-300 font-semibold">{row.played}</td>
                      <td className="py-4.5 px-5 text-center font-outfit text-gray-300 font-semibold">{row.gd}</td>
                      <td className="py-4.5 px-5 text-center font-black font-outfit text-[#E2B659] text-lg sm:text-xl">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InteractiveHover>
        </div>

        {/* العمود الأيسر: أفضل الهدافين (منصة التتويج ثلاثية الأبعاد الفاخرة 3D Glass Podium) */}
        <div className="space-y-5 w-full flex flex-col justify-between">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-[#E2B659]" />
              أفضل هدافي البطولة
            </h3>
            <Link href="/standings" className="text-sm sm:text-base text-[#E2B659] hover:underline font-bold">
              جدول الهدافين الكامل ←
            </Link>
          </div>

          <div className="flex flex-col justify-between flex-grow gap-5">
            {/* منصة التتويج ثلاثية الأبعاد (3D Glass Podium) - زيادة الارتفاع لمنع التداخل والازدحام */}
            <div className="glass-panel rounded-2xl p-5 flex items-end justify-center gap-3 sm:gap-5 h-[250px] relative overflow-hidden">
              {/* المركز الثاني (يمين الوسط) */}
              {secondPlace && (
                <div className="flex flex-col items-center w-24 sm:w-28 space-y-2">
                  <div className="text-xs sm:text-sm text-slate-300 font-bold flex flex-col items-center">
                    <span className="text-xl">🥈</span>
                    <span className="text-[10px] sm:text-xs font-bold leading-none">المركز الثاني</span>
                  </div>
                  <div className="w-full h-[100px] sm:h-[115px] rounded-t-xl border border-slate-500/20 bg-gradient-to-t from-slate-500/8 to-transparent flex flex-col items-center justify-between p-2 text-center">
                    <span className="text-xs sm:text-sm font-bold text-white line-clamp-1 w-full">{secondPlace.name}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 line-clamp-1 w-full">{secondPlace.team.name}</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-base sm:text-xl font-black font-outfit text-[#E2B659]">{secondPlace.goalsCount}</span>
                      <span className="text-[10px] text-gray-500 font-bold">أهداف</span>
                    </div>
                  </div>
                </div>
              )}

              {/* المركز الأول (الوسط والأعلى) */}
              {firstPlace && (
                <div className="flex flex-col items-center w-28 sm:w-32 space-y-2 z-10">
                  <div className="text-xs sm:text-sm text-[#E2B659] font-bold flex flex-col items-center">
                    <span className="text-2xl animate-bounce">🥇</span>
                    <span className="text-[11px] sm:text-xs font-black leading-none text-[#E2B659]">المتصدر</span>
                  </div>
                  <div className="w-full h-[135px] sm:h-[150px] rounded-t-2xl border border-[#E2B659]/30 bg-gradient-to-t from-[#E2B659]/12 to-transparent shadow-[0_0_15px_rgba(226,182,89,0.06)] flex flex-col items-center justify-between p-2.5 text-center">
                    <span className="text-sm sm:text-base font-black text-white line-clamp-1 w-full">{firstPlace.name}</span>
                    <span className="text-[10px] sm:text-xs text-[#E2B659] font-bold line-clamp-1 w-full">{firstPlace.team.name}</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl sm:text-3xl font-black font-outfit text-[#E2B659]">{firstPlace.goalsCount}</span>
                      <span className="text-[10px] sm:text-xs text-[#E2B659] font-bold">أهداف</span>
                    </div>
                  </div>
                </div>
              )}

              {/* المركز الثالث (يسار الوسط) */}
              {thirdPlace && (
                <div className="flex flex-col items-center w-24 sm:w-28 space-y-2">
                  <div className="text-xs sm:text-sm text-amber-600 font-bold flex flex-col items-center">
                    <span className="text-xl">🥉</span>
                    <span className="text-[10px] sm:text-xs font-bold leading-none">المركز الثالث</span>
                  </div>
                  <div className="w-full h-[85px] sm:h-[95px] rounded-t-xl border border-amber-700/20 bg-gradient-to-t from-amber-700/5 to-transparent flex flex-col items-center justify-between p-2 text-center">
                    <span className="text-xs sm:text-sm font-bold text-white line-clamp-1 w-full">{thirdPlace.name}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 line-clamp-1 w-full">{thirdPlace.team.name}</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-base sm:text-xl font-black font-outfit text-[#E2B659]">{thirdPlace.goalsCount}</span>
                      <span className="text-[10px] text-gray-500 font-bold">أهداف</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* بقية الهدافين (المركز الرابع والخامس) في قائمة خطية ناعمة ومريحة */}
            {remainingScorers.length > 0 && (
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                {remainingScorers.map((player: any, idx: number) => (
                  <div key={player.id || idx} className="flex items-center justify-between text-base py-1 px-2 hover:bg-white/3 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="font-outfit font-black text-gray-400 text-lg">{idx + 4}</span>
                      <div className="flex flex-col">
                        <span className="font-black text-white">{player.name}</span>
                        <span className="text-xs sm:text-sm text-gray-400 font-semibold">{player.team.name}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-black font-outfit text-[#E2B659] text-lg">{player.goalsCount}</span>
                      <span className="text-xs text-gray-500 font-bold">أهداف</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. شريط الرعاة وشركاء النجاح (Sponsors Bar)
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-4 text-center w-full animate-delay-300">
        <span className="text-xs sm:text-sm font-bold tracking-widest text-[#E2B659]/40 uppercase">
          شركاء النجاح والرعاة
        </span>
        <div className="py-4 border-t border-b border-white/3 w-full">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm sm:text-base font-semibold text-gray-400 px-4">
            {MOCK_SPONSORS.map((sponsor, index) => (
              <span
                key={index}
                className="hover:text-gray-300 transition-colors duration-300 cursor-default"
              >
                {sponsor.name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
