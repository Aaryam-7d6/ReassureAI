/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB", // bright blue
          light: "#60A5FA",
          dark: "#1E40AF",
        },
        accent: {
          DEFAULT: "#34D399", // teal
          light: "#6EE7B7",
          dark: "#059669",
        },
        warm: {
          DEFAULT: "#F59E0B", // warm yellow / friendly
          light: "#FDE68A",
        },
        calm: {
          DEFAULT: "#E9D5FF", // soft lavender for backgrounds
        },
        coral: {
          DEFAULT: "#FB7185",
        },
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
