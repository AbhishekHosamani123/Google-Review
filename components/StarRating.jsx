// Inline-SVG Material star — no icon-font dependency, so the stars never flash
// as text.
//
// Design notes (Google Maps review language):
//  - filled: gold fill #FBBC04 with a deep-gold rounded outer rim (paint-order
//    stroke keeps the fill on top so the rim shows only around the silhouette)
//    plus a whisper of a drop shadow for tactility
//  - empty: soft gray shell (#F1F3F4 with a #DADCE0 edge) instead of a thin
//    hairline, so the row reads as five real stars at every rating
//  - tap: the newly filled star pops with a spring-time keyframe (reduced
//    motion users get the instant swap via the global freeze in globals.css)
const STAR_PATH = "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

function Star({ filled, size, pop }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className="block"
      style={{
        ...(filled ? { filter: "drop-shadow(0 1px 1px rgba(249,171,0,0.4))" } : null),
        ...(pop ? { animation: "starPop 340ms cubic-bezier(0.34, 1.56, 0.64, 1)" } : null),
      }}
    >
      {filled ? (
        <path d={STAR_PATH} fill="#FBBC04" stroke="#F9AB00" strokeWidth="3.2" strokeLinejoin="round" paintOrder="stroke" />
      ) : (
        <path d={STAR_PATH} fill="#F1F3F4" stroke="#DADCE0" strokeWidth="1.8" strokeLinejoin="round" />
      )}
    </svg>
  );
}

const LABELS = [
  { text: "Poor", color: "#C5221F", bg: "rgba(197,34,31,0.08)" },
  { text: "Fair", color: "#C5221F", bg: "rgba(197,34,31,0.08)" },
  { text: "Good", color: "#B06000", bg: "rgba(251,188,4,0.14)" },
  { text: "Very good", color: "#188038", bg: "rgba(52,168,83,0.1)" },
  { text: "Excellent", color: "#188038", bg: "rgba(52,168,83,0.1)" },
];

export default function StarRating({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={filled && n === value}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            className="rounded-full p-1 transition-transform duration-150 hover:scale-110 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue focus-visible:ring-offset-1"
          >
            <span className="select-none" key={`${n}-${filled}`}>
              <Star filled={filled} size={34} pop={filled && n === value} />
            </span>
          </button>
        );
      })}
      <span
        className="ml-1.5 rounded-pill px-2.5 py-1 text-[13px] font-bold"
        style={{ color: LABELS[value - 1].color, background: LABELS[value - 1].bg }}
      >
        {LABELS[value - 1].text}
      </span>
    </div>
  );
}
