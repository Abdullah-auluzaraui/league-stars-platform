'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCircle,
  Swords,
  Star,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
  Play,
  StopCircle,
  Flag,
  Shield,
  BarChart3,
  Medal,
  Tv2,
  Loader2,
  AlertCircle,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import TournamentModal from './TournamentModal';
import TeamModal from './TeamModal';
import ConfirmModal from './ConfirmModal';
import {
  getTournaments,
  startTournament,
  completeTournament,
  deleteTournament,
} from './tournamentActions';
import {
  getTeams,
  archiveTeam,
  unarchiveTeam,
  deleteTeam,
} from './teamActions';

// ─── Types (واجهات البيانات الوهمية) ─────────────────────────────────────────

type TabId = 'overview' | 'tournaments' | 'teams' | 'players' | 'matches' | 'voting';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

// ─── Navigation Config ────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',     label: 'نظرة عامة',      icon: LayoutDashboard },
  { id: 'tournaments',  label: 'البطولات',         icon: Trophy          },
  { id: 'teams',        label: 'الفرق',            icon: Shield          },
  { id: 'players',      label: 'اللاعبون',         icon: UserCircle      },
  { id: 'matches',      label: 'المباريات',         icon: Swords          },
  { id: 'voting',       label: 'التصويت',           icon: Star            },
];

// ─── Mock Stats ───────────────────────────────────────────────────────────────

const STATS = [
  { label: 'البطولات',    value: '3',    icon: Trophy,    color: 'from-[#C9971A]/20 to-[#C9971A]/5',  border: 'border-[#C9971A]/20',  text: 'text-[#F0C040]' },
  { label: 'الفرق',       value: '12',   icon: Shield,    color: 'from-[#5C131F]/20 to-[#5C131F]/5',  border: 'border-[#5C131F]/30',  text: 'text-red-300'   },
  { label: 'اللاعبون',   value: '148',  icon: Users,     color: 'from-white/10 to-white/3',            border: 'border-white/10',       text: 'text-white'     },
  { label: 'الأصوات',    value: '4.2k', icon: BarChart3, color: 'from-purple-500/15 to-purple-500/3', border: 'border-purple-500/20', text: 'text-purple-300'},
];

// ─── Mock Tournaments ─────────────────────────────────────────────────────────

const MOCK_TOURNAMENTS = [
  { id: '1', name: 'دوري الفرسان الربيعي',    type: 'group_stage', status: 'active',    groups: 2, qualifiers: 2 },
  { id: '2', name: 'كأس النجوم الصيفية',       type: 'knockout',    status: 'upcoming',  groups: 1, qualifiers: 1 },
  { id: '3', name: 'بطولة الشتاء التاريخية',   type: 'group_stage', status: 'completed', groups: 3, qualifiers: 2 },
];

// ─── Mock Teams ───────────────────────────────────────────────────────────────

const MOCK_TEAMS = [
  { id: '1', name: 'فرسان نجد',    group: 'A', tournament: 'دوري الفرسان الربيعي'  },
  { id: '2', name: 'صقور الرياض', group: 'A', tournament: 'دوري الفرسان الربيعي'  },
  { id: '3', name: 'أسود القصيم', group: 'B', tournament: 'دوري الفرسان الربيعي'  },
  { id: '4', name: 'نجوم الجنوب', group: 'B', tournament: 'دوري الفرسان الربيعي'  },
  { id: '5', name: 'نمور المنطقة', group: '-', tournament: 'كأس النجوم الصيفية'    },
  { id: '6', name: 'عقبان الغرب',  group: '-', tournament: 'كأس النجوم الصيفية'    },
];

// ─── Mock Players ─────────────────────────────────────────────────────────────

const MOCK_PLAYERS = [
  { id: '1', name: 'محمد السهلاوي', team: 'فرسان نجد',    jersey: 9,  position: 'مهاجم'    },
  { id: '2', name: 'ياسر القحطاني', team: 'صقور الرياض',  jersey: 10, position: 'وسط'      },
  { id: '3', name: 'عمر الشمراني',  team: 'أسود القصيم',  jersey: 7,  position: 'وسط'      },
  { id: '4', name: 'خالد البلوي',   team: 'نجوم الجنوب',  jersey: 1,  position: 'حارس مرمى'},
  { id: '5', name: 'أحمد الدوسري',  team: 'فرسان نجد',    jersey: 5,  position: 'مدافع'    },
  { id: '6', name: 'تركي الغامدي',  team: 'صقور الرياض',  jersey: 11, position: 'مهاجم'    },
];

