export default function VotesLoading() {
  return (
    <div className="max-w-2xl mx-auto md:max-w-none">
      
      {/* Header section skeleton */}
      <div className="mb-8 animate-fade-in-up animate-pulse">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-1.5 h-6 bg-white/15 rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-black text-white/20 tracking-tight">
            هدف الجولة
          </h1>
        </div>
        <p className="text-white/35 text-sm font-medium pr-6 w-64 bg-white/5 h-4 rounded mt-1.5" />
      </div>

      {/* Nominated Goals Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[1, 2].map((idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl overflow-hidden border border-white/5 flex flex-col"
          >
            {/* Card Header Skeleton */}
            <div
              className="px-4 py-3.5 flex items-center gap-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              {/* Rank Index */}
              <div className="w-8 h-8 rounded-xl bg-white/10 shrink-0" />
              
              {/* Team Logo */}
              <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />

              {/* Player/Team Text */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="h-3.5 w-24 bg-white/10 rounded" />
                <div className="h-2.5 w-16 bg-white/5 rounded" />
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="h-5 w-14 bg-white/5 rounded-full" />
                <div className="h-5 w-10 bg-white/5 rounded-full" />
              </div>
            </div>

            {/* Video Placeholder */}
            <div className="px-4 py-3">
              <div className="relative aspect-video rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                {/* Play Button Icon Placeholder */}
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-12 border-l-white/10 ml-1" />
                </div>
              </div>
            </div>

            {/* Vote Action Area */}
            <div className="px-4 pb-4">
              <div className="h-10 w-full bg-white/10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
