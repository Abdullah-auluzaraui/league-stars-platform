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

  return <span className="text-2xl font-black text-[#F0C040] font-outfit score-number leading-none">{current}</span>;
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
    <div className="relative z-10 flex items-center gap-8 mt-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
      <div className="flex flex-col items-center gap-1">
        <AnimatedNumber value={goals} />
        <span className="flex items-center gap-1 text-[10px] text-white/35 font-semibold">
          <Target className="w-2.5 h-2.5" />
          هدف مسجل
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <AnimatedNumber value={teams} />
        <span className="flex items-center gap-1 text-[10px] text-white/35 font-semibold">
          <Users className="w-2.5 h-2.5" />
          فريق منافس
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <AnimatedNumber value={matches} />
        <span className="flex items-center gap-1 text-[10px] text-white/35 font-semibold">
          <Activity className="w-2.5 h-2.5" />
          مباراة
        </span>
      </div>
    </div>
  );
}
