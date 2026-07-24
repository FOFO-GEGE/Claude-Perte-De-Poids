import { calcTDEE, calcBudget } from "./metabolism.js";
import { fmt, parseDay, addDays } from "./dates.js";

export const KCAL_PER_KG = 7700;
export const MAX_SIM_DAYS = 400;

// ── Plan : dates ancrées (début figé + objectif théorique figé) ────────────
export function buildPlan(profile, startDate) {
  const tdee = calcTDEE(profile);
  const budget = calcBudget(profile);
  const dailyDeficit = Math.max(1, tdee - budget);
  const kgToLose = Math.max(0, profile.weight - profile.goalWeight);
  const days = Math.max(1, Math.ceil(kgToLose * KCAL_PER_KG / dailyDeficit));
  return {
    startDate,
    startWeight: profile.weight,
    goalWeight: profile.goalWeight,
    days,
    goalDate: fmt(addDays(parseDay(startDate), days)),
  };
}

// ── Simulation jour par jour (passé ET prévisionnel) ──────────────────────
// Les jours renseignés utilisent les vraies calories, les autres le budget théorique.
export function simulate(plan, kcalByDay, tdee, budget) {
  const pts = [{ day: 0, w: plan.startWeight }];
  const start = parseDay(plan.startDate);
  let w = plan.startWeight;
  let reachedDay = null;

  for (let d = 1; d <= MAX_SIM_DAYS; d++) {
    const key = fmt(addDays(start, d - 1));
    const eaten = kcalByDay[key] != null ? kcalByDay[key] : budget;
    w = w - (tdee - eaten) / KCAL_PER_KG;
    pts.push({ day: d, w });
    if (w <= plan.goalWeight) { reachedDay = d; break; }
  }
  return { pts, reachedDay };
}
