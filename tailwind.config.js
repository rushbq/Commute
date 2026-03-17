/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dfeaff",
          200: "#bdd5ff",
          300: "#8db6ff",
          400: "#5e93ff",
          500: "#336dff",
          600: "#214fd8",
          700: "#1c3fae",
          800: "#1d3989",
          900: "#1d356d"
        }
      },
      boxShadow: {
        panel: "0 24px 64px rgba(15, 23, 42, 0.08)",
        glow: "0 24px 60px rgba(51, 109, 255, 0.18)"
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', '"Noto Sans TC"', "sans-serif"]
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(51, 109, 255, 0.16), transparent 28%), radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.14), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.96))"
      }
    }
  },
  plugins: []
};
