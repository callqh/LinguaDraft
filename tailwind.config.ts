import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        appBg: "#F3F5F8",
        panel: "#FFFFFF",
        borderSoft: "#E7EBF0",
        accent: "#3B82F6",
        textMain: "#1F2937",
        textMuted: "#6B7280"
      },
      borderRadius: {
        xl2: "18px"
      },
      boxShadow: {
        card: "0 10px 25px rgba(18, 35, 68, 0.06)"
      }
    }
  },
  plugins: []
} satisfies Config;
