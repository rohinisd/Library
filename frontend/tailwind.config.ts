import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        candy: {
          pink: "#FF6B9D",
          mint: "#7FDBDA",
          lemon: "#FFE66D",
          grape: "#C9B1BD",
          sky: "#81D4FA",
          peach: "#FFAB91",
          lavender: "#E1BEE7",
        },
      },
      animation: {
        bounce: "bounce 1s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
