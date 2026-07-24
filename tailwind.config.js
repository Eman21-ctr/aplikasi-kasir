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
          50: '#021411',
          100: '#05221c',
          200: '#10332a',
          300: '#204a40',
          400: '#386e61',
          500: '#60998a',
          600: '#88b8ac',
          700: '#b4d5cc',
          800: '#d1e6e0',
          850: '#e6f2ee',
          900: '#ffffff',
          950: '#f4f9f7',
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
