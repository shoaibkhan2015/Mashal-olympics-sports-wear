"use client";

export function ConfirmDeleteButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(`Permanently delete ${label}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
      className="rounded-full border border-destructive/50 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive hover:text-white"
    >
      Delete
    </button>
  );
}
