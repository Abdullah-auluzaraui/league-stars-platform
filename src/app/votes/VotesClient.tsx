"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Trophy,
  Star,
  Play,
  CheckCircle,
  Clock,
  Flame,
  Lock,
  Award,
  ThumbsUp,
  Zap,
  Eye,
} from "lucide-react";
import type { VotingPageData, NominatedGoal, ArchivedWinner } from "./page";

// ─── Fingerprint ──────────────────────────────────────────────────────────────

async function generateFingerprint(): Promise<string> {
  const nav = navigator;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency ?? 0,
    (nav as Navigator & { deviceMemory?: number }).deviceMemory ?? 0,
  ].join("|");

  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGoalTypeLabel(type: string) {
  switch (type) {
    case "penalty":
      return "ركلة جزاء";
    case "free_kick":
      return "ركلة حرة";
    case "own_goal":
      return "هدف عكسي";
    default:
      return "هدف عادي";
  }
}

function getGoalTypeColor(type: string) {
  switch (type) {
    case "penalty":
      return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#fc8181" };
    case "free_kick":
      return { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#93c5fd" };
    case "own_goal":
      return { bg: "rgba(156,163,175,0.15)", border: "rgba(156,163,175,0.3)", text: "#9ca3af" };
    default:
      return { bg: "rgba(201,151,26,0.12)", border: "rgba(201,151,26,0.3)", text: "#F0C040" };
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Team Avatar ──────────────────────────────────────────────────────────────

function TeamAvatar({ name, logoUrl, size = 40 }: { name: string; logoUrl: string | null; size?: number }) {
  const hasLogo =
    logoUrl &&
    (logoUrl.startsWith("/") || logoUrl.startsWith("http") || logoUrl.includes("."));

  return (
    <div
      className="relative rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {hasLogo ? (
        <Image src={logoUrl!} alt={name} fill sizes={`${size}px`} className="object-contain p-1" />
      ) : (
        <span className="text-[10px] font-black text-white/50">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

// ─── Video Embed ──────────────────────────────────────────────────────────────

function VideoPlayer({ url, goalId }: { url: string | null; goalId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract YouTube ID
  const ytMatch = url?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/
  );
  const ytId = ytMatch?.[1];

  if (!url) {
    return (
      <div
        className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center"
        style={{
          height: "80px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2 text-white/45">
          <Play className="w-4 h-4" />
          <span className="text-xs font-medium">الفيديو غير متاح حالياً</span>
        </div>
      </div>
    );
  }

  if (ytId) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {!isPlaying ? (
          <button
            onClick={() => setIsPlaying(true)}
            className="relative w-full h-full group cursor-pointer block"
            style={{ aspectRatio: "16/9" }}
            aria-label="تشغيل الفيديو"
          >
            <Image
              src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
              alt="صورة مصغرة للفيديو"
              fill
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-cover"
            />
            {/* Overlay */}
            <div
              className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-70"
              style={{ background: "rgba(0,0,0,0.45)" }}
            />
            {/* Play button */}
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  background: "rgba(201,151,26,0.9)",
                  boxShadow: "0 0 32px rgba(201,151,26,0.5)",
                }}
              >
                <Play className="w-6 h-6 text-[#0e0e12] fill-current mr-0.5" />
              </div>
            </div>
          </button>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title={`فيديو الهدف ${goalId}`}
          />
        )}
      </div>
    );
  }

  // Generic video
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <video
        src={url}
        controls
        playsInline
        className="w-full h-full object-cover"
        preload="metadata"
      />
    </div>
  );
}

// ─── Vote Progress Bar ────────────────────────────────────────────────────────

function VoteBar({ percent, color = "#C9971A" }: { percent: number; color?: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div
      ref={ref}
      className="relative h-2 rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <div
        className="absolute inset-y-0 right-0 rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: `linear-gradient(to left, ${color}, ${color}88)`,
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-2 animate-trophy-float"
          style={{
            background: "linear-gradient(135deg, rgba(201,151,26,0.12) 0%, rgba(201,151,26,0.04) 100%)",
            border: "1px solid rgba(201,151,26,0.2)",
            boxShadow: "0 0 60px rgba(201,151,26,0.1)",
          }}
        >
          <Trophy className="w-12 h-12 text-[#C9971A] opacity-80" />
        </div>
        <div className="absolute inset-0 bg-glow-trophy rounded-3xl pointer-events-none" />
      </div>

      <h2 className="text-xl font-black text-white/70 mb-3">
        لم تبدأ المنافسات بعد
      </h2>
      <p className="text-white/50 text-sm max-w-xs leading-relaxed">
        بمجرد انطلاق الجولة الأولى وترشيح أجمل الأهداف، ستتمكن من التصويت
        لأفضل هدف واختيار الفائز
      </p>

      <div
        className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full"
        style={{
          background: "rgba(201,151,26,0.08)",
          border: "1px solid rgba(201,151,26,0.2)",
        }}
      >
        <Clock className="w-4 h-4 text-[#C9971A]/60" />
        <span className="text-xs font-bold text-[#C9971A]/60">
          ترقّب إعلان الترشيحات قريباً
        </span>
      </div>
    </div>
  );
}

// ─── Goal Card (Active Voting) ────────────────────────────────────────────────

type GoalCardProps = {
  goal: NominatedGoal;
  index: number;
  hasVoted: boolean;
  votedGoalId: string | null;
  voteCounts: Record<string, number>;
  totalVotes: number;
  onVote: (goalId: string) => void;
  isVoting: boolean;
};

function GoalCard({
  goal,
  index,
  hasVoted,
  votedGoalId,
  voteCounts,
  totalVotes,
  onVote,
  isVoting,
}: GoalCardProps) {
  const isMyVote = votedGoalId === goal.id;
  const typeStyle = getGoalTypeColor(goal.type);
  const voteCount = voteCounts[goal.id] ?? goal.voteCount;
  const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  const animDelay = index * 150;

  const showResults = hasVoted;

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Card header */}
      <div
        className="px-4 pt-4 pb-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
          style={{
            background: "rgba(201,151,26,0.12)",
            border: "1px solid rgba(201,151,26,0.25)",
            color: "#F0C040",
          }}
        >
          {index + 1}
        </div>

        <TeamAvatar name={goal.teamName} logoUrl={goal.teamLogoUrl} size={36} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate">{goal.playerName}</p>
          <p className="text-xs text-white/40 font-medium">{goal.teamName}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Goal type badge */}
          <div
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: typeStyle.bg,
              border: `1px solid ${typeStyle.border}`,
              color: typeStyle.text,
            }}
          >
            {getGoalTypeLabel(goal.type)}
          </div>
          {/* Minute */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <Clock className="w-2.5 h-2.5" />
            {goal.minute}&apos;
          </div>
        </div>
      </div>

      {/* Video */}
      <div className="px-4 py-3">
        <VideoPlayer url={goal.videoUrl} goalId={goal.id} />
      </div>

      {/* Vote section */}
      <div className="px-4 pb-4 space-y-3">
        {/* 1. Show results/standing after voting */}
        {showResults && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {isMyVote && (
                  <div className="flex items-center gap-1 text-[#F0C040]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">صوتك</span>
                  </div>
                )}
                <span className="text-xs text-white/40 font-medium">
                  {voteCount} {voteCount === 1 ? "صوت" : "أصوات"}
                </span>
              </div>
              <span
                className="text-sm font-black"
                style={{ color: isMyVote ? "#F0C040" : "rgba(255,255,255,0.6)" }}
              >
                {percent}%
              </span>
            </div>
            <VoteBar
              percent={percent}
              color={isMyVote ? "#C9971A" : "rgba(255,255,255,0.3)"}
            />
          </div>
        )}

        {/* 2. Show vote button if user hasn't voted yet */}
        {!hasVoted && (
          <button
            onClick={() => onVote(goal.id)}
            disabled={isVoting}
            className="w-full btn-trophy flex items-center justify-center gap-2 py-3 text-sm font-black rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            style={{ minHeight: 48 }}
          >
            {isVoting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0e0e12]/40 border-t-[#0e0e12] rounded-full animate-spin" />
                <span>جاري التسجيل...</span>
              </>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4" />
                <span>صوّت لهذا الهدف</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Active Voting View ───────────────────────────────────────────────────────

function ActiveVotingView({
  goals,
  roundTitle,
}: {
  goals: NominatedGoal[];
  roundTitle: string;
}) {
  const [hasVoted, setHasVoted] = useState(false);
  const [votedGoalId, setVotedGoalId] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isVoting, setIsVoting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>("");
  const [checked, setChecked] = useState(false);

  // Initialize fingerprint + check localStorage
  useEffect(() => {
    generateFingerprint().then((fp) => {
      setFingerprint(fp);

      // Check if user already voted (stored locally for this roundTitle)
      const stored = localStorage.getItem(`ls_vote_${roundTitle}_${fp}`);
      if (stored) {
        const data = JSON.parse(stored);
        setHasVoted(true);
        setVotedGoalId(data.votingRoundGoalId);
        if (data.voteCounts) setVoteCounts(data.voteCounts);
      }
      setChecked(true);
    });
  }, [roundTitle]);

  const totalVotes = hasVoted
    ? goals.reduce((sum, g) => sum + (voteCounts[g.id] ?? g.voteCount), 0)
    : 0;

  const handleVote = useCallback(
    async (votingRoundGoalId: string) => {
      if (!fingerprint || isVoting || hasVoted) return;
      setIsVoting(true);
      setErrorMsg(null);

      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ votingRoundGoalId, fingerprint }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error === "already_voted" || data.error === "already_voted_session") {
            setErrorMsg("لقد سبق وسجّلت صوتك في هذه الجولة");
            setHasVoted(true);
            setVotedGoalId(votingRoundGoalId);
          } else {
            setErrorMsg("حدث خطأ، حاول مرة أخرى");
          }
          return;
        }

        setHasVoted(true);
        setVotedGoalId(votingRoundGoalId);
        setVoteCounts(data.voteCounts ?? {});

        // Persist to localStorage
        localStorage.setItem(
          `ls_vote_${roundTitle}_${fingerprint}`,
          JSON.stringify({ votingRoundGoalId, voteCounts: data.voteCounts ?? {} })
        );
      } catch {
        setErrorMsg("تعذّر الاتصال بالخادم، حاول مرة أخرى");
      } finally {
        setIsVoting(false);
      }
    },
    [fingerprint, isVoting, hasVoted, roundTitle]
  );

  if (!checked) {
    return (
      <div className="space-y-4">
        {goals.map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-2xl animate-pulse"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {!hasVoted ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in-up"
          style={{
            background: "rgba(201,151,26,0.08)",
            border: "1px solid rgba(201,151,26,0.2)",
          }}
        >
          <div className="live-dot flex-shrink-0" style={{ background: "#C9971A", boxShadow: "0 0 6px rgba(201,151,26,0.8)" }} />
          <div>
            <p className="text-xs font-black text-[#F0C040]">التصويت مفتوح الآن</p>
            <p className="text-[11px] text-white/55 font-medium">
              صوت واحد فقط — النتائج تظهر بعد تسجيل صوتك
            </p>
          </div>
          <Lock className="w-4 h-4 text-white/40 mr-auto flex-shrink-0" />
        </div>
      ) : (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in-up"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-black text-emerald-400">تم تسجيل صوتك!</p>
            <p className="text-[11px] text-white/55 font-medium">
              شكراً لمشاركتك — إجمالي الأصوات: {totalVotes}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-bold text-red-400 animate-fade-in-up"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Goal cards */}
      {goals.map((goal, i) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          index={i}
          hasVoted={hasVoted}
          votedGoalId={votedGoalId}
          voteCounts={voteCounts}
          totalVotes={totalVotes}
          onVote={handleVote}
          isVoting={isVoting}
        />
      ))}
    </div>
  );
}

