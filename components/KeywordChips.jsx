// Chip icon per highlight — material symbols, fuzzy-mapped from the label
// (covers every preset/extra keyword; anything unknown falls back to a heart).
function chipIcon(label) {
  const s = String(label).toLowerCase();
  if (/(food|tasty|delicious|breakfast|taste|dish|meal|snack|sweet|biryani|variety|collection|drinks)/.test(s)) return "restaurant";
  if (/(coffee)/.test(s)) return "local_cafe";
  if (/(bake|bakery)/.test(s)) return "cake";
  if (/(quick|fast|prompt|easy|smooth|seamless|response|appointment|billing|waiting|time)/.test(s)) return "bolt";
  if (/(staff|service|barista|team|helpful|caring|attentive|polite|courteous|front desk|hospitality|reception|therapist)/.test(s)) return "support_agent";
  if (/(friend|welcom|cozy|crowd|warm vibe)/.test(s)) return "mood";
  if (/(clean|hygien|spotless|tidy|washroom|sanit)/.test(s)) return "cleaning_services";
  if (/(family)/.test(s)) return "family_restroom";
  if (/(group)/.test(s)) return "groups";
  if (/(ambian|ambien|vibe|music|view|seating|atmosphere|decor|calm|peaceful|quiet|relax)/.test(s)) return "eco";
  if (/(value|price|pricing|affordab|reasonable|fair)/.test(s)) return "payments";
  if (/(parking)/.test(s)) return "local_parking";
  if (/(location)/.test(s)) return "location_on";
  if (/(wifi)/.test(s)) return "wifi";
  if (/(bed|comfort|stay|sleep)/.test(s)) return "king_bed";
  if (/(gym|fitness|equipment|trainer)/.test(s)) return "fitness_center";
  if (/(doctor|medical|nurse|clinic|hygiene|care|hospital)/.test(s)) return "medical_services";
  if (/(massage|spa)/.test(s)) return "spa";
  if (/(style|salon|wash|hair)/.test(s)) return "content_cut";
  if (/(booking|reserv)/.test(s)) return "event_available";
  if (/(profession|managed|organiz|skilled|expert|quality|perfect)/.test(s)) return "verified";
  if (/(wishlist|recommend|would)/.test(s)) return "recommend";
  return "favorite";
}

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
              "group inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-2 text-sm font-semibold transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-1",
              selected
                ? "border-googleBlue bg-chipSelected text-[#1A73E8] shadow-sm"
                : disabled
                  ? "cursor-not-allowed border-cardBorder bg-white text-textSecondary opacity-40"
                  : "border-cardBorder bg-white text-textPrimary hover:border-googleBlue/40 hover:bg-surface",
            ].join(" ")}
          >
            <span
              className={`material-symbols-rounded transition-colors ${selected ? "text-[#1A73E8]" : "text-textSecondary group-hover:text-googleBlue"}`}
              style={{ fontSize: 17 }}
              aria-hidden="true"
            >
              {chipIcon(k.label)}
            </span>
            {k.label}
            <span
              className={`material-symbols-rounded -mr-1 transition-all ${selected ? "scale-100 text-[#1A73E8]" : "scale-0 text-transparent"}`}
              style={{ fontSize: 17, fontVariationSettings: "'FILL' 1", width: selected ? 17 : 0 }}
              aria-hidden="true"
            >
              check_circle
            </span>
          </button>
        );
      })}
    </div>
  );
}
