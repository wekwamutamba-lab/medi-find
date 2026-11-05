/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        palette: {
          slate: "250 250 252",
          rose: "235 64 52",
          amber: "254 243 193",
          emerald: "167 185 151",
        },
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
