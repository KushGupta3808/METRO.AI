/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep app background - darker than the brand navy, for depth
        void: '#070B14',
        // The brand's own navy, sampled straight from the logo mark
        obsidian: '#0E1A30',
        // Slightly lifted navy for glass panels/cards
        panel: '#122240',
        // Brand green, sampled from the logo checkmark/arrow
        emeraldNeon: '#0FB87F',
        emeraldDeep: '#08976B',
        // Functional accents the brief calls for (not in the mark itself)
        amberNeon: '#F6B93B',
        sapphireNeon: '#4FC3F7',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-emerald': '0 0 30px -5px rgba(15,184,127,0.55)',
        'glow-amber': '0 0 30px -5px rgba(246,185,59,0.55)',
        'glow-sapphire': '0 0 30px -5px rgba(79,195,247,0.55)',
      },
      keyframes: {
        pulseGlow: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
        floatY: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        'float-y': 'floatY 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
