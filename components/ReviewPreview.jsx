import WritingMascot from "@/components/WritingMascot";

export default function ReviewPreview({ text, setText, onRegenerate, mascotSrc = "/mascot.mp4" }) {
  const len = text.length;
  const tooShort = len > 0 && len < 30;
  return (
    <div className="rounded-card border border-cardBorder bg-white overflow-hidden shadow-card">
      <div className="flex items-center justify-between border-b border-cardBorder bg-surface px-4 py-2.5">
        <span className="flex items-center gap-2.5">
          <WritingMascot src={mascotSrc} size={44} />
          <span className="text-sm font-semibold text-textPrimary">Your review</span>
        </span>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1 rounded-full border border-cardBorder bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>refresh</span>
          Regenerate
        </button>
      </div>
      <div className="p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Your generated review will appear here..."
          className="w-full resize-none rounded-xl border border-cardBorder bg-white px-3.5 py-3 text-[15px] leading-relaxed text-textPrimary placeholder:text-textSecondary/60 focus:border-googleBlue focus:outline-none focus:ring-2 focus:ring-googleBlue/20"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs ${tooShort ? "text-googleRed font-medium" : "text-textSecondary"}`}>
            {len} characters {tooShort ? "· add a bit more for best results" : len > 0 ? "· looks good" : ""}
          </span>
          <span className="text-xs text-textSecondary flex items-center gap-1">
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit</span> Editable
          </span>
        </div>
      </div>
    </div>
  );
}
