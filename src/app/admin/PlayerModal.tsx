'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Shirt,
  Trash2,
  Upload,
  UserCircle,
  X,
} from 'lucide-react';
import { createPlayer, updatePlayer } from './playerActions';

const POSITION_OPTIONS = [
  { value: 'goalkeeper', label: 'حارس مرمى' },
  { value: 'defender', label: 'مدافع' },
  { value: 'midfielder', label: 'وسط' },
  { value: 'forward', label: 'مهاجم' },
] as const;

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  player?: PlayerRecord | null;
  teams: TeamOption[];
}

type TeamOption = {
  id: string;
  name: string;
  logoUrl?: string | null;
  archivedAt?: Date | string | null;
};

type PlayerRecord = {
  id: string;
  name: string;
  teamId: string;
  jerseyNumber: number | null;
  position: string | null;
  photoUrl: string | null;
  team?: TeamOption | null;
};

async function compressImage(file: File, maxWidth = 320, maxHeight = 320, quality = 0.86): Promise<Blob> {
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
        } else if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('فشل ضغط الصورة'));
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

export default function PlayerModal({
  isOpen,
  onClose,
  onSuccess,
  player,
  teams,
}: PlayerModalProps) {
  const isEditMode = !!player;
  const selectableTeams = useMemo(() => {
    const activeTeams = teams.filter((team) => !team.archivedAt);
    const currentTeam = player?.team;
    if (currentTeam?.archivedAt && !activeTeams.some((team) => team.id === currentTeam.id)) {
      return [currentTeam, ...activeTeams];
    }
    return activeTeams;
  }, [player, teams]);

  const [name, setName] = useState(() => player?.name || '');
  const [teamId, setTeamId] = useState(() => player?.teamId || player?.team?.id || selectableTeams[0]?.id || '');
  const [jerseyNumber, setJerseyNumber] = useState(() => (player?.jerseyNumber ? String(player.jerseyNumber) : ''));
  const [position, setPosition] = useState(() => player?.position || '');
  const [photoUrl, setPhotoUrl] = useState(() => player?.photoUrl || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(() => player?.photoUrl || null);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
        setTeamDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const selectedTeam = teams.find((team) => team.id === teamId);
  const selectedPosition = POSITION_OPTIONS.find((item) => item.value === position);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setFilePreview(URL.createObjectURL(file));
    setPhotoUrl('');
  };

  const handleRemovePreview = () => {
    setPhotoFile(null);
    setFilePreview(null);
    setPhotoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('teamId', teamId);
      formData.append('jerseyNumber', jerseyNumber.trim());
      formData.append('position', position);
      formData.append('photoUrl', photoUrl.trim());

      if (photoFile) {
        try {
          const compressedBlob = await compressImage(photoFile);
          const compressedFile = new File([compressedBlob], `player-${Date.now()}.webp`, {
            type: 'image/webp',
          });
          formData.append('photoFile', compressedFile);
        } catch (compressErr) {
          console.error('Player image compression failed, uploading original:', compressErr);
          formData.append('photoFile', photoFile);
        }
      }

      let res;
      if (isEditMode && player) {
        formData.append('id', player.id);
        res = await updatePlayer(formData);
      } else {
        res = await createPlayer(formData);
      }

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'حدث خطأ أثناء حفظ بيانات اللاعب');
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
      <div
        className="w-full max-w-xl bg-[#0e0e12] border border-white/8 rounded-2xl shadow-2xl animate-scale-in"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#121018] rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <UserCircle className="w-5 h-5 text-[#F0C040]" />
            <h3 className="text-sm sm:text-base font-black text-white">
              {isEditMode ? 'تعديل بيانات اللاعب' : 'إضافة لاعب جديد'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_112px] gap-4">
            <div className="space-y-4 min-w-0">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50">اسم اللاعب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اسم اللاعب"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 focus:bg-white/6 transition-all"
                />
              </div>

              <div className="space-y-1.5 relative" ref={teamDropdownRef}>
                <label className="block text-xs font-bold text-white/50">الفريق *</label>
                <button
                  type="button"
                  onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold hover:bg-white/6 hover:border-white/12 transition-all cursor-pointer text-right"
                >
                  <span className="truncate">
                    {selectedTeam ? selectedTeam.name : 'اختر فريق اللاعب'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${teamDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {teamDropdownOpen && (
                  <div className="absolute z-50 top-full mt-2 w-full bg-[#0e0e12] border border-white/8 rounded-xl shadow-2xl py-1 max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {selectableTeams.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-white/35 font-semibold">
                        لا توجد فرق نشطة حالياً
                      </div>
                    ) : (
                      selectableTeams.map((team) => (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => {
                            setTeamId(team.id);
                            setTeamDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors font-semibold text-right ${
                            teamId === team.id
                              ? 'bg-[#C9971A]/10 text-[#F0C040]'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-5 h-5 rounded-md object-contain bg-white/5" />
                          ) : (
                            <div className="w-5 h-5 rounded-md bg-white/5" />
                          )}
                          <span className="truncate">{team.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/50">صورة اللاعب</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-[112px] rounded-xl bg-white/3 border border-dashed border-white/10 hover:border-[#C9971A]/30 hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {filePreview ? (
                  <img src={filePreview} alt="معاينة صورة اللاعب" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-5 h-5 text-white/35" />
                    <span className="text-[10px] text-white/40 font-bold">رفع صورة</span>
                  </div>
                )}
              </button>
              {filePreview && (
                <button
                  type="button"
                  onClick={handleRemovePreview}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/15 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  إزالة الصورة
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-[#F0C040]" />
                <span>رقم القميص</span>
              </label>
              <input
                type="number"
                min={1}
                max={99}
                inputMode="numeric"
                placeholder="اختياري"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 focus:bg-white/6 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/50">المركز</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#14141a] border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 focus:bg-[#17171f] transition-all"
              >
                <option value="">غير محدد</option>
                {POSITION_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>


          {selectedPosition && (
            <div className="px-4 py-3 rounded-xl bg-white/3 border border-white/5 text-xs text-white/45 font-semibold">
              سيتم عرض اللاعب في قوائم الفريق كمركز: <span className="text-white/80">{selectedPosition.label}</span>
            </div>
          )}

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
              disabled={isSubmitting || !teamId}
              className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-l from-[#C9971A] to-[#A07510] rounded-xl hover:shadow-lg hover:shadow-[#C9971A]/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ بيانات اللاعب</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
