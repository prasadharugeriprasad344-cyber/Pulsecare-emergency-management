/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FB',
        surface: '#FFFFFF',
        navy: {
          DEFAULT: '#15243B',
          dark: '#0D1726',
          light: '#233857',
        },
        teal: {
          medical: '#12B8A6',
          soft: '#E2F8F4',
          dark: '#0F766E',
        },
        priority: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
        },
        text: {
          primary: '#172033',
          secondary: '#718096',
          muted: '#A0AEC0',
        },
        border: {
          DEFAULT: '#E6EAF0',
          dark: '#CBD5E1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(21, 36, 59, 0.04), 0 1px 2px 0 rgba(21, 36, 59, 0.02)',
        card: '0 4px 6px -1px rgba(21, 36, 59, 0.05), 0 2px 4px -1px rgba(21, 36, 59, 0.03)',
        floating: '0 10px 15px -3px rgba(21, 36, 59, 0.08), 0 4px 6px -2px rgba(21, 36, 59, 0.04)',
      }
    },
  },
  plugins: [],
}
