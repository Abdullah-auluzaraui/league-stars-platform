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
  Search,
} from 'lucide-react';
import TournamentModal from './TournamentModal';
import TeamModal from './TeamModal';
import PlayerModal from './PlayerModal';
import MatchModal from './MatchModal';
import VotingTab from './VotingTab';
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
import {
  getPlayers,
  deletePlayer,
} from './playerActions';
import {
  getMatches,
  deleteMatch,
} from './matchActions';
import {
  getVotingRounds,
} from './votingActions';
import { logout } from '../admin-login/actions';

// ─── Types ─────────────────────────────────────────

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
  playersCount: number;
}

function OverviewTab({ tournamentsCount, teamsCount, playersCount }: OverviewTabProps) {
  const stats = [
    { label: 'البطولات', value: String(tournamentsCount), icon: Trophy, color: 'from-[#C9971A]/20 to-[#C9971A]/5', border: 'border-[#C9971A]/20', text: 'text-[#F0C040]' },
    { label: 'الفرق', value: String(teamsCount), icon: Shield, color: 'from-[#5C131F]/20 to-[#5C131F]/5', border: 'border-[#5C131F]/30', text: 'text-red-300' },
    { label: 'اللاعبون', value: String(playersCount), icon: Users, color: 'from-white/10 to-white/3', border: 'border-white/10', text: 'text-white' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs sm:text-sm font-bold text-white mb-1">النشاط الأخير</h3>
          <p className="text-[10px] sm:text-xs text-white/35 mb-4">آخر العمليات والمجريات في النظام</p>
          <div className="flex items-center justify-center min-h-[112px] rounded-xl border border-dashed border-white/8 bg-white/2 text-xs font-semibold text-white/25">
            لا توجد عمليات حديثة مسجلة.
          </div>
        </div>
      </div>
    </div>
  );
}
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
  forward: 'text-red-300 bg-red-500/10 border-red-500/20',
  midfielder: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  defender: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  goalkeeper: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: 'حارس مرمى',
  defender: 'مدافع',
  midfielder: 'وسط',
  forward: 'مهاجم',
};

type AdminTeamOption = {
  id: string;
  name: string;
  logoUrl?: string | null;
  archivedAt?: Date | string | null;
};

type AdminPlayer = {
  id: string;
  name: string;
  teamId: string;
  jerseyNumber: number | null;
  position: string | null;
  photoUrl: string | null;
  team?: AdminTeamOption | null;
  _count?: {
    goals: number;
    cards: number;
  };
};

interface PlayersTabProps {
  players: AdminPlayer[];
  teams: AdminTeamOption[];
  loading: boolean;
  includeArchivedTeams: boolean;
  setIncludeArchivedTeams: (val: boolean) => void;
  onAdd: () => void;
  onEdit: (player: AdminPlayer) => void;
  onDelete: (id: string) => void;
}

function PlayerAvatar({ player }: { player: AdminPlayer }) {
  if (player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt={player.name}
        className="w-8 h-8 rounded-full object-cover bg-white/5 border border-white/8 flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/3 flex items-center justify-center flex-shrink-0">
      <UserCircle className="w-4 h-4 text-white/35" />
    </div>
  );
}

function PositionBadge({ position }: { position?: string | null }) {
  if (!position) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-white/35 bg-white/5 border-white/10 whitespace-nowrap">
        غير محدد
      </span>
    );
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${POSITION_COLORS[position] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
      {POSITION_LABELS[position] ?? position}
    </span>
  );
}

