'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useFingerprint } from '../hooks/use-fingerprint';
import { submitVote, checkUserVote } from '../actions';
import VideoPlayer from './VideoPlayer';
import Turnstile from './Turnstile';

interface Goal {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  type: string;
  minute: number;
  videoUrl: string | null;
  isNominated: boolean;
  createdAt: Date;
  player: {
    id: string;
    name: string;
    jerseyNumber: number | null;
  };
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  match: {
    id: string;
    matchDate: Date;
    homeTeam: { name: string };
    awayTeam: { name: string };
  };
  votes: { id: string }[];
}

interface GoalGalleryProps {
  initialGoals: Goal[];
  tournamentId: string;
}

export default function GoalGallery({ initialGoals, tournamentId }: GoalGalleryProps) {
  const fingerprint = useFingerprint();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [votedGoalId, setVotedGoalId] = useState<string | null>(null);
  const [checkingVote, setCheckingVote] = useState<boolean>(true);
  const [votingFor, setVotingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // ─── 1. التحقق من حالة تصويت الجهاز عند تحميل البصمة ──────────────────────────
  useEffect(() => {
    if (!fingerprint) return;

    async function fetchUserVote() {
      try {
        // التحقق من السيرفر لمعرفة ما إذا كان الجهاز قد صوّت بالفعل
        const votedId = await checkUserVote(fingerprint!, tournamentId);
        setVotedGoalId(votedId);
      } catch (err) {
        console.error('Error checking vote:', err);
      } finally {
        setCheckingVote(false);
      }
    }

    fetchUserVote();
  }, [fingerprint, tournamentId]);

  // ─── 2. حساب إحصائيات ونسب التصويت الحالية ────────────────────────────────────
  const calculateStats = () => {
    const totalVotes = goals.reduce((sum, g) => sum + g.votes.length, 0);
    
    return goals.map((g) => {
      const count = g.votes.length;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        goalId: g.id,
        count,
        percentage,
      };
    });
  };

  const stats = calculateStats();
  const totalVotesCount = goals.reduce((sum, g) => sum + g.votes.length, 0);

  // ─── 3. معالجة الضغط على زر التصويت ──────────────────────────────────────────
  const handleVote = async (goalId: string) => {
    if (!fingerprint) {
      setError('جاري تهيئة البصمة الرقمية لجهازك، يرجى المحاولة بعد قليل');
      return;
    }
    if (!turnstileToken) {
      setError('يرجى إكمال التحقق البشري أولاً قبل التصويت');
      return;
    }
    if (votedGoalId) return;

    setError(null);
    setVotingFor(goalId);

    const formData = new FormData();
    formData.append('goalId', goalId);
    formData.append('fingerprint', fingerprint);
    formData.append('token', turnstileToken);

    startTransition(async () => {
      const res = await submitVote(formData);

      if (res?.error) {
        setError(res.error);
        setVotingFor(null);
      } else {
        // تحديث الحالة محلياً فوراً لتحديث النسب والعدادات أمام عين المستخدم
        setGoals((prevGoals) =>
          prevGoals.map((g) => {
            if (g.id === goalId) {
              return {
                ...g,
                votes: [...g.votes, { id: `temp_${Date.now()}` }],
              };
            }
            return g;
          })
        );
        setVotedGoalId(goalId);
        setVotingFor(null);
      }
    });
  };

  // ─── 4. حالة التحميل الأولية ──────────────────────────────────────────────────
  if (checkingVote) {
    return (
      <div className="vote-loading-wrapper">
        <div className="vote-spinner" />
        <p className="vote-loading-text font-el-messiri">جاري تحميل معرض الأهداف والتحقق من جهازك...</p>
      </div>
    );
  }

  return (
    <div className="goal-gallery-wrapper">
      {/* رسالة الخطأ إن وجدت */}
      {error && (
        <div className="vote-error-alert" role="alert">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* شريط الإحصائيات الإجمالي */}
      {votedGoalId && (
        <div className="global-stats-banner">
          <span className="stats-banner-icon">🎉</span>
          <p className="stats-banner-text font-el-messiri">
            شكراً لمشاركتك! تم تسجيل <strong>{totalVotesCount.toLocaleString('ar-EG')}</strong> صوتاً في هذه الجولة حتى الآن.
          </p>
        </div>
      )}

      {/* أداة التحقق من الهوية البشرية - تظهر فقط قبل التصويت */}
      {!votedGoalId && (
        <div className="turnstile-container font-el-messiri my-4 text-center p-4 rounded-xl bg-gray-900/40 border border-gray-800 max-w-sm mx-auto">
          <p className="text-sm text-gray-300 mb-3">الرجاء إكمال التحقق البشري لتفعيل أزرار التصويت:</p>
          <Turnstile
            onVerify={(token) => {
              setTurnstileToken(token);
              setError(null);
            }}
            onExpire={() => setTurnstileToken(null)}
            onError={() => {
              setTurnstileToken(null);
              setError('فشل تحميل أداة التحقق من الهوية البشرية، يرجى إعادة تحميل الصفحة');
            }}
          />
        </div>
      )}

      {/* شبكة الأهداف المرشحة */}
      <div className="goals-grid">
        {goals.map((goal) => {
          const goalStat = stats.find((s) => s.goalId === goal.id);
          const isVotedForThis = votedGoalId === goal.id;
          const showStats = votedGoalId !== null;

          return (
            <article
              key={goal.id}
              className={`goal-card ${isVotedForThis ? 'voted-highlight' : ''} ${showStats ? 'results-view' : ''}`}
            >
              {/* مشغل الفيديو الذكي */}
              <div className="goal-card-video">
                <VideoPlayer url={goal.videoUrl ?? ''} />
              </div>

              {/* تفاصيل الهدف وصاحبه */}
              <div className="goal-card-content">
                <div className="goal-card-header">
                  <div className="player-info-block">
                    <div className="player-avatar-mini">
                      {goal.player.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="goal-player-name font-el-messiri">{goal.player.name}</h3>
                      <div className="goal-team-info">
                        {goal.team.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={goal.team.logoUrl} alt="" className="goal-team-logo" />
                        )}
                        <span className="goal-team-name">{goal.team.name}</span>
                        {goal.player.jerseyNumber !== null && (
                          <span className="goal-player-jersey">#{goal.player.jerseyNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="goal-minute-badge">د {goal.minute}</span>
                </div>

                {/* تفاصيل المباراة */}
                <div className="goal-match-details">
                  <span className="match-teams">
                    ⚽ {goal.match.homeTeam.name} ضد {goal.match.awayTeam.name}
                  </span>
                  <span className="match-date-sep">|</span>
                  <span className="match-date-lbl">
                    {new Intl.DateTimeFormat('ar-SA', { month: 'short', day: 'numeric' }).format(new Date(goal.match.matchDate))}
                  </span>
                </div>

                {/* جزء التفاعل والتصويت */}
                <div className="goal-card-footer">
                  {!showStats ? (
                    <button
                      onClick={() => handleVote(goal.id)}
                      disabled={votingFor !== null || isPending || !turnstileToken}
                      className={`btn-vote-submit font-el-messiri ${votingFor === goal.id ? 'btn-loading' : ''} ${!turnstileToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {votingFor === goal.id ? (
                        <>
                          <span className="button-spinner" />
                          جاري تسجيل صوتك...
                        </>
                      ) : (
                        <>
                          <span>🗳️</span> صوّت لهذا الهدف
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="vote-results-block">
                      <div className="results-label-row">
                        <span className="results-percentage font-el-messiri">
                          {goalStat?.percentage ?? 0}%
                        </span>
                        {isVotedForThis ? (
                          <span className="my-vote-badge font-el-messiri">صوتك 👑</span>
                        ) : (
                          <span className="votes-count-txt">
                            {(goalStat?.count ?? 0).toLocaleString('ar-EG')} صوت
                          </span>
                        )}
                      </div>
                      
                      {/* شريط التقدم للنسبة */}
                      <div className="vote-progress-bg">
                        <div
                          className={`vote-progress-fill ${isVotedForThis ? 'my-vote-fill' : ''}`}
                          style={{ width: `${goalStat?.percentage ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
