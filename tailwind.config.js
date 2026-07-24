/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eafaf1',
          100: '#d5f5e3',
          200: '#abebc6',
          300: '#82e0aa',
          400: '#58d68d',
          500: '#00b050', // Tring Pegadaian vibrant green
          600: '#009644',
          700: '#007b37',
          800: '#00622c',
          900: '#004a21',
        },
        slate: {
          50: '#f2f8f6',
          100: '#e1efeb',
          200: '#c5dfd7',
          300: '#9dcbbe',
          400: '#6eb09e',
          500: '#4c9380',
          600: '#397868',
          700: '#2c5f52',
          800: '#1b4f44',
          850: '#0e3d33',
          900: '#083028',
          950: '#05221c',
        }
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
