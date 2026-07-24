import { Preferences } from "@capacitor/preferences";

// Toutes les clés utilisées par l'app — sert à la migration automatique depuis localStorage (PWA).
const KEYS = [
  "wl-accent", "wl-dark", "wl-curve-style", "wl-zoom",
  "wl-profile", "wl-meals", "wl-weigh-ins", "wl-plan",
];
const MIGRATED_FLAG = "wl-migrated-to-preferences";

// Recopie une seule fois les données de l'ancienne PWA (localStorage) vers Preferences,
// pour ne rien perdre au passage à l'app native.
async function migrateFromLocalStorage() {
  const { value: already } = await Preferences.get({ key: MIGRATED_FLAG });
  if (already) return;
  for (const key of KEYS) {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) await Preferences.set({ key, value: v });
    } catch {}
  }
  await Preferences.set({ key: MIGRATED_FLAG, value: "1" });
}

const migration = migrateFromLocalStorage();

export const storage = {
  async get(key, fallback) {
    await migration;
    try {
      const { value } = await Preferences.get({ key });
      if (value == null) return fallback;
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch { return fallback; }
  },
  async set(key, value) {
    try { await Preferences.set({ key, value: JSON.stringify(value) }); } catch {}
  },
};
