// PenMark — an original, tiny "pen writing a line" flourish (inline SVG + CSS).
// Used sparingly: the generating state and the draft-ready header on the
// customer review page. Decorative only (aria-hidden), honors
// prefers-reduced-motion via the global CSS override in globals.css.
export default function PenMark({ size = 28, className = "" }) {
  return (
    <svg
      viewBox="0 0 48 40"
      width={size}
      height={Math.round((size * 40) / 48)}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* the written line draws itself left → right */}
      <path
        d="M4 32 C 12 26, 17 36, 25 29 S 36 28, 44 24"
        stroke="#4285F4"
        strokeWidth="3.2"
        strokeLinecap="round"
        className="rh-write"
      />
      {/* the pen glides along with the line */}
      <g className="rh-pen">
        <path d="M31 4 L43 14 L34.5 25 L28 27.5 L30 20.5 Z" fill="#202124" />
        <path d="M31.6 6.2 L40.6 13.6" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
        <path d="M28 27.5 L30 20.5 L34.5 25 Z" fill="#FBBC04" />
      </g>
      {/* sparkles */}
      <path
        d="M8 6 l1.7 4.3 L14 12 l-4.3 1.7 L8 18 l-1.7-4.3 L2 12 l4.3-1.7 Z"
        fill="#FBBC04"
        className="rh-spark"
      />
      <path
        d="M41 2 l1.1 2.9 L45 6 l-2.9 1.1 L41 10 l-1.1-2.9 L37 6 l2.9-1.1 Z"
        fill="#4285F4"
        className="rh-spark"
        style={{ animationDelay: "0.85s" }}
      />
    </svg>
  );
}
