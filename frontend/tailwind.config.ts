import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "sf-pro": [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      spacing: {
        '0.125': '0.125rem', // 2px
        '0.25': '0.25rem',   // 4px
        '0.375': '0.375rem', // 6px
        '0.5': '0.5rem',     // 8px
        '0.75': '0.75rem',   // 12px
        '1.25': '1.25rem',   // 20px
        '1.5': '1.5rem',     // 24px
        '2.25': '2.25rem',   // 36px
        '2.75': '2.75rem',   // 44px
        '6.25': '6.25rem',   // 100px
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      minHeight: {
        'touch': '2.75rem', // 44px - Apple's recommended touch target
        'touch-sm': '2.25rem', // 36px
        'touch-lg': '3rem', // 48px
      },
      maxWidth: {
        'mobile': '100%',
        'tablet': '95%',
        'desktop': '92%',
      },
    },
  },
  plugins: [],
};

export default config;
