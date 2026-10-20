"use client";
import { useEffect, useRef } from "react";

// The shop's writing mascot — plays while the customer's review draft is
// generated. Purely decorative (muted, aria-hidden). Honors
// prefers-reduced-motion by showing a still frame instead of looping.
export default function WritingMascot({ src = "/mascot.mp4", size = 96, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tryPlay = () => {
      if (mq.matches) {
        v.pause();
        v.removeAttribute("loop");
      } else {
        v.loop = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      }
    };
    tryPlay();
    // retry once media data arrives — an early play() can get lost during load
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    mq.addEventListener?.("change", tryPlay);
    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      mq.removeEventListener?.("change", tryPlay);
    };
  }, []);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#FAFAFA] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <video
        ref={ref}
        src={src}
        width={size}
        height={size}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="h-full w-full object-contain"
      />
    </span>
  );
}
