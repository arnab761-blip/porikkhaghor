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
        background: 'var(--bg-color)',
        foreground: 'var(--fg-color)',
        primary: {
          light: '#13294B',
          dark: '#E8EEF9',
        },
        accent: {
          light: '#F5A524',
          dark: '#FFB938',
        },
        success: {
          light: '#10B981',
          dark: '#34D399',
        },
        error: {
          light: '#F43F5E',
          dark: '#FB7185',
        }
      },
      fontFamily: {
        heading: ['"Anek Bangla"', 'sans-serif'],
        body: ['"Hind Siliguri"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
