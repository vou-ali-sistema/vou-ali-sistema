/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'countdown-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.92', transform: 'scale(1.06)' },
        },
        'countdown-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(255,255,255,0.06)' },
          '50%': { opacity: '1', boxShadow: '0 0 28px rgba(255,255,255,0.12)' },
        },
        'countdown-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'countdown-motion': {
          '0%, 100%': { transform: 'translateY(0)', boxShadow: '0 0 20px rgba(255,255,255,0.06)' },
          '50%': { transform: 'translateY(-3px)', boxShadow: '0 0 30px rgba(255,255,255,0.1)' },
        },
      },
      animation: {
        'countdown-pulse': 'countdown-pulse 0.4s ease-out',
        'countdown-glow': 'countdown-glow 2.5s ease-in-out infinite',
        'countdown-float': 'countdown-float 3s ease-in-out infinite',
        'countdown-motion': 'countdown-motion 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

