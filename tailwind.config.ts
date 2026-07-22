import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5B3DF5",
          dark: "#4328D7",
          blue: "#3B82F6",
          accent: "#60A5FA",
        },
        bg: {
          DEFAULT: "#F8FAFF",
          surface: "#FFFFFF",
          secondary: "#F4F6FB",
        },
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
          disabled: "#9CA3AF",
        },
        border: {
          DEFAULT: "#E8ECF5",
        },
        status: {
          success: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },
        dark: {
          bg: "#0B0F1A",
          surface: "#131826",
          secondary: "#1B2233",
          border: "#232B3D",
          textPrimary: "#F1F4FA",
          textSecondary: "#8B93A7",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        btn: "16px",
        input: "16px",
        dialog: "28px",
        badge: "999px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(91,61,245,.12)",
        large: "0 20px 60px rgba(91,61,245,.18)",
        hover: "0 18px 45px rgba(59,130,246,.18)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #6D4CFF 0%, #5B3DF5 30%, #3B82F6 70%, #2F6BFF 100%)",
      },
      transitionDuration: {
        250: "250ms",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-500px 0" }, "100%": { backgroundPosition: "500px 0" } },
      },
      animation: {
        "fade-in": "fade-in .25s ease-in-out",
        "slide-up": "slide-up .3s ease-in-out",
        shimmer: "shimmer 1.5s infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
