"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export function BasketQuantityControl({
  name,
  quantity,
  maxQuantity,
  onChange,
}: {
  name: string;
  quantity: number;
  maxQuantity: number;
  onChange: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState<string | undefined>();
  const draftQuantity = Number(draft);
  const displayedQuantity =
    draft !== undefined && Number.isSafeInteger(draftQuantity) && draftQuantity > 0
      ? Math.min(draftQuantity, maxQuantity)
      : quantity;

  const commit = (value: string) => {
    const requestedQuantity = Number(value);
    if (value === "") onChange(1);
    else if (Number.isSafeInteger(requestedQuantity) && requestedQuantity > 0) {
      onChange(Math.min(requestedQuantity, maxQuantity));
    }
    setDraft(undefined);
  };
  const step = (amount: number) => {
    onChange(Math.max(1, Math.min(maxQuantity, displayedQuantity + amount)));
    setDraft(undefined);
  };

  return (
    <div className="inline-flex h-11 items-center rounded-full border border-input bg-background">
      <button
        type="button"
        aria-label={`Decrease quantity of ${name}`}
        disabled={displayedQuantity <= 1}
        onClick={() => step(-1)}
        className="grid size-11 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <input
        aria-label={`Quantity of ${name}`}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        value={draft ?? String(quantity)}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const value = event.currentTarget.value.replace(/\D/g, "");
          setDraft(value);
          const requestedQuantity = Number(value);
          if (
            value !== "" &&
            Number.isSafeInteger(requestedQuantity) &&
            requestedQuantity > 0 &&
            requestedQuantity <= maxQuantity
          ) {
            onChange(requestedQuantity);
          }
        }}
        onBlur={(event) => commit(event.currentTarget.value)}
        className="h-full w-12 min-w-0 border-x border-input bg-transparent px-1 text-center tabular-nums outline-none"
      />
      <button
        type="button"
        aria-label={`Increase quantity of ${name}`}
        disabled={displayedQuantity >= maxQuantity}
        onClick={() => step(1)}
        className="grid size-11 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
