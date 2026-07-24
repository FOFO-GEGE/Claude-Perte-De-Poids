// ── Dates (tout en heure LOCALE — fix fuseau horaire) ─────────────────────
const DAY_MS = 86400000;

export const DAY_FR      = ["D", "L", "M", "M", "J", "V", "S"];
export const DAY_FULL_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export const MONTH_FR    = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "aoû", "sep", "oct", "nov", "déc"];
export const MONTH_FULL  = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function parseDay(dateKey) {
  return new Date(dateKey + "T12:00:00");
}
export function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
// Nombre de jours entre deux clés de date (helper unique — plus de duplication)
export function dayOffset(dateKey, refKey) {
  return Math.round((parseDay(dateKey) - parseDay(refKey)) / DAY_MS);
}

export function fmtShortDate(dateKey) {
  const d = parseDay(dateKey);
  const y = d.getFullYear() !== new Date().getFullYear() ? " " + String(d.getFullYear()).slice(2) : "";
  return `${d.getDate()} ${MONTH_FR[d.getMonth()]}${y}`;
}

export const TODAY = fmt(new Date());