function PlayersTab({
  players,
  teams,
  loading,
  includeArchivedTeams,
  setIncludeArchivedTeams,
  onAdd,
  onEdit,
  onDelete,
}: PlayersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');

  const filteredPlayers = players.filter((player) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      player.name.toLowerCase().includes(normalizedSearch) ||
      player.team?.name?.toLowerCase().includes(normalizedSearch) ||
      String(player.jerseyNumber ?? '').includes(normalizedSearch);
    const matchesTeam = teamFilter === 'all' || player.teamId === teamFilter;
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;

    return matchesSearch && matchesTeam && matchesPosition;
  });

  const teamsWithPlayers = teams.filter((team) =>
    players.some((player) => player.teamId === team.id)
  );

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="اللاعبون"
        subtitle="إدارة بيانات اللاعبين وربطهم بالفرق"
        onAdd={onAdd}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mb-4 bg-white/3 border border-white/5 p-3 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-white/25 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم اللاعب أو الفريق أو الرقم"
            className="w-full pr-9 pl-3 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/50 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="min-w-36 px-3 py-2.5 bg-[#14141a] border border-white/8 rounded-xl text-white/75 text-xs font-bold focus:outline-none focus:border-[#C9971A]/50"
          >
            <option value="all">كل الفرق</option>
            {teamsWithPlayers.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="min-w-32 px-3 py-2.5 bg-[#14141a] border border-white/8 rounded-xl text-white/75 text-xs font-bold focus:outline-none focus:border-[#C9971A]/50"
          >
            <option value="all">كل المراكز</option>
            {Object.entries(POSITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIncludeArchivedTeams(!includeArchivedTeams)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
              includeArchivedTeams
                ? 'bg-[#C9971A]/10 border-[#C9971A]/20 text-[#F0C040]'
                : 'bg-white/4 border-white/8 text-white/40 hover:bg-white/6 hover:text-white'
            }`}
          >
            {includeArchivedTeams ? 'إخفاء لاعبي الفرق المؤرشفة' : 'عرض لاعبي الفرق المؤرشفة'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-[#F0C040] animate-spin" />
          <span className="text-xs text-white/30 font-semibold">جاري تحميل قائمة اللاعبين...</span>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 bg-[#121018]/40 border border-white/5 rounded-2xl">
          <UserCircle className="w-10 h-10 text-white/10 mx-auto mb-2.5" />
          <p className="text-xs text-white/30 font-semibold">لا يوجد لاعبون مسجلون حالياً. أضف لاعباً جديداً للبدء!</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-12 bg-[#121018]/40 border border-white/5 rounded-2xl">
          <Search className="w-9 h-9 text-white/10 mx-auto mb-2.5" />
          <p className="text-xs text-white/30 font-semibold">لا توجد نتائج مطابقة للفلاتر الحالية</p>
        </div>
      ) : (
        <>
          <div className="block md:hidden space-y-3">
            {filteredPlayers.map((player, i) => (
              <div
                key={player.id}
                className="glass-card rounded-xl p-4 flex flex-col gap-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PlayerAvatar player={player} />
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-white block truncate">{player.name}</span>
                      <span className="text-[10px] text-white/40 block truncate">{player.team?.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="min-w-7 h-7 px-2 rounded-full bg-[#C9971A]/10 border border-[#C9971A]/20 text-[#F0C040] text-xs font-black flex items-center justify-center">
                      {player.jerseyNumber ?? '-'}
                    </span>
                    <PositionBadge position={player.position} />
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-white/30 font-semibold">
                    {player._count?.goals ?? 0} هدف · {player._count?.cards ?? 0} بطاقة
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(player)}
                      className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      type="button"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(player.id)}
                      className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-right whitespace-nowrap">اللاعب</th>
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-right whitespace-nowrap">الفريق</th>
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-center whitespace-nowrap">الرقم</th>
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-right whitespace-nowrap">المركز</th>
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-center whitespace-nowrap">السجل</th>
                    <th className="px-3 py-3 sm:px-5 sm:py-3.5 text-[11px] font-bold text-white/35 text-center whitespace-nowrap">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {filteredPlayers.map((player) => {
                    const isArchivedTeam = !!player.team?.archivedAt;
                    return (
                      <tr
                        key={player.id}
                        className={`hover:bg-white/3 transition-colors ${isArchivedTeam ? 'opacity-50 bg-white/1' : ''}`}
                      >
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar player={player} />
                            <span className="text-sm font-bold text-white whitespace-nowrap">{player.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <span className="text-xs text-white/45 whitespace-nowrap">{player.team?.name ?? '-'}</span>
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5 text-center">
                          <span className="text-xs font-black text-white whitespace-nowrap">{player.jerseyNumber ?? '-'}</span>
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <PositionBadge position={player.position} />
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5 text-center">
                          <span className="text-[10px] text-white/35 font-bold whitespace-nowrap">
                            {player._count?.goals ?? 0} هدف · {player._count?.cards ?? 0} بطاقة
                          </span>
                        </td>
                        <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => onEdit(player)}
                              className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              type="button"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDelete(player.id)}
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

// ─── Matches Tab ──────────────────────────────────────────────────────────────
import LiveMatchControl from './LiveMatchControl';

interface MatchesTabProps {
  matches: any[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (match: any) => void;
  onDelete: (id: string) => void;
  players: any[];
  fetchMatches: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  activeSubTab: 'schedule' | 'live';
  setActiveSubTab: (tab: 'schedule' | 'live') => void;
}

function MatchesTab({
  matches,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  players,
  fetchMatches,
  showToast,
  activeSubTab,
  setActiveSubTab,
}: MatchesTabProps) {
  return (
    <div className="space-y-6">
      {/* التبويبات الفرعية الفاخرة */}
      <div className="flex items-center gap-2 p-1 bg-white/3 border border-white/5 rounded-xl max-w-xs" dir="rtl">
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            activeSubTab === 'schedule'
              ? 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/20'
              : 'text-white/45 hover:text-white hover:bg-white/5'
          }`}
        >
          جدولة المباريات
        </button>
        <button
          onClick={() => setActiveSubTab('live')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            activeSubTab === 'live'
              ? 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/20'
              : 'text-white/45 hover:text-white hover:bg-white/5'
          }`}
        >
          إدارة مباشرة
        </button>
      </div>

      {activeSubTab === 'schedule' ? (
        <div className="space-y-4 animate-fade-in-up">
          <SectionHeader
            title="جدولة المباريات"
            subtitle="جدولة المباريات وتحديد الملاعب والتواريخ للبطولة"
            onAdd={onAdd}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#F0C040] animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 border-dashed border-white/10 text-center">
              <Swords className="w-10 h-10 text-white/15 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white/30">لا توجد مباريات مجدولة حالياً.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden text-right" dir="rtl">
              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full border-collapse text-right">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2 text-[10px] sm:text-xs font-black text-white/40">
                      <th className="px-6 py-4">البطولة</th>
                      <th className="px-6 py-4">المرحلة / المجموعة</th>
                      <th className="px-6 py-4 text-center">المباراة</th>
                      <th className="px-6 py-4">التاريخ والوقت</th>
                      <th className="px-6 py-4">الملعب</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 text-xs font-semibold text-white/80">
                    {matches.map((m) => {
                      const matchDateStr = m.matchDate
                        ? new Date(m.matchDate).toLocaleString('ar-SA', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '-';
                      return (
                        <tr key={m.id} className="hover:bg-white/1 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#F0C040] truncate max-w-[120px]">
                            {m.tournament?.name}
                          </td>
                          <td className="px-6 py-4">
                            {m.stage === 'group' ? `دور المجموعات` : `خروج المغلوب`}
                            {m.groupName && ` (المجموعة ${m.groupName})`}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <span className="font-bold">{m.homeTeam?.name}</span>
                              <span className="bg-white/4 px-2 py-0.5 rounded text-[10px] text-white/60">ضد</span>
                              <span className="font-bold">{m.awayTeam?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-white/65">{matchDateStr}</td>
                          <td className="px-6 py-4 text-white/65">{m.venue || '-'}</td>
                          <td className="px-6 py-4">
                            {m.status === 'live' ? (
                              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded animate-pulse">مباشر</span>
                            ) : m.status === 'finished' ? (
                              <span className="text-[10px] font-black text-white/45 bg-white/10 px-2 py-0.5 rounded">منتهية</span>
                            ) : (
                              <span className="text-[10px] font-black text-[#F0C040] bg-[#C9971A]/10 px-2 py-0.5 rounded">مجدولة</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onEdit(m)}
                                className="p-1.5 text-white/30 hover:text-[#F0C040] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                title="تعديل الإعدادات"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDelete(m.id)}
                                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                title="حذف المباراة"
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
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up">
          <LiveMatchControl
            matches={matches}
            players={players}
            fetchMatches={fetchMatches}
            showToast={showToast}
          />
        </div>
      )}
    </div>
  );
}

// VotingTab is now imported from its own file

export default function AdminClient({ username }: { username: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // --- حالات اللاعبين وقاعدة البيانات ---
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [includeArchivedPlayerTeams, setIncludeArchivedPlayerTeams] = useState(false);

  // حالات نافذة التحكم باللاعبين
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayer | null>(null);

  // --- حالات المباريات وقاعدة البيانات ---
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [activeMatchTab, setActiveMatchTab] = useState<'schedule' | 'live'>('schedule');

  // حالات نافذة التحكم بالمباريات
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  // --- حالات جولات التصويت وقاعدة البيانات ---
  const [votingRounds, setVotingRounds] = useState<any[]>([]);
  const [votingRoundsLoading, setVotingRoundsLoading] = useState(true);
  const [activeVotingSubTab, setActiveVotingSubTab] = useState<'current' | 'nominate' | 'results' | 'archive'>('current');

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

  // جلب اللاعبين من السيرفر
  const fetchPlayers = async () => {
    try {
      setPlayersLoading(true);
      const data = await getPlayers(includeArchivedPlayerTeams);
      setPlayers(data);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل قائمة اللاعبين', 'error');
    } finally {
      setPlayersLoading(false);
    }
  };

  // جلب المباريات من السيرفر
  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      const data = await getMatches();
      setMatches(data);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل قائمة المباريات', 'error');
    } finally {
      setMatchesLoading(false);
    }
  };

  // جلب جولات التصويت من السيرفر
  const fetchVotingRounds = async () => {
    try {
      setVotingRoundsLoading(true);
      const data = await getVotingRounds();
      setVotingRounds(data);
    } catch (err) {
      console.error(err);
      showToast('فشل تحميل قائمة جولات التصويت', 'error');
    } finally {
      setVotingRoundsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchMatches();
    fetchVotingRounds();
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [showArchived]);

  useEffect(() => {
    fetchPlayers();
  }, [includeArchivedPlayerTeams]);

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

  // إضافة وتعديل لاعب
  const handleAddPlayer = () => {
    setSelectedPlayer(null);
    setIsPlayerModalOpen(true);
  };

  const handleEditPlayer = (player: AdminPlayer) => {
    setSelectedPlayer(player);
    setIsPlayerModalOpen(true);
  };

  // حذف لاعب
  const handleDeletePlayer = (id: string) => {
    triggerConfirm({
      title: 'حذف اللاعب',
      message: 'هل أنت متأكد من رغبتك في حذف هذا اللاعب؟ لا يمكن حذف اللاعبين الذين لديهم أهداف أو بطاقات مسجلة.',
      confirmText: 'حذف اللاعب',
      cancelText: 'تراجع',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await deletePlayer(id);
          if (res.success) {
            showToast('تم حذف اللاعب بنجاح');
            fetchPlayers();
          } else {
            showToast(res.error || 'فشل حذف اللاعب', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ غير متوقع', 'error');
        }
      },
    });
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
    overview:    <OverviewTab tournamentsCount={tournaments.length} teamsCount={teams.length} playersCount={players.length} />,
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
    players: (
      <PlayersTab
        players={players}
        teams={teams}
        loading={playersLoading}
        includeArchivedTeams={includeArchivedPlayerTeams}
        setIncludeArchivedTeams={setIncludeArchivedPlayerTeams}
        onAdd={handleAddPlayer}
        onEdit={handleEditPlayer}
        onDelete={handleDeletePlayer}
      />
    ),
    matches: (
      <MatchesTab
        matches={matches}
        isLoading={matchesLoading}
        onAdd={() => {
          setSelectedMatch(null);
          setIsMatchModalOpen(true);
        }}
        onEdit={(match) => {
          setSelectedMatch(match);
          setIsMatchModalOpen(true);
        }}
        onDelete={(id) => {
          triggerConfirm({
            title: 'حذف المباراة',
            message: 'هل أنت متأكد من رغبتك في إلغاء وحذف هذه المباراة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه ويحذف سجلات الأهداف المرتبطة.',
            confirmText: 'حذف نهائي',
            cancelText: 'تراجع',
            variant: 'danger',
            onConfirm: async () => {
              try {
                const res = await deleteMatch(id);
                if (res.success) {
                  showToast('تم حذف المباراة بنجاح');
                  fetchMatches();
                } else {
                  showToast(res.error || 'فشل حذف المباراة', 'error');
                }
              } catch (err) {
                showToast('حدث خطأ غير متوقع', 'error');
              }
            },
          });
        }}
        players={players}
        fetchMatches={fetchMatches}
        showToast={showToast}
        activeSubTab={activeMatchTab}
        setActiveSubTab={setActiveMatchTab}
      />
    ),
    voting: (
      <VotingTab
        votingRounds={votingRounds}
        isLoading={votingRoundsLoading}
        fetchVotingRounds={fetchVotingRounds}
        tournaments={tournaments}
        showToast={showToast}
        activeSubTab={activeVotingSubTab}
        setActiveSubTab={setActiveVotingSubTab}
      />
    ),
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
        <button
          onClick={async () => {
            await logout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 cursor-pointer"
        >
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
          fetchPlayers();
        }}
        team={selectedTeam}
        tournaments={tournaments}
      />

      {/* المودال الخاص باللاعبين */}
      {isPlayerModalOpen && (
        <PlayerModal
          key={selectedPlayer?.id ?? 'new-player'}
          isOpen={isPlayerModalOpen}
          onClose={() => setIsPlayerModalOpen(false)}
          onSuccess={() => {
            showToast(selectedPlayer ? 'تم تحديث اللاعب بنجاح!' : 'تم إنشاء اللاعب بنجاح!');
            fetchPlayers();
          }}
          player={selectedPlayer}
          teams={teams}
        />
      )}

      {/* المودال الخاص بالمباريات */}
      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        onSuccess={() => {
          showToast(selectedMatch ? 'تم تحديث بيانات المباراة!' : 'تم جدولة المباراة بنجاح!');
          fetchMatches();
        }}
        match={selectedMatch}
        tournaments={tournaments}
        teams={teams}
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
