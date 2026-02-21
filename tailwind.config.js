/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        military: {
          DEFAULT: '#14452F',
          50: '#e8f5ee',
          100: '#c5e6d3',
          200: '#9fd5b5',
          300: '#74c396',
          400: '#4faf7c',
          500: '#2d9b63',
          600: '#1f7a4c',
          700: '#14452F',
          800: '#0e3322',
          900: '#082116',
          950: '#04110b'
        },
        sqtt: {
          bg: '#0B6E4F',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          primary: '#059669',
          primaryHover: '#047857',
          text: '#1F2937',
          textLight: '#6B7280',
          gold: '#F59E0B',
          accent: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        card: '0 2px 8px rgba(0, 0, 0, 0.04)'
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
