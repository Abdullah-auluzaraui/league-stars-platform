export default function MatchesLoading() {
  return (
    <div className="max-w-2xl mx-auto pb-20 md:max-w-none md:w-full md:pb-0">
      
      {/* Header section skeleton */}
      <div className="mb-5 md:mb-10 animate-fade-in-up md:flex md:items-end md:justify-between md:gap-8 animate-pulse">
        <div>
          <div className="flex items-center gap-2.5 md:gap-3 mb-1.5 md:mb-2">
            <span className="w-1.5 h-5 md:h-7 bg-white/15 rounded-full" />
            <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white/20 tracking-tight">
              المباريات والنتائج
            </h1>
          </div>
          <p className="text-white/35 text-xs sm:text-sm md:text-base font-medium pr-5 md:pr-6 md:max-w-2xl leading-5">
            متابعة حية للمباريات مع تفاصيل الأهداف والبطاقات
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs font-black text-white/25">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span>تجربة متابعة مباشرة</span>
        </div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/[0.04] pb-3 overflow-x-auto animate-pulse">
        {['الكل', 'مباشر', 'قادمة', 'منتهية'].map((tab, idx) => (
          <div
            key={idx}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-white/5 h-8 w-16`}
          />
        ))}
      </div>

      {/* Match Cards list skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {/* Card 1: Live match skeleton */}
        <div className="glass-card-burgundy rounded-2xl p-4 md:p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-24 bg-white/5 rounded" />
            <span className="h-5 w-16 bg-white/15 rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-6 bg-white/10 rounded" />
              <div className="h-0.5 w-2 bg-white/5" />
              <div className="h-8 w-6 bg-white/10 rounded" />
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming match skeleton */}
        <div className="glass-card-gold rounded-2xl p-4 md:p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-32 bg-white/5 rounded" />
            <span className="h-5 w-12 bg-white/15 rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
            <div className="flex flex-col items-center shrink-0 min-w-[70px]">
              <div className="h-4.5 w-10 bg-white/10 rounded" />
              <div className="h-2.5 w-12 bg-white/5 rounded mt-1.5" />
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
          </div>
        </div>

        {/* Card 3: Finished match skeleton */}
        <div className="glass-card rounded-2xl p-4 md:p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-28 bg-white/5 rounded" />
            <span className="h-5 w-14 bg-white/10 rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-6 bg-white/10 rounded" />
              <div className="h-0.5 w-2 bg-white/5" />
              <div className="h-8 w-6 bg-white/10 rounded" />
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
          </div>
        </div>

        {/* Card 4: Finished match skeleton 2 */}
        <div className="glass-card rounded-2xl p-4 md:p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-24 bg-white/5 rounded" />
            <span className="h-5 w-14 bg-white/10 rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-6 bg-white/10 rounded" />
              <div className="h-0.5 w-2 bg-white/5" />
              <div className="h-8 w-6 bg-white/10 rounded" />
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
