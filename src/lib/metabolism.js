// ── Calculs métaboliques ──────────────────────────────────────────────────
export const ACTIVITY_LEVELS = [
  { value: 1.2,   label: "Sédentaire" },
  { value: 1.375, label: "Légèrement actif" },
  { value: 1.55,  label: "Modérément actif" },
  { value: 1.725, label: "Très actif" },
];

export const DEFAULT_PROFILE = { weight: 68.4, height: 170, age: 30, sex: "homme", activity: 1.375, goalWeight: 62.0 };

export function calcBMR(p) {
  const b = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return p.sex === "homme" ? b + 5 : b - 161;
}
export function calcTDEE(p)   { return Math.round(calcBMR(p) * p.activity); }
export function calcBudget(p) { return Math.max(1200, calcTDEE(p) - 500); }
