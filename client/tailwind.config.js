/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Primary color
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        background: '#F9FAFB',
        divider: '#E5E7EB',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
      },
    },
  },
  plugins: [],
}

