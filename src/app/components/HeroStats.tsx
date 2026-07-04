'use client';

import React, { useEffect, useState } from 'react';
import { Target, Users, Activity } from 'lucide-react';

interface StatItemProps {
  value: number;
  duration?: number;
}

function AnimatedNumber({ value, duration = 1500 }: StatItemProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      setCurrent(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrent(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span className="text-xl md:text-2xl font-black text-[#F0C040] font-outfit score-number leading-none">{current}</span>;
}

export default function HeroStats({
  goals = 48,
  teams = 12,
  matches = 32,
}: {
  goals?: number;
  teams?: number;
  matches?: number;
}) {
  return (
    <div className="relative z-10 grid grid-cols-3 gap-2 w-full max-w-[350px] mt-6 md:mt-8 md:flex md:w-auto md:max-w-none md:items-center md:gap-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.035] px-2 py-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
        <AnimatedNumber value={goals} />
        <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-white/55 font-semibold whitespace-nowrap">
          <Target className="w-3 h-3" />
          هدف مسجل
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.035] px-2 py-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
        <AnimatedNumber value={teams} />
        <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-white/55 font-semibold whitespace-nowrap">
          <Users className="w-3 h-3" />
          فريق منافس
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.035] px-2 py-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
        <AnimatedNumber value={matches} />
        <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-white/55 font-semibold whitespace-nowrap">
          <Activity className="w-3 h-3" />
          مباراة
        </span>
      </div>
    </div>
  );
}
