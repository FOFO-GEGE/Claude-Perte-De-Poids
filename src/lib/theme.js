// ── Thème ─────────────────────────────────────────────────────────────────
export const ACCENTS = ["#111111", "#1F8A5B", "#B65538", "#3B5BA9"];

export function getTheme(dark) {
  return dark ? {
    bg: "#0E0E0C", surface: "#161614", text: "#F4F2EC",
    muted: "rgba(244,242,236,0.55)", fainter: "rgba(244,242,236,0.32)",
    hairline: "rgba(244,242,236,0.10)", chipBg: "rgba(244,242,236,0.06)",
  } : {
    bg: "#FAF9F5", surface: "#FFFFFF", text: "#161514",
    muted: "rgba(22,21,20,0.52)", fainter: "rgba(22,21,20,0.30)",
    hairline: "rgba(22,21,20,0.10)", chipBg: "rgba(22,21,20,0.04)",
  };
}
