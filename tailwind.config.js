/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Tailwind будет следить за всеми файлами в папке src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
