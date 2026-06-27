'use client';

import React, { useEffect, useState } from 'react';

export default function HeroStats({
  goals = 48,
  teams = 12,
  matches = 32,
}: {
  goals?: number;
  teams?: number;
  matches?: number;
}) {
  const [currentGoals, setCurrentGoals] = useState(0);
  const [currentTeams, setCurrentTeams] = useState(0);
  const [currentMatches, setCurrentMatches] = useState(0);

  useEffect(() => {
    const duration = 1500; // Animation duration in milliseconds
    const frameRate = 1000 / 60; // 60 FPS
    const totalFrames = Math.round(duration / frameRate);
    
    let frame = 0;
    
    const animate = () => {
      frame++;
      // Smooth ease-out quad formula
      const progress = 1 - Math.pow(1 - frame / totalFrames, 2);
      
      setCurrentGoals(Math.round(progress * goals));
      setCurrentTeams(Math.round(progress * teams));
      setCurrentMatches(Math.round(progress * matches));
      
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        setCurrentGoals(goals);
        setCurrentTeams(teams);
        setCurrentMatches(matches);
      }
    };
    
    requestAnimationFrame(animate);
  }, [goals, teams, matches]);

  return (
    <div className="flex items-center gap-4 sm:gap-8 text-sm sm:text-lg text-gray-300 font-semibold font-outfit animate-fade-in-up animate-delay-100 opacity-0" style={{ animationFillMode: 'forwards' }}>
      <span className="flex items-center gap-2">
        <span className="text-[#E2B659] font-black text-lg sm:text-2xl">{currentGoals}</span> أهداف مسجلة
      </span>
      <span className="w-2 h-2 rounded-full bg-white/20" />
      <span className="flex items-center gap-2">
        <span className="text-[#E2B659] font-black text-lg sm:text-2xl">{currentTeams}</span> فرق منافسة
      </span>
      <span className="w-2 h-2 rounded-full bg-white/20" />
      <span className="flex items-center gap-2">
        <span className="text-[#E2B659] font-black text-lg sm:text-2xl">{currentMatches}</span> مباراة ملعوبة
      </span>
    </div>
  );
}
