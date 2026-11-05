"use client";

import { useEffect, useRef } from "react";
import heroImg from "@/assets/hero.jpg";
import shorts from "@/assets/shorts.jpg";
import shirts from "@/assets/shirts.jpg";
import gymWear from "@/assets/gym-wear.jpg";
import tracksuit from "@/assets/tracksuit.jpg";
import footballKit from "@/assets/football-kit.jpg";
import taekwondo from "@/assets/taekwondo.jpg";
import wushu from "@/assets/wushu.jpg";

const slides = [
  { image: heroImg.src, label: "The Torch Standard" },
  { image: shorts.src, label: "Custom Shorts" },
  { image: shirts.src, label: "Shirts & Tanks" },
  { image: gymWear.src, label: "Gym Wear" },
  { image: tracksuit.src, label: "Tracksuits" },
  { image: footballKit.src, label: "Football Kits" },
  { image: taekwondo.src, label: "Taekwondo" },
  { image: wushu.src, label: "Wushu" },
];

const ANGLE = 360 / slides.length;

/**
 * Scroll-driven 3D cylinder: the ring rotates as the section scrolls
 * through the viewport, so images appear to travel around a cylinder.
 */
export function CylinderGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const section = sectionRef.current;
      const ring = ringRef.current;
      if (!section || !ring) return;
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      const rotation = -progress * 360;
      ring.style.transform = `translateZ(calc(-1 * var(--cyl-radius))) rotateY(${rotation}deg)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative h-[280vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute size-[42rem] max-w-[140vw] rounded-full opacity-40 blur-3xl pulse-glow bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_45%,transparent),transparent_70%)]"
          aria-hidden
        />

        <p className="mb-10 font-display text-3xl tracking-[0.25em] uppercase text-muted-foreground">
          Scroll — the lineup rotates
        </p>

        <div className="cylinder-stage relative h-[26rem] w-full max-w-6xl">
          <div ref={ringRef} className="cylinder-ring absolute inset-0">
            {slides.map((slide, i) => (
              <figure
                key={slide.label}
                className="cylinder-item"
                style={{
                  transform: `translate(-50%, -50%) rotateY(${i * ANGLE}deg) translateZ(var(--cyl-radius))`,
                }}
              >
                <img
                  src={slide.image}
                  alt={slide.label}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="size-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-8 text-center font-display text-lg tracking-widest uppercase text-white">
                  {slide.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
