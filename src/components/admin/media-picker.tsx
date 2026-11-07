"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function MediaPicker({
  name,
  initialUrl = "",
  label = "Image",
}: {
  name: string;
  initialUrl?: string;
  label?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file?: File) => {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { url: projectUrl, anonKey } = getSupabaseConfig();
      const supabase = createBrowserClient(projectUrl, anonKey);
      const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
      const path = `storefront/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("storefront-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("storefront-media").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (uploadError) {
      console.error("Could not upload storefront image:", uploadError);
      setError(
        "Image upload failed. Confirm the CMS migration is applied and your admin session is active.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-2 text-sm">
      <span>{label}</span>
      <input type="hidden" name={name} value={url} />
      {url && (
        <img src={url} alt="" className="h-28 w-40 rounded-lg border border-border object-cover" />
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={(event) => upload(event.target.files?.[0])}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-semibold file:text-primary-foreground"
      />
      {busy && <span className="text-xs text-muted-foreground">Uploading image…</span>}
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
      <label className="grid gap-1 text-xs text-muted-foreground">
        Or paste an image URL
        <input
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          placeholder="https://…"
        />
      </label>
    </div>
  );
}
