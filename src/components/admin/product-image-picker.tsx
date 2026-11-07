"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ChevronDown, ChevronUp, Star, Trash2 } from "lucide-react";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function ProductImagePicker({ initialUrls = [] }: { initialUrls?: string[] }) {
  const [urls, setUrls] = useState(initialUrls);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (
      selected.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024,
      )
    ) {
      setError("Each image must be JPG, PNG, or WebP and no larger than 5 MB.");
      return;
    }
    if (urls.length + selected.length > 12) {
      setError("A product can have up to 12 images.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { url: projectUrl, anonKey } = getSupabaseConfig();
      const supabase = createBrowserClient(projectUrl, anonKey);
      const results = await Promise.allSettled(
        selected.map(async (file) => {
          const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
          const path = `products/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage
            .from("storefront-media")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (uploadError) throw uploadError;
          return supabase.storage.from("storefront-media").getPublicUrl(path).data.publicUrl;
        }),
      );
      const uploaded = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      if (uploaded.length) setUrls((current) => [...current, ...uploaded]);
      if (uploaded.length !== selected.length) {
        console.error("One or more product image uploads failed:", results);
        setError(
          `${uploaded.length} of ${selected.length} images uploaded. Please retry failed images.`,
        );
      }
    } catch (uploadError) {
      console.error("Could not upload product images:", uploadError);
      setError(
        "Image upload failed. Confirm the CMS migration is applied and your admin session is active.",
      );
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, offset: number) => {
    setUrls((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="grid gap-2 text-sm sm:col-span-2 lg:col-span-3">
      <span>Product images (first image is the main image)</span>
      <input type="hidden" name="image_urls" value={JSON.stringify(urls)} />
      <input type="hidden" name="image_url" value={urls[0] ?? ""} />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy || urls.length >= 12}
        onChange={(event) => {
          void upload(event.target.files);
          event.currentTarget.value = "";
        }}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-semibold file:text-primary-foreground"
      />
      <p className="text-xs text-muted-foreground">
        Select multiple images at once. Reorder them below or set a main image.
      </p>
      {busy && <span className="text-xs text-muted-foreground">Uploading images…</span>}
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="overflow-hidden rounded-xl border border-border"
            >
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="aspect-square w-full object-cover"
              />
              <div className="flex items-center justify-between gap-1 p-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move image ${index + 1} earlier`}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={index === urls.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move image ${index + 1} later`}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                >
                  <ChevronDown className="size-4" />
                </button>
                <span className="flex-1 truncate text-center text-xs">
                  {index === 0 ? "Main image" : `Image ${index + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                  aria-label={`Remove image ${index + 1}`}
                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setUrls((current) => [
                        current[index],
                        ...current.filter((_, itemIndex) => itemIndex !== index),
                      ])
                    }
                    aria-label={`Make image ${index + 1} the main image`}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <Star className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
