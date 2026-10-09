/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        surface: '#131a30',
        line: '#26304f',
        muted: '#8e99b8',
        brand: { DEFAULT: '#6366f1', dark: '#4f52d9' },
        ok: '#22c55e',
        bad: '#ef4444',
        warn: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};