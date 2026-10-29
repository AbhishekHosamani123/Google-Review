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
              "relative rounded-xl border px-3 py-3.5 text-left transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-1",
              active
                ? "border-googleBlue bg-chipSelected shadow-sm"
                : "border-cardBorder bg-white hover:border-googleBlue/30",
            ].join(" ")}
          >
            <span
              className={`material-symbols-rounded absolute right-1.5 top-1.5 transition-all ${active ? "scale-100 text-[#1A73E8]" : "scale-0 text-transparent"}`}
              style={{ fontSize: 17, fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              check_circle
            </span>
            <span
              className={`material-symbols-rounded block ${active ? "text-googleBlue" : "text-textSecondary"}`}
              style={{ fontSize: 22 }}
              aria-hidden="true"
            >
              {t.icon}
            </span>
            <span className={`mt-1.5 block text-sm font-bold ${active ? "text-[#1A73E8]" : "text-textPrimary"}`}>{t.label}</span>
            <span className="mt-0.5 block text-xs text-textSecondary">{t.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
