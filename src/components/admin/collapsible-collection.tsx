"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleCollection({
  title,
  slug,
  imageUrl,
  children,
}: {
  title: string;
  slug: string;
  imageUrl: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="size-12 shrink-0 rounded-lg object-cover sm:size-16"
            />
          ) : (
            <div className="size-12 shrink-0 rounded-lg bg-primary/10 sm:size-16" aria-hidden />
          )}
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{title}</h3>
            <p className="truncate text-xs text-muted-foreground">/{slug}</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {expanded && (
        <div
          id={contentId}
          className="grid gap-4 border-t border-border p-4 sm:p-5 lg:grid-cols-[1fr_auto]"
        >
          {children}
        </div>
      )}
    </article>
  );
}
