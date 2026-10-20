export default function KeywordChips({ keywords, selectedIds, onToggle }) {
  const MAX = 5;
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((k) => {
        const selected = selectedIds.includes(k.id);
        const disabled = !selected && selectedIds.length >= MAX;
        return (
          <button
            key={k.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(k.id)}
            aria-pressed={selected}
            className={[
              "inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-2 text-sm font-medium transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-1",
              selected
                ? "bg-chipSelected border-googleBlue text-googleBlue shadow-sm"
                : disabled
                  ? "bg-white border-cardBorder text-textSecondary opacity-40 cursor-not-allowed"
                  : "bg-white border-cardBorder text-textPrimary hover:border-googleBlue/40 hover:bg-surface",
            ].join(" ")}
          >
            {selected && (
              <span className="material-symbols-rounded" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            )}
            {k.label}
          </button>
        );
      })}
    </div>
  );
}
