/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#132238",
        paper: "#f6f0e8",
        gold: "#c9902b",
        moss: "#28574b",
        brick: "#8a3b2e",
      },
      boxShadow: {
        panel: "0 24px 80px rgba(19, 34, 56, 0.12)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Segoe UI", "Tahoma", "sans-serif"],
      },
    },
  },
  plugins: [],
};
