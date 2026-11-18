"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { BasketQuantityControl } from "@/components/basket-quantity-control";
import { useBasket } from "@/components/basket-provider";
import type { Product, ProductFaq } from "@/lib/supabase/types";

type RelatedProduct = Pick<Product, "id" | "slug" | "name" | "image_url" | "image_urls" | "price">;

const colourValues: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  red: "#dc2626",
  blue: "#2563eb",
  navy: "#1e3a8a",
  green: "#16a34a",
  yellow: "#eab308",
  orange: "#ea580c",
  purple: "#9333ea",
  pink: "#ec4899",
  gray: "#6b7280",
  grey: "#6b7280",
  brown: "#854d0e",
  maroon: "#7f1d1d",
};

function getSwatchColour(name: string) {
  const normalised = name.trim().toLowerCase();
  if (colourValues[normalised]) return colourValues[normalised];
  return /^#[0-9a-f]{6}$/i.test(normalised) ? normalised : "#525252";
}

function formatPrice(price: number) {
  return `PKR ${Number(price).toFixed(2)}`;
}

function safeFaqs(faqs: ProductFaq[] | null | undefined): ProductFaq[] {
  if (!Array.isArray(faqs)) return [];
  return faqs.filter(
    (faq): faq is ProductFaq =>
      !!faq &&
      typeof faq.question === "string" &&
      !!faq.question.trim() &&
      typeof faq.answer === "string" &&
      !!faq.answer.trim(),
  );
}

