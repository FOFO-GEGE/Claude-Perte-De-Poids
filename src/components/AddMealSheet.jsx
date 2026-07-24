import { useState, useEffect, useRef } from "react";
import { searchFood } from "../lib/food-search.js";
import { decodeBarcodeFromFile, fetchByBarcode } from "../lib/barcode.js";
import { Spinner } from "./Spinner.jsx";

export function AddMealSheet({ open, onClose, onSave, onDelete, theme, accent, dayLabel, editing }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editName, setEditName] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [offline, setOffline] = useState(false);
  const [unit, setUnit] = useState("g");
  const [rawQty, setRawQty] = useState("100");
  const [manualKcal, setManualKcal] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const photoRef = useRef(null);

  const isEdit = !!editing;

  useEffect(() => {
    if (!open) return;
    setQuery(""); setResults([]); setLoading(false); setHasSearched(false); setOffline(false);
    setScanBusy(false); setNotice(null);
    if (editing) {
      setEditName(editing.name);
      if (editing.kcalPer100 != null) {
        setSelected({
          name: editing.name, brand: "", kcal: editing.kcalPer100,
          unit: editing.baseUnit || "g",
          serving: editing.servingSize ? { grams: editing.servingSize, label: editing.servingLabel || editing.servingSize + " g" } : null,
        });
        setUnit(editing.unit || "g");
        setRawQty(String(editing.qty != null ? editing.qty : 100));
        setManualKcal("");
      } else {
        // Repas ancien : pas de kcal/100 g mémorisées → édition directe des calories
        setSelected(null);
        setManualKcal(String(editing.kcal ?? ""));
      }
    } else {
      setSelected(null); setEditName(""); setUnit("g"); setRawQty("100"); setManualKcal("");
    }
  }, [open, editing]);

  const runSearch = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true); setOffline(false);
    const { items, offline: off } = await searchFood(q);
    setResults(items); setOffline(off); setHasSearched(true); setLoading(false);
  };

  const handleSelect = (item) => {
    setSelected(item);
    setEditName(item.brand ? item.name + " · " + item.brand : item.name);
    setManualKcal("");
    if (item.serving) { setUnit("portion"); setRawQty("1"); }
    else { setUnit(item.unit || "g"); setRawQty("100"); }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setScanBusy(true); setNotice("Analyse de la photo…"); setOffline(false);

    const code = await decodeBarcodeFromFile(file);
    if (!code) {
      setScanBusy(false);
      setNotice("Aucun code lisible. Reprenez la photo de plus près, bien à plat et sans reflet.");
      return;
    }

    setNotice("Code " + code + " — recherche du produit…");
    const { item, offline: off } = await fetchByBarcode(code);
    setScanBusy(false);
    setHasSearched(true);
    if (off) { setOffline(true); setResults([]); setNotice("Hors ligne — code " + code + " non vérifiable."); return; }
    if (!item) {
      setResults([]); setQuery(code);
      setNotice("Code " + code + " introuvable dans Open Food Facts. Cherchez par nom.");
      return;
    }
    setNotice(null);
    setResults([item]);
    setQuery(item.name);
    handleSelect(item);
  };

  const qty = parseFloat(String(rawQty).replace(",", ".")) || 0;
  const serving = selected && selected.serving;
  const baseUnit = (selected && selected.unit) || "g"; // "g" ou "ml" — mesure de base de l'aliment (liquide vs solide)
  const grams = unit === "portion" && serving ? qty * serving.grams : qty;
  const computedKcal = selected ? Math.round(selected.kcal * grams / 100) : 0;
  const manualKcalNum = parseInt(manualKcal, 10);
  const canSave = selected ? (qty > 0 && editName.trim() !== "") : (!isNaN(manualKcalNum) && manualKcalNum >= 0 && editName.trim() !== "");

  const handleSave = () => {
    if (!canSave) return;
    if (selected) {
      onSave({
        name: editName.trim(),
        kcal: computedKcal,
        kcalPer100: selected.kcal,
        qty, unit,
        servingSize: serving ? serving.grams : null,
        servingLabel: serving ? serving.label : null,
        baseUnit,
      });
    } else {
      onSave({ name: editName.trim(), kcal: manualKcalNum, kcalPer100: null, qty: null, unit: null });
    }
  };

  const QTY_PRESETS = unit === "portion"
    ? [0.5, 1, 1.5, 2, 3]
    : (baseUnit === "ml" ? [100, 150, 200, 250, 330, 500] : [30, 50, 100, 150, 200, 250]);

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)", animation: "fadeIn 240ms ease" }} />
      <div style={{ position: "relative", background: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: "14px 22px 24px", animation: "sheetIn 320ms cubic-bezier(.2,.7,.2,1)", boxShadow: "0 -8px 40px rgba(0,0,0,0.16)", maxHeight: "88%", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: theme.hairline, margin: "0 auto 12px", flexShrink: 0 }} />

        <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.fainter, marginBottom: 10, flexShrink: 0 }}>
          {isEdit ? "Modifier" : "Ajouter"} · {dayLabel}
        </div>

        {/* Recherche : champ + bouton */}
        <div style={{ marginBottom: 10, flexShrink: 0 }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input autoFocus={!isEdit} value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") runSearch(); }}
              placeholder={isEdit ? "Remplacer l'aliment…" : "Nutella, banane, saumon…"}
              style={{ width: "100%", height: 46, borderRadius: 12, border: `1px solid ${loading ? accent : theme.hairline}`, background: theme.chipBg, color: theme.text, fontSize: 15, padding: "0 38px 0 14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color 200ms" }}
            />
            {query && !loading && (
              <button onClick={() => { setQuery(""); setResults([]); setHasSearched(false); }}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: theme.fainter, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
          <button onClick={runSearch} disabled={!query.trim() || loading}
            style={{ height: 46, width: "100%", borderRadius: 12, border: "none", background: query.trim() && !loading ? accent : theme.chipBg, color: query.trim() && !loading ? "#fff" : theme.fainter, fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: query.trim() && !loading ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loading ? <Spinner accent="#fff" /> : "Chercher"}
          </button>
        </div>

        {/* Scan par photo — sous la barre de recherche */}
        {/* Sans capture="environment" : le natif propose appareil photo ET galerie au clic */}
        <input ref={photoRef} type="file" accept="image/*"
          onChange={handlePhoto} style={{ display: "none" }} />

        <button onClick={() => { setNotice(null); photoRef.current && photoRef.current.click(); }}
          disabled={scanBusy}
          style={{ height: 44, width: "100%", marginBottom: 12, borderRadius: 12, border: `1px solid ${theme.hairline}`, background: theme.chipBg, color: scanBusy ? theme.fainter : theme.text, fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: scanBusy ? "default" : "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
          {scanBusy ? <Spinner accent={accent} /> : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <path d="M7 8v8M10.5 8v8M14 8v8M17 8v8" />
            </svg>
          )}
          {scanBusy ? "Analyse…" : "QR code"}
        </button>

        {/* Panneau aliment : quantité + validation */}
        {(selected || isEdit) && (
          <div style={{ background: theme.chipBg, border: `1px solid ${accent}55`, borderRadius: 14, padding: "12px 14px", marginBottom: 10, flexShrink: 0 }}>
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom du repas"
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: theme.text, fontSize: 14, fontFamily: "inherit", marginBottom: 10 }} />

            {selected ? (
              <>
                {/* Unité : mesure de base (grammes ou millilitres selon l'aliment) / portion */}
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {[baseUnit, "portion"].map(u => {
                    const disabled = u === "portion" && !serving;
                    return (
                      <button key={u} disabled={disabled}
                        onClick={() => {
                          setUnit(u);
                          setRawQty(u === "portion" ? "1" : "100");
                        }}
                        style={{ flex: 1, height: 32, borderRadius: 999, border: `1px solid ${unit === u ? accent : theme.hairline}`, background: unit === u ? accent : "transparent", color: unit === u ? "#fff" : (disabled ? theme.fainter : theme.text), fontSize: 12, fontFamily: "inherit", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1 }}>
                        {u === "portion" ? "Portion" : (u === "ml" ? "Millilitres" : "Grammes")}
                      </button>
                    );
                  })}
                </div>
                {unit === "portion" && serving && (
                  <div style={{ fontSize: 11, color: theme.fainter, marginBottom: 8 }}>
                    1 portion = {serving.label}
                  </div>
                )}
                {!serving && (
                  <div style={{ fontSize: 11, color: theme.fainter, marginBottom: 8 }}>
                    Aucune portion connue pour cet aliment.
                  </div>
                )}

                {/* Quantité : préréglages + saisie libre */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {QTY_PRESETS.map(v => (
                    <button key={v} onClick={() => setRawQty(String(v))}
                      style={{ background: qty === v ? accent : "transparent", color: qty === v ? "#fff" : theme.text, border: `1px solid ${qty === v ? accent : theme.hairline}`, padding: "5px 10px", borderRadius: 999, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
                      {unit === "portion" ? "×" + v : v + (baseUnit === "ml" ? " ml" : "g")}
                    </button>
                  ))}
                  <input type="text" inputMode="decimal" value={rawQty} onChange={e => setRawQty(e.target.value)}
                    style={{ width: 64, height: 30, borderRadius: 999, border: `1px solid ${theme.hairline}`, background: "transparent", color: theme.text, fontSize: 12, padding: "0 10px", fontFamily: "inherit", outline: "none", textAlign: "center" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: theme.muted }}>
                    {selected.kcal.toFixed(0)} kcal/100{baseUnit === "ml" ? " ml" : "g"}{unit === "portion" && serving ? ` · ${Math.round(grams)} ${baseUnit === "ml" ? "ml" : "g"}` : ""} → <span style={{ color: accent, fontWeight: 500, fontSize: 13 }}>{computedKcal} kcal</span>
                  </span>
                  <button onClick={handleSave} disabled={!canSave}
                    style={{ height: 36, padding: "0 18px", borderRadius: 18, border: "none", background: canSave ? accent : theme.hairline, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: canSave ? "pointer" : "default" }}>
                    {isEdit ? "Enregistrer" : "Ajouter"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: theme.fainter, marginBottom: 8 }}>
                  Repas saisi avant la mise à jour — quantité inconnue. Modifie les calories directement, ou relance une recherche pour repartir d'un aliment.
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <input type="number" inputMode="numeric" value={manualKcal} onChange={e => setManualKcal(e.target.value)}
                    style={{ flex: 1, height: 36, borderRadius: 10, border: `1px solid ${theme.hairline}`, background: "transparent", color: theme.text, fontSize: 14, padding: "0 12px", fontFamily: "inherit", outline: "none" }} />
                  <span style={{ fontSize: 12, color: theme.muted }}>kcal</span>
                  <button onClick={handleSave} disabled={!canSave}
                    style={{ height: 36, padding: "0 18px", borderRadius: 18, border: "none", background: canSave ? accent : theme.hairline, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 500, cursor: canSave ? "pointer" : "default" }}>Enregistrer</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Résultats */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 50 }}>
          {offline && (
            <div style={{ fontSize: 12, color: "#B65538", padding: "6px 0 10px" }}>
              Connexion indisponible — résultats issus de la base locale.
            </div>
          )}
          {notice && (
            <div style={{ fontSize: 12, color: theme.muted, padding: "6px 0 10px" }}>{notice}</div>
          )}
          {!hasSearched ? (
            !isEdit && <div style={{ fontSize: 12, color: theme.fainter, padding: "8px 0" }}>
              Tapez l'aliment en entier, puis Rechercher — accents optionnels.
            </div>
          ) : results.length === 0 ? (
            <div style={{ fontSize: 13, color: theme.fainter, fontStyle: "italic", padding: "12px 0" }}>
              Aucun résultat pour « {query.trim()} ».
            </div>
          ) : results.map((item, i) => {
            const isSel = selected === item;
            return (
              <button key={i} onClick={() => handleSelect(item)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderRadius: 10, marginBottom: 2, background: isSel ? accent + "18" : "transparent", border: `1px solid ${isSel ? accent + "44" : "transparent"}`, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.3 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: theme.fainter, marginTop: 2 }}>
                    {item.brand || (item.local ? "base locale" : "")}
                    {item.serving ? (item.local || item.brand ? " · " : "") + "portion " + item.serving.label : ""}
                  </div>
                </div>
                <span style={{ fontSize: 13, color: accent, fontVariantNumeric: "tabular-nums", flexShrink: 0, fontWeight: 500 }}>{Math.round(item.kcal)} <span style={{ fontSize: 10, color: theme.fainter }}>/100g</span></span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, height: 44, borderRadius: 22, border: `1px solid ${theme.hairline}`, background: "transparent", color: theme.muted, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>Annuler</button>
          {isEdit && (
            <button onClick={onDelete}
              style={{ height: 44, padding: "0 20px", borderRadius: 22, border: `1px solid ${theme.hairline}`, background: "transparent", color: "#B65538", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>Supprimer</button>
          )}
        </div>
      </div>

    </div>
  );
}
