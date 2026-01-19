/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Это активирует класс "dark" из тега <html>
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#121212',
        primary: '#6d28d9',
        secondary: '#2563eb',
        accent: '#00d4ff',
      },
    },
  },
  plugins: [],
}
