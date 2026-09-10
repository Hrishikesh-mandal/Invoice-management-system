/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          light: '#122A4D',
        },
        teal: {
          DEFAULT: '#1F6F5C',
          dark: '#123C39',
        },
        status: {
          paid: '#22C55E',
          pending: '#F59E0B',
          overdue: '#EF4444',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'teal-gradient': 'linear-gradient(135deg, #123C39 0%, #1F6F5C 100%)',
      },
    },
  },
  plugins: [],
};