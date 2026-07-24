import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { parseServing } from "./food-search.js";

// ── Code-barres ───────────────────────────────────────────────────────────
export function mapOffProduct(p) {
  const n = p.nutriments || {};
  const kcal = n["energy-kcal_100g"]
    ?? n["energy-kcal"]
    ?? (n["energy_100g"] ? Math.round(n["energy_100g"] / 4.184) : null)
    ?? (n["energy"] ? Math.round(n["energy"] / 4.184) : null);
  if (kcal == null || kcal <= 0 || !p.product_name) return null;
  return {
    name: p.product_name,
    brand: p.brands ? p.brands.split(",")[0].trim() : "",
    kcal,
    serving: parseServing(p),
  };
}

// Endpoint produit d'Open Food Facts — même hôte que la recherche, rien à changer côté sw.js
export async function fetchByBarcode(code) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`
      + `?fields=product_name,brands,nutriments,serving_size,serving_quantity`;
    const res = await fetch(url);
    if (!res.ok) return { item: null, offline: false };
    const data = await res.json();
    if (data.status !== 1 || !data.product) return { item: null, offline: false };
    return { item: mapOffProduct(data.product), offline: false };
  } catch {
    return { item: null, offline: true };
  }
}

// ── Lecture de code-barres sur PHOTO (plus fiable que le flux vidéo) ──────
// Clé de contrôle EAN-8 / EAN-13 / UPC-A : élimine les lectures erronées.
export function validEan(code) {
  if (!/^\d{8}$|^\d{12,13}$/.test(code)) return false;
  const d = code.split("").map(Number);
  const check = d.pop();
  let sum = 0;
  d.reverse().forEach((n, i) => { sum += n * (i % 2 === 0 ? 3 : 1); });
  return (10 - (sum % 10)) % 10 === check;
}

export function canvasFrom(img, scale, angle) {
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas");
  if (angle % 180 === 0) { c.width = w; c.height = h; }
  else { c.width = h; c.height = w; }
  const ctx = c.getContext("2d");
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(angle * Math.PI / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return c;
}

// Essaie plusieurs échelles et rotations : une photo n'est jamais parfaitement cadrée.
export async function decodeBarcodeFromFile(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  } catch { URL.revokeObjectURL(url); return null; }

  // Moteur natif : seulement s'il déclare réellement des formats
  let detector = null;
  if ("BarcodeDetector" in window) {
    try {
      const fs = await window.BarcodeDetector.getSupportedFormats();
      const wanted = ["ean_13", "ean_8", "upc_a", "upc_e"].filter(f => fs.includes(f));
      if (wanted.length) detector = new window.BarcodeDetector({ formats: wanted });
    } catch {}
  }

  // Moteur ZXing restreint aux codes produits + décodage renforcé
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);

  const base = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const scales = base === 1 ? [1] : [base, 1];
  let found = null;

  outer:
  for (const scale of scales) {
    for (const angle of [0, 90, 180, 270]) {
      const canvas = canvasFrom(img, scale, angle);

      if (detector) {
        try {
          const codes = await detector.detect(canvas);
          for (const c of codes) {
            const v = String(c.rawValue).trim();
            if (validEan(v)) { found = v; break outer; }
          }
        } catch {}
      }

      // decodeFromImageUrl : la seule voie qui accepte nos variantes
      const reader = new BrowserMultiFormatReader(hints);
      try {
        const r = await reader.decodeFromImageUrl(canvas.toDataURL("image/jpeg", 0.92));
        const v = r && String(r.getText()).trim();
        if (v && validEan(v)) { found = v; break outer; }
      } catch {}
      try { reader.reset(); } catch {}
    }
  }

  URL.revokeObjectURL(url);
  return found;
}
