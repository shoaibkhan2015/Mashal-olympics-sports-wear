import type { StorefrontCategory } from "@/lib/cms";

export function Marquee({ collections }: { collections: StorefrontCategory[] }) {
  const row = [
    ...collections.map((category) => category.name),
    ...collections.map((category) => category.name),
  ];
  return (
    <div className="relative overflow-hidden border-y border-border bg-card py-4">
      <div className="marquee-track items-center gap-10">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-10 font-display text-2xl tracking-[0.2em] uppercase text-muted-foreground"
          >
            {item}
            <span className="inline-block size-2 rounded-full bg-primary" aria-hidden />
          </span>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent"
        aria-hidden
      />
    </div>
  );
}
