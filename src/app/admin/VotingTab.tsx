'use client';

import { useState, useEffect } from 'react';
import {
  Medal,
  Plus,
  Trash2,
  Play,
  StopCircle,
  Archive,
  Search,
  Video,
  Trophy,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Users,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import {
  getVotingRounds,
  createVotingRound,
  updateVotingRound,
  addGoalToRound,
  removeGoalFromRound,
  updateRoundGoalVideo,
  activateVotingRound,
  closeVotingRound,
  archiveVotingRound,
  resetRoundVotes,
  deleteVotingRound,
  getGoalsForNomination,
} from './votingActions';

interface VotingTabProps {
  votingRounds: any[];
  isLoading: boolean;
  fetchVotingRounds: () => void;
  tournaments: any[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  activeSubTab: 'current' | 'nominate' | 'results' | 'archive';
  setActiveSubTab: (tab: 'current' | 'nominate' | 'results' | 'archive') => void;
}

export default function VotingTab({
  votingRounds,
  isLoading,
  fetchVotingRounds,
  tournaments,
  showToast,
  activeSubTab,
  setActiveSubTab,
}: VotingTabProps) {
  // معرفة الجولة الحالية (نشطة أو مسودة أو مغلقة غير مؤرشفة)
  const currentRound = votingRounds.find((r) => r.status !== 'archived');
  const archivedRounds = votingRounds.filter((r) => r.status === 'archived');

  // حالات الجولة الجديدة
  const [newRoundTitle, setNewRoundTitle] = useState('');
  const [newRoundDesc, setNewRoundDesc] = useState('');
  const [newRoundTournamentId, setNewRoundTournamentId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // حالات تعديل الجولة
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTournamentId, setEditTournamentId] = useState('');

  // حالات الترشيح (Nomination Filters)
  const [filterTournamentId, setFilterTournamentId] = useState('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [goalsForNominationList, setGoalsForNominationList] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  // حالة حفظ روابط الفيديوهات
  const [savingVideoId, setSavingVideoId] = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});

  // حالة فتح أرشيف تفاصيل الجولات
  const [expandedArchiveRounds, setExpandedArchiveRounds] = useState<Record<string, boolean>>({});

  // جلب الأهداف المتاحة للترشيح عند الدخول لتبويب الترشيح
  useEffect(() => {
    if (activeSubTab === 'nominate' && currentRound && currentRound.status === 'draft') {
      const loadGoals = async () => {
        try {
          setGoalsLoading(true);
          const data = await getGoalsForNomination(currentRound.id, {
            tournamentId: filterTournamentId,
            query: filterQuery,
          });
          setGoalsForNominationList(data);

          // تعبئة روابط الفيديوهات الحالية في الحالات المحلية
          const urls: Record<string, string> = {};
          data.forEach((g) => {
            if (g.isNominatedInRound && g.roundGoalId) {
              urls[g.roundGoalId] = g.roundGoalVideoUrl || '';
            }
          });
          setVideoUrls(urls);
        } catch (e) {
          console.error(e);
          showToast('فشل تحميل قائمة الأهداف للترشيح', 'error');
        } finally {
          setGoalsLoading(false);
        }
      };

      loadGoals();
    }
  }, [activeSubTab, currentRound?.id, filterTournamentId, filterQuery]);

  // إنشاء جولة جديدة
  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoundTitle.trim()) return;

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', newRoundTitle);
      formData.append('description', newRoundDesc);
      formData.append('tournamentId', newRoundTournamentId);

      const res = await createVotingRound(formData);
      if (res.success) {
        showToast('تم إنشاء جولة التصويت بنجاح!');
        setNewRoundTitle('');
        setNewRoundDesc('');
        setNewRoundTournamentId('');
        fetchVotingRounds();
        setActiveSubTab('nominate'); // نقله فوراً لترشيح الأهداف
      } else {
        showToast(res.error || 'فشل إنشاء جولة التصويت', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // تعديل الجولة الحالية
  const handleUpdateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRound || !editTitle.trim()) return;

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('id', currentRound.id);
      formData.append('title', editTitle);
      formData.append('description', editDesc);
      formData.append('tournamentId', editTournamentId);

      const res = await updateVotingRound(formData);
      if (res.success) {
        showToast('تم تعديل جولة التصويت بنجاح!');
        setIsEditing(false);
        fetchVotingRounds();
      } else {
        showToast(res.error || 'فشل تعديل الجولة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // بدء تعديل الجولة
  const startEdit = () => {
    if (!currentRound) return;
    setEditTitle(currentRound.title);
    setEditDesc(currentRound.description || '');
    setEditTournamentId(currentRound.tournamentId || '');
    setIsEditing(true);
  };

  // تفعيل الجولة
  const handleActivateRound = async (id: string) => {
    if (!confirm('هل ترغب في فتح التصويت لهذه الجولة وإتاحته للجمهور؟ سيتم إغلاق أي جولة نشطة أخرى تلقائياً.')) return;
    try {
      const res = await activateVotingRound(id);
      if (res.success) {
        showToast('تم فتح جولة التصويت ونشرها للجمهور بنجاح!');
        fetchVotingRounds();
        setActiveSubTab('current');
      } else {
        showToast(res.error || 'فشل تفعيل الجولة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    }
  };

  // إغلاق الجولة
  const handleCloseRound = async (id: string) => {
    if (!confirm('هل ترغب في إغلاق التصويت لهذه الجولة؟ لن يتمكن الزوار من التصويت بعد الآن.')) return;
    try {
      const res = await closeVotingRound(id);
      if (res.success) {
        showToast('تم إغلاق جولة التصويت بنجاح!');
        fetchVotingRounds();
      } else {
        showToast(res.error || 'فشل إغلاق الجولة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    }
  };

  // حذف الجولة
  const handleDeleteRound = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف جولة التصويت هذه بالكامل؟ سيتم إزالة الأهداف المرشحة بها.')) return;
    try {
      const res = await deleteVotingRound(id);
      if (res.success) {
        showToast('تم حذف جولة التصويت بنجاح');
        fetchVotingRounds();
        setActiveSubTab('current');
      } else {
        showToast(res.error || 'فشل حذف الجولة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    }
  };

  // تصفير الأصوات
  const handleResetVotes = async (id: string) => {
    if (!confirm('تحذير هام جداً: هذا الإجراء سيقوم بحذف كل الأصوات الفردية المسجلة لهذه الجولة الحالية فقط! لا يمكن التراجع عن هذا الإجراء أبداً. هل ترغب في الاستمرار وتصفير الأصوات؟')) return;
    try {
      const res = await resetRoundVotes(id);
      if (res.success) {
        showToast('تم تصفير أصوات الجولة الحالية بالكامل!');
        fetchVotingRounds();
      } else {
        showToast(res.error || 'فشل تصفير الأصوات', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    }
  };

  // اعتماد الفائز وأرشفة الجولة
  const handleArchiveRound = async (roundId: string, winnerGoalId: string, playerName: string) => {
    if (!confirm(`هل أنت متأكد من اعتماد هدف اللاعب (${playerName}) كفائز رسمي بهذه الجولة وأرشفة الجولة؟ هذا سينقل الجولة لقسم الأرشيف والمعرض التاريخي للجمهور.`)) return;
    try {
      const res = await archiveVotingRound(roundId, winnerGoalId);
      if (res.success) {
        showToast('تم اعتماد الفائز وأرشفة الجولة بنجاح! شكراً لك.');
        fetchVotingRounds();
        setActiveSubTab('current');
      } else {
        showToast(res.error || 'فشل أرشفة الجولة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    }
  };

  // إضافة هدف للجولة
  const handleAddGoal = async (goalId: string) => {
    if (!currentRound) return;
    try {
      const res = await addGoalToRound(currentRound.id, goalId);
      if (res.success) {
        showToast('تمت إضافة الهدف لقائمة المرشحين!');
        // تحديث القائمة المحلية
        setGoalsForNominationList((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, isNominatedInRound: true } : g))
        );
        fetchVotingRounds();
      } else {
        showToast(res.error || 'فشل إضافة الهدف', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ غير متوقع', 'error');
    }
  };

  // إزالة هدف من الجولة
  const handleRemoveGoal = async (goalId: string) => {
    if (!currentRound) return;
    try {
      const res = await removeGoalFromRound(currentRound.id, goalId);
      if (res.success) {
        showToast('تمت إزالة الهدف من الترشيحات');
        setGoalsForNominationList((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, isNominatedInRound: false } : g))
        );
        fetchVotingRounds();
      } else {
        showToast(res.error || 'فشل إزالة الهدف', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ غير متوقع', 'error');
    }
  };

  // تحديث رابط فيديو المرشح
  const handleSaveVideoUrl = async (roundGoalId: string) => {
    setSavingVideoId(roundGoalId);
    try {
      const url = videoUrls[roundGoalId] || '';
      const res = await updateRoundGoalVideo(roundGoalId, url);
      if (res.success) {
        showToast('تم حفظ رابط الفيديو للمرشح بنجاح!');
        fetchVotingRounds();
      } else {
        showToast(res.error || 'فشل حفظ رابط الفيديو', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setSavingVideoId(null);
    }
  };



  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'penalty':
        return 'ركلة جزاء';
      case 'free_kick':
        return 'ركلة حرة';
      case 'own_goal':
        return 'هدف عكسي';
      default:
        return 'هدف عادي';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* التبويبات الفرعية لجولات التصويت */}
      <div className="flex items-center gap-1.5 p-1 bg-white/3 border border-white/5 rounded-xl max-w-lg">
        <button
          onClick={() => setActiveSubTab('current')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            activeSubTab === 'current'
              ? 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/20'
              : 'text-white/45 hover:text-white hover:bg-white/4'
          }`}
        >
          الجولة الحالية
        </button>
        <button
          onClick={() => {
            if (currentRound && currentRound.status === 'draft') {
              setActiveSubTab('nominate');
            } else {
              showToast('ترشيح الأهداف متاح فقط لجولة المسودة (Draft) الحالية', 'error');
            }
          }}
          disabled={!currentRound || currentRound.status !== 'draft'}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            activeSubTab === 'nominate'
              ? 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/20'
              : 'text-white/45 hover:text-white hover:bg-white/4 disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
        >
          ترشيح الأهداف
        </button>
        <button
          onClick={() => {
            if (currentRound) {
              setActiveSubTab('results');
            } else {
              showToast('النتائج متاحة فقط عند وجود جولة حالية', 'error');
            }
          }}
          disabled={!currentRound}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            activeSubTab === 'results'
              ? 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/20'
              : 'text-white/45 hover:text-white hover:bg-white/4 disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
        >
          مراقبة النتائج
        </button>
        <button
          onClick={() => setActiveSubTab('archive')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            activeSubTab === 'archive'
              ? 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/20'
              : 'text-white/45 hover:text-white hover:bg-white/4'
          }`}
        >
          الأرشيف ({archivedRounds.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#F0C040] animate-spin" />
        </div>
      ) : (
        <>
          {/* ══ Tab 1: الجولة الحالية ═══════════════════════════════════ */}
          {activeSubTab === 'current' && (
            <div className="space-y-4 animate-fade-in-up">
              {currentRound ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* معلومات وتفاصيل الجولة الحالية */}
                  <div className="lg:col-span-2 space-y-4">
                    {isEditing ? (
                      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 text-right">
                        <h4 className="text-sm font-black text-white">تعديل بيانات جولة التصويت</h4>
                        <form onSubmit={handleUpdateRound} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-white/50">عنوان الجولة *</label>
                            <input
                              type="text"
                              required
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-white/50">البطولة المرتبطة (اختياري)</label>
                            <select
                              value={editTournamentId}
                              onChange={(e) => setEditTournamentId(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#0e0e12] border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 [color-scheme:dark]"
                            >
                              <option value="">لا توجد بطولة معينة</option>
                              {tournaments.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* طريقة عرض النتائج افتراضية */}

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-white/50">وصف إضافي (اختياري)</label>
                            <textarea
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60"
                            />
                          </div>

                          <div className="flex items-center gap-2.5 pt-2">
                            <button
                              type="submit"
                              disabled={isCreating}
                              className="flex-1 py-2 text-xs font-bold text-white bg-gradient-to-l from-[#C9971A] to-[#A07510] rounded-xl hover:shadow-lg active:scale-95 transition-all"
                            >
                              حفظ التغييرات
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              className="px-5 py-2 text-xs font-bold text-white/60 hover:text-white bg-white/4 border border-white/6 rounded-xl hover:bg-white/8 transition-all"
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-5 text-right relative overflow-hidden">
                        {/* شارات الحالة */}
                        <div className="flex items-center justify-between">
                          <div>
                            {currentRound.status === 'draft' ? (
                              <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                                مسودة (تحت الإعداد)
                              </span>
                            ) : currentRound.status === 'active' ? (
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                نشطة (التصويت مفتوح)
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20">
                                مغلقة (بانتظار الفائز)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/50 font-semibold">
                            أنشئت في {new Date(currentRound.createdAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-base sm:text-lg font-black text-white">{currentRound.title}</h3>
                          {currentRound.description && (
                            <p className="text-xs text-white/50 leading-relaxed">{currentRound.description}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 py-2 border-t border-b border-white/5 text-xs text-right">
                          <div>
                            <span className="block text-white/50 font-bold">الأهداف المرشحة</span>
                            <span className="text-[#F0C040] font-black mt-1 block">
                              {currentRound.goals.length} أهداف مرشحة
                            </span>
                          </div>
                        </div>

                        {/* قائمة أهداف الجولة وعرض الأصوات */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold text-white/60">الأهداف المرشحة في هذه الجولة:</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                            {currentRound.goals.map((rg: any) => (
                              <div
                                key={rg.id}
                                className="flex items-center justify-between p-2.5 bg-white/3 border border-white/6 rounded-xl text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center font-bold text-white text-[10px]">
                                    {rg.goal?.player?.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-white">{rg.goal?.player?.name}</span>
                                    <span className="text-[10px] text-white/50">
                                      {rg.goal?.team?.name} • د {rg.goal?.minute}
                                    </span>
                                  </div>
                                </div>
                                <span className="bg-[#C9971A]/10 text-[#F0C040] px-2 py-0.5 rounded font-black text-[10px]">
                                  {rg.votes?.length || 0} صوت
                                </span>
                              </div>
                            ))}
                            {currentRound.goals.length === 0 && (
                              <p className="text-[10px] text-white/60 text-center py-2">لا توجد أهداف مرشحة في هذه الجولة حتى الآن.</p>
                            )}
                          </div>
                        </div>

                        {/* أزرار التحكم بالجولة الحالية */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/5">
                          {currentRound.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleActivateRound(currentRound.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-l from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg active:scale-95 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>تفعيل ونشر التصويت</span>
                              </button>
                              <button
                                onClick={startEdit}
                                className="px-4 py-2.5 bg-white/4 border border-white/6 hover:bg-white/8 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                تعديل الجولة
                              </button>
                            </>
                          )}

                          {currentRound.status === 'active' && (
                            <button
                              onClick={() => handleCloseRound(currentRound.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-l from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl text-xs font-bold transition-all hover:shadow-lg active:scale-95 cursor-pointer"
                            >
                              <StopCircle className="w-3.5 h-3.5" />
                              <span>إيقاف التصويت</span>
                            </button>
                          )}

                          {currentRound.status === 'closed' && (
                            <button
                              onClick={() => handleActivateRound(currentRound.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/4 border border-white/6 hover:bg-white/8 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>إعادة فتح التصويت</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteRound(currentRound.id)}
                            className="p-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 border border-white/6 rounded-xl transition-all cursor-pointer"
                            title="حذف الجولة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* لوحة اعتماد الفائز (تظهر عندما تكون الجولة مغلقة Closed) */}
                  <div className="lg:col-span-1">
                    {currentRound.status === 'closed' ? (
                      <div className="glass-card-gold rounded-2xl p-5 border border-[#C9971A]/20 space-y-4 text-right">
                        <h4 className="text-xs font-black text-[#F0C040] uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy className="w-4.5 h-4.5" />
                          <span>اعتماد الفائز بالجولة</span>
                        </h4>
                        <p className="text-[10px] text-white/50 leading-relaxed">
                          التصويت مغلق الآن. يرجى اختيار الهدف الفائز بناءً على أعلى الأصوات، ثم الضغط على اعتماد للأرشفة وإعلان الفائز رسمياً.
                        </p>

                        <div className="space-y-2">
                          {currentRound.goals.map((rg: any) => (
                            <div
                              key={rg.id}
                              className="p-3 bg-[#0e0e12] border border-white/8 rounded-xl flex flex-col gap-2.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex flex-col">
                                  <span className="font-bold text-white">{rg.goal?.player?.name}</span>
                                  <span className="text-[9px] text-white/50">{rg.goal?.team?.name}</span>
                                </div>
                                <span className="bg-[#C9971A]/20 text-[#F0C040] px-2 py-0.5 rounded font-black text-[10px]">
                                  {rg.votes?.length || 0} صوت
                                </span>
                              </div>
                              <button
                                onClick={() => handleArchiveRound(currentRound.id, rg.goalId, rg.goal?.player?.name)}
                                className="w-full py-1.5 bg-[#C9971A] hover:bg-[#A07510] text-[#0e0e12] rounded-lg text-[10px] font-black transition-all cursor-pointer"
                              >
                                اعتماد هذا الهدف كفائز وأرشفة الجولة
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="glass-card rounded-2xl p-5 border border-white/5 text-center text-white/55 py-12">
                        <Medal className="w-8 h-8 text-white/45 mx-auto mb-2 animate-bounce" />
                        <p className="text-[11px] font-semibold">
                          {currentRound.status === 'draft'
                            ? 'سيتم تفعيل لوحة الفائز بعد إغلاق التصويت للجولة.'
                            : 'التصويت مفتوح حالياً. يمكنك تصفح الأصوات والمراقبة من تبويب النتائج.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* إذا لم تكن هناك جولة تصويت حالية، نعرض واجهة الإنشاء */
                <div className="max-w-xl mx-auto glass-card rounded-2xl p-6 border border-white/5 text-right space-y-6">
                  <div className="text-center space-y-2 py-4">
                    <Medal className="w-12 h-12 text-white/55 mx-auto" />
                    <h3 className="text-base font-black text-white">لا توجد جولة تصويت حالية</h3>
                    <p className="text-xs text-white/55">أنشئ جولة تصويت جديدة لتبدأ بترشيح أهداف الجولة والبطولات.</p>
                  </div>

                  <form onSubmit={handleCreateRound} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white/50">عنوان الجولة *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: هدف الجولة الأولى"
                        value={newRoundTitle}
                        onChange={(e) => setNewRoundTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white/50">البطولة المرتبطة (اختياري)</label>
                      <select
                        value={newRoundTournamentId}
                        onChange={(e) => setNewRoundTournamentId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0e0e12] border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 [color-scheme:dark]"
                      >
                        <option value="">اختر البطولة</option>
                        {tournaments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* طريقة عرض النتائج افتراضية */}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white/50">وصف الجولة (اختياري)</label>
                      <textarea
                        placeholder="أضف وصفاً مختصراً أو تعليمات حول التصويت"
                        value={newRoundDesc}
                        onChange={(e) => setNewRoundDesc(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCreating || !newRoundTitle.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-l from-[#C9971A] to-[#A07510] text-white rounded-xl text-xs font-bold hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري إنشاء الجولة...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>إنشاء جولة التصويت</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ══ Tab 2: ترشيح الأهداف ═══════════════════════════════════ */}
          {activeSubTab === 'nominate' && currentRound && (
            <div className="space-y-4 animate-fade-in-up">
              {currentRound.status === 'draft' ? (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/2 border border-white/5 p-4 rounded-2xl">
                    {/* فلتر البحث بالاسم */}
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        placeholder="البحث باسم اللاعب أو الفريق..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 text-right"
                      />
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    </div>

                    {/* فلتر البطولة */}
                    <div className="w-full sm:w-48">
                      <select
                        value={filterTournamentId}
                        onChange={(e) => setFilterTournamentId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0e0e12] border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 [color-scheme:dark]"
                      >
                        <option value="all">كل البطولات</option>
                        {tournaments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {goalsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#F0C040] animate-spin" />
                    </div>
                  ) : goalsForNominationList.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 border-dashed border-white/10 text-center">
                      <Medal className="w-8 h-8 text-white/55 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-white/50">لم يتم العثور على أهداف مطابقة للفلاتر.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {goalsForNominationList.map((g) => (
                        <div
                          key={g.id}
                          className={`p-4 rounded-2xl border transition-all text-right space-y-3 ${
                            g.isNominatedInRound
                              ? 'bg-[#C9971A]/5 border-[#C9971A]/20 shadow-md'
                              : 'bg-white/2 border-white/6 hover:border-white/12'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-white/50 bg-white/5 px-2 py-0.5 rounded">
                              {g.match?.tournament?.name}
                            </span>
                            <span className="text-[10px] font-bold text-white/50">د {g.minute}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="block text-xs font-black text-white">{g.player?.name}</span>
                            <span className="block text-[10px] text-white/55 font-bold">
                              فريق: {g.team?.name} • {getGoalTypeLabel(g.type)}
                            </span>
                            <span className="block text-[9px] text-white/60">
                              مباراة: {g.match?.homeTeam?.name} ضد {g.match?.awayTeam?.name}
                            </span>
                          </div>

                          {g.isNominatedInRound ? (
                            <div className="pt-3 border-t border-white/5 space-y-2">
                              {/* تعديل رابط الفيديو مباشرة للمرشح */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="رابط فيديو الهدف (YouTube / TikTok)..."
                                  value={videoUrls[g.roundGoalId] ?? ''}
                                  onChange={(e) =>
                                    setVideoUrls((prev) => ({ ...prev, [g.roundGoalId]: e.target.value }))
                                  }
                                  className="flex-1 px-3 py-1.5 bg-[#0e0e12] border border-white/8 rounded-lg text-white text-[10px] focus:outline-none focus:border-[#C9971A]/60 text-right"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveVideoUrl(g.roundGoalId)}
                                  disabled={savingVideoId === g.roundGoalId}
                                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-bold border border-white/8 transition-colors cursor-pointer"
                                >
                                  {savingVideoId === g.roundGoalId ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <span>حفظ</span>
                                  )}
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemoveGoal(g.id)}
                                className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                إزالة من جولة التصويت
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddGoal(g.id)}
                              className="w-full py-1.5 bg-[#C9971A]/10 hover:bg-[#C9971A]/15 border border-[#C9971A]/20 text-[#F0C040] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              ترشيح لجولة التصويت
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="glass-card rounded-2xl p-8 border-dashed border-white/10 text-center animate-fade-in-up">
                  <AlertCircle className="w-8 h-8 text-white/60 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white/50">
                    الترشيح متاح فقط عندما تكون الجولة في حالة مسودة (Draft).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ══ Tab 3: مراقبة النتائج ═══════════════════════════════════ */}
          {activeSubTab === 'results' && currentRound && (
            <div className="space-y-6 animate-fade-in-up text-right">
              {/* إحصائيات عامة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-card p-5 border border-white/5 rounded-2xl">
                  <span className="text-[10px] font-black text-white/50 uppercase">إجمالي الأصوات المصوت عليها</span>
                  <h3 className="text-2xl font-black text-[#F0C040] mt-1">
                    {currentRound.goals.reduce((acc: number, g: any) => acc + g.votes.length, 0)} صوت
                  </h3>
                </div>
                <div className="glass-card p-5 border border-white/5 rounded-2xl">
                  <span className="text-[10px] font-black text-white/50 uppercase">عدد المرشحين بالترتيب</span>
                  <h3 className="text-2xl font-black text-white mt-1">{currentRound.goals.length} أهداف</h3>
                </div>
                <div className="glass-card p-5 border border-white/5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-black text-white/50 uppercase">تصفير أصوات الجولة</span>
                    <span className="text-[9px] text-white/60 block mt-0.5">حذف كل الأصوات وبدء الجولة من جديد</span>
                  </div>
                  <button
                    onClick={() => handleResetVotes(currentRound.id)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
                    title="تصفير كل الأصوات"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* الترتيب المباشر للأهداف */}
              <div className="glass-card rounded-2xl border border-white/5 p-5 space-y-4">
                <h4 className="text-xs font-black text-white/60">ترتيب الأهداف المباشر الحاصلة على الأصوات:</h4>
                <div className="divide-y divide-white/5">
                  {currentRound.goals
                    .map((rg: any) => ({
                      ...rg,
                      votesCount: rg.votes.length,
                    }))
                    .sort((a: any, b: any) => b.votesCount - a.votesCount)
                    .map((rg: any, index: number) => {
                      const totalVotes = currentRound.goals.reduce((acc: number, g: any) => acc + g.votes.length, 0);
                      const pct = totalVotes > 0 ? Math.round((rg.votesCount / totalVotes) * 100) : 0;
                      return (
                        <div key={rg.id} className="py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-white/50 font-mono w-4">#{index + 1}</span>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">{rg.goal?.player?.name}</span>
                              <span className="text-[9px] text-white/50">
                                فريق: {rg.goal?.team?.name} • د {rg.goal?.minute}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 max-w-xs sm:max-w-md hidden sm:block">
                            <div className="w-full bg-white/4 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-l from-[#C9971A] to-[#A07510] h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span className="text-xs font-black text-[#F0C040] block">{rg.votesCount} صوت</span>
                            <span className="text-[9px] text-white/60 font-bold block mt-0.5">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  {currentRound.goals.length === 0 && (
                    <p className="text-[10px] text-white/45 text-center py-6">لا توجد أهداف مرشحة حالياً لمراقبة الأصوات.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ Tab 4: الأرشيف ═══════════════════════════════════ */}
          {activeSubTab === 'archive' && (
            <div className="space-y-4 animate-fade-in-up text-right">
              {archivedRounds.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 border-dashed border-white/10 text-center py-16">
                  <Archive className="w-10 h-10 text-white/45 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white/50">لا توجد جولات تصويت مؤرشفة بعد في المنصة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {archivedRounds.map((round) => {
                    const isExpanded = expandedArchiveRounds[round.id] || false;
                    // البحث عن الهدف الفائز
                    const winnerGoalObj = round.goals.find((rg: any) => rg.goalId === round.winnerGoalId);
                    const winnerVotes = winnerGoalObj?.votes?.length || 0;
                    const totalVotes = round.goals.reduce((acc: number, g: any) => acc + g.votes.length, 0);

                    return (
                      <div
                        key={round.id}
                        className="glass-card rounded-2xl border border-white/5 p-5 space-y-4 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-white">{round.title}</h3>
                          <span className="text-[9px] font-black text-white/60 bg-white/5 px-2.5 py-0.5 rounded">
                            مؤرشفة
                          </span>
                        </div>

                        {round.winnerGoalId && winnerGoalObj ? (
                          <div className="p-3 bg-[#C9971A]/5 border border-[#C9971A]/15 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <Trophy className="w-5 h-5 text-[#F0C040]" />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-[#F0C040] uppercase">الهدف الفائز بالجولة</span>
                                <span className="font-bold text-white">{winnerGoalObj.goal?.player?.name}</span>
                                <span className="text-[9px] text-white/50">
                                  {winnerGoalObj.goal?.team?.name} • د {winnerGoalObj.goal?.minute}
                                </span>
                              </div>
                            </div>
                            <div className="text-left">
                              <span className="bg-[#C9971A]/20 text-[#F0C040] px-2 py-0.5 rounded font-black text-[9px]">
                                {winnerVotes} أصوات
                              </span>
                              <span className="block text-[9px] text-white/60 mt-1 font-bold">
                                إجمالي: {totalVotes} صوت
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-white/2 border border-white/6 rounded-xl text-xs text-white/55">
                            لا يوجد فائز معتمد للجولة.
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <button
                            onClick={() =>
                              setExpandedArchiveRounds((prev) => ({ ...prev, [round.id]: !isExpanded }))
                            }
                            className="flex items-center gap-1 text-[10px] font-black text-white/50 hover:text-white transition-colors cursor-pointer"
                          >
                            <span>تفاصيل الترشيحات والأصوات</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleDeleteRound(round.id)}
                            className="p-1 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="حذف الجولة من الأرشيف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="pt-4 border-t border-white/5 space-y-2 animate-fade-in-up">
                            <h4 className="text-[10px] font-bold text-white/60 mb-2">أصوات المرشحين النهائية:</h4>
                            {round.goals.map((rg: any) => (
                              <div
                                key={rg.id}
                                className="flex items-center justify-between p-2.5 bg-white/2 border border-white/6 rounded-xl text-[10px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">
                                    {rg.goal?.player?.name}
                                    {rg.goalId === round.winnerGoalId && ' 👑'}
                                  </span>
                                  <span className="text-white/50">({rg.goal?.team?.name})</span>
                                </div>
                                <span className="font-bold text-white/70">{rg.votes?.length || 0} صوت</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
