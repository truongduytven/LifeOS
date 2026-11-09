import type { Config } from "tailwindcss";

const sapphire = {
  50: '#F0F5FC',
  100: '#E1EDF9',
  200: '#C2DBF3',
  300: '#94C0EB',
  400: '#5A9DE0',
  500: '#286EC7',
  600: '#1E5AA8', // Captain's Sapphire Blue
  700: '#164584',
  800: '#13396D',
  900: '#12315A',
  950: '#0C1E38',
};

const sunset = {
  50: '#FEF6ED',
  100: '#FDECDA',
  200: '#FAD6B4',
  300: '#F7BC88',
  400: '#F59A52',
  500: '#F58220', // Captain's Sunset Orange
  600: '#E06D0B',
  700: '#BA5409',
  800: '#94430F',
  900: '#793910',
  950: '#421B06',
};

const vanilla = {
  50: '#FDFAF3',
  100: '#FAF3E3', // Light theme main background
  200: '#F5E6C8', // Captain's Vanilla Cream (secondary/tinted surface)
  300: '#E8D2A6',
  400: '#DBBD83',
  500: '#CBA460',
  600: '#B88E47',
  700: '#967138',
  800: '#7B5C30',
  900: '#654C2A',
  950: '#3A2913',
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Captain's Brand Palette
        sapphire,
        sunset,
        vanilla,
        // Override existing indigo to Sapphire Blue scale
        indigo: sapphire,
        // Override existing violet, amber, and orange to Sunset Orange scale
        violet: sunset,
        amber: sunset,
        orange: sunset,
      },
    },
  },
  plugins: [],
};
export default config;