// ─── Archive Winner Card ──────────────────────────────────────────────────────

function WinnerCard({ winner, index }: { winner: ArchivedWinner; index: number }) {
  const isFirst = index === 0;
  const delay = index * 120;

  return (
    <div
      className={`${isFirst ? "glass-card-gold" : "glass-card"} rounded-2xl overflow-hidden animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Trophy banner for first */}
      {isFirst && (
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{
            background: "linear-gradient(to right, rgba(201,151,26,0.18), rgba(201,151,26,0.06))",
            borderBottom: "1px solid rgba(201,151,26,0.2)",
          }}
        >
          <Trophy className="w-3.5 h-3.5 text-[#F0C040]" />
          <span className="text-xs font-black text-[#F0C040]">أحدث هدف فائز</span>
        </div>
      )}

      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Round badge */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-black"
          style={{
            background: isFirst
              ? "linear-gradient(135deg, rgba(201,151,26,0.25) 0%, rgba(201,151,26,0.1) 100%)"
              : "rgba(255,255,255,0.04)",
            border: isFirst
              ? "1px solid rgba(201,151,26,0.4)"
              : "1px solid rgba(255,255,255,0.07)",
            color: isFirst ? "#F0C040" : "rgba(255,255,255,0.4)",
          }}
        >
          #{index + 1}
        </div>

        <TeamAvatar name={winner.teamName} logoUrl={winner.teamLogoUrl} size={36} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-black text-white truncate">{winner.playerName}</p>
            {isFirst && <Star className="w-3 h-3 text-[#F0C040] flex-shrink-0 fill-current" />}
          </div>
          <p className="text-xs text-white/40 font-medium">{winner.teamName}</p>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[11px] font-black text-white/50">{winner.roundLabel}</span>
          <div className="flex items-center gap-1 text-[11px] text-white/55 font-medium">
            <Eye className="w-3 h-3" />
            {winner.totalVotes} صوت
          </div>
        </div>
      </div>

      {/* Video */}
      <div className="px-4 py-3">
        <VideoPlayer url={winner.videoUrl} goalId={winner.id} />
      </div>

      {/* Winner stats footer */}
      <div
        className="px-4 pb-4 flex items-center gap-3"
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: isFirst ? "rgba(201,151,26,0.12)" : "rgba(255,255,255,0.04)",
            border: isFirst ? "1px solid rgba(201,151,26,0.25)" : "1px solid rgba(255,255,255,0.06)",
            color: isFirst ? "#F0C040" : "rgba(255,255,255,0.35)",
          }}
        >
          <Award className="w-3 h-3" />
          هدف الجولة الفائز
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mr-auto"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <ThumbsUp className="w-3 h-3" />
          {winner.totalVotes} أصوات
        </div>
      </div>
    </div>
  );
}

// ─── Archive View ─────────────────────────────────────────────────────────────

function ArchiveView({ winners }: { winners: ArchivedWinner[] }) {
  return (
    <div className="space-y-5">
      {/* Archive header */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in-up"
        style={{
          background: "rgba(201,151,26,0.06)",
          border: "1px solid rgba(201,151,26,0.15)",
        }}
      >
        <Flame className="w-4 h-4 text-[#C9971A] flex-shrink-0" />
        <div>
          <p className="text-xs font-black text-[#F0C040]">معرض أهداف البطولة</p>
          <p className="text-[11px] text-white/55 font-medium">
            {winners.length} هدف فائز مسجّل في سجل المنافسة
          </p>
        </div>
        <Zap className="w-4 h-4 text-white/40 mr-auto flex-shrink-0" />
      </div>

      {winners.map((winner, i) => (
        <WinnerCard key={winner.id} winner={winner} index={i} />
      ))}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function VotesClient({ data }: { data: VotingPageData }) {
  if (data.state === "empty") {
    return <EmptyState />;
  }

  if (data.state === "active") {
    return (
      <ActiveVotingView
        goals={data.goals}
        roundTitle={data.roundTitle}
      />
    );
  }

  return <ArchiveView winners={data.winners} />;
}
