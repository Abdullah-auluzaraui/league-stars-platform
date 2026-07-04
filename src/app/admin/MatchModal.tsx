'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Swords, Trophy, MapPin, Calendar, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import { scheduleMatch, updateMatchSettings } from './matchActions';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  match?: any | null; // إذا تم تمريره، نحن في وضع التعديل
  tournaments: any[]; // قائمة البطولات
  teams: any[];       // قائمة الفرق الكلية (لتصفيتها حسب البطولة والمجموعة)
}

export default function MatchModal({
  isOpen,
  onClose,
  onSuccess,
  match,
  tournaments,
  teams,
}: MatchModalProps) {
  const isEditMode = !!match;

  // الحالات المدخلة للمباراة
  const [tournamentId, setTournamentId] = useState('');
  const [stage, setStage] = useState('group'); // group | round_16 | quarter | semi | final
  const [groupName, setGroupName] = useState('none'); // A, B, C... or none
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [venue, setVenue] = useState('');

  // حالات التحكم في القوائم المنسدلة المخصصة
  const [tournamentDropdownOpen, setTournamentDropdownOpen] = useState(false);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [homeTeamDropdownOpen, setHomeTeamDropdownOpen] = useState(false);
  const [awayTeamDropdownOpen, setAwayTeamDropdownOpen] = useState(false);

  const tournamentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const awayRef = useRef<HTMLDivElement>(null);

  // حالات المعالجة
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tournamentRef.current && !tournamentRef.current.contains(event.target as Node)) {
        setTournamentDropdownOpen(false);
      }
      if (stageRef.current && !stageRef.current.contains(event.target as Node)) {
        setStageDropdownOpen(false);
      }
      if (groupRef.current && !groupRef.current.contains(event.target as Node)) {
        setGroupDropdownOpen(false);
      }
      if (homeRef.current && !homeRef.current.contains(event.target as Node)) {
        setHomeTeamDropdownOpen(false);
      }
      if (awayRef.current && !awayRef.current.contains(event.target as Node)) {
        setAwayTeamDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تهيئة البيانات عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTournamentDropdownOpen(false);
      setStageDropdownOpen(false);
      setGroupDropdownOpen(false);
      setHomeTeamDropdownOpen(false);
      setAwayTeamDropdownOpen(false);

      if (match) {
        setTournamentId(match.tournamentId);
        setStage(match.stage);
        setGroupName(match.groupName || 'none');
        setHomeTeamId(match.homeTeamId);
        setAwayTeamId(match.awayTeamId);
        setVenue(match.venue || '');

        // تنسيق التاريخ ليتناسب مع input datetime-local
        if (match.matchDate) {
          const date = new Date(match.matchDate);
          // تصحيح التوقيت المحلي لـ ISO
          const tzOffset = date.getTimezoneOffset() * 60000;
          const localISODate = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
          setMatchDate(localISODate);
        } else {
          setMatchDate('');
        }
      } else {
        setTournamentId(tournaments[0]?.id || '');
        setStage('group');
        setGroupName('none');
        setHomeTeamId('');
        setAwayTeamId('');
        setMatchDate('');
        setVenue('');
      }
    }
  }, [isOpen, match, tournaments]);

  // معرفة تفاصيل البطولة المختارة حالياً
  const selectedTournament = tournaments.find((t) => t.id === tournamentId);
  const isGroupStageTournament = selectedTournament?.type === 'group_stage';

  // توليد المجموعات المتاحة للبطولة
  const availableGroups = isGroupStageTournament
    ? Array.from({ length: selectedTournament.groupCount || 1 }, (_, i) =>
        String.fromCharCode(65 + i)
      )
    : [];

  // تصفية الفرق المشاركة في البطولة والمجموعة المختارة
  const filteredTeams = teams.filter((team) => {
    // التحقق من مشاركته في البطولة الحالية
    const assoc = team.tournaments?.find((assoc: any) => assoc.tournamentId === tournamentId);
    if (!assoc || assoc.status === 'disqualified') return false; // إقصاء الفرق المستبعدة

    // إذا كانت مرحلة المجموعات وتم اختيار مجموعة معينة، نفلتر على أساسها
    if (stage === 'group' && groupName !== 'none' && isGroupStageTournament) {
      return assoc.groupName === groupName;
    }

    return true;
  });

  // تفريغ اختيار الفرق عند تغيير البطولة أو المجموعة أو المرحلة لمنع التعارض
  useEffect(() => {
    if (isOpen && !isEditMode) {
      setHomeTeamId('');
      setAwayTeamId('');
    }
  }, [tournamentId, stage, groupName, isOpen, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!homeTeamId || !awayTeamId) {
      setError('يرجى تحديد الفريقين أولاً');
      setIsSubmitting(false);
      return;
    }

    if (homeTeamId === awayTeamId) {
      setError('لا يمكن جدولة مباراة لفريق ضد نفسه');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('tournamentId', tournamentId);
      formData.append('homeTeamId', homeTeamId);
      formData.append('awayTeamId', awayTeamId);
      
      if (matchDate) {
        const localDate = new Date(matchDate);
        formData.append('matchDate', localDate.toISOString());
      } else {
        formData.append('matchDate', '');
      }

      formData.append('venue', venue.trim());
      formData.append('stage', stage);
      if (stage === 'group' && groupName !== 'none') {
        formData.append('groupName', groupName);
      } else {
        formData.append('groupName', '');
      }

      let res;
      if (isEditMode && match) {
        formData.append('id', match.id);
        res = await updateMatchSettings(formData);
      } else {
        res = await scheduleMatch(formData);
      }

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'حدث خطأ أثناء حفظ بيانات المباراة');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  // أسماء المراحل باللغة العربية
  const STAGES_AR: Record<string, string> = {
    group: 'دور المجموعات',
    round_16: 'دور الـ 16',
    quarter: 'ربع النهائي',
    semi: 'نصف النهائي',
    final: 'النهائي',
  };

  const selectedHomeTeam = teams.find((t) => t.id === homeTeamId);
  const selectedAwayTeam = teams.find((t) => t.id === awayTeamId);

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg bg-[#0e0e12] border border-white/8 rounded-2xl shadow-2xl animate-scale-in max-h-[calc(100vh-2rem)] flex flex-col"
        dir="rtl"
      >
        {/* الترويسة */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#121018] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Swords className="w-5 h-5 text-[#F0C040]" />
            <h3 className="text-sm sm:text-base font-black text-white">
              {isEditMode ? 'تعديل إعدادات المباراة' : 'جدولة مباراة جديدة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* جسم المودال والنموذج */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* اختيار البطولة */}
          <div className="space-y-1.5 relative" ref={tournamentRef}>
            <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#F0C040]" />
              <span>البطولة *</span>
            </label>
            <div
              onClick={() => !isEditMode && setTournamentDropdownOpen(!tournamentDropdownOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold hover:bg-white/6 hover:border-white/12 transition-all select-none ${
                isEditMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span className="text-right flex-1">{selectedTournament?.name || 'اختر البطولة'}</span>
              {!isEditMode && <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${tournamentDropdownOpen ? 'rotate-180' : ''}`} />}
            </div>
            {tournamentDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-[#0e0e12] border border-white/8 rounded-xl shadow-2xl py-1 divide-y divide-white/4 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full">
                {tournaments.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTournamentId(t.id);
                      setTournamentDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors font-semibold text-right ${
                      tournamentId === t.id ? 'bg-[#C9971A]/10 text-[#F0C040]' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* مرحلة المباراة والمجموعة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* اختيار المرحلة */}
            <div className="space-y-1.5 relative" ref={stageRef}>
              <label className="block text-xs font-bold text-white/50">المرحلة *</label>
              <div
                onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold hover:bg-white/6 hover:border-white/12 transition-all cursor-pointer select-none text-right"
              >
                <span>{STAGES_AR[stage] || 'اختر المرحلة'}</span>
                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${stageDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              {stageDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-[#0e0e12] border border-white/8 rounded-xl shadow-2xl py-1 divide-y divide-white/4 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-1">
                  {Object.entries(STAGES_AR).map(([key, value]) => {
                    // منع إظهار دور المجموعات للبطولات الإقصائية
                    if (key === 'group' && !isGroupStageTournament) return null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setStage(key);
                          if (key !== 'group') setGroupName('none');
                          setStageDropdownOpen(false);
                        }}
                        className={`w-full text-right px-4 py-2 text-xs transition-colors font-semibold ${
                          stage === key ? 'bg-[#C9971A]/10 text-[#F0C040]' : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* اختيار المجموعة (إذا كانت مرحلة مجموعات) */}
            <div className="space-y-1.5 relative" ref={groupRef}>
              <label className="block text-xs font-bold text-white/50">المجموعة</label>
              <div
                onClick={() => {
                  if (stage === 'group' && isGroupStageTournament) {
                    setGroupDropdownOpen(!groupDropdownOpen);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold hover:bg-white/6 hover:border-white/12 transition-all select-none text-right ${
                  stage === 'group' && isGroupStageTournament ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <span>{groupName === 'none' ? 'بدون مجموعة' : `المجموعة ${groupName}`}</span>
                {stage === 'group' && isGroupStageTournament && (
                  <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </div>
              {groupDropdownOpen && stage === 'group' && isGroupStageTournament && (
                <div className="absolute z-50 mt-1 w-full bg-[#0e0e12] border border-white/8 rounded-xl shadow-2xl py-1 divide-y divide-white/4 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-1">
                  <button
                    type="button"
                    onClick={() => {
                      setGroupName('none');
                      setGroupDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-xs transition-colors font-semibold ${
                      groupName === 'none' ? 'bg-[#C9971A]/10 text-[#F0C040]' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    بدون مجموعة (عرض كل فرق البطولة)
                  </button>
                  {availableGroups.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGroupName(g);
                        setGroupDropdownOpen(false);
                      }}
                      className={`w-full text-right px-4 py-2 text-xs transition-colors font-semibold ${
                        groupName === g ? 'bg-[#C9971A]/10 text-[#F0C040]' : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      المجموعة {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* تحديد الفريقين */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white/3 border border-white/5 rounded-xl">
            {/* الفريق الأول (المستضيف) */}
            <div className="space-y-1.5 relative" ref={homeRef}>
              <label className="block text-[11px] font-bold text-white/60 text-right">الفريق المستضيف *</label>
              <div
                onClick={() => setHomeTeamDropdownOpen(!homeTeamDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#0e0e12] border border-white/8 rounded-lg text-white text-xs font-semibold hover:border-white/12 cursor-pointer"
              >
                <span className="truncate flex-1 text-right">{selectedHomeTeam?.name || 'اختر الفريق'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/60 flex-shrink-0 mr-2 transition-transform ${homeTeamDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              {homeTeamDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-[#0e0e12] border border-white/8 rounded-xl shadow-2xl py-1 max-h-44 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full" dir="rtl">
                  {filteredTeams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setHomeTeamId(t.id);
                        setHomeTeamDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs transition-colors ${
                        homeTeamId === t.id ? 'bg-[#C9971A]/15 text-[#F0C040]' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                  {filteredTeams.length === 0 && (
                    <p className="text-[10px] p-2 text-white/60 text-center">لا توجد فرق متاحة</p>
                  )}
                </div>
              )}
            </div>

            {/* الفريق الثاني (الضيف) */}
            <div className="space-y-1.5 relative" ref={awayRef}>
              <label className="block text-[11px] font-bold text-white/60 text-right">الفريق الضيف *</label>
              <div
                onClick={() => setAwayTeamDropdownOpen(!awayTeamDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#0e0e12] border border-white/8 rounded-lg text-white text-xs font-semibold hover:border-white/12 cursor-pointer"
              >
                <span className="truncate flex-1 text-right">{selectedAwayTeam?.name || 'اختر الفريق'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/60 flex-shrink-0 mr-2 transition-transform ${awayTeamDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              {awayTeamDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-[#0e0e12] border border-white/8 rounded-xl shadow-2xl py-1 max-h-44 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full" dir="rtl">
                  {filteredTeams.map((t) => {
                    if (t.id === homeTeamId) return null;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setAwayTeamId(t.id);
                          setAwayTeamDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 text-xs transition-colors ${
                          awayTeamId === t.id ? 'bg-[#C9971A]/15 text-[#F0C040]' : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                  {filteredTeams.length === 0 && (
                    <p className="text-[10px] p-2 text-white/60 text-center">لا توجد فرق متاحة</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* التاريخ والوقت */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F0C040]" />
              <span>تاريخ ووقت المباراة *</span>
            </label>
            <input
              type="datetime-local"
              required
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all [color-scheme:dark]"
            />
          </div>

          {/* ملعب المباراة */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F0C040]" />
              <span>ملعب المباراة</span>
            </label>
            <input
              type="text"
              placeholder="مثال: ملعب نادي النجوم الرئيسي"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all"
            />
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white bg-white/3 border border-white/6 rounded-xl hover:bg-white/6 active:scale-95 transition-all cursor-pointer"
              type="button"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-l from-[#C9971A] to-[#A07510] rounded-xl hover:shadow-lg hover:shadow-[#C9971A]/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الجدولة...</span>
                </>
              ) : (
                <span>{isEditMode ? 'حفظ التعديلات' : 'جدولة المباراة'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
