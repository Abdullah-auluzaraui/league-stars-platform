'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Swords,
  Play,
  StopCircle,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Timer,
  Info,
  X,
} from 'lucide-react';
import {
  startMatch,
  finishMatch,
  recordGoal,
  deleteGoal,
  recordCard,
  deleteCard,
  updatePenaltyScore,
} from './matchActions';

interface LiveMatchControlProps {
  matches: any[];
  players: any[];
  fetchMatches: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function LiveMatchControl({
  matches,
  players,
  fetchMatches,
  showToast,
}: LiveMatchControlProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // حالات تسجيل الأحداث
  const [activeModal, setActiveModal] = useState<'goal' | 'card' | 'penalty' | null>(null);
  const [eventTeamId, setEventTeamId] = useState<string>(''); // الفريق الذي يسجل له الحدث
  const [eventPlayerId, setEventPlayerId] = useState<string>('');
  const [eventMinute, setEventMinute] = useState<string>('45');
  const [goalType, setGoalType] = useState<string>('normal'); // normal | penalty | own_goal | free_kick
  const [cardType, setCardType] = useState<string>('yellow'); // yellow | red | second_yellow

  // ركلات الترجيح
  const [homePenalties, setHomePenalties] = useState<string>('');
  const [awayPenalties, setAwayPenalties] = useState<string>('');

  // إغلاق القوائم المنسدلة للحدث
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (playerRef.current && !playerRef.current.contains(event.target as Node)) {
        setPlayerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // جلب المباراة المحددة حالياً مع أحداثها المحدثة
  const activeMatch = matches.find((m) => m.id === selectedMatchId);

  // تصفية مباريات اليوم + المباريات النشطة + أقرب مباراة
  const liveOrUpcomingMatches = matches.filter((m) => {
    const today = new Date();
    const matchDate = new Date(m.matchDate);
    const isToday =
      matchDate.getDate() === today.getDate() &&
      matchDate.getMonth() === today.getMonth() &&
      matchDate.getFullYear() === today.getFullYear();

    return m.status === 'live' || isToday || m.status === 'scheduled';
  });

  // تعيين المباراة الأولى الجارية تلقائياً إن وجدت
  useEffect(() => {
    if (!selectedMatchId && liveOrUpcomingMatches.length > 0) {
      const liveMatch = liveOrUpcomingMatches.find((m) => m.status === 'live');
      if (liveMatch) {
        setSelectedMatchId(liveMatch.id);
      } else {
        setSelectedMatchId(liveOrUpcomingMatches[0].id);
      }
    }
  }, [matches, selectedMatchId, liveOrUpcomingMatches]);

  if (matches.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 border-dashed border-white/10 text-center animate-fade-in-up">
        <Swords className="w-10 h-10 text-white/55 mx-auto mb-2" />
        <p className="text-xs font-semibold text-white/50">لا توجد مباريات مسجلة حالياً لجدولتها.</p>
      </div>
    );
  }

  // بدء المباراة
  const handleStart = async (id: string) => {
    setLoadingAction('start');
    try {
      const res = await startMatch(id);
      if (res.success) {
        showToast('تم بدء المباراة بنجاح، جاري رصد الأحداث!');
        fetchMatches();
      } else {
        showToast(res.error || 'فشل بدء المباراة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // إنهاء المباراة
  const handleFinish = async (id: string) => {
    setLoadingAction('finish');
    try {
      const res = await finishMatch(id);
      if (res.success) {
        showToast('تم إنهاء المباراة بنجاح وحفظ النتائج والترتيب!');
        fetchMatches();
      } else {
        showToast(res.error || 'فشل إنهاء المباراة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // تحضير مودال تسجيل الحدث (هدف / بطاقة)
  const openEventModal = (type: 'goal' | 'card', teamId: string) => {
    setEventTeamId(teamId);
    setEventPlayerId('');
    setEventMinute('45');
    setGoalType('normal');
    setCardType('yellow');
    setActiveModal(type);
    setPlayerDropdownOpen(false);
  };

  // إرسال تسجيل الهدف
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !eventPlayerId) return;

    setLoadingAction('add_goal');
    try {
      const res = await recordGoal(
        selectedMatchId,
        eventPlayerId,
        eventTeamId,
        goalType,
        Number(eventMinute)
      );

      if (res.success) {
        showToast('تم تسجيل الهدف وتحديث النتيجة!');
        fetchMatches();
        setActiveModal(null);
      } else {
        showToast(res.error || 'فشل تسجيل الهدف', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // إرسال تسجيل البطاقة
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !eventPlayerId) return;

    setLoadingAction('add_card');
    try {
      const res = await recordCard(
        selectedMatchId,
        eventPlayerId,
        eventTeamId,
        cardType,
        Number(eventMinute)
      );

      if (res.success) {
        showToast('تم تسجيل البطاقة بنجاح!');
        fetchMatches();
        setActiveModal(null);
      } else {
        showToast(res.error || 'فشل تسجيل البطاقة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // إرسال ركلات الترجيح
  const handlePenaltySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;

    setLoadingAction('add_penalty');
    try {
      const hPen = homePenalties === '' ? null : Number(homePenalties);
      const aPen = awayPenalties === '' ? null : Number(awayPenalties);

      const res = await updatePenaltyScore(selectedMatchId, hPen, aPen);
      if (res.success) {
        showToast('تم تحديث ركلات الترجيح بنجاح!');
        fetchMatches();
        setActiveModal(null);
      } else {
        showToast(res.error || 'فشل التحديث', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // حذف هدف
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('هل ترغب فعلاً في التراجع عن هذا الهدف وإلغائه؟')) return;
    setLoadingAction(`delete_goal_${goalId}`);
    try {
      const res = await deleteGoal(goalId);
      if (res.success) {
        showToast('تم التراجع عن الهدف وتعديل النتيجة');
        fetchMatches();
      } else {
        showToast(res.error || 'فشل التراجع', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // حذف بطاقة
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('هل ترغب فعلاً في التراجع عن هذه البطاقة؟')) return;
    setLoadingAction(`delete_card_${cardId}`);
    try {
      const res = await deleteCard(cardId);
      if (res.success) {
        showToast('تم إلغاء البطاقة بنجاح');
        fetchMatches();
      } else {
        showToast(res.error || 'فشل الإلغاء', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // تصفية اللاعبين للتسجيل
  // منطق الهدف العكسي: إذا كان النوع own_goal، نفلتر لاعبي الفريق الذي استقبل الهدف (الفريق الآخر)، بدلاً من الفريق المستفيد.
  const targetFilterTeamId =
    activeModal === 'goal' && goalType === 'own_goal'
      ? eventTeamId === activeMatch?.homeTeamId
        ? activeMatch?.homeTeamId // اللاعب الذي ارتكب الهدف العكسي في مرماه
        : activeMatch?.awayTeamId
      : eventTeamId;

  // جلب اللاعبين المنتمين للفريق المستهدف
  const filteredPlayers = players.filter((p) => p.teamId === targetFilterTeamId);

  // تحديد اللاعبين الذين تم طردهم بالفعل في هذه المباراة (حمراء أو صفراء ثانية) لاستبعادهم من القوائم
  const redCardedPlayerIds =
    activeMatch?.cards
      ?.filter((c: any) => c.type === 'red' || c.type === 'second_yellow')
      ?.map((c: any) => c.playerId) || [];

  const availablePlayers = filteredPlayers.filter((p) => !redCardedPlayerIds.includes(p.id));

  // تفريغ اللاعب المختار عند تغيير نوع الهدف (لأنه قد يغير الفريق المستهدف باللاعبين في حال الهدف العكسي)
  useEffect(() => {
    setEventPlayerId('');
  }, [goalType]);

  const selectedPlayer = availablePlayers.find((p) => p.id === eventPlayerId);

  // دمج وترتيب الأهداف والبطاقات زمنياً لعرضها في الشريط الزمني
  const timelineEvents = [
    ...(activeMatch?.goals || []).map((g: any) => ({
      id: g.id,
      type: 'goal',
      goalType: g.type,
      minute: g.minute,
      playerName: g.player?.name || 'لاعب غير معروف',
      teamId: g.teamId,
      detail:
        g.type === 'own_goal'
          ? 'هدف عكسي ⚽ (عكسي)'
          : g.type === 'penalty'
          ? 'ركلة جزاء ⚽'
          : g.type === 'free_kick'
          ? 'ركلة حرة ⚽'
          : 'هدف ⚽',
    })),
    ...(activeMatch?.cards || []).map((c: any) => ({
      id: c.id,
      type: 'card',
      cardType: c.type,
      minute: c.minute,
      playerName: c.player?.name || 'لاعب غير معروف',
      teamId: c.teamId,
      detail:
        c.type === 'yellow'
          ? 'بطاقة صفراء 🟨'
          : c.type === 'second_yellow'
          ? 'بطاقة صفراء ثانية 🟨🟥'
          : 'بطاقة حمراء 🟥',
    })),
  ].sort((a, b) => a.minute - b.minute);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" dir="rtl">
      {/* العمود الأيمن: قائمة مباريات اليوم والنشطة */}
      <div className="lg:col-span-1 space-y-4">
        <h4 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-[#F0C040]" />
          <span>مباريات اليوم والمباريات النشطة</span>
        </h4>
        <div className="space-y-3 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
          {liveOrUpcomingMatches.map((m) => {
            const isSelected = m.id === selectedMatchId;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMatchId(m.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-right ${
                  isSelected
                    ? 'bg-[#C9971A]/5 border-[#C9971A]/30 shadow-lg shadow-[#C9971A]/5'
                    : 'bg-white/2 border-white/6 hover:bg-white/4 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-white/50 bg-white/5 px-2 py-0.5 rounded">
                    {m.tournament?.name}
                  </span>
                  {m.status === 'live' ? (
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      مباشر
                    </span>
                  ) : m.status === 'finished' ? (
                    <span className="text-[9px] font-black text-white/45 bg-white/10 px-2 py-0.5 rounded">
                      منتهية
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-[#F0C040] bg-[#C9971A]/10 px-2 py-0.5 rounded">
                      مجدولة
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white/80 truncate max-w-[80px]">
                    {m.homeTeam?.name}
                  </span>
                  <div className="flex items-center gap-1.5 bg-white/3 px-3 py-1 rounded-xl">
                    <span className="text-xs font-black text-white/90">
                      {m.homeScore !== null ? m.homeScore : '-'}
                    </span>
                    <span className="text-[10px] text-white/60">:</span>
                    <span className="text-xs font-black text-white/90">
                      {m.awayScore !== null ? m.awayScore : '-'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white/80 truncate max-w-[80px]">
                    {m.awayTeam?.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* العمود الأيسر: لوحة التحكم المباشر بالمباراة المختارة */}
      <div className="lg:col-span-2 space-y-4">
        {activeMatch ? (
          <div className="space-y-4">
            {/* بطاقة النتيجة الكبيرة الفخمة */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#121018] to-[#0e0e12] border border-white/8 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
              {/* خلفية جمالية */}
              <div className="absolute inset-0 bg-[#C9971A]/2 opacity-[0.02] pointer-events-none" />

              <div className="text-[10px] font-bold text-white/60 mb-3 flex items-center gap-1 bg-white/3 px-3 py-1 rounded-full border border-white/5">
                <span>{activeMatch.tournament?.name}</span>
                <span>•</span>
                <span>{activeMatch.venue || 'بدون ملعب محدد'}</span>
              </div>

              {/* لوحة النتيجة */}
              <div className="w-full grid grid-cols-3 items-center justify-center text-center gap-2 mb-6">
                {/* الفريق المستضيف */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center p-2">
                    {activeMatch.homeTeam?.logoUrl ? (
                      <img
                        src={activeMatch.homeTeam.logoUrl}
                        alt="Logo"
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <Swords className="w-6 h-6 text-white/60" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-black text-white truncate w-full max-w-[120px]">
                    {activeMatch.homeTeam?.name}
                  </span>
                </div>

                {/* النتيجة */}
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="flex items-center justify-center gap-3 bg-white/4 border border-white/8 px-6 py-2 rounded-2xl shadow-inner">
                    <span className="text-2xl sm:text-3xl font-black text-[#F0C040] font-mono leading-none">
                      {activeMatch.homeScore !== null ? activeMatch.homeScore : '-'}
                    </span>
                    <span className="text-white/45 font-black text-xl">:</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#F0C040] font-mono leading-none">
                      {activeMatch.awayScore !== null ? activeMatch.awayScore : '-'}
                    </span>
                  </div>

                  {/* ركلات الترجيح إن وجدت */}
                  {(activeMatch.homePenalty !== null || activeMatch.awayPenalty !== null) && (
                    <span className="text-[9px] font-black text-red-300 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      ركلات الترجيح: {activeMatch.homePenalty || 0} - {activeMatch.awayPenalty || 0}
                    </span>
                  )}

                  {activeMatch.status === 'live' && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20 animate-pulse mt-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      مباشر الآن
                    </span>
                  )}
                </div>

                {/* الفريق الضيف */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center p-2">
                    {activeMatch.awayTeam?.logoUrl ? (
                      <img
                        src={activeMatch.awayTeam.logoUrl}
                        alt="Logo"
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <Swords className="w-6 h-6 text-white/60" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-black text-white truncate w-full max-w-[120px]">
                    {activeMatch.awayTeam?.name}
                  </span>
                </div>
              </div>

              {/* أزرار بدء وإنهاء المباراة */}
              <div className="flex items-center gap-3 border-t border-white/5 pt-4 w-full justify-center">
                {activeMatch.status === 'scheduled' && (
                  <button
                    onClick={() => handleStart(activeMatch.id)}
                    disabled={loadingAction === 'start'}
                    className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-l from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === 'start' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>بدء المباراة</span>
                  </button>
                )}

                {activeMatch.status === 'live' && (
                  <button
                    onClick={() => handleFinish(activeMatch.id)}
                    disabled={loadingAction === 'finish'}
                    className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-l from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === 'finish' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <StopCircle className="w-3.5 h-3.5" />
                    )}
                    <span>إنهاء وإغلاق النتيجة</span>
                  </button>
                )}

                {activeMatch.status === 'finished' && (
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/8 text-white/50 rounded-xl text-[10px] font-bold">
                    <span>مباراة منتهية</span>
                  </div>
                )}
              </div>
            </div>

            {/* نظام الإدخال المنقسم (Home / Away) - متاح فقط أثناء المباراة الجارية */}
            {activeMatch.status === 'live' ? (
              <div className="grid grid-cols-2 gap-4">
                {/* إدخال للمستضيف */}
                <div className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-3">
                  <span className="text-[10px] font-black text-white/50 truncate max-w-[150px]">
                    رصد لـ: {activeMatch.homeTeam?.name}
                  </span>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => openEventModal('goal', activeMatch.homeTeamId)}
                      className="flex flex-col items-center justify-center p-3 bg-[#C9971A]/10 border border-[#C9971A]/20 hover:bg-[#C9971A]/20 hover:border-[#C9971A]/35 text-[#F0C040] rounded-xl transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mb-1" />
                      <span className="text-[11px] font-black">⚽ هدف</span>
                    </button>
                    <button
                      onClick={() => openEventModal('card', activeMatch.homeTeamId)}
                      className="flex flex-col items-center justify-center p-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/35 text-red-400 rounded-xl transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mb-1" />
                      <span className="text-[11px] font-black">🟨/🟥 بطاقة</span>
                    </button>
                  </div>
                </div>

                {/* إدخال للضيف */}
                <div className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-3">
                  <span className="text-[10px] font-black text-white/50 truncate max-w-[150px]">
                    رصد لـ: {activeMatch.awayTeam?.name}
                  </span>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => openEventModal('goal', activeMatch.awayTeamId)}
                      className="flex flex-col items-center justify-center p-3 bg-[#C9971A]/10 border border-[#C9971A]/20 hover:bg-[#C9971A]/20 hover:border-[#C9971A]/35 text-[#F0C040] rounded-xl transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mb-1" />
                      <span className="text-[11px] font-black">⚽ هدف</span>
                    </button>
                    <button
                      onClick={() => openEventModal('card', activeMatch.awayTeamId)}
                      className="flex flex-col items-center justify-center p-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/35 text-red-400 rounded-xl transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mb-1" />
                      <span className="text-[11px] font-black">🟨/🟥 بطاقة</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : activeMatch.status === 'finished' && activeMatch.stage !== 'group' ? (
              // إذا كانت منتهية وليست مجموعات (إقصائيات) يتاح للمشرف تسجيل ركلات ترجيح
              <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#F0C040]" />
                  <span className="text-xs font-semibold text-white/60">
                    مباراة إقصائية منتهية. هل ترغب في رصد/تحديث ركلات الترجيح؟
                  </span>
                </div>
                <button
                  onClick={() => {
                    setHomePenalties(String(activeMatch.homePenalty || ''));
                    setAwayPenalties(String(activeMatch.awayPenalty || ''));
                    setActiveModal('penalty');
                  }}
                  className="px-4 py-1.5 bg-white/4 border border-white/8 hover:bg-white/8 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  تعديل الترجيح
                </button>
              </div>
            ) : null}

            {/* شريط الأحداث الزمني (Match Timeline) */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
              <h4 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <span>سجل الأحداث الزمني للمباراة</span>
              </h4>

              {timelineEvents.length === 0 ? (
                <p className="text-[10px] text-white/60 text-center py-2">لا توجد أحداث مرصودة بعد في هذه المباراة.</p>
              ) : (
                <div className="relative border-r border-white/5 pr-4 space-y-4">
                  {timelineEvents.map((evt) => {
                    const isGoal = evt.type === 'goal';
                    const isHomeEvent = evt.teamId === activeMatch.homeTeamId;
                    return (
                      <div key={evt.id} className="relative flex items-center justify-between gap-4 text-right">
                        {/* خط الزمن */}
                        <span className="absolute right-[-21px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C9971A] border border-[#0e0e12]" />

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F0C040] w-8">د {evt.minute}</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-white/80">{evt.playerName}</span>
                            <span className="text-[9px] text-white/50">
                              {evt.detail} • {isHomeEvent ? activeMatch.homeTeam?.name : activeMatch.awayTeam?.name}
                            </span>
                          </div>
                        </div>

                        {/* زر التراجع والحذف المتاح للمشرف */}
                        {activeMatch.status === 'live' && (
                          <button
                            onClick={() => (isGoal ? handleDeleteGoal(evt.id) : handleDeleteCard(evt.id))}
                            className="p-1 text-white/45 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="إلغاء هذا الحدث"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 border-dashed border-white/10 text-center animate-fade-in-up">
            <Swords className="w-8 h-8 text-white/55 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white/50">يرجى تحديد مباراة من القائمة للبدء.</p>
          </div>
        )}
      </div>

      {/* المودال التفاعلي الصغير — نستخدم Portal لتصييره خارج الـ layout تماماً */}
      {activeModal && activeMatch && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-[#0e0e12] border border-white/8 rounded-2xl p-6 shadow-2xl animate-scale-in text-right"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <h3 className="text-sm font-black text-white">
                {activeModal === 'goal'
                  ? `تسجيل هدف لـ ${eventTeamId === activeMatch.homeTeamId ? activeMatch.homeTeam?.name : activeMatch.awayTeam?.name}`
                  : activeModal === 'card'
                  ? `تسجيل بطاقة لـ ${eventTeamId === activeMatch.homeTeamId ? activeMatch.homeTeam?.name : activeMatch.awayTeam?.name}`
                  : 'تسجيل ركلات الترجيح'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeModal === 'penalty' ? (
              <form onSubmit={handlePenaltySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-white/50">{activeMatch.homeTeam?.name}</label>
                    <input
                      type="number"
                      required
                      placeholder="ركلات الترجيح"
                      value={homePenalties}
                      onChange={(e) => setHomePenalties(e.target.value)}
                      className="w-full px-3 py-2 bg-white/4 border border-white/8 rounded-lg text-white text-xs font-bold text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-white/50">{activeMatch.awayTeam?.name}</label>
                    <input
                      type="number"
                      required
                      placeholder="ركلات الترجيح"
                      value={awayPenalties}
                      onChange={(e) => setAwayPenalties(e.target.value)}
                      className="w-full px-3 py-2 bg-white/4 border border-white/8 rounded-lg text-white text-xs font-bold text-center"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loadingAction === 'add_penalty'}
                  className="w-full py-2 bg-gradient-to-l from-[#C9971A] to-[#A07510] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                >
                  {loadingAction === 'add_penalty' ? 'جاري الحفظ...' : 'حفظ ركلات الترجيح'}
                </button>
              </form>
            ) : (
              <form
                onSubmit={activeModal === 'goal' ? handleGoalSubmit : handleCardSubmit}
                className="space-y-4"
              >
                {/* نوع الهدف (إذا كان الهدف المختار) */}
                {activeModal === 'goal' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-white/60">نوع الهدف</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-white/3 border border-white/6 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setGoalType('normal')}
                        className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                          goalType === 'normal' ? 'bg-[#C9971A]/20 text-[#F0C040]' : 'text-white/45'
                        }`}
                      >
                        هدف عادي
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalType('penalty')}
                        className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                          goalType === 'penalty' ? 'bg-[#C9971A]/20 text-[#F0C040]' : 'text-white/45'
                        }`}
                      >
                        ركلة جزاء
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalType('free_kick')}
                        className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                          goalType === 'free_kick' ? 'bg-[#C9971A]/20 text-[#F0C040]' : 'text-white/45'
                        }`}
                      >
                        ركلة حرة
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalType('own_goal')}
                        className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                          goalType === 'own_goal' ? 'bg-red-500/20 text-red-400' : 'text-white/45'
                        }`}
                      >
                        عكسي (Own Goal)
                      </button>
                    </div>
                  </div>
                )}

                {/* نوع البطاقة (إذا كانت البطاقة المختارة) */}
                {activeModal === 'card' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-white/60">نوع البطاقة</label>
                    <div className="grid grid-cols-3 gap-1 bg-white/3 border border-white/6 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCardType('yellow')}
                        className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                          cardType === 'yellow' ? 'bg-amber-500/20 text-amber-400' : 'text-white/45'
                        }`}
                      >
                        صفراء 🟨
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardType('second_yellow')}
                        className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                          cardType === 'second_yellow' ? 'bg-red-500/20 text-red-400' : 'text-white/45'
                        }`}
                      >
                        ثانية 🟨🟥
                      </button>
                      <button
                        type="button"
                        onClick={() => setCardType('red')}
                        className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer text-center ${
                          cardType === 'red' ? 'bg-red-600/30 text-red-500' : 'text-white/45'
                        }`}
                      >
                        حمراء 🟥
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1 relative" ref={playerRef}>
                  <label className="block text-[11px] font-bold text-white/60">اللاعب المسجل *</label>
                  <div
                    onClick={() => setPlayerDropdownOpen(!playerDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white/4 border border-white/8 rounded-lg text-white text-xs font-semibold hover:border-white/12 cursor-pointer"
                    dir="rtl"
                  >
                    <span className="truncate">{selectedPlayer ? `${selectedPlayer.name} ${selectedPlayer.jerseyNumber ? `(${selectedPlayer.jerseyNumber})` : ''}` : 'اختر اللاعب'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/60 flex-shrink-0 mr-2 transition-transform ${playerDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {playerDropdownOpen && (
                    <div className="absolute z-10 top-full mt-1 w-full bg-[#0e0e12] border border-white/8 rounded-xl shadow-2xl py-1 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full" dir="rtl">
                      {availablePlayers.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setEventPlayerId(p.id);
                            setPlayerDropdownOpen(false);
                          }}
                          className={`w-full text-right px-3 py-2 text-xs transition-colors ${
                            eventPlayerId === p.id ? 'bg-[#C9971A]/15 text-[#F0C040]' : 'text-white/70 hover:bg-white/5'
                          }`}
                        >
                          {p.name} {p.jerseyNumber && `(${p.jerseyNumber})`}
                        </button>
                      ))}
                      {availablePlayers.length === 0 && (
                        <p className="text-[10px] p-2 text-white/60 text-center">لا يوجد لاعبون متاحون للتسجيل</p>
                      )}
                    </div>
                  )}
                </div>

                {/* الدقيقة */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-white/60">الدقيقة (1 - 120) *</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="45"
                    value={eventMinute}
                    onChange={(e) => setEventMinute(e.target.value)}
                    className="w-full px-3 py-2 bg-white/4 border border-white/8 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60"
                  />
                </div>

                {/* زر الإرسال */}
                <button
                  type="submit"
                  disabled={loadingAction !== null || !eventPlayerId}
                  className="w-full py-2 bg-gradient-to-l from-[#C9971A] to-[#A07510] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all disabled:opacity-40 cursor-pointer"
                >
                  {loadingAction !== null ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : (
                    <span>رصد وإرسال الحدث</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      , document.body)}
    </div>
  );
}
