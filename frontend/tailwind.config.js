/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050807",
        ink: "#0a100d",
        surface: "#0f1612",
        elevated: "#162019",
        border: "#243028",
        muted: "#7a8f82",
        "ape-lime": "#a3e635",
        "ape-emerald": "#34d399",
        "ape-jungle": "#166534",
        "ape-gold": "#fbbf24",
        "ape-coral": "#fb7185",
        "ape-sky": "#38bdf8",
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-lime": "0 0 40px rgba(163, 230, 53, 0.12)",
        card: "0 8px 32px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease both",
        "pulse-soft": "pulseSoft 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
