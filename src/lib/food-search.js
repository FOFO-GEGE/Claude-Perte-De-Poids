import { FOOD_DB } from "../data/food-db.js";

// ── Recherche d'aliments ──────────────────────────────────────────────────
export function normalise(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function searchLocal(q) {
  const n = normalise(q.trim());
  if (!n) return [];
  return FOOD_DB
    .filter(f => normalise(f.name).includes(n))
    .map(f => ({
      name: f.name,
      brand: f.brand || "",
      kcal: f.kcal100,
      unit: f.unit,
      serving: f.portionQty ? { grams: f.portionQty, label: f.portionLabel } : null,
      local: true,
    }))
    .slice(0, 10);
}

// Tri de pertinence : correspondance exacte > début de mot > contenu > nom court
export function rankResults(items, query) {
  const q = normalise(query.trim());
  return items
    .map(it => {
      const n = normalise(it.name);
      let score = 3;
      if (n === q) score = 0;
      else if (n.startsWith(q)) score = 1;
      else if (n.includes(q)) score = 2;
      return { item: it, score, len: n.length };
    })
    .sort((a, b) => a.score - b.score || a.len - b.len)
    .map(r => r.item);
}

// Portion : Open Food Facts expose serving_quantity (nombre) et/ou serving_size ("30 g")
// La base locale n'a pas cette notion — les portions n'apparaissent que sur les produits OFF.
export function parseServing(p) {
  const q = Number(p.serving_quantity);
  if (q > 0 && q < 2000) return { grams: q, label: p.serving_size || `${q} g` };
  if (p.serving_size) {
    const m = String(p.serving_size).match(/([\d.,]+)\s*g/i);
    if (m) {
      const g = parseFloat(m[1].replace(",", "."));
      if (g > 0 && g < 2000) return { grams: g, label: p.serving_size };
    }
  }
  return null;
}

// Fusionne base locale (aliments simples) + résultats API (produits emballés), sans doublons de nom
export function mergeResults(local, apiItems) {
  const apiNames = new Set(apiItems.map(p => normalise(p.name)));
  const localFiltered = local.filter(l => !apiNames.has(normalise(l.name)));
  return [...localFiltered, ...apiItems];
}

// Retourne { items, offline } — plus jamais de repli silencieux invisible
export async function searchFood(query) {
  const local = searchLocal(query);
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=25`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("http " + res.status);
    const data = await res.json();
    const items = (data.products || [])
      .filter(p => p.product_name)
      .map(p => {
        const n = p.nutriments || {};
        const kcal = n["energy-kcal_100g"]
          ?? n["energy-kcal"]
          ?? (n["energy_100g"] ? Math.round(n["energy_100g"] / 4.184) : null)
          ?? (n["energy"] ? Math.round(n["energy"] / 4.184) : null);
        return {
          name: p.product_name,
          brand: p.brands ? p.brands.split(",")[0].trim() : "",
          kcal,
          serving: parseServing(p),
        };
      })
      .filter(p => p.kcal != null && p.kcal > 0);

    // Aliments simples (base locale) + produits emballés (API), triés par pertinence
    return { items: rankResults(mergeResults(local, items), query).slice(0, 12), offline: false };
  } catch {
    return { items: local, offline: true };
  }
}
