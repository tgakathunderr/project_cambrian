/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#00170f",
        surface: "#00170f",
        "surface-bright": "#263e34",
        "surface-container": "#0b241b",
        "surface-container-high": "#162f25",
        "surface-container-highest": "#213a30",
        "surface-container-low": "#072017",
        "surface-container-lowest": "#00120b",
        "on-surface": "#cde9db",
        "on-surface-variant": "#c7c6cb",
        outline: "#919095",
        "outline-variant": "#46464b",
        primary: "#c7c6cc",
        "on-primary": "#2f3035",
        secondary: "#dec2a0", // Champagne Gold
        "on-secondary": "#3e2d15",
        "secondary-container": "#574329",
        tertiary: "#c0c6de",   // Heather Lavender
        "on-tertiary": "#293043",
        "tertiary-container": "#030718",
        neutral: "#8da89b",    // Eucalyptus Sage
        error: "#ffb4ab",      // Sunset Terracotta
        "error-container": "#93000a",
      },
      fontFamily: {
        headline: ["Outfit", "sans-serif"],
        body: ["Syne", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      spacing: {
        "glass-padding": "20px",
        "margin-desktop": "48px",
        gutter: "24px",
      }
    },
  },
  plugins: [],
}
