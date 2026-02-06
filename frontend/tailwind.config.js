/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /**
       * 디자인 시스템 색상 정의
       * - primary: 메인 브랜드 색상 (보라색 #7C3AED 계열)
       * - surface: 배경/카드 등 표면 색상
       */
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7C3AED',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          background: '#F3F3F3',
          card: '#FFFFFF',
          input: '#F5F5F7',
          border: '#E5E5EA',
        },
      },
      borderRadius: {
        card: '16px',
        input: '8px',
        button: '10px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.1)',
        modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      maxWidth: {
        form: '440px',
      },
    },
  },
  plugins: [],
};
