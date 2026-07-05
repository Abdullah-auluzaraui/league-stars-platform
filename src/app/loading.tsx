import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';

export default function HomeLoading() {
  return (
    <div className="w-full space-y-8 md:space-y-12">
      {/* ══ SECTION 1: HERO SKELETON ═══════════════════════════ */}
      <section className="relative flex flex-col items-center text-center pt-2 sm:pt-12 md:pt-16 pb-4 md:pb-6">
        
        {/* Tournament badge placeholder */}
        <div className="relative mb-5 md:mb-10 z-10 animate-pulse">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/5 bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="w-24 h-3 bg-white/10 rounded" />
          </div>
        </div>

        {/* Trophy Logo with pulse effect */}
        <div className="relative z-10 mb-5 md:mb-8 w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 mx-auto animate-pulse">
          <div className="relative w-full h-full opacity-40">
            <Image
              src="/شعار البطولة.png"
              alt="شعار بطولة نجوم الدوري"
              fill
              sizes="(max-width:640px) 160px, (max-width:768px) 192px, 224px"
              className="object-contain filter grayscale"
              priority
            />
          </div>
        </div>

        {/* Title placeholder */}
        <div className="h-9 sm:h-12 w-64 sm:w-96 bg-white/5 rounded-2xl mb-3 md:mb-4 animate-pulse" />

        {/* Subtitle placeholder */}
        <div className="h-4 sm:h-5 w-48 sm:w-80 bg-white/5 rounded-lg mb-6 animate-pulse" />

        {/* Quick stats placeholder */}
        <div className="relative z-10 grid grid-cols-3 gap-2 w-full max-w-[350px] mt-6 md:mt-8 md:flex md:w-auto md:max-w-none md:items-center md:gap-8 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 md:border-0 md:bg-transparent md:p-0 min-w-[80px]">
              <div className="h-6 w-8 bg-white/10 rounded" />
              <div className="h-3 w-12 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* ══ SECTION 2: CONTENT (Two-Column Layout) ═══════════════════════════ */}
      <div className="max-w-5xl mx-auto md:grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] md:gap-8 md:items-start">
        
        {/* ─── MAIN COLUMN (Matches & Votes) ───────────────────────────────── */}
        <div className="max-w-2xl mx-auto md:max-w-none space-y-6 sm:space-y-10 pb-6 w-full">
          
          {/* Matches Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-4 px-0.5 animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-5 bg-white/15 rounded-full" />
                <div className="h-5 w-24 bg-white/10 rounded" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3.5 w-16 bg-white/5 rounded" />
                <ChevronLeft className="w-3.5 h-3.5 text-white/20" />
              </div>
            </div>

            {/* Match cards skeletons */}
            <div className="space-y-3">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="glass-card rounded-2xl p-4 md:p-5 animate-pulse flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-28 bg-white/5 rounded" />
                    <div className="h-5 w-12 bg-white/10 rounded-full" />
                  </div>
                  {/* Card Content VS */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/5" />
                      <div className="h-3.5 w-16 bg-white/5 rounded" />
                    </div>
                    {/* VS / Score */}
                    <div className="flex flex-col items-center justify-center shrink-0 min-w-[70px]">
                      <div className="h-6 w-12 bg-white/10 rounded" />
                      <div className="h-2.5 w-6 bg-white/5 rounded mt-2" />
                    </div>
                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/5" />
                      <div className="h-3.5 w-16 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Vote Section Placeholder */}
          <section className="animate-pulse">
            <div className="flex items-center gap-2.5 mb-4 px-0.5">
              <span className="w-1.5 h-5 bg-white/15 rounded-full" />
              <div className="h-5 w-32 bg-white/10 rounded" />
            </div>
            <div className="glass-card-gold rounded-2xl p-4 md:p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 bg-white/10 rounded" />
                  <div className="h-4.5 w-40 bg-white/10 rounded" />
                  <div className="h-3 w-28 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-11 w-full bg-white/10 rounded-xl" />
            </div>
          </section>
        </div>

        {/* ─── SIDEBAR (Desktop Only: Scorers) ─────────────────────────────── */}
        <aside className="hidden md:flex flex-col gap-6 sticky top-28 pb-6 w-full animate-pulse">
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-4 px-0.5">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-5 bg-white/15 rounded-full" />
                <div className="h-5 w-24 bg-white/10 rounded" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3.5 w-8 bg-white/5 rounded" />
                <ChevronLeft className="w-3.5 h-3.5 text-white/20" />
              </div>
            </div>

            {/* Podium Skeleton */}
            <div className="glass-card rounded-2xl p-4 md:p-5 mb-3 flex items-end justify-center gap-3 h-[150px] md:h-[170px]">
              {/* 2nd */}
              <div className="flex flex-col items-center flex-1 max-w-[84px]">
                <div className="w-8 h-8 rounded-xl bg-white/5 mb-2" />
                <div className="h-2.5 w-10 bg-white/5 rounded mb-2" />
                <div className="w-full bg-white/5 rounded-t-xl h-[45px]" />
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center flex-1 max-w-[94px]">
                <div className="w-10 h-10 rounded-2xl bg-white/10 mb-2" />
                <div className="h-2.5 w-12 bg-white/5 rounded mb-2" />
                <div className="w-full bg-white/10 rounded-t-xl h-[65px]" />
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center flex-1 max-w-[84px]">
                <div className="w-8 h-8 rounded-xl bg-white/5 mb-2" />
                <div className="h-2.5 w-10 bg-white/5 rounded mb-2" />
                <div className="w-full bg-white/5 rounded-t-xl h-[35px]" />
              </div>
            </div>

            {/* List items skeleton */}
            <div className="glass-card rounded-2xl p-2 space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-4 h-4 bg-white/5 rounded shrink-0" />
                  <div className="w-8 h-8 bg-white/5 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-20 bg-white/10 rounded" />
                    <div className="h-2.5 w-14 bg-white/5 rounded" />
                  </div>
                  <div className="w-8 h-5 bg-white/5 rounded shrink-0" />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* ══ SECTION 3: SPONSORS (Full-Width, Bottom) ═════════════════════════ */}
      <div className="max-w-5xl mx-auto pt-2 md:pt-4 pb-20 md:pb-10 animate-pulse">
        <div className="w-full h-10 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}