// ─── Mock Matches ─────────────────────────────────────────────────────────────

const MOCK_MATCHES = [
  { id: '1', home: 'فرسان نجد',    away: 'صقور الرياض', homeScore: 2, awayScore: 1, status: 'finished', stage: 'دور المجموعات - أ' },
  { id: '2', home: 'أسود القصيم', away: 'نجوم الجنوب', homeScore: 0, awayScore: 0, status: 'live',     stage: 'دور المجموعات - ب' },
  { id: '3', home: 'فرسان نجد',    away: 'أسود القصيم', homeScore: null, awayScore: null, status: 'scheduled', stage: 'دور المجموعات' },
];

// ─── Helper: Status Badge ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:    { label: 'نشطة',    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    upcoming:  { label: 'قادمة',   cls: 'bg-[#C9971A]/15 text-[#F0C040] border-[#C9971A]/25'     },
    completed: { label: 'منتهية',  cls: 'bg-white/8 text-white/40 border-white/10'                },
    live:      { label: 'مباشر',   cls: 'bg-red-500/15 text-red-400 border-red-500/25 animate-pulse' },
    finished:  { label: 'انتهت',   cls: 'bg-white/8 text-white/40 border-white/10'                },
    scheduled: { label: 'مجدولة',  cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25'         },
  };
  const s = map[status] ?? { label: status, cls: 'bg-white/8 text-white/40 border-white/10' };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, onAdd }: { title: string; subtitle: string; onAdd?: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="text-lg font-black text-white">{title}</h2>
        <p className="text-xs text-white/35 font-semibold mt-0.5">{subtitle}</p>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-l from-[#C9971A] to-[#A07510] rounded-xl hover:shadow-lg hover:shadow-[#C9971A]/10 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة جديد</span>
        </button>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

interface OverviewTabProps {
  tournamentsCount: number;
  teamsCount: number;
}

function OverviewTab({ tournamentsCount, teamsCount }: OverviewTabProps) {
  const stats = [
    { label: 'البطولات',    value: String(tournamentsCount),    icon: Trophy,    color: 'from-[#C9971A]/20 to-[#C9971A]/5',  border: 'border-[#C9971A]/20',  text: 'text-[#F0C040]' },
    ...STATS.slice(1),
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-br ${s.color} p-3 sm:p-4 flex flex-col justify-between min-h-[90px] sm:min-h-[110px]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-white/40 font-bold">{s.label}</span>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.text} opacity-80`} />
              </div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">{s.value}</span>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white mb-1">إجراءات سريعة</h3>
            <p className="text-[10px] sm:text-xs text-white/35 mb-4">الوصول السريع للعمليات الأساسية</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 active:scale-95 transition-all cursor-pointer text-center">
              <Trophy className="w-4 h-4 text-[#F0C040] mb-1.5" />
              <span className="text-[10px] font-bold text-white">بطولة جديدة</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 active:scale-95 transition-all cursor-pointer text-center">
              <Swords className="w-4 h-4 text-blue-400 mb-1.5" />
              <span className="text-[10px] font-bold text-white">جدولة مباراة</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 active:scale-95 transition-all cursor-pointer text-center">
              <Users className="w-4 h-4 text-emerald-400 mb-1.5" />
              <span className="text-[10px] font-bold text-white">إضافة لاعب</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 active:scale-95 transition-all cursor-pointer text-center">
              <Star className="w-4 h-4 text-purple-400 mb-1.5" />
              <span className="text-[10px] font-bold text-white">جلسة تصويت</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-bold text-white mb-1">النشاط الأخير</h3>
          <p className="text-[10px] sm:text-xs text-white/35 mb-4">آخر العمليات والمجريات في النظام</p>

          <div className="space-y-3">
            {[
              { action: 'بدء مباراة مباشر', detail: 'أسود القصيم ضد نجوم الجنوب', time: 'منذ دقيقة', color: 'bg-red-500' },
              { action: 'نتيجة مباراة', detail: 'فرسان نجد 2 - 1 صقور الرياض', time: 'قبل ساعة', color: 'bg-[#C9971A]' },
              { action: 'بطولة جديدة', detail: 'كأس النجوم الصيفية', time: 'أمس', color: 'bg-blue-500' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 ${a.color} rounded-full mt-1.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/80">{a.action}</p>
                  <p className="text-[10px] text-white/40 truncate">{a.detail}</p>
                </div>
                <p className="text-[10px] text-white/25 flex-shrink-0">{a.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tournaments Tab ──────────────────────────────────────────────────────────

interface TournamentsTabProps {
  tournaments: any[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (tournament: any) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
}

function TournamentsTab({
  tournaments,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onStart,
  onComplete,
}: TournamentsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#F0C040]" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="البطولات"
        subtitle="إدارة دورة حياة البطولات الكاملة"
        onAdd={onAdd}
      />
      {tournaments.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 border-dashed border-white/10 text-center animate-fade-in-up">
          <Trophy className="w-10 h-10 text-white/15 mx-auto mb-2" />
          <p className="text-xs text-white/30 font-semibold">لا توجد بطولات مسجلة حالياً، اضغط على إضافة جديد لإنشاء بطولة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t, i) => (
            <div
              key={t.id}
              className="glass-card rounded-2xl p-4 sm:p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="p-2.5 rounded-xl bg-[#C9971A]/10 border border-[#C9971A]/15 flex-shrink-0">
                    <Trophy className="w-5 h-5 text-[#F0C040]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-bold text-white leading-tight">{t.name}</h3>
                      <StatusBadge status={t.status} />
                      <span className="text-[10px] text-white/35 bg-white/5 px-2 py-0.5 rounded-md whitespace-nowrap">
                        {t.type === 'group_stage' ? `${t.groupCount} مجموعات` : 'إقصائي'}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/35">
                      {t.type === 'group_stage'
                        ? `${t.qualifyingTeams} فرق متأهلة من كل مجموعة · ${t.groupCount} مجموعة`
                        : `بطولة خروج المغلوب (إقصائية)`
                      }
                      {t.startDate && ` · تبدأ في ${new Date(t.startDate).toLocaleDateString('ar-SA')}`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-0 flex-shrink-0">
                  {t.status === 'upcoming' && (
                    <button
                      onClick={() => onStart(t.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-3 h-3" />
                      بدء
                    </button>
                  )}
                  {t.status === 'active' && (
                    <button
                      onClick={() => onComplete(t.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Flag className="w-3 h-3" />
                      إنهاء البطولة
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {t.status !== 'active' && (
                      <button
                        onClick={() => onDelete(t.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────

interface TeamsTabProps {
  teams: any[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (team: any) => void;
  onDelete: (id: string) => void;
  onArchiveToggle: (id: string, isArchived: boolean) => void;
  showArchived: boolean;
  setShowArchived: (val: boolean) => void;
}

function TeamsTab({
  teams,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onArchiveToggle,
  showArchived,
  setShowArchived,
}: TeamsTabProps) {
  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="الفرق"
        subtitle="إدارة الفرق وتوزيعها على المجموعات"
        onAdd={onAdd}
      />

      {/* شريط الفلترة والأرشفة */}
      <div className="flex items-center justify-between mb-4 bg-white/3 border border-white/5 p-3 rounded-2xl">
        <div className="text-xs text-white/40 font-semibold">إجمالي الفرق: {teams.length}</div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            showArchived
              ? 'bg-[#C9971A]/10 border-[#C9971A]/20 text-[#F0C040]'
              : 'bg-white/4 border-white/8 text-white/40 hover:bg-white/6 hover:text-white'
          }`}
          type="button"
        >
          {showArchived ? 'إخفاء الفرق المؤرشفة' : 'عرض الفرق المؤرشفة'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-[#F0C040] animate-spin" />
          <span className="text-xs text-white/30 font-semibold">جاري تحميل قائمة الفرق...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 bg-[#121018]/40 border border-white/5 rounded-2xl">
          <Shield className="w-10 h-10 text-white/10 mx-auto mb-2.5" />
          <p className="text-xs text-white/30 font-semibold">
            {showArchived ? 'لا توجد فرق مؤرشفة حالياً' : 'لا توجد فرق مسجلة. أضف فريقاً جديداً للبدء!'}
          </p>
        </div>
      ) : (
        <>
          {/* 1. Mobile View (Cards) */}
          <div className="block sm:hidden space-y-3">
            {teams.map((team, i) => {
              const assoc = team.tournaments?.[0];
              const isArchived = !!team.archivedAt;
              return (
                <div
                  key={team.id}
                  className={`glass-card rounded-xl p-4 flex items-center justify-between gap-3 animate-fade-in-up ${isArchived ? 'opacity-50 border-white/5 bg-white/2' : ''}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/8 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white block truncate">{team.name}</span>
                        {isArchived && (
                          <span className="text-[8px] font-black text-white/50 bg-white/10 px-1 py-0.5 rounded">مؤرشف</span>
                        )}
                        {assoc?.status === 'disqualified' && (
                          <span className="text-[8px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded">مستبعد</span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40 block truncate">
                        {assoc ? assoc.tournament.name : 'فريق عام (غير مرتبط)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {assoc?.groupName && (
                      <span className="text-[10px] font-black text-[#F0C040] bg-[#C9971A]/10 px-2 py-0.5 rounded-md">
                        المجموعة {assoc.groupName}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(team)}
                        className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        type="button"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onArchiveToggle(team.id, isArchived)}
                        className="p-1.5 text-white/30 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title={isArchived ? 'إلغاء الأرشفة' : 'أرشفة الفريق'}
                        type="button"
                      >
                        {isArchived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(team.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop View (Table) */}
          <div className="hidden sm:block glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-right whitespace-nowrap">الفريق</th>
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-right whitespace-nowrap">البطولة</th>
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-center whitespace-nowrap">المجموعة</th>
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-center whitespace-nowrap">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {teams.map((team, i) => {
                    const assoc = team.tournaments?.[0];
                    const isArchived = !!team.archivedAt;
                    return (
                      <tr
                        key={team.id}
                        className={`hover:bg-white/3 transition-colors ${isArchived ? 'opacity-50 bg-white/1' : ''}`}
                      >
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <div className="flex items-center gap-3">
                            {team.logoUrl ? (
                              <img
                                src={team.logoUrl}
                                alt={team.name}
                                className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/8 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-white/6 border border-white/8 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 text-white/30" />
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white whitespace-nowrap">{team.name}</span>
                              {isArchived && (
                                <span className="text-[8px] font-black text-white/50 bg-white/10 px-1.5 py-0.5 rounded">مؤرشف</span>
                              )}
                              {assoc?.status === 'disqualified' && (
                                <span className="text-[8px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">مستبعد</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <span className="text-xs text-white/45 whitespace-nowrap">
                            {assoc ? assoc.tournament.name : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5 text-center">
                          {assoc?.groupName ? (
                            <span className="text-xs font-black text-[#F0C040] bg-[#C9971A]/10 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                              المجموعة {assoc.groupName}
                            </span>
                          ) : (
                            <span className="text-xs text-white/20">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => onEdit(team)}
                              className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              type="button"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onArchiveToggle(team.id, isArchived)}
                              className="p-1.5 text-white/30 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              title={isArchived ? 'إلغاء الأرشفة' : 'أرشفة الفريق'}
                              type="button"
                            >
                              {isArchived ? (
                                <ArchiveRestore className="w-3.5 h-3.5" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => onDelete(team.id)}
                              className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                              type="button"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────────────────────────────────

const POSITION_COLORS: Record<string, string> = {
  'مهاجم': 'text-red-300 bg-red-500/10 border-red-500/20',
  'وسط': 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  'مدافع': 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  'حارس مرمى': 'text-amber-300 bg-amber-500/10 border-amber-500/20',
};

function PlayersTab() {
  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="اللاعبون"
        subtitle="سجل اللاعبين المشاركين في البطولات"
        onAdd={() => {}}
      />

      {/* 1. Mobile View (Cards) */}
      <div className="block md:hidden space-y-3">
        {MOCK_PLAYERS.map((p, i) => (
          <div
            key={p.id}
            className="glass-card rounded-xl p-4 flex flex-col gap-3 animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#C9971A]/10 border border-[#C9971A]/20 text-[#F0C040] text-xs font-black flex items-center justify-center flex-shrink-0">
                  {p.jersey}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-white block truncate">{p.name}</span>
                  <span className="text-[10px] text-white/40 block truncate">{p.team}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md border flex-shrink-0 ${POSITION_COLORS[p.position] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                {p.position}
              </span>
            </div>
            <div className="border-t border-white/5 pt-2 flex items-center justify-end gap-1.5">
              <button className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Desktop View (Table) */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-white/6">
                <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-right whitespace-nowrap">اللاعب</th>
                <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-right whitespace-nowrap">الفريق</th>
                <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-center whitespace-nowrap">رقم</th>
                <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-right whitespace-nowrap">المركز</th>
                <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-center whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {MOCK_PLAYERS.map((p, i) => (
                <tr
                  key={p.id}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/3 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="w-4 h-4 text-white/35" />
                      </div>
                      <span className="text-sm font-bold text-white whitespace-nowrap">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                    <span className="text-xs text-white/45 whitespace-nowrap">{p.team}</span>
                  </td>
                  <td className="px-3 py-3 sm:px-5 sm:py-3.5 text-center">
                    <span className="text-xs font-black text-white whitespace-nowrap">{p.jersey}</span>
                  </td>
                  <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${POSITION_COLORS[p.position] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                      {p.position}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <button className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Matches Tab ──────────────────────────────────────────────────────────────

function MatchesTab() {
  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="المباريات"
        subtitle="إدارة الجدول وإدخال النتائج"
        onAdd={() => {}}
      />
      <div className="space-y-3">
        {MOCK_MATCHES.map((m, i) => (
          <div
            key={m.id}
            className={`glass-card rounded-2xl p-4 sm:p-5 animate-fade-in-up ${m.status === 'live' ? 'border-red-500/20' : ''}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-col gap-3">
              {/* Match row (Teams & Score) */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs sm:text-sm font-bold text-white text-right flex-1 truncate">{m.home}</span>
                <div className="flex-shrink-0 mx-1">
                  {m.homeScore !== null ? (
                    <span className="text-xs sm:text-sm font-black text-white bg-white/8 rounded-lg px-2.5 py-1 min-w-[48px] sm:min-w-[56px] text-center inline-block">
                      {m.homeScore} - {m.awayScore}
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-bold text-white/25 bg-white/4 rounded-lg px-2.5 py-1 min-w-[48px] sm:min-w-[56px] text-center inline-block">
                      VS
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold text-white text-left flex-1 truncate text-left">{m.away}</span>
              </div>

              {/* Stage & Status/Actions */}
              <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5 text-[11px] gap-2">
                <span className="text-white/30 font-semibold truncate max-w-[120px] sm:max-w-none">{m.stage}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusBadge status={m.status} />
                  {m.status === 'live' && (
                    <button className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap">
                      <Tv2 className="w-3.5 h-3.5" />
                      إدارة
                    </button>
                  )}
                  {m.status === 'scheduled' && (
                    <button className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap">
                      <Play className="w-3.5 h-3.5" />
                      بدء
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Voting Tab ───────────────────────────────────────────────────────────────

function VotingTab() {
  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="جلسات التصويت"
        subtitle="إدارة وتفعيل تصويت الجمهور لأفضل هدف"
        onAdd={() => {}}
      />

      {/* Active Session Card */}
      <div className="glass-card-gold rounded-2xl p-4 sm:p-5 mb-4 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Star className="w-4 h-4 text-[#F0C040]" />
              <span className="text-xs sm:text-sm font-bold text-white">تصويت الجولة · الجولة العاشرة</span>
            </div>
            <p className="text-[10px] sm:text-xs text-white/45">3 أهداف مرشحة · 412 صوت إجمالي</p>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full whitespace-nowrap">نشطة</span>
            <button className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap">
              <StopCircle className="w-3 h-3" />
              إغلاق
            </button>
          </div>
        </div>

        {/* Nominated Goals */}
        <div className="space-y-2">
          {[
            { player: 'محمد السهلاوي', team: 'فرسان نجد',   votes: 210, pct: 51 },
            { player: 'ياسر القحطاني', team: 'صقور الرياض', votes: 142, pct: 34 },
            { player: 'عمر الشمراني',  team: 'أسود القصيم', votes: 60,  pct: 15 },
          ].map((g, i) => (
            <div key={i} className="bg-white/4 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="min-w-0 flex items-baseline">
                  <span className="text-xs font-bold text-white truncate">{g.player}</span>
                  <span className="text-[9px] sm:text-[10px] text-white/40 mr-1.5 truncate">· {g.team}</span>
                </div>
                <span className="text-xs font-bold text-[#F0C040] flex-shrink-0">{g.votes} صوت</span>
              </div>
              <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-[#F0C040] to-[#C9971A] rounded-full"
                  style={{ width: `${g.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No active session placeholder hint */}
      <div className="glass-card rounded-2xl p-5 border-dashed border-white/10 text-center animate-fade-in-up animate-delay-200">
        <Medal className="w-8 h-8 text-white/15 mx-auto mb-2" />
        <p className="text-xs text-white/30 font-semibold">ابدأ جلسة تصويت جديدة عبر ترشيح أهداف من قاعدة البيانات</p>
      </div>
    </div>
  );
}

export default function AdminClient({ username }: { username: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- حالات البطولات وقاعدة البيانات ---
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // حالات نافذة التحكم بالبطولة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);

  // --- حالات الفرق وقاعدة البيانات ---
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // حالات نافذة التحكم بالفرق
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  // إعدادات نافذة التأكيد المخصصة (Confirm Modal)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant: 'danger' | 'warning' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  // نظام عرض التنبيهات
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // مساعد لفتح نافذة التأكيد المخصصة
  const triggerConfirm = (config: Omit<typeof confirmConfig, 'isOpen'>) => {
    setConfirmConfig({ ...config, isOpen: true });
  };

  // جلب البطولات من السيرفر
  const fetchTournaments = async () => {
    try {
      setTournamentsLoading(true);
      const data = await getTournaments();
      setTournaments(data);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل قائمة البطولات', 'error');
    } finally {
      setTournamentsLoading(false);
    }
  };

  // جلب الفرق من السيرفر
  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      const data = await getTeams(showArchived);
      setTeams(data);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل قائمة الفرق', 'error');
    } finally {
      setTeamsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [showArchived]);

  // إضافة وتعديل
  const handleAddTournament = () => {
    setSelectedTournament(null);
    setIsModalOpen(true);
  };

  const handleEditTournament = (tournament: any) => {
    setSelectedTournament(tournament);
    setIsModalOpen(true);
  };

  // بدء البطولة
  const handleStartTournament = (id: string) => {
    triggerConfirm({
      title: 'بدء البطولة',
      message: 'هل أنت متأكد من رغبتك في بدء هذه البطولة؟ سيؤدي هذا لتفعيلها رسمياً وتعيين تاريخ البدء تلقائياً اليوم. لن تتمكن من تعديل إعدادات المجموعات ونوع البطولة لاحقاً.',
      confirmText: 'بدء البطولة الآن',
      cancelText: 'تراجع',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await startTournament(id);
          if (res.success) {
            showToast('تم بدء البطولة بنجاح!');
            fetchTournaments();
          } else {
            showToast(res.error || 'فشل بدء البطولة', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ غير متوقع', 'error');
        }
      },
    });
  };

  // إنهاء البطولة
  const handleCompleteTournament = (id: string) => {
    triggerConfirm({
      title: 'إنهاء البطولة',
      message: 'هل أنت متأكد من رغبتك في إنهاء هذه البطولة بشكل رسمي وأرشفتها؟ سيتم تسجيل تاريخ الانتهاء تلقائياً اليوم.',
      confirmText: 'إنهاء البطولة',
      cancelText: 'إلغاء',
      variant: 'success',
      onConfirm: async () => {
        try {
          const res = await completeTournament(id);
          if (res.success) {
            showToast('تم إنهاء البطولة بنجاح!');
            fetchTournaments();
          } else {
            showToast(res.error || 'فشل إنهاء البطولة', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ غير متوقع', 'error');
        }
      },
    });
  };

  // حذف البطولة
  const handleDeleteTournament = (id: string) => {
    triggerConfirm({
      title: 'حذف البطولة',
      message: 'هل أنت متأكد من رغبتك في حذف هذه البطولة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيتم إزالة كافة السجلات المرتبطة بها.',
      confirmText: 'حذف نهائي',
      cancelText: 'تراجع',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await deleteTournament(id);
          if (res.success) {
            showToast('تم حذف البطولة بنجاح');
            fetchTournaments();
          } else {
            showToast(res.error || 'فشل حذف البطولة', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ غير متوقع', 'error');
        }
      },
    });
  };

  // إضافة وتعديل فريق
  const handleAddTeam = () => {
    setSelectedTeam(null);
    setIsTeamModalOpen(true);
  };

  const handleEditTeam = (team: any) => {
    setSelectedTeam(team);
    setIsTeamModalOpen(true);
  };

  // أرشفة / إلغاء أرشفة فريق
  const handleArchiveTeam = (id: string, isCurrentlyArchived: boolean) => {
    triggerConfirm({
      title: isCurrentlyArchived ? 'إلغاء أرشفة الفريق' : 'أرشفة الفريق',
      message: isCurrentlyArchived
        ? 'هل ترغب في إلغاء أرشفة الفريق وإعادته للظهور كفريق نشط في القوائم؟'
        : 'هل ترغب في أرشفة الفريق؟ سيتم إخفاؤه من قوائم الاختيار للبطولات الجديدة مع الحفاظ على كافة البيانات التاريخية.',
      confirmText: isCurrentlyArchived ? 'إلغاء الأرشفة' : 'أرشفة الآن',
      cancelText: 'تراجع',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = (isCurrentlyArchived ? await unarchiveTeam(id) : await archiveTeam(id)) as any;
          if (res.success) {
            showToast(isCurrentlyArchived ? 'تم إلغاء أرشفة الفريق' : 'تم أرشفة الفريق بنجاح!');
            fetchTeams();
          } else {
            showToast(res.error || 'فشل تعديل حالة الأرشفة', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ غير متوقع', 'error');
        }
      },
    });
  };

  // حذف فريق (مع التحويل الذكي للأرشفة)
  const handleDeleteTeam = (id: string) => {
    triggerConfirm({
      title: 'حذف الفريق',
      message: 'هل أنت متأكد من رغبتك في حذف هذا الفريق نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.',
      confirmText: 'حذف نهائي',
      cancelText: 'تراجع',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = (await deleteTeam(id)) as any;
          if (res.success) {
            showToast('تم حذف الفريق بنجاح');
            fetchTeams();
          } else if (res.requireArchive) {
            // إذا تطلب الأرشفة، نعرض مودال التأكيد الذكي للأرشفة مباشرة
            triggerConfirm({
              title: 'أرشفة الفريق بدلاً من الحذف',
              message: 'لا يمكن حذف الفريق نظراً لوجود مباريات مسجلة له في المنصة. هل ترغب في أرشفته بدلاً من ذلك لإخفائه من القوائم النشطة مع الحفاظ على كافة البيانات التاريخية؟',
              confirmText: 'نعم، أرشفة الفريق',
              cancelText: 'إلغاء',
              variant: 'warning',
              onConfirm: async () => {
                try {
                  const resArchive = (await archiveTeam(id)) as any;
                  if (resArchive.success) {
                    showToast('تم أرشفة الفريق بنجاح!');
                    fetchTeams();
                  } else {
                    showToast(resArchive.error || 'فشل أرشفة الفريق', 'error');
                  }
                } catch (err) {
                  showToast('حدث خطأ غير متوقع', 'error');
                }
              },
            });
          } else {
            showToast(res.error || 'فشل حذف الفريق', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ غير متوقع', 'error');
        }
      },
    });
  };

  const TAB_CONTENT: Record<TabId, React.ReactNode> = {
    overview:    <OverviewTab tournamentsCount={tournaments.length} teamsCount={teams.length} />,
    tournaments: (
      <TournamentsTab
        tournaments={tournaments}
        isLoading={tournamentsLoading}
        onAdd={handleAddTournament}
        onEdit={handleEditTournament}
        onDelete={handleDeleteTournament}
        onStart={handleStartTournament}
        onComplete={handleCompleteTournament}
      />
    ),
    teams: (
      <TeamsTab
        teams={teams}
        loading={teamsLoading}
        onAdd={handleAddTeam}
        onEdit={handleEditTeam}
        onDelete={handleDeleteTeam}
        onArchiveToggle={handleArchiveTeam}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
      />
    ),
    players:     <PlayersTab />,
    matches:     <MatchesTab />,
    voting:      <VotingTab />,
  };

  // دالة مشتركة لعرض محتويات القائمة الجانبية لمنع تكرار الكود
  const renderSidebarContent = () => (
    <>
      {/* Admin user badge */}
      <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-xl bg-white/4 border border-white/6">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9971A] to-[#5C131F] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-white">{username.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{username}</p>
          <p className="text-[10px] text-white/35">مشرف النظام</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold
                transition-all duration-200 cursor-pointer text-right
                ${isActive
                  ? 'bg-[#C9971A]/15 text-[#F0C040] border border-[#C9971A]/20'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {isActive && (
                <ChevronLeft className="w-3.5 h-3.5 mr-auto text-[#C9971A]/60" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-white/6 mt-auto">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 cursor-pointer">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </>
  );

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-6 min-h-[calc(100dvh-120px)] px-4">

      {/* ── 1. القائمة الجانبية للديسكتوب (Desktop Sidebar) ── */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 sticky top-28 h-[calc(100dvh-150px)] p-5 rounded-2xl border border-white/5 bg-[#101016]/95">
        {renderSidebarContent()}
      </aside>

      {/* ── 2. القائمة الجانبية للجوال (Mobile Drawer) ── */}
      {/* الغطاء الخلفي الشفاف */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* القائمة الجانبية المنزلقة للجوال */}
      <aside
        className={`
          fixed top-0 bottom-0 right-0 h-full w-64 z-[100] md:hidden
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col p-5 bg-[#0e0e12]/98 border-l border-white/5 overflow-y-auto
        `}
      >
        {/* ترويسة القائمة للجوال */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/6">
          <span className="text-xs font-bold text-white/60">القائمة</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderSidebarContent()}
      </aside>

      {/* ── 3. المحتوى الرئيسي (Main Content) ── */}
      <div className="flex-grow min-w-0 flex flex-col">

        {/* شريط العنوان العلوي (Top bar) */}
        <div
          className="flex items-center justify-between px-5 py-3.5 mb-6 rounded-2xl"
          style={{
            background: 'rgba(18, 16, 24, 0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* العنوان */}
          <div>
            <h1 className="text-base font-black text-white">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-[10px] text-white/30 font-semibold">لوحة تحكم المشرف</p>
          </div>

          {/* زر الهامبرغر للجوال لفتح القائمة */}
          <button
            className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى التبويب النشط */}
        <div className="flex-grow">
          {TAB_CONTENT[activeTab]}
        </div>
      </div>

      {/* المودال الخاص بالبطولات */}
      <TournamentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showToast(selectedTournament ? 'تم تحديث البطولة بنجاح!' : 'تم إنشاء البطولة بنجاح!');
          fetchTournaments();
        }}
        tournament={selectedTournament}
      />

      {/* المودال الخاص بالفرق */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSuccess={() => {
          showToast(selectedTeam ? 'تم تحديث الفريق بنجاح!' : 'تم إنشاء الفريق بنجاح!');
          fetchTeams();
        }}
        team={selectedTeam}
        tournaments={tournaments}
      />

      {/* التنبيهات المنبثقة (Toasts) */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-[200] px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2 animate-fade-in-up font-semibold text-xs ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
          dir="rtl"
        >
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* نافذة التأكيد الفاخرة المخصصة */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
