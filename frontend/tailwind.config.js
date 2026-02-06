/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366F1',
          600: '#6366F1',
          700: '#4f46e5',
          800: '#4338ca',
          900: '#3730a3',
        },
        surface: {
          background: '#F7F8FA',
          card: '#FFFFFF',
          input: '#F0F1F3',
          border: '#E5E7EB',
        },
      },
      borderRadius: {
        card: '16px',
        input: '8px',
        button: '8px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-drag': '0 12px 28px rgba(0, 0, 0, 0.15)',
        auth: '0 4px 20px rgba(0, 0, 0, 0.05)',
        modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      maxWidth: {
        form: '440px',
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.02em',
      },
    },
  },
  plugins: [],
};
