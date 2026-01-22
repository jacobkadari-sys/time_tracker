import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Retro DoG color palette
        'dog-orange': '#FF6B35',
        'dog-cream': '#F7F0E3',
        'dog-brown': '#4A3728',
        'dog-tan': '#C9B896',
        'dog-green': '#2D5016',
        'dog-red': '#D32F2F',
        'dog-blue': '#1565C0',
        'dog-gold': '#C9A227',
      },
      fontFamily: {
        'mono': ['Monaco', 'Menlo', 'monospace'],
        'display': ['Georgia', 'serif'],
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px rgba(74, 55, 40, 1)',
        'retro-sm': '2px 2px 0px 0px rgba(74, 55, 40, 1)',
        'retro-lg': '6px 6px 0px 0px rgba(74, 55, 40, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
