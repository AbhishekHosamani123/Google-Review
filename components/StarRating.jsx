// Inline-SVG Material star — identical geometry to the icon font, but with
// zero font-loading dependency so the stars never flash as text.
const STAR_PATH = "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

function Star({ filled, size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="block">
      {filled ? (
        <path d={STAR_PATH} fill="#FBBC04" />
      ) : (
        <path d={STAR_PATH} fill="none" stroke="#DADCE0" strokeWidth="1.7" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
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
            className="p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-googleBlue transition-transform active:scale-95"
          >
            <span className="select-none">
              <Star filled={filled} size={32} />
            </span>
          </button>
        );
      })}
      <span className="ml-2 text-sm font-medium text-textSecondary">
        {value === 5 ? "Excellent" : value === 4 ? "Very good" : value === 3 ? "Good" : value === 2 ? "Fair" : "Poor"}
      </span>
    </div>
  );
}
