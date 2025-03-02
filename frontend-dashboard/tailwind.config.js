/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff5470',
        secondary: '#ffe74c',
        accent: '#6bf178',
        destructive: '#ff0000',
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'neo-lg': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'neo-xl': '12px 12px 0px 0px rgba(0, 0, 0, 1)',
      },
    },
  },
  plugins: [],
} 