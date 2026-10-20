export default function HelpModal({ open, onClose, reviewUrl, reviewText }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-card bg-white shadow-card p-6" style={{ animation: "fadeUp 200ms ease-out" }}>
        <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
          <span className="material-symbols-rounded text-googleBlue">info</span>
          Paste your review on Google
        </h3>
        <ol className="mt-4 space-y-2 text-sm leading-relaxed text-textSecondary list-decimal list-inside">
          <li>We copied your review — if not, tap the text below and copy it.</li>
          <li>Google will open in a new tab — long-press the review box and tap <b className="text-textPrimary">Paste</b>.</li>
          <li>Choose your star rating and tap <b className="text-textPrimary">Post</b>.</li>
        </ol>
        <div className="mt-4 rounded-xl border border-cardBorder bg-surface p-3">
          <p className="text-xs font-semibold text-textSecondary mb-1">Your review (tap to select all):</p>
          <textarea
            readOnly
            value={reviewText}
            onFocus={(e) => e.target.select()}
            rows={4}
            className="w-full resize-none rounded-lg border border-cardBorder bg-white px-3 py-2 text-sm text-textPrimary focus:border-googleBlue focus:outline-none"
          />
        </div>
        <div className="mt-5 flex gap-3">
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-googleBlue px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3367D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue"
          >
            Open Google Reviews <span className="material-symbols-rounded" style={{ fontSize: 18 }}>open_in_new</span>
          </a>
          <button type="button" onClick={onClose} className="rounded-full border border-cardBorder bg-white px-5 py-3 text-sm font-semibold text-textPrimary hover:bg-surface">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
