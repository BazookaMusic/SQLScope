module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust the paths according to your project structure
  ],
  theme: {
    extend: {
      colors: {
        dracula: {
          background: '#282a36',
          foreground: '#f8f8f2',
          selection: '#44475a',
          comment: '#6272a4',
          cyan: '#8be9fd',
          green: '#50fa7b',
          orange: '#ffb86c',
          pink: '#ff79c6',
          purple: '#bd93f9',
          red: '#ff5555',
          yellow: '#f1fa8c',
        },
      },
    },
  },
  fontFamily: {
    sans: ['Helvetica', 'Arial', 'sans-serif'],
    serif: ['Georgia', 'serif'],
    mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
  },
  plugins: [],
};