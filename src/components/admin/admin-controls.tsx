"use client";

import { useFormStatus } from "react-dom";

export function AdminSubmit({
  children,
  pendingLabel = "Saving…",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="admin-button admin-button-primary" disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
