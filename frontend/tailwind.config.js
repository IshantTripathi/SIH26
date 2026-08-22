/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coop: {
          dark: '#0a1d37',
          primary: '#0f2e5a',
          secondary: '#1a4b8c',
          blue: '#2563eb',
          accent: '#b45309',
          gold: '#d97706',
          green: '#166534',
          slate: '#f8fafc',
          border: '#e2e8f0',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
