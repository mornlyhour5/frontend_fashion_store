/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0B0B0B', secondary: '#1A1A1A' },
        surface: '#242424',
        surface2: '#2C2C2C',
        text: { primary: '#F5F5F5', secondary: '#A0A0A0' },
        gold: {
          50: '#FBF7EE', 100: '#F3E7C9', 200: '#E8D6A3', 300: '#DCC57C',
          400: '#D0B45C', 500: '#C6A75A', 600: '#A88A42', 700: '#8A6F32',
          800: '#6B5424', 900: '#4D3B18',
        },
        light: {
          bg: '#F7F5F2', secondary: '#FFFFFF', surface: '#FFFFFF',
          text: '#1A1A1A', textSecondary: '#6B6B6B',
        },
        border: { dark: '#2E2E2E', light: '#E5E1DA' },
        success: '#4CAF7D', danger: '#D9534F', warning: '#D0A94C', info: '#5B8FB9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        luxury: '0 4px 24px rgba(0, 0, 0, 0.08)',
        'luxury-lg': '0 8px 40px rgba(0, 0, 0, 0.12)',
        gold: '0 0 0 1px rgba(198, 167, 90, 0.3)',
      },
      borderRadius: { xl: '14px', '2xl': '20px' },
    },
  },
  plugins: [],
}
