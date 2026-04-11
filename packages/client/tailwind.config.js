/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mugen: {
          bg: '#0f0f1a',
          surface: '#1a1a2e',
          accent: '#6366f1',
          danger: '#ef4444',
          success: '#22c55e',
          gold: '#f59e0b',
          mana: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};
