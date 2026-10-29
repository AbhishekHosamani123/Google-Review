// Chip icon per highlight — material symbols, fuzzy-mapped from the label.
// The ladder covers every preset/extra keyword across all business categories
// (Hotel, Restaurant, Cafe, Bakery, Gym, Hospital, Clinic, Salon, Spa, Store,
// Bar, Other) plus owner-written custom keywords; unmatched labels fall back
// to a warm heart that reads as "loved it".
function chipIcon(label) {
  const s = String(label).toLowerCase();
  const ifMatch = (re, icon) => (re.test(s) ? icon : null);
  const found =
    // specific things first, generic traits after
    ifMatch(/check-?in/, "how_to_reg") ||
    ifMatch(/booking|appointment|reserv|admission/, "event_available") ||
    ifMatch(/washroom|wash\b/, "wash") ||
    ifMatch(/wifi|wi-fi/, "wifi") ||
    ifMatch(/music/, "music_note") ||
    ifMatch(/coffee|espresso/, "local_cafe") ||
    ifMatch(/breakfast/, "free_breakfast") ||
    ifMatch(/bake|bakery/, "bakery_dining") ||
    ifMatch(/sweet|cake|dessert/, "cake") ||
    ifMatch(/spice/, "local_fire_department") ||
    ifMatch(/food|delicious|tasty|taste|dish|meal|snack|authentic|presentation|ingredients/, "restaurant") ||
    ifMatch(/drink|beverage|bar\b|bartender/, "local_bar") ||
    ifMatch(/caring|nurse|welcom|hospitality/, "volunteer_activism") ||
    ifMatch(/doctor|physician|medical|hospital|clinic|diagnos|treatment|care\b/, "medical_services") ||
    ifMatch(/staff|team|barista|reception|attendant|desk|courteous|polite/, "support_agent") ||
    ifMatch(/family/, "family_restroom") ||
    ifMatch(/group|crowd/, "groups") ||
    ifMatch(/parking/, "local_parking") ||
    ifMatch(/location|accessib/, "location_on") ||
    ifMatch(/bill|receipt|fees|price|pricing|value|affordab|reasonable/, "payments") ||
    ifMatch(/gyms?\b|fitness|equipment|trainer|exercise|training/, "fitness_center") ||
    ifMatch(/massage|spa\b|relax/, "spa") ||
    ifMatch(/therapist/, "self_improvement") ||
    ifMatch(/facilit/, "apartment") ||
    ifMatch(/style|salon|hair/, "content_cut") ||
    ifMatch(/bed|sleep/, "king_bed") ||
    ifMatch(/seat|chair|seating/, "chair") ||
    ifMatch(/view|scenic/, "landscape") ||
    ifMatch(/collection|variety|display|store\b|shopping|market/, "storefront") ||
    ifMatch(/stock|products|inventory|packaging|packages|gift/, "inventory_2") ||
    ifMatch(/redeem|offer|discount/, "redeem") ||
    ifMatch(/billing|exchange|refund/, "sync_alt") ||
    ifMatch(/waiting|schedule|timing|timer|punctual/, "schedule") ||
    ifMatch(/ambian|ambien|vibe|cozy|chill|calm|peaceful|quiet|fresh\b|eco|atmosphere|decor|lively/, "eco") ||
    ifMatch(/clean|hygien|spotless|tidy|sanit/, "cleaning_services") ||
    ifMatch(/quick|fast|prompt|swift|efficient|responsive|response|express/, "bolt") ||
    ifMatch(/service|helpful|attention|support|assist/, "volunteer_activism") ||
    ifMatch(/professional|quality|well.?managed|organized|skilled|expert|perfect|premium|certified|licensed|staffed/, "verified") ||
    ifMatch(/comfort|comfy/, "king_bed") ||
    ifMatch(/recommended|recommend|favorite|loved/, "recommend") ||
    "favorite";
  return found;
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
