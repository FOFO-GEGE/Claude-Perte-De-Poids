import { DAY_FULL_FR, MONTH_FR, fmtShortDate } from "../lib/dates.js";
import { MAX_SIM_DAYS } from "../lib/plan.js";
import { ACCENTS } from "../lib/theme.js";
import { ProjectionCurve } from "../components/ProjectionCurve.jsx";
import { DayStrip } from "../components/DayStrip.jsx";
import { AddMealSheet } from "../components/AddMealSheet.jsx";

// ── Page de suivi (accueil) ─────────────────────────────────────────────────
export function TrackPage({
  theme, accent, setAccent, dark, setDark,
  selDate, dayLabel, isFutureDay, budget,
  projectedWeight, rawWeighIn, setRawWeighIn, commitWeighIn,
  tweenedAvg, tweenedNext7,
  plan, daysToGoal, tweenedDays,
  zoom, setZoom, curveStyle, setCurveStyle,
  sim, weighInPts, todayDay, pulseKey,
  projGoalDate, deltaDays,
  selectedDay, setSelectedDay, mealsByDay,
  tweenedEaten, eaten, remaining,
  meals, isToday, lastAddedId, openEdit, onDeleteMeal, qtyLabel,
  sheetOpen, setSheetOpen, editingMeal, setEditingMeal, closeSheet, onSaveMeal,
}) {
  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 28px 0" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.muted }}>{DAY_FULL_FR[selDate.getDay()]}</div>
          <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontSize: 28, lineHeight: 1.1, marginTop: 2 }}>{dayLabel}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: theme.fainter }}>{budget.toLocaleString("fr-FR")} kcal/j</div>
          <div style={{ display: "flex", gap: 5, marginTop: 6, justifyContent: "flex-end" }}>
            {ACCENTS.map(c => <button key={c} onClick={() => setAccent(c)} style={{ width: 16, height: 16, borderRadius: "50%", background: c, border: accent === c ? `2px solid ${theme.text}` : `1px solid ${theme.hairline}`, cursor: "pointer", padding: 0 }} />)}
            <button onClick={() => setDark(!dark)} style={{ width: 16, height: 16, borderRadius: "50%", background: theme.chipBg, border: `1px solid ${theme.hairline}`, cursor: "pointer", padding: 0, fontSize: 9, color: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>{dark ? "☾" : "☀"}</button>
          </div>
        </div>
      </div>

      {/* Poids projeté + pesée du jour, sur la même ligne */}
      <div style={{ padding: "16px 28px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
          <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 72, lineHeight: 0.95, fontWeight: 400, letterSpacing: "-0.03em", fontStyle: "italic" }}>{projectedWeight.toFixed(1)}</div>
          <div style={{ fontSize: 13, color: theme.muted }}>kg {isFutureDay ? "prévu" : "projeté"}</div>
        </div>

        <div style={{ flexShrink: 0, textAlign: "right", paddingBottom: 4 }}>
          <div style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.muted, marginBottom: 5 }}>Pesée</div>
          <input
            type="text" inputMode="decimal" placeholder="—"
            value={rawWeighIn}
            onChange={e => setRawWeighIn(e.target.value)}
            onBlur={commitWeighIn}
            onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
            style={{ width: 92, height: 42, borderRadius: 12, border: `1px solid ${theme.hairline}`, background: theme.chipBg, color: theme.text, fontSize: 19, padding: "0 12px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", textAlign: "right" }}
          />
          <div style={{ fontSize: 9.5, color: theme.fainter, marginTop: 4 }}>facultatif</div>
        </div>
      </div>
      <div style={{ padding: "6px 28px 0", display: "flex", gap: 18, fontSize: 12, color: theme.fainter }}>
        <span>
          <span style={{ color: tweenedAvg <= 0 ? accent : "#B65538", fontWeight: 500 }}>{tweenedAvg.toFixed(2)}</span>
          <span style={{ marginLeft: 4 }}>kg/sem moyen</span>
        </span>
        <span>
          <span style={{ color: tweenedNext7 <= 0 ? accent : "#B65538", fontWeight: 500 }}>{tweenedNext7.toFixed(2)}</span>
          <span style={{ marginLeft: 4 }}>7 prochains j</span>
        </span>
      </div>
      <div style={{ padding: "4px 28px 0", fontSize: 12, color: theme.fainter }}>
        obj. {plan.goalWeight.toFixed(1)} kg
        <span style={{ margin: "0 6px", color: theme.hairline }}>·</span>
        {daysToGoal != null ? `~${Math.round(tweenedDays)} j` : `> ${MAX_SIM_DAYS} j`}
      </div>

      {/* Courbe */}
      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10px 4px", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.fainter }}>
          <span>Trajectoire</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setZoom(z => z === "30" ? "all" : "30")}
              style={{ background: "transparent", border: `1px solid ${theme.hairline}`, color: theme.muted, fontFamily: "inherit", fontSize: 9, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 999, padding: "3px 9px" }}>
              {zoom === "30" ? "Tout voir" : "30 jours"}
            </button>
            <select value={curveStyle} onChange={e => setCurveStyle(e.target.value)}
              style={{ background: "transparent", border: "none", color: theme.fainter, fontFamily: "inherit", fontSize: 10, cursor: "pointer", outline: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <option value="line">Trait</option>
              <option value="area">Aire</option>
              <option value="dotted">Pointillé</option>
            </select>
          </div>
        </div>
        <ProjectionCurve
          plan={plan} sim={sim} weighIns={weighInPts} todayDay={todayDay}
          curveStyle={curveStyle} zoom={zoom}
          accent={accent} text={theme.text} muted={theme.muted} hairline={theme.hairline}
          pulseKey={pulseKey}
        />
        <div style={{ display: "flex", gap: 14, padding: "6px 10px 0", fontSize: 10, color: theme.fainter, flexWrap: "wrap" }}>
          <span><span style={{ color: accent }}>┄</span> théorique</span>
          <span><span style={{ color: theme.text }}>—</span> projection calories</span>
          <span><span style={{ color: accent }}>○</span> pesées</span>
        </div>
        <div style={{ margin: "10px 10px 0", padding: "10px 12px", borderRadius: 12, background: theme.chipBg, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: theme.muted, lineHeight: 1.5 }}>
            <div>Théorique · <span style={{ color: theme.text }}>{fmtShortDate(plan.goalDate)}</span></div>
            <div>Projeté · <span style={{ color: theme.text }}>{projGoalDate ? fmtShortDate(projGoalDate) : "au-delà de " + MAX_SIM_DAYS + " j"}</span></div>
          </div>
          {deltaDays != null && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontSize: 22, color: deltaDays > 0 ? "#B65538" : accent, lineHeight: 1 }}>
                {deltaDays > 0 ? "+" : ""}{deltaDays} j
              </div>
              <div style={{ fontSize: 9.5, color: theme.fainter, marginTop: 3 }}>
                {deltaDays > 0 ? "de retard" : deltaDays < 0 ? "d'avance" : "dans les temps"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendrier */}
      <div style={{ padding: "16px 0 4px" }}>
        <DayStrip selectedDay={selectedDay} setSelectedDay={setSelectedDay} mealsByDay={mealsByDay} theme={theme} accent={accent} />
      </div>

      {/* Barre calories */}
      <div style={{ padding: "14px 28px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.muted }}>Calories</div>
          <div style={{ fontSize: 13, color: theme.muted }}>
            <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontSize: 16, color: theme.text }}>{Math.round(tweenedEaten).toLocaleString("fr-FR")}</span>
            <span style={{ margin: "0 4px", color: theme.fainter }}>/</span>
            <span>{budget.toLocaleString("fr-FR")} kcal</span>
          </div>
        </div>
        <div style={{ position: "relative", height: 2, background: theme.hairline, borderRadius: 1 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(100, (eaten/budget)*100)}%`, background: accent, transition: "width 700ms cubic-bezier(.4,0,.2,1)", borderRadius: 1 }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: theme.muted }}>
          {remaining >= 0
            ? <>il reste <span style={{ color: theme.text }}>{remaining.toLocaleString("fr-FR")}</span> kcal</>
            : <span style={{ color: "#B65538" }}>{Math.abs(remaining).toLocaleString("fr-FR")} kcal au-dessus</span>}
        </div>
      </div>

      {/* Liste repas */}
      <div style={{ padding: "20px 28px 140px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.muted, marginBottom: 12 }}>
          Repas {isFutureDay && <span style={{ textTransform: "none", letterSpacing: 0, color: theme.fainter }}>· prévisionnel</span>}
          {meals.length > 0 && <span style={{ textTransform: "none", letterSpacing: 0, color: theme.fainter, fontSize: 10, marginLeft: 8 }}>touchez pour modifier</span>}
        </div>
        {meals.length === 0 ? (
          <div style={{ fontSize: 14, color: theme.fainter, fontStyle: "italic", padding: "8px 0" }}>
            Aucun repas enregistré{isToday ? " aujourd'hui" : " ce jour"}.
          </div>
        ) : meals.map((m, i) => (
          <div key={m.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto 28px", alignItems: "baseline", gap: 12, padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${theme.hairline}`, animation: m.id === lastAddedId ? "mealIn 600ms ease" : "none" }}>
            <div style={{ fontSize: 11, color: theme.fainter, fontVariantNumeric: "tabular-nums" }}>{m.time}</div>
            <button onClick={() => openEdit(m)}
              style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}>
              <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.3 }}>{m.name}</div>
              {qtyLabel(m) && <div style={{ fontSize: 11, color: theme.fainter, marginTop: 2 }}>{qtyLabel(m)}</div>}
            </button>
            <div style={{ fontSize: 13, color: theme.muted, fontVariantNumeric: "tabular-nums" }}>{m.kcal != null ? m.kcal : "—"} <span style={{ color: theme.fainter, fontSize: 11 }}>kcal</span></div>
            <button onClick={() => onDeleteMeal(m.id)} className="meal-del"
              style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "transparent", color: theme.fainter, cursor: "pointer", padding: 0, fontSize: 16, lineHeight: 1, alignSelf: "center", transition: "all 150ms" }}>×</button>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ position: "sticky", bottom: 0, padding: "12px 20px 16px", background: `linear-gradient(to top, ${theme.bg} 65%, transparent)`, marginTop: -60 }}>
        <button onClick={() => { setEditingMeal(null); setSheetOpen(true); }}
          style={{ width: "100%", height: 54, borderRadius: 27, border: "none", background: theme.text, color: theme.bg, fontSize: 15, fontFamily: "inherit", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.6)" : "0 8px 24px rgba(22,21,20,0.18)" }}>
          <span style={{ fontSize: 20, fontWeight: 300, marginTop: -2 }}>+</span>
          Ajouter un repas · {dayLabel}
        </button>
      </div>

      <AddMealSheet
        open={sheetOpen}
        onClose={closeSheet}
        onSave={onSaveMeal}
        onDelete={() => { if (editingMeal) onDeleteMeal(editingMeal.id); closeSheet(); }}
        editing={editingMeal}
        theme={theme} accent={accent} dayLabel={dayLabel} />
    </>
  );
}
