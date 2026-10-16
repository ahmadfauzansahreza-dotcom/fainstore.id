export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="h-64 animate-pulse rounded-xl2 bg-background-secondary md:h-96" />
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl2 bg-background-secondary" />
        ))}
      </div>
    </div>
  );
}
