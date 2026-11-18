"use client";

import { ImageIcon, Pencil, X } from "lucide-react";
import { useId, useState } from "react";

export function CatalogRow({
  title,
  subtitle,
  imageUrl,
  metadata,
  published,
  initiallyOpen = false,
  children,
}: {
  title: string;
  subtitle: string;
  imageUrl?: string;
  metadata: string;
  published: boolean;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const id = useId();

  return (
    <article className="admin-row">
      <div className="admin-row-summary">
        <div className="admin-row-name">
          <div className="admin-thumbnail">
            {imageUrl ? (
              <img src={imageUrl} alt="" loading="lazy" />
            ) : (
              <ImageIcon size={19} aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h3 title={title}>{title}</h3>
            <p title={subtitle}>{subtitle}</p>
          </div>
        </div>
        <span className="admin-row-meta">{metadata}</span>
        <span className={`admin-status ${published ? "admin-status-published" : ""}`}>
          {published ? "Published" : "Hidden"}
        </span>
        <button
          type="button"
          className="admin-button"
          aria-label={`${open ? "Close editor for" : "Edit"} ${title}`}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={15} aria-hidden="true" /> : <Pencil size={14} aria-hidden="true" />}
          {open ? "Close" : "Edit"}
        </button>
      </div>
      <div id={id} className="admin-row-editor" hidden={!open}>
        {open && children}
      </div>
    </article>
  );
}
