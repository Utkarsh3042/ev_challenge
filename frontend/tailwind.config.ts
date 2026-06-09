import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff3eb',
          100: '#ffe0c7',
          200: '#ffc094',
          300: '#ff9b5c',
          400: '#ff7c2f',
          500: '#FF6B1A',
          600: '#E55A0F',
          700: '#c24408',
          800: '#9b3306',
          900: '#7d2905',
        },
        secondary: {
          50:  '#f0f4f8',
          100: '#d9e2ed',
          200: '#b3c5db',
          300: '#8ba9c9',
          400: '#5a6b85',
          500: '#4a5a72',
          900: '#0F1B2D',
        },
        success: {
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          500: '#EF4444',
          600: '#DC2626',
        },
        canvas: '#F7F8FA',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'Noto Sans Kannada', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        bounceIn: { '0%': { transform: 'scale(0.8)', opacity: '0' }, '70%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      boxShadow: {
        card: '0 2px 12px rgba(15,27,45,0.08)',
        'card-hover': '0 8px 24px rgba(15,27,45,0.14)',
        glow: '0 0 20px rgba(255,107,26,0.3)',
      },
    },
  },
  plugins: [],
}

export default config
