/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.05)',
        },
        text: {
          primary: 'rgba(255, 255, 255, 0.9)',
          secondary: 'rgba(255, 255, 255, 0.5)',
          tertiary: 'rgba(255, 255, 255, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '28px',
      },
      borderRadius: {
        'glass-lg': '24px',
        'glass-md': '16px',
        'glass-sm': '8px',
      },
      animation: {
        float: 'float 8s ease-in-out infinite alternate',
        'float-slow': 'floatSlow 12s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-10px)' },
        },
        floatSlow: {
          '0%': { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
          '50%': { transform: 'translate3d(10px, -15px, 20px) rotate(1deg)' },
          '100%': { transform: 'translate3d(-5px, 10px, -10px) rotate(-1deg)' },
        },
      },
    },
  },
  plugins: [],
}
