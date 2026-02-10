/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#EA580C", // Premium Burnt Orange
        secondary: "#14B8A6", // Sophisticated Teal
        accent: "#FBBF24", // Warm Gold
        dark: "#1F2937", // Deep Charcoal
        light: "#F3F4F6" // Soft Gray
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
