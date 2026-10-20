"use client";
import { useEffect, useState } from "react";

// Anti-flash for the Material Symbols icon font: adds `icons-ready` to <html>
// only once the font is actually loadable, so ligature text like "star" or
// "download" never paints as plain words. A fallback timer reveals everything
// after 2.5s even if the font request fails (graceful degradation).
export default function IconFontReady() {
  const [, force] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const done = () => root.classList.add("icons-ready");
    if (!document.fonts || !document.fonts.load) {
      done();
      return;
    }
    document.fonts.load('400 20px "Material Symbols Rounded"').then(done).catch(done);
    const fallback = setTimeout(done, 2500);
    return () => clearTimeout(fallback);
  }, []);
  return null;
}
