'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Users, Image as ImageIcon, Trophy, AlertCircle, Loader2, ChevronDown, Upload, Trash2 } from 'lucide-react';
import { createTeam, updateTeam } from './teamActions';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team?: any | null; // إذا تم تمريره، نحن في وضع التعديل
  tournaments: any[]; // قائمة البطولات لربط الفريق بها
}

// ─── دالة لضغط وتصغير حجم شعار الفريق في المتصفح قبل الرفع ─────────────────────
async function compressImage(file: File, maxWidth = 200, maxHeight = 200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('فشل ضغط الصورة'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function TeamModal({
  isOpen,
  onClose,
  onSuccess,
  team,
  tournaments,
}: TeamModalProps) {
  const isEditMode = !!team;

  // الحالات الفرعية للنموذج
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tournamentId, setTournamentId] = useState('none');
  const [groupDistribution, setGroupDistribution] = useState<'auto' | 'manual'>('auto');
  const [groupName, setGroupName] = useState('A');
  const [status, setStatus] = useState<'active' | 'disqualified'>('active');

  // حالات رفع الملفات
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // حالات القائمة المنسدلة المخصصة
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // حالات المعالجة
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تهيئة البيانات عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLogoFile(null);
      setFilePreview(null);
      setDropdownOpen(false);

      if (team) {
        setName(team.name);
        setLogoUrl(team.logoUrl || '');
        if (team.logoUrl) {
          setFilePreview(team.logoUrl);
        }
        
        // استخراج ارتباط البطولة الحالي
        const currentAssociation = team.tournaments?.[0];
        if (currentAssociation) {
          setTournamentId(currentAssociation.tournamentId);
          setGroupDistribution(currentAssociation.groupName ? 'manual' : 'auto');
          setGroupName(currentAssociation.groupName || 'A');
          setStatus(currentAssociation.status || 'active');
        } else {
          setTournamentId('none');
          setGroupDistribution('auto');
          setGroupName('A');
          setStatus('active');
        }
      } else {
        setName('');
        setLogoUrl('');
        setTournamentId('none');
        setGroupDistribution('auto');
        setGroupName('A');
        setStatus('active');
      }
    }
  }, [isOpen, team]);

  if (!isOpen) return null;

  // معالجة تغيير ملف الصورة المرفوع
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setFilePreview(URL.createObjectURL(file));
      setLogoUrl(''); // تفريغ رابط النصي ليعتمد النظام الملف المرفوع
    }
  };

  // معالجة سحب الشعار
  const handleRemovePreview = () => {
    setLogoFile(null);
    setFilePreview(null);
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // معرفة تفاصيل البطولة المختارة حالياً
  const selectedTournament = tournaments.find((t) => t.id === tournamentId);
  const isGroupStage = selectedTournament?.type === 'group_stage';

  // توليد المجموعات المتاحة للبطولة يدوياً (مثال: 3 مجموعات -> ['A', 'B', 'C'])
  const availableGroups = isGroupStage
    ? Array.from({ length: selectedTournament.groupCount || 1 }, (_, i) =>
        String.fromCharCode(65 + i)
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('logoUrl', logoUrl.trim());
      
      if (logoFile) {
        try {
          // ضغط الصورة إلى WebP بحجم أقصى 200x200 بكسل قبل إرسالها للسيرفر
          const compressedBlob = await compressImage(logoFile, 200, 200, 0.85);
          const compressedFile = new File([compressedBlob], `logo-${Date.now()}.webp`, {
            type: 'image/webp',
          });
          formData.append('logoFile', compressedFile);
        } catch (compressErr) {
          console.error('Image compression failed, uploading original:', compressErr);
          formData.append('logoFile', logoFile);
        }
      }
      formData.append('tournamentId', tournamentId);
      formData.append('groupDistribution', groupDistribution);
      if (isGroupStage && groupDistribution === 'manual') {
        formData.append('groupName', groupName);
      }
      formData.append('status', status);

      let res;
      if (isEditMode && team) {
        formData.append('id', team.id);
        res = await updateTeam(formData);
      } else {
        res = await createTeam(formData);
      }

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'حدث خطأ أثناء حفظ بيانات الفريق');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Users className="w-5 h-5 text-[#F0C040]" />
            <h3 className="text-sm sm:text-base font-black text-white">
              {isEditMode ? 'تعديل بيانات الفريق' : 'إضافة فريق جديد'}
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

          {/* اسم الفريق */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/50">اسم الفريق *</label>
            <input
              type="text"
              required
              placeholder="مثال: اسم الفريق"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 focus:bg-white/6 transition-all"
            />
          </div>

          {/* تحميل شعار الفريق من جهاز المستخدم */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#F0C040]" />
              <span>شعار الفريق</span>
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* صندوق الرفع والتأثير البصري */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="col-span-2 border border-dashed border-white/10 hover:border-[#C9971A]/30 bg-white/2 hover:bg-white/4 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[96px] text-center"
              >
                <Upload className="w-5 h-5 text-white/40" />
                <span className="text-[10px] sm:text-xs text-white/50 font-bold">تحميل شعار من جهازك</span>
              </div>

              {/* معاينة الصورة المرفوعة */}
              <div className="border border-white/8 bg-white/3 rounded-xl p-2 flex flex-col items-center justify-center relative min-h-[96px]">
                {filePreview ? (
                  <>
                    <img 
                      src={filePreview} 
                      alt="معاينة الشعار" 
                      className="w-12 h-12 rounded-lg object-contain bg-white/5"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePreview}
                      className="absolute -top-1.5 -left-1.5 p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/35 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="إزالة الشعار"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-9 h-9 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white/20" />
                    </div>
                    <span className="text-[9px] text-white/25 font-bold">لا يوجد شعار</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* القائمة المنسدلة المحسنة (الربط ببطولة) */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#F0C040]" />
              <span>الربط ببطولة</span>
            </label>
            
            {/* زر القائمة المنسدلة المحسنة */}
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold hover:bg-white/6 hover:border-white/12 transition-all cursor-pointer select-none text-right"
            >
              <span>
                {selectedTournament
                  ? `${selectedTournament.name} (${selectedTournament.type === 'group_stage' ? 'دور مجموعات' : 'إقصائي'})`
                  : 'بدون بطولة حالياً (فريق عام)'}
              </span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* قائمة الخيارات العائمة الفاخرة */}
            {dropdownOpen && (
              <div className="absolute z-50 bottom-full mb-2 w-full bg-[#0e0e12] border border-white/8 rounded-xl shadow-2xl py-1 divide-y divide-white/4 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/25">
                <button
                  type="button"
                  onClick={() => {
                    setTournamentId('none');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-right px-4 py-2.5 text-xs transition-colors font-semibold flex items-center justify-between ${
                    tournamentId === 'none'
                      ? 'bg-[#C9971A]/10 text-[#F0C040]'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>بدون بطولة حالياً (فريق عام)</span>
                </button>
                {tournaments.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTournamentId(t.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors font-semibold text-right ${
                      tournamentId === t.id
                        ? 'bg-[#C9971A]/10 text-[#F0C040]'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate max-w-[280px]">{t.name}</span>
                    <span className="text-[9px] font-black text-white/35 bg-white/5 px-2 py-0.5 rounded flex-shrink-0">
                      {t.type === 'group_stage' ? 'دور مجموعات' : 'إقصائي'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* إعدادات التوزيع للمجموعات */}
          {tournamentId !== 'none' && isGroupStage && (
            <div className="space-y-3 p-4 bg-white/3 border border-white/5 rounded-xl animate-fade-in-up">
              {/* خيار يدوي / تلقائي */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/40">طريقة توزيع المجموعة</label>
                <div className="grid grid-cols-2 gap-2 bg-white/3 border border-white/6 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setGroupDistribution('auto')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                      groupDistribution === 'auto'
                        ? 'bg-gradient-to-l from-[#C9971A] to-[#A07510] text-white shadow-md'
                        : 'text-white/45 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    توزيع تلقائي (متوازن)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupDistribution('manual')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                      groupDistribution === 'manual'
                        ? 'bg-gradient-to-l from-[#C9971A] to-[#A07510] text-white shadow-md'
                        : 'text-white/45 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    تحديد يدوي للمجموعة
                  </button>
                </div>
              </div>

              {/* اختيار المجموعة اليدوي */}
              {groupDistribution === 'manual' && (
                <div className="space-y-1.5 animate-fade-in-up">
                  <label className="block text-[10px] font-bold text-white/40">اختر المجموعة *</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableGroups.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGroupName(g)}
                        className={`w-10 h-8 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center border ${
                          groupName === g
                            ? 'bg-gradient-to-l from-[#C9971A] to-[#A07510] text-white border-transparent'
                            : 'bg-white/4 border-white/8 text-white/50 hover:bg-white/6'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* حالة المشاركة بالبطولة (تظهر في وضع التعديل إذا كانت البطولة مختارة) */}
          {isEditMode && tournamentId !== 'none' && (
            <div className="space-y-1.5 p-4 bg-white/3 border border-white/5 rounded-xl animate-fade-in-up">
              <label className="block text-xs font-bold text-white/40">حالة الفريق في هذه البطولة</label>
              <div className="grid grid-cols-2 gap-2 bg-white/3 border border-white/6 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                    status === 'active'
                      ? 'bg-gradient-to-l from-emerald-600 to-emerald-800 text-white shadow-md'
                      : 'text-white/45 hover:text-white hover:bg-white/5'
                  }`}
                >
                  نشط ومشارك
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('disqualified')}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                    status === 'disqualified'
                      ? 'bg-gradient-to-l from-red-600 to-red-800 text-white shadow-md'
                      : 'text-white/45 hover:text-white hover:bg-white/5'
                  }`}
                >
                  مستبعد (Disqualified)
                </button>
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
