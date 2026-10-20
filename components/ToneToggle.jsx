import { TONES } from "@/lib/reviews/keywords";

export default function ToneToggle({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TONES.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-pressed={active}
            className={[
              "rounded-xl border px-3 py-3 text-left transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue",
              active
                ? "bg-chipSelected border-googleBlue shadow-sm"
                : "bg-white border-cardBorder hover:border-googleBlue/30",
            ].join(" ")}
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: active ? "#4285F4" : "#5F6368" }}>
                {t.icon}
              </span>
              <span className={`text-sm font-semibold ${active ? "text-googleBlue" : "text-textPrimary"}`}>{t.label}</span>
            </span>
            <span className="mt-1 block text-xs text-textSecondary">{t.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
