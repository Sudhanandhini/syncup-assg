/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      colors: {
        brand: {
          50:  '#edfafa',
          100: '#d5f5f6',
          200: '#afeced',
          300: '#7ddde0',
          400: '#41c7cb',
          500: '#25a9ae',
          600: '#1a8a8f',
          700: '#186e73',
          800: '#1a585c',
          900: '#1a494d',
          950: '#092d30',
        },
        surface: {
          DEFAULT: '#0d1117',
          card:    '#161b22',
          border:  '#21262d',
          hover:   '#1c2128',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-up':  'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.8)' },
        },
      },
    },
  },
  plugins: [],
};
