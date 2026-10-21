// সব রঙ, ইজিং, ফন্ট — এক জায়গায়
export const theme = {
  name: "Kobita Sondhan",
  colors: {
    bg: "#0B0C10",
    hero: "#7C8AA8",
    accent: "#C9A227",
    text: "#F2EDE3",
    muted: "#8A8d96",
    surface: "#14161C",
  },
  radius: 22,
  font: "Noto Serif Bengali",
  easing: {
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
  },
  motion: {
    soft: {damping: 200, mass: 0.7, stiffness: 120},
    snap: {damping: 26, mass: 0.6, stiffness: 220},
  },
};

export type Theme = typeof theme;
