// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        fade: "fade 10s infinite ease-in-out",
      },
      keyframes: {
        fade: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
};
