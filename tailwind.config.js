/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vendix: {
          blue: "#0066FF",
          dark: "#0B1525",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeOut: {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        scaleIntro: {
          "0%": { transform: "scale(0.8)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.8s ease-out forwards",
        fadeOut: "fadeOut 0.8s ease-out forwards",
        scaleIntro: "scaleIntro 1s cubic-bezier(0.16,1,0.3,1) forwards",
        slideUp: "slideUp 0.7s ease-out forwards",
      },
    },
  },
  plugins: [],
}
