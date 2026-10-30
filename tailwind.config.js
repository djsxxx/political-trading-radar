/** @type {import('tailwindcss').Config} */
export default {
  content: ['./frontend/index.html', './frontend/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        canvas: '#070b10',
        panel: '#0d131b',
        line: '#1d2a38',
        cyan: '#43d9ff',
        positive: '#23d9a4',
        negative: '#ff5d72',
        warning: '#f8b84e'
      },
      boxShadow: {
        glow: '0 0 24px rgba(67, 217, 255, 0.08)'
      }
    }
  },
  plugins: []
}
