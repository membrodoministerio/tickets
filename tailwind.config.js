/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00205B', // Azul escuro
          light: '#1A3A7A',
          dark: '#001845',
        },
        secondary: {
          DEFAULT: '#FFFFFF', // Branco
        },
        accent: '#0056B3',
        background: '#F5F7FA',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
