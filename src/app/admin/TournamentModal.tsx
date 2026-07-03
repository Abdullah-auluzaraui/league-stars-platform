'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { createTournament, updateTournament } from './tournamentActions';

interface Tournament {
  id: string;
  name: string;
  type: string;
  status: string;
  groupCount: number;
  qualifyingTeams: number;
  startDate: Date | null;
  endDate: Date | null;
}

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournament?: Tournament | null; // إذا تم تمريره، نحن في وضع التعديل
}

// ─── مكون اختيار الأرقام الفاخر (NumberInput) ──────────────────────────────────
function NumberInput({
  value,
  onChange,
  disabled,
  min = 1,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  min?: number;
}) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };
  const increment = () => {
    onChange(value + 1);
  };

  return (
    <div className="flex items-center w-full bg-white/4 border border-white/8 rounded-xl overflow-hidden h-[42px] transition-all focus-within:border-[#C9971A]/40">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={decrement}
        className="w-12 h-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-base font-black border-l border-white/5"
      >
        -
      </button>
      <input
        type="text"
        pattern="[0-9]*"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value.replace(/\D/g, '')) || min;
          onChange(Math.max(min, val));
        }}
        className="flex-1 h-full bg-transparent text-white text-center font-bold text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={increment}
        className="w-12 h-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-base font-black border-r border-white/5"
      >
        +
      </button>
    </div>
  );
}

export default function TournamentModal({
  isOpen,
  onClose,
  onSuccess,
  tournament,
}: TournamentModalProps) {
  const isEditMode = !!tournament;

  // الحالات الفرعية للنموذج
  const [name, setName] = useState('');
  const [type, setType] = useState('group_stage');
  const [groupCount, setGroupCount] = useState(2);
  const [qualifyingTeams, setQualifyingTeams] = useState(2);

  // حالات المعالجة
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تهيئة الحقول عند فتح المودال في وضع التعديل
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (tournament) {
        setName(tournament.name);
        setType(tournament.type);
        setGroupCount(tournament.groupCount);
        setQualifyingTeams(tournament.qualifyingTeams);
      } else {
        // إعادة تعيين الحقول في وضع الإضافة
        setName('');
        setType('group_stage');
        setGroupCount(2);
        setQualifyingTeams(2);
      }
    }
  }, [isOpen, tournament]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('type', type);
      formData.append('groupCount', String(type === 'knockout' ? 1 : groupCount));
      formData.append('qualifyingTeams', String(type === 'knockout' ? 1 : qualifyingTeams));

      let res;
      if (isEditMode && tournament) {
        formData.append('id', tournament.id);
        res = await updateTournament(formData);
      } else {
        res = await createTournament(formData);
      }

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'حدث خطأ أثناء حفظ البيانات');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = isEditMode && tournament && tournament.status !== 'upcoming';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      {/* نافذة المودال */}
      <div
        className="w-full max-w-lg bg-[#0e0e12] border border-white/8 rounded-2xl shadow-2xl animate-scale-in max-h-[calc(100vh-2rem)] flex flex-col"
        dir="rtl"
      >
        {/* الترويسة */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#121018] rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-[#F0C040]" />
            <h3 className="text-sm sm:text-base font-black text-white">
              {isEditMode ? 'تعديل بيانات البطولة' : 'إنشاء بطولة جديدة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
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

          {isLocked && (
            <div className="flex items-center gap-2 p-3 bg-[#C9971A]/10 border border-[#C9971A]/20 text-[#F0C040] rounded-xl text-[10px] sm:text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>البطولة نشطة حالياً أو منتهية. لا يمكن تعديل نوع البطولة أو تفاصيل المجموعات.</span>
            </div>
          )}

          {/* اسم البطولة */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/50">اسم البطولة *</label>
            <input
              type="text"
              required
              placeholder="مثال: اسم البطولة"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 focus:bg-white/6 transition-all"
            />
          </div>

          {/* نوع البطولة */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/50">نوع البطولة *</label>
            <div className="grid grid-cols-2 gap-2 bg-white/3 border border-white/6 p-1 rounded-xl">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setType('group_stage')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  type === 'group_stage'
                    ? 'bg-gradient-to-l from-[#C9971A] to-[#A07510] text-white shadow-md'
                    : 'text-white/45 hover:text-white hover:bg-white/5'
                }`}
              >
                دور مجموعات
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setType('knockout')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  type === 'knockout'
                    ? 'bg-gradient-to-l from-[#C9971A] to-[#A07510] text-white shadow-md'
                    : 'text-white/45 hover:text-white hover:bg-white/5'
                }`}
              >
                إقصائي (خروج المغلوب)
              </button>
            </div>
          </div>

          {/* تفاصيل المجموعات (تظهر فقط في دور المجموعات) */}
          {type === 'group_stage' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50">عدد المجموعات *</label>
                <NumberInput
                  value={groupCount}
                  onChange={setGroupCount}
                  disabled={isLocked}
                  min={1}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50">الفرق المتأهلة من كل مجموعة *</label>
                <NumberInput
                  value={qualifyingTeams}
                  onChange={setQualifyingTeams}
                  disabled={isLocked}
                  min={1}
                />
              </div>
            </div>
          )}

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
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ البيانات</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
