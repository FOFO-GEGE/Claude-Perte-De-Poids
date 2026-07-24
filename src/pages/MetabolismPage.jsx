import { useState, useEffect } from "react";
import { calcBMR, calcTDEE, calcBudget, ACTIVITY_LEVELS } from "../lib/metabolism.js";
import { KCAL_PER_KG } from "../lib/plan.js";
import { parseDay, MONTH_FR } from "../lib/dates.js";

// ── Page Métabolisme ──────────────────────────────────────────────────────
export function MetabolismPage({ profile, setProfile, plan, onReplan, theme, accent }) {
  const bmr = Math.round(calcBMR(profile));
  const tdee = calcTDEE(profile);
  const budget = calcBudget(profile);
  const deficit = tdee - budget;
  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const [raw, setRaw] = useState({
    age: String(profile.age), height: String(profile.height),
    weight: String(profile.weight), goalWeight: String(profile.goalWeight),
  });

  useEffect(() => {
    setRaw({ age: String(profile.age), height: String(profile.height), weight: String(profile.weight), goalWeight: String(profile.goalWeight) });
  }, [profile.age, profile.height, profile.weight, profile.goalWeight]);

  const CLAMP = { age: [10, 120], height: [100, 250], weight: [30, 300], goalWeight: [30, 300] };
  const onBlur = (k, step) => {
    const parsed = step ? parseFloat(String(raw[k]).replace(",", ".")) : parseInt(raw[k], 10);
    const [mn, mx] = CLAMP[k];
    const clamped = isNaN(parsed) ? profile[k] : Math.min(mx, Math.max(mn, parsed));
    set(k, clamped);
    setRaw(r => ({ ...r, [k]: String(clamped) }));
  };

  const lbl = { fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.muted, marginBottom: 6, display: "block" };
  const inp = { width: "100%", height: 44, borderRadius: 12, border: `1px solid ${theme.hairline}`, background: theme.chipBg, color: theme.text, fontSize: 15, padding: "0 14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  const startD = parseDay(plan.startDate);
  const goalD = parseDay(plan.goalDate);
  const fmtLong = d => `${d.getDate()} ${MONTH_FR[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div style={{ padding: "28px 28px 120px", overflowY: "auto" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.muted, marginBottom: 8 }}>Mon profil</div>
      <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontSize: 32, lineHeight: 1.1, marginBottom: 28 }}>Métabolisme</div>

      <div style={{ marginBottom: 18 }}>
        <span style={lbl}>Sexe</span>
        <div style={{ display: "flex", gap: 8 }}>
          {["homme", "femme"].map(s => (
            <button key={s} onClick={() => set("sex", s)}
              style={{ flex: 1, height: 42, borderRadius: 12, border: `1px solid ${profile.sex === s ? accent : theme.hairline}`, background: profile.sex === s ? accent : "transparent", color: profile.sex === s ? "#fff" : theme.text, fontSize: 14, fontFamily: "inherit", cursor: "pointer", fontWeight: 500, transition: "all 200ms" }}>
              {s === "homme" ? "Homme" : "Femme"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div><span style={lbl}>Âge</span><input type="number" inputMode="numeric" value={raw.age} onChange={e => setRaw(r => ({ ...r, age: e.target.value }))} onBlur={() => onBlur("age")} style={inp} /></div>
        <div><span style={lbl}>Taille (cm)</span><input type="number" inputMode="numeric" value={raw.height} onChange={e => setRaw(r => ({ ...r, height: e.target.value }))} onBlur={() => onBlur("height")} style={inp} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div><span style={lbl}>Poids de départ (kg)</span><input type="number" step="0.1" inputMode="decimal" value={raw.weight} onChange={e => setRaw(r => ({ ...r, weight: e.target.value }))} onBlur={() => onBlur("weight", true)} style={inp} /></div>
        <div><span style={lbl}>Objectif (kg)</span><input type="number" step="0.1" inputMode="decimal" value={raw.goalWeight} onChange={e => setRaw(r => ({ ...r, goalWeight: e.target.value }))} onBlur={() => onBlur("goalWeight", true)} style={inp} /></div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <span style={lbl}>Niveau d'activité</span>
        <div style={{ display: "grid", gap: 8 }}>
          {ACTIVITY_LEVELS.map(a => (
            <button key={a.value} onClick={() => set("activity", a.value)}
              style={{ height: 42, borderRadius: 12, border: `1px solid ${profile.activity === a.value ? accent : theme.hairline}`, background: profile.activity === a.value ? accent : "transparent", color: profile.activity === a.value ? "#fff" : theme.text, fontSize: 13, fontFamily: "inherit", cursor: "pointer", fontWeight: 500, padding: "0 16px", textAlign: "left", transition: "all 200ms" }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan ancré */}
      <div style={{ border: `1px solid ${theme.hairline}`, borderRadius: 16, padding: "16px 16px 14px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.fainter, marginBottom: 10 }}>Plan</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.muted, marginBottom: 6 }}>
          <span>Début</span><span style={{ color: theme.text }}>{fmtLong(startD)} · {plan.startWeight.toFixed(1)} kg</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: theme.muted, marginBottom: 12 }}>
          <span>Objectif théorique</span><span style={{ color: theme.text }}>{fmtLong(goalD)} · {plan.days} j</span>
        </div>
        <button onClick={onReplan}
          style={{ width: "100%", height: 40, borderRadius: 12, border: `1px solid ${theme.hairline}`, background: "transparent", color: theme.muted, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
          Replanifier à partir d'aujourd'hui
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "MB", value: bmr, sub: "métabolisme basal" },
          { label: "TDEE", value: tdee, sub: "dépense totale" },
          { label: "Budget", value: budget, sub: `déficit ${deficit} kcal` },
        ].map(c => (
          <div key={c.label} style={{ background: theme.chipBg, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.fainter, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontSize: 22, color: theme.text }}>{c.value.toLocaleString("fr-FR")}</div>
            <div style={{ fontSize: 9.5, color: theme.fainter, marginTop: 3 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: theme.fainter, lineHeight: 1.5 }}>
        Mifflin-St Jeor · −{deficit} kcal/j ≈ {(deficit * 7 / KCAL_PER_KG).toFixed(2)} kg/sem
      </div>
    </div>
  );
}