export function ProductDetail({
  product,
  relatedProducts,
  whatsappNumber,
}: {
  product: Product;
  relatedProducts: RelatedProduct[];
  whatsappNumber: string;
}) {
  const images = useMemo(
    () =>
      [...(product.image_urls?.length ? product.image_urls : [product.image_url])].filter(
        (image): image is string => typeof image === "string" && image.length > 0,
      ),
    [product.image_url, product.image_urls],
  );
  const detailsImages = (product.fabric_image_urls ?? []).filter(Boolean);
  const faqs = safeFaqs(product.product_faqs);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");
  const [colour, setColour] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const { addToBasket, basket } = useBasket();
  const sizeOptionsRef = useRef<HTMLFieldSetElement>(null);
  const colourOptionsRef = useRef<HTMLFieldSetElement>(null);
  const buyingControlsRef = useRef<HTMLDivElement>(null);
  const zoomCloseRef = useRef<HTMLButtonElement>(null);
  const buyingControlsSeen = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const swipedUntil = useRef(0);
  const outOfStock = product.stock_quantity === 0;
  const phoneDigits = whatsappNumber.replace(/\D/g, "");
  const canContactOnWhatsApp = phoneDigits.length >= 7 && phoneDigits.length <= 15;
  const selectedVariantQuantity = basket
    .filter(
      (line) =>
        line.productId === product.id &&
        (line.size ?? "") === size &&
        (line.colour ?? "") === colour,
    )
    .reduce((total, line) => total + line.quantity, 0);
  const existingProductQuantity = basket
    .filter((line) => line.productId === product.id)
    .reduce((total, line) => total + line.quantity, 0);
  const maxQuantity =
    product.stock_quantity === null
      ? 100 - selectedVariantQuantity
      : Math.min(100 - selectedVariantQuantity, product.stock_quantity - existingProductQuantity);
  const canPurchase = product.price !== null && !outOfStock && maxQuantity > 0;
  const effectiveQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const needsSize = product.available_sizes.length > 0 && !size;
  const needsColour = product.available_colours.length > 0 && !colour;
  const canAdd = canPurchase && !needsSize && !needsColour;
  const faqText = `Hi! I’d like to discuss customization for ${product.name}.\nQuestion: What customization options are available?`;
  const productMessage = (message: string) =>
    `${message}\n\nProduct: ${product.name}\nLink: ${window.location.origin}/shop/${product.slug}`;
  const whatsappHref = (message: string) =>
    `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
  const customInquiryHref = whatsappHref(`${faqText}\nProduct: /shop/${product.slug}`);

  useEffect(() => {
    const target = buyingControlsRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          buyingControlsSeen.current = true;
          setStickyVisible(false);
        } else if (buyingControlsSeen.current) {
          setStickyVisible(true);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -24px 0px" },
    );
    if (target.getBoundingClientRect().bottom < 0) {
      buyingControlsSeen.current = true;
      setStickyVisible(true);
    }
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!zoomed) return;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const closeButton = zoomCloseRef.current;
    document.body.style.overflow = "hidden";
    closeButton?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
      if (!zoomedImage && event.key === "ArrowLeft") {
        setSelectedImage((index) => (index - 1 + images.length) % images.length);
      }
      if (!zoomedImage && event.key === "ArrowRight") {
        setSelectedImage((index) => (index + 1) % images.length);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [zoomed, zoomedImage, images.length]);

  const moveImage = (amount: number) => {
    setSelectedImage((index) => (index + amount + images.length) % images.length);
  };

  const chooseOption = (kind: "size" | "colour", value: string) => {
    if (kind === "size") setSize(value);
    else setColour(value);
    setError("");
  };

  const add = async () => {
    if (!canPurchase) return;
    setError("");
    if (needsSize || needsColour) {
      const optionName = needsSize ? "size" : "colour";
      setError(`Choose an available ${optionName} before adding this product.`);
      const target = needsSize ? sizeOptionsRef.current : colourOptionsRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
      return;
    }
    if (quantity > maxQuantity) {
      setQuantity(effectiveQuantity);
      setError("The quantity was updated to match the available amount.");
      return;
    }
    setAdding(true);
    try {
      await addToBasket(product, effectiveQuantity, size, colour);
    } catch (addError) {
      setError(
        addError instanceof Error ? addError.message : "Could not add this product to your basket.",
      );
    } finally {
      setAdding(false);
    }
  };

  const statusText = outOfStock
    ? "Out of stock"
    : product.stock_quantity === null
      ? "Made to order"
      : `${product.stock_quantity} in stock`;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:pb-20">
      <Link
        href="/shop"
        className="mb-5 inline-flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to shop
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
        <section aria-label={`${product.name} product images`} className="min-w-0">
          <div
            className="relative aspect-[4/5] max-h-[780px] overflow-hidden rounded-2xl border border-border bg-card sm:aspect-[5/4] lg:aspect-[4/5]"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = touchStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              touchStartX.current = null;
              if (images.length < 2 || startX === null || endX === undefined) return;
              if (Math.abs(startX - endX) > 45) {
                swipedUntil.current = Date.now() + 500;
                moveImage(startX - endX > 0 ? 1 : -1);
              }
            }}
          >
            {images[selectedImage] ? (
              <button
                type="button"
                onClick={() => {
                  if (swipedUntil.current > Date.now()) return;
                  setZoomedImage(null);
                  setZoomed(true);
                }}
                aria-label={`Zoom image ${selectedImage + 1} of ${images.length}`}
                className="absolute inset-0 grid size-full place-items-center p-2"
              >
                <img
                  src={zoomedImage ?? images[selectedImage]}
                  alt={
                    zoomedImage
                      ? `${product.name} fabric detail`
                      : `${product.name} - image ${selectedImage + 1}`
                  }
                  className="size-full object-contain"
                  fetchPriority="high"
                />
                <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full border border-border bg-background/90">
                  <Maximize2 className="size-4" />
                </span>
              </button>
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                Product image not added
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => moveImage(-1)}
                  aria-label="Previous product image"
                  className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 hover:border-primary"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(1)}
                  aria-label="Next product image"
                  className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 hover:border-primary"
                >
                  <ChevronRight className="size-5" />
                </button>
                <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs tabular-nums">
                  {selectedImage + 1} / {images.length}
                </span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Choose product image">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={selectedImage === index}
                  className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-card p-1 sm:size-20 ${
                    selectedImage === index ? "border-primary" : "border-border"
                  }`}
                >
                  <img src={image} alt="" className="size-full object-contain" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0 lg:py-3">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Knockout Sports Wear
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            {product.name}
          </h1>
          {product.price !== null && (
            <p className="mt-3 text-2xl font-bold tabular-nums">{formatPrice(product.price)}</p>
          )}
          {product.description.trim() && (
            <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>
          )}
          <p
            className={`mt-4 flex items-center gap-2 text-sm font-semibold ${
              outOfStock ? "text-destructive" : "text-primary"
            }`}
          >
            <span
              className={`size-2 rounded-full ${outOfStock ? "bg-destructive" : "bg-primary"}`}
            />
            {statusText}
          </p>

          <div className="mt-5 grid gap-4">
            {!!product.available_sizes?.length && (
              <fieldset ref={sizeOptionsRef}>
                <legend className="mb-2 text-sm font-semibold">Size</legend>
                <div className="flex flex-wrap gap-2">
                  {product.available_sizes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={size === item}
                      onClick={() => chooseOption("size", item)}
                      className={`min-h-11 min-w-12 rounded-lg border px-4 py-2 text-sm font-semibold ${
                        size === item
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {product.size_guide.trim() && (
                  <a
                    href="#size-fit"
                    className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Size guide
                  </a>
                )}
              </fieldset>
            )}
            {!!product.available_colours?.length && (
              <fieldset ref={colourOptionsRef}>
                <legend className="mb-2 text-sm font-semibold">
                  Colour{colour ? `: ${colour}` : ""}
                </legend>
                <div className="flex flex-wrap gap-3">
                  {product.available_colours.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-label={`Choose ${item}`}
                      aria-pressed={colour === item}
                      onClick={() => chooseOption("colour", item)}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                        colour === item
                          ? "border-primary ring-1 ring-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-5 rounded-full border border-white/30"
                        style={{ backgroundColor: getSwatchColour(item) }}
                      />
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {!product.available_sizes?.length && product.size_guide.trim() && (
              <a
                href="#size-fit"
                className="inline-flex min-h-9 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                View Size &amp; Fit
              </a>
            )}
          </div>

          {canContactOnWhatsApp && (
            <a
              href={whatsappHref(
                `Hi! I have a question about ${product.name}.\nProduct: /shop/${product.slug}`,
              )}
              onClick={(event) => {
                event.preventDefault();
                window.open(
                  whatsappHref(productMessage(`Hi! I have a question about ${product.name}.`)),
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Ask about this product on WhatsApp
            </a>
          )}

          <div ref={buyingControlsRef} className="mt-5 scroll-mt-28">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <p className="mb-2 text-sm font-semibold">Quantity</p>
                <BasketQuantityControl
                  name={product.name}
                  quantity={effectiveQuantity}
                  maxQuantity={Math.max(1, maxQuantity)}
                  onChange={setQuantity}
                />
              </div>
              <button
                type="button"
                onClick={() => void add()}
                disabled={!canPurchase || adding}
                className="min-h-12 flex-1 rounded-full bg-primary px-6 py-3 font-bold uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {adding ? "Adding…" : "Add to Basket"}
              </button>
            </div>
            {(!canAdd || error) && !stickyVisible && (
              <p
                role={error ? "alert" : undefined}
                className={`mt-3 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
              >
                {error ||
                  (needsSize || needsColour
                    ? `Choose an available ${needsSize ? "size" : "colour"} to add this item.`
                    : "This item cannot currently be added to your basket.")}
              </p>
            )}
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            Payment and delivery are confirmed with you before fulfillment. No online payment is
            taken.
          </p>
        </section>
      </div>

      {(product.fabric_details.trim() ||
        product.fit_details.trim() ||
        product.care_instructions.trim() ||
        detailsImages.length > 0) && (
        <section className="mt-14 border-t border-border pt-9" aria-labelledby="fabric-heading">
          <h2 id="fabric-heading" className="font-display text-3xl uppercase">
            Fabric &amp; Performance
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {product.fabric_details.trim() && (
              <DetailText title="Material" text={product.fabric_details} />
            )}
            {product.fit_details.trim() && <DetailText title="Fit" text={product.fit_details} />}
            {product.care_instructions.trim() && (
              <DetailText title="Care" text={product.care_instructions} />
            )}
          </div>
          {detailsImages.length > 0 && (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {detailsImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => {
                    setZoomedImage(image);
                    setZoomed(true);
                  }}
                  className="w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-card p-2 text-left sm:w-52"
                >
                  <img
                    src={image}
                    alt={`${product.name} fabric detail ${index + 1}`}
                    className="aspect-square w-full object-contain"
                    loading="lazy"
                  />
                  <span className="mt-2 block text-xs text-muted-foreground">
                    Fabric detail {index + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {product.customization_options.trim() && (
        <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-7">
          <h2 className="font-display text-3xl uppercase">Make It Yours</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {product.customization_options}
          </p>
          {canContactOnWhatsApp && (
            <a
              href={customInquiryHref}
              onClick={(event) => {
                event.preventDefault();
                window.open(whatsappHref(productMessage(faqText)), "_blank", "noopener,noreferrer");
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-bold uppercase text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Discuss Customization <ArrowRight className="size-4" />
            </a>
          )}
        </section>
      )}

      {product.size_guide.trim() && (
        <section id="size-fit" className="mt-10 scroll-mt-28" aria-labelledby="size-fit-heading">
          <h2 id="size-fit-heading" className="font-display text-3xl uppercase">
            Size &amp; Fit
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {product.size_guide}
          </p>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="mt-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-3xl uppercase">
            Product FAQs
          </h2>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border px-4">
            {faqs.map((faq, index) => (
              <details key={`${faq.question}-${index}`} className="py-4">
                <summary className="cursor-pointer font-semibold">{faq.question}</summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-14 border-t border-border pt-9" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-display text-3xl uppercase">
            More from this collection
          </h2>
          <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {relatedProducts.map((related) => {
              const image = related.image_urls?.[0] || related.image_url || null;
              return (
                <Link
                  key={related.id}
                  href={`/shop/${related.slug}`}
                  className="group w-[72vw] max-w-64 shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary lg:w-auto lg:max-w-none"
                >
                  <div className="aspect-[4/3] bg-background p-2">
                    {image ? (
                      <img
                        src={image}
                        alt={related.name}
                        className="size-full object-contain transition-transform group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-xs text-muted-foreground">
                        Product image not added
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{related.name}</h3>
                    {related.price !== null && (
                      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                        {formatPrice(related.price)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {stickyVisible && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.3)] backdrop-blur lg:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{product.name}</p>
              {product.price !== null && (
                <p className="text-sm font-bold tabular-nums">{formatPrice(product.price)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void add()}
              disabled={!canPurchase || adding}
              className="min-h-11 shrink-0 rounded-full bg-primary px-5 text-sm font-bold uppercase text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add to Basket"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mx-auto mt-2 max-w-7xl text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}

      {zoomed && images[selectedImage] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image viewer`}
          className="fixed inset-0 z-[120] grid place-items-center bg-black/95 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setZoomed(false);
          }}
        >
          <button
            ref={zoomCloseRef}
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full border border-white/30 bg-black/70 text-white"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ×
            </span>
          </button>
          {!zoomedImage && images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => moveImage(-1)}
                aria-label="Previous product image"
                className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/70 text-white sm:left-6"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => moveImage(1)}
                aria-label="Next product image"
                className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/70 text-white sm:right-6"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
          <img
            src={images[selectedImage]}
            alt={`${product.name} - image ${selectedImage + 1}`}
            className="max-h-[90dvh] max-w-full object-contain"
          />
        </div>
      )}
    </main>
  );
}

function DetailText({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
