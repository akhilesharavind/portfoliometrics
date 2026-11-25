/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff5f14',
          hover: '#e6510e',
          active: '#cc450a',
          light: 'rgba(255, 95, 20, 0.12)',
          dark: '#993306',
        },
        // Crox-inspired precision engineering slate & titanium ramp
        graphite: {
          deep: '#141415',
          bg: '#1a1b1c',
          card: '#1f2022',
          raised: '#282829',
          text: '#e3e7eb',
          secondary: '#969696',
          muted: '#686a73',
          // Light equivalents (Drafting paper & titanium silver)
          lightBg: '#e3e7eb',
          lightCard: '#ffffff',
          lightRaised: '#d9dee3',
          lightText: '#1a1b1c',
          lightSecondary: '#505159',
          lightMuted: '#7a7d84',
        },
        crox: {
          orange: '#ff5f14',
          dark: '#1a1b1c',
          card: '#1f2022',
          plate: '#282829',
          light: '#e3e7eb',
          hairline: 'rgba(227, 231, 235, 0.1)',
        },
        semantic: {
          positive: '#10b981',
          positiveLight: '#059669',
          negative: '#ef4444',
          negativeLight: '#dc2626',
          warning: '#f59e0b',
          warningLight: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
