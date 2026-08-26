/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"Cinzel"', '"Georgia"', 'serif'],
        mono: ['"JetBrains Mono"', '"Consolas"', 'monospace'],
      },
    },
  },
  plugins: []
}