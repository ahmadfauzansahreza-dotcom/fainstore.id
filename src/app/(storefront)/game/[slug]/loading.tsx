export default function GameLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">

        {/* Game hero */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101010]">
          <div className="h-44 w-full bg-white/[0.05] sm:h-56" />

          <div className="space-y-3 p-5">
            <div className="h-6 w-48 rounded-lg bg-white/[0.08]" />
            <div className="h-4 w-28 rounded-lg bg-white/[0.05]" />
          </div>
        </div>

        {/* Step 1 */}
        <div className="rounded-2xl border border-white/10 bg-[#101010] p-5">
          <div className="mb-5 h-5 w-40 rounded-lg bg-white/[0.08]" />
          <div className="h-12 w-full rounded-xl bg-white/[0.05]" />
        </div>

        {/* Nominal */}
        <div className="rounded-2xl border border-white/10 bg-[#101010] p-5">
          <div className="mb-5 h-5 w-36 rounded-lg bg-white/[0.08]" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-xl bg-white/[0.05]"
              />
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
