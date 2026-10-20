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
            <span
              className="material-symbols-rounded select-none"
              style={{
                fontSize: 32,
                fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400`,
                color: filled ? "#FBBC04" : "#DADCE0",
              }}
            >
              star
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
