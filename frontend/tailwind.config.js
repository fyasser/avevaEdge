module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        aveva: {
          primary: '#00558C',    // AVEVA Primary Blue
          secondary: '#0078D4',  // AVEVA Secondary Blue
          accent: '#00A3E0',     // AVEVA Accent Blue
          dark: '#1A1A1A',       // Dark Gray
          light: '#F4F4F9',      // Light Background
          gray: '#6C757D',       // Text Gray
          success: '#28A745',    // Success Green
          warning: '#FFC107',    // Warning Yellow
          danger: '#DC3545',     // Error Red
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}