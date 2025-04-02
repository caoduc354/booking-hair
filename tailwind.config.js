// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        fadeInScale: {
          "0%": { opacity: 0, transform: "scale(0.9)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      animation: {
        fadeInScale: "fadeInScale 0.3s ease-out forwards",
      },
    },
  },
};
