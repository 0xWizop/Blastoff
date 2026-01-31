import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blastoff: {
          bg: '#0a0a0a',
          surface: '#111111',
          border: '#1a1a1a',
          orange: '#ff6b00',
          'orange-dark': '#cc5500',
          'orange-light': '#ff8533',
          'orange-glow': 'rgba(255, 107, 0, 0.15)',
          'green-glow': 'rgba(0, 200, 83, 0.15)',
          'red-glow': 'rgba(255, 61, 0, 0.15)',
          text: '#ffffff',
          'text-secondary': '#a0a0a0',
          'text-muted': '#666666',
          success: '#00c853',
          error: '#ff3d00',
          warning: '#ffab00',
        },
      },
      fontFamily: {
        display: ['Byte Bounce', 'Arcade Classic', 'Press Start 2P', 'cursive'],
        logo: ['VT323', 'Share Tech Mono', 'monospace'],
        body: ['Space Grotesk', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
        full: '9999px', // Keep circular for spinners, avatars, etc.
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255, 107, 0, 0.3)',
        'glow-orange-sm': '0 0 10px rgba(255, 107, 0, 0.2)',
        'glow-green': '0 0 12px rgba(0, 200, 83, 0.25)',
        'glow-red': '0 0 12px rgba(255, 61, 0, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 107, 0, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 107, 0, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
