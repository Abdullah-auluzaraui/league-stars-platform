export default function StandingsLoading() {
  return (
    <div className="max-w-2xl mx-auto pb-20 md:max-w-none md:pb-0">
      
      {/* Header section skeleton */}
      <div className="mb-5 md:mb-8 animate-fade-in-up animate-pulse">
        <div className="flex items-center gap-2.5 md:gap-3 mb-1.5 md:mb-2">
          <span className="w-1.5 h-5 md:h-7 bg-white/15 rounded-full" />
          <h1 className="text-xl sm:text-3xl font-black text-white/20 tracking-tight">
            المنافسات والأرقام
          </h1>
        </div>
        <p className="text-white/35 text-xs sm:text-sm font-medium pr-5 md:pr-6 leading-5">
          مسار البطولة · الفرق والتشكيلات · لائحة الهدافين
        </p>
      </div>

      {/* Tab Bar Skeleton */}
      <div
        className="mb-5 grid grid-cols-3 gap-1.5 rounded-2xl p-1.5 animate-pulse md:mb-6 md:flex md:gap-2"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {[1, 2, 3].map((t) => (
          <div
            key={t}
            className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 bg-white/5 h-9 md:flex-1"
          />
        ))}
      </div>

      {/* Group Stage Skeleton */}
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-4 w-28 bg-white/10 rounded mb-4" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Group 1 Skeleton */}
            {[1, 2].map((gIdx) => (
              <div key={gIdx} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                {/* Group Header */}
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10" />
                  <div className="h-3 w-16 bg-white/5 rounded" />
                </div>

                {/* Column Headers */}
                <div
                  className="grid grid-cols-[1fr_34px_38px_40px] px-3 py-2 text-[9px] font-black text-white/20 tracking-wider uppercase md:grid-cols-[1fr_28px_28px_28px_28px_36px_36px_28px_36px]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span>الفريق</span>
                  <span className="text-center">لع</span>
                  <span className="hidden text-center md:block">ف</span>
                  <span className="hidden text-center md:block">ت</span>
                  <span className="hidden text-center md:block">خ</span>
                  <span className="hidden text-center md:block">له</span>
                  <span className="hidden text-center md:block">عه</span>
                  <span className="text-center">فا</span>
                  <span className="text-center">نق</span>
                </div>

                {/* Rows Skeletons */}
                <div className="divide-y divide-white/[0.02]">
                  {[1, 2, 3, 4].map((rowIdx) => (
                    <div
                      key={rowIdx}
                      className="grid grid-cols-[1fr_34px_38px_40px] items-center px-3 py-3 md:grid-cols-[1fr_28px_28px_28px_28px_36px_36px_28px_36px]"
                      style={{
                        background: rowIdx <= 2 ? "rgba(255,255,255,0.01)" : "transparent"
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] w-4 bg-white/5 h-3 rounded shrink-0" />
                        {rowIdx <= 2 && <div className="w-1 h-5 rounded-full bg-white/10 shrink-0" />}
                        <div className="w-7 h-7 rounded-xl bg-white/5 shrink-0" />
                        <div className="h-3 w-20 bg-white/5 rounded" />
                      </div>
                      <span className="h-3.5 w-4 bg-white/5 rounded mx-auto" />
                      <span className="hidden md:inline-block h-3.5 w-4 bg-white/5 rounded mx-auto" />
                      <span className="hidden md:inline-block h-3.5 w-4 bg-white/5 rounded mx-auto" />
                      <span className="hidden md:inline-block h-3.5 w-4 bg-white/5 rounded mx-auto" />
                      <span className="hidden md:inline-block h-3.5 w-4 bg-white/5 rounded mx-auto" />
                      <span className="hidden md:inline-block h-3.5 w-4 bg-white/5 rounded mx-auto" />
                      <span className="h-3.5 w-6 bg-white/5 rounded mx-auto" />
                      <span className="h-3.5 w-4 bg-white/10 rounded mx-auto" />
                    </div>
                  ))}
                </div>

                {/* Footer line */}
                <div
                  className="px-4 py-2 flex items-center gap-2"
                  style={{ borderTop: "1px dashed rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}
                >
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="h-2 w-24 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
