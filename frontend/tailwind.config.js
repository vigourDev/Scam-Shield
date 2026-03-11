/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        danger: '#ef4444',
        warning: '#f59e0b',
        safe: '#10b981',
      }
    },
  },
  plugins: [],
}
