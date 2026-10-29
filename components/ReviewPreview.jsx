import { useRef } from "react";
import WritingMascot from "@/components/WritingMascot";
import GoogleG from "@/components/GoogleG";

const GOAL = 400; // suggested review length shown as the "x/400" goal

export default function ReviewPreview({ text, setText, onRegenerate, onCopy, mascotSrc = "/mascot.mp4" }) {
  const len = text.length;
  const tooShort = len > 0 && len < 30;
  const pct = Math.min((len / GOAL) * 100, 100);
  const taRef = useRef(null);

  return (
    <div className="overflow-hidden rounded-card border border-cardBorder bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-cardBorder bg-[#FAFAFA] px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-textPrimary">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-chipSelected text-xs font-bold text-[#1A73E8]">3</span>
          Your review
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              taRef.current?.focus();
              const t = taRef.current;
              if (t) t.setSelectionRange(t.value.length, t.value.length);
            }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-[#1A73E8] transition-colors hover:bg-chipSelected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-1"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>
              edit
            </span>
            Edit
          </button>
          <WritingMascot src={mascotSrc} size={76} className="shrink-0" />
        </span>
      </div>
      <div className="p-4">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Your generated review will appear here..."
          className="w-full resize-none rounded-xl border border-cardBorder bg-white px-3.5 py-3 text-[15px] leading-relaxed text-textPrimary placeholder:text-textSecondary/60 focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={`text-xs ${tooShort ? "font-medium text-googleRed" : "text-textSecondary"}`}>
            {len} characters {tooShort ? "· add a bit more for best results" : len > 0 ? "· looks good" : ""}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="w-16 shrink-0 text-right text-xs font-medium text-textSecondary">{len}/{GOAL}</span>
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-[#E0E0E0] sm:w-24" aria-hidden="true">
              <span
                className={`block h-full rounded-full transition-all duration-300 ${tooShort ? "bg-googleRed" : len > GOAL ? "bg-googleYellow" : "bg-googleGreen"}`}
                style={{ width: `${len === 0 ? 0 : Math.max(pct, 3)}%` }}
              />
            </span>
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-cardBorder bg-white px-5 py-3 text-sm font-semibold text-textPrimary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-2"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
              refresh
            </span>
            Regenerate
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={!text.trim()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#4285F4,#1A73E8)] px-6 py-3 text-sm font-bold text-white shadow-card transition-all hover:brightness-105 hover:shadow-cardHover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
              <GoogleG size={14} />
            </span>
            Copy and open Google Reviews
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
              open_in_new
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
