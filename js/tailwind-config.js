window.tailwind = window.tailwind || {};
tailwind.config = {
  theme: {
    extend: {
      screens: {
        xs: "344px", // Menores dispositivos (Galaxy S20 Ultra, etc)
        "mobile-m": "390px",
        "mobile-l": "430px",
        "tablet-sm": "540px", // Surface Duo
        "tablet-md": "820px", // iPad Air / 912px
      },
      colors: {
        wesus: {
          blue: "#0B1F3A",
          "blue-mid": "#0F2847",
          "blue-light": "#142E52",
          // Novas cores de Ouro Reluzente (Alto Contraste)
          "gold-shine": "#FFF8D6" /* Luz forte do reflexo */,
          "gold-pure": "#E6B535" /* Ouro vivo e saturado */,
          "gold-deep": "#8A5A19" /* Sombra metálica densa */,
        },
      },
      fontFamily: {
        playfair: ['"Playfair Display"', "Georgia", "serif"],
        inter: ['"Inter"', "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.10" },
          "50%": { opacity: "0.18" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease forwards",
        "glow-pulse": "glow-pulse 6s ease-in-out infinite",
      },
    },
  },
};
