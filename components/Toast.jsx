export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-textPrimary px-5 py-3 text-sm font-medium text-white shadow-lg"
      style={{ animation: "toastIn 200ms ease-out" }}
    >
      <span className="flex items-center gap-2">
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: "#34A853", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        {message}
      </span>
    </div>
  );
}
