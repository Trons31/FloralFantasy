/** @type {import('tailwindcss').Config} */

// Paleta rosa de la marca. `brand` es un alias de `primary` para que el
// codigo portado de CliqCut (que usa `brand-*`) funcione sin traducir clases.
const rose = {
  50:  "#fff0f5",
  100: "#ffe0ec",
  200: "#ffc2d9",
  300: "#ff94bc",
  400: "#ff5c97",
  500: "#f72d72",
  600: "#e8185a",
  700: "#c40d47",
  800: "#a30e3f",
  900: "#8a1039",
  950: "#54031e",
};

const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: rose,
        brand: rose,
        gold: {
          50:  "#fdfaed",
          100: "#faf2cc",
          200: "#f4e295",
          300: "#edcc5a",
          400: "#e8b830",
          500: "#d89a18",
          600: "#b97512",
          700: "#955412",
          800: "#7b4216",
          900: "#683717",
          950: "#3c1c09",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans:    ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      // Apertura de carrito y menú (spec 011): un fade corto en CSS, más
      // barato que deslizar con framer-motion.
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out both",
      },
    },
  },
  plugins: [],
};

module.exports = config;