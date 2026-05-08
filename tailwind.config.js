/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'capta-bg': '#0b1326',
        'capta-primary': '#2fd9f4',
        'capta-surface-lowest': '#060e20',
        'capta-surface-low': '#131b2e',
        'capta-surface-high': '#222a3d',
        'capta-surface-highest': '#2d3449',
      },
      fontFamily: {
        'space': ['"Space Grotesk"', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'none': '0px',
      }
    },
  },
  plugins: [],
}
