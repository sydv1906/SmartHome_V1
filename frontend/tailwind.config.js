/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090D16',
        darkCard: '#111827',
        darkCardHover: '#1F2937',
        teslaBlue: '#3B82F6',
        neonCyan: '#00F0FF',
        neonEmerald: '#00FF9D',
        neonAmber: '#FFB800',
        neonRose: '#FF3B3B',
      },
      boxShadow: {
        glowCyan: '0 0 20px -3px rgba(0, 240, 255, 0.4)',
        glowEmerald: '0 0 20px -3px rgba(0, 255, 157, 0.4)',
        glowAmber: '0 0 20px -3px rgba(255, 184, 0, 0.4)',
        glowRose: '0 0 20px -3px rgba(255, 59, 59, 0.4)',
      },
      animation: {
        pulseFast: 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        floatSlow: 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
