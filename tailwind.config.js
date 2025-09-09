/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/(tabs)/*.{js,jsx,ts,tsx}",
    "./app/shop/*.{js,jsx,ts,tsx}",
    "./app/shop/(top-tabs)/*.{js,jsx,ts,tsx}",
    "./app/modal/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1A3D59',
      },
    },
  },
  plugins: [],
};