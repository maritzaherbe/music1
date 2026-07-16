import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.94) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "progress-slide": {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(120%)" },
          "100%": { transform: "translateX(340%)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(24px, -28px) scale(1.06)" },
          "66%": { transform: "translate(-18px, 18px) scale(0.96)" },
        },
        eq: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "progress-slide": "progress-slide 1.8s ease-in-out infinite",
        float: "float 15s ease-in-out infinite",
        "float-slow": "float 22s ease-in-out infinite",
        eq: "eq 0.9s ease-in-out infinite",
        pop: "pop 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
