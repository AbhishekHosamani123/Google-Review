/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        googleBlue: "#4285F4",
        googleGreen: "#34A853",
        googleYellow: "#FBBC04",
        googleRed: "#EA4335",
        surface: "#F8F9FA",
        cardBorder: "#DADCE0",
        textPrimary: "#202124",
        textSecondary: "#5F6368",
        chipSelected: "#E8F0FE",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Roboto", "system-ui", "sans-serif"],
        display: ["var(--font-bricolage)", "Bricolage Grotesque", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
        cardHover: "0 2px 6px rgba(60,64,67,0.2), 0 4px 12px rgba(60,64,67,0.12)",
        // premium layered depth (hairline + soft ambient + tight contact)
        raised: "0 2px 4px rgba(11,11,11,0.05), 0 24px 48px -16px rgba(11,40,46,0.22)",
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
}
