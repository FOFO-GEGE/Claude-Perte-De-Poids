import { useState, useEffect, useMemo } from "react";
import { storage } from "./lib/storage.js";
import { useIsMobile, useTween } from "./lib/useTween.js";
import { getTheme } from "./lib/theme.js";
import { DEFAULT_PROFILE, calcTDEE, calcBudget } from "./lib/metabolism.js";
import { buildPlan, simulate, MAX_SIM_DAYS } from "./lib/plan.js";
import { fmt, parseDay, addDays, dayOffset, TODAY, MONTH_FR } from "./lib/dates.js";
import { ProfileButton } from "./components/ProfileButton.jsx";
import { TrackPage } from "./pages/TrackPage.jsx";
import { MetabolismPage } from "./pages/MetabolismPage.jsx";

export function App() {
  const isMobile = useIsMobile();

  const [hydrated, setHydrated] = useState(false);
  const [accent, setAccent]   = useState("#1F8A5B");
  const [dark, setDark]       = useState(false);
  const [curveStyle, setCurveStyle] = useState("line");
  const [zoom, setZoom] = useState("30");
  const [page, setPage]       = useState("track");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const [mealsByDay, setMealsByDay]   = useState({});
  const [weighIns, setWeighIns]       = useState({});
  const [plan, setPlan]       = useState(() => buildPlan(DEFAULT_PROFILE, TODAY));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [pulseKey, setPulseKey]   = useState(0);

  const theme = getTheme(dark);

  // Chargement initial (asynchrone — Capacitor Preferences), avec migration depuis localStorage.
  useEffect(() => {
    (async () => {
      const [loadedAccent, loadedDark, loadedCurveStyle, loadedZoom, loadedProfile, loadedMeals, loadedWeighIns, loadedPlan] = await Promise.all([
        storage.get("wl-accent", "#1F8A5B"),
        storage.get("wl-dark", false),
        storage.get("wl-curve-style", "line"),
        storage.get("wl-zoom", "30"),
        storage.get("wl-profile", DEFAULT_PROFILE),
        storage.get("wl-meals", {}),
        storage.get("wl-weigh-ins", {}),
        storage.get("wl-plan", null),
      ]);
      setAccent(loadedAccent);
      setDark(loadedDark);
      setCurveStyle(loadedCurveStyle);
      setZoom(loadedZoom);
      setProfile(loadedProfile);
      setMealsByDay(loadedMeals);
      setWeighIns(loadedWeighIns);
      setPlan(loadedPlan || buildPlan(loadedProfile, TODAY));
      setHydrated(true);
    })();
  }, []);

  // Persistance — désactivée tant que le chargement initial n'est pas terminé,
  // pour ne pas écraser les données réelles par les valeurs par défaut le temps de l'hydratation.
  useEffect(() => { if (hydrated) storage.set("wl-accent", accent); }, [accent, hydrated]);
  useEffect(() => { if (hydrated) storage.set("wl-dark", dark); }, [dark, hydrated]);
  useEffect(() => { if (hydrated) storage.set("wl-curve-style", curveStyle); }, [curveStyle, hydrated]);
  useEffect(() => { if (hydrated) storage.set("wl-zoom", zoom); }, [zoom, hydrated]);
  useEffect(() => { if (hydrated) storage.set("wl-profile", profile); }, [profile, hydrated]);
  useEffect(() => { if (hydrated) storage.set("wl-meals", mealsByDay); }, [mealsByDay, hydrated]);
  useEffect(() => { if (hydrated) storage.set("wl-weigh-ins", weighIns); }, [weighIns, hydrated]);
  useEffect(() => { if (hydrated) storage.set("wl-plan", plan); }, [plan, hydrated]);

  // Le plan reste FIXE au quotidien ; il n'est reconstruit que si le profil change.
  useEffect(() => {
    if (!hydrated) return;
    setPlan(prev => {
      const next = buildPlan(profile, prev.startDate);
      const same = next.days === prev.days
        && next.startWeight === prev.startWeight
        && next.goalWeight === prev.goalWeight;
      return same ? prev : next;
    });
  }, [profile, hydrated]);

  const replan = () => setPlan(buildPlan(profile, TODAY));

  const meals    = mealsByDay[selectedDay] || [];
  const isToday  = selectedDay === TODAY;
  const budget   = calcBudget(profile);
  const tdee     = calcTDEE(profile);
  const eaten    = meals.reduce((s, m) => s + (m.kcal || 0), 0);
  const remaining = budget - eaten;

  // Calories par jour — passé ET futur (plus de filtre d <= TODAY)
  const kcalByDay = useMemo(() => {
    const out = {};
    for (const [d, ms] of Object.entries(mealsByDay)) {
      if (ms && ms.length > 0) out[d] = ms.reduce((s, m) => s + (m.kcal || 0), 0);
    }
    return out;
  }, [mealsByDay]);

  const sim = useMemo(() => simulate(plan, kcalByDay, tdee, budget), [plan, kcalByDay, tdee, budget]);

  const todayDay    = Math.max(0, dayOffset(TODAY, plan.startDate));
  const selectedDayOffset = dayOffset(selectedDay, plan.startDate);
  const weighInPts  = useMemo(
    () => Object.entries(weighIns)
      .map(([d, w]) => ({ day: dayOffset(d, plan.startDate), w }))
      .filter(p => p.day >= 0)
      .sort((a, b) => a.day - b.day),
    [weighIns, plan.startDate]
  );

  // Poids projeté pour le jour sélectionné (piloté par les calories)
  const projectedWeight = sim.pts[Math.max(0, Math.min(selectedDayOffset, sim.pts.length - 1))]?.w ?? plan.startWeight;
  const daysToGoal = sim.reachedDay;

  // Deux rythmes distincts : moyenne sur l'horizon restant, et pente des 7 prochains jours
  const wToday = sim.pts[Math.min(todayDay, sim.pts.length - 1)]?.w ?? plan.startWeight;
  const remainingDays = daysToGoal != null ? Math.max(1, daysToGoal - todayDay) : null;
  const weeklyAvg = remainingDays ? -((wToday - plan.goalWeight) / (remainingDays / 7)) : 0;
  const weeklyNext7 = sim.pts[Math.min(todayDay + 7, sim.pts.length - 1)].w - wToday;

  // Dates de fin : théorique (fixe) vs projetée (pilotée par les calories)
  const projGoalDate = daysToGoal != null ? fmt(addDays(parseDay(plan.startDate), daysToGoal)) : null;
  const deltaDays = daysToGoal != null ? daysToGoal - plan.days : null;

  const tweenedEaten = useTween(eaten);
  const tweenedDays  = useTween(daysToGoal ?? MAX_SIM_DAYS);
  const tweenedAvg   = useTween(weeklyAvg);
  const tweenedNext7 = useTween(weeklyNext7);

  // Saisie libre de la pesée (validation à la sortie du champ)
  const [rawWeighIn, setRawWeighIn] = useState("");
  useEffect(() => {
    setRawWeighIn(weighIns[selectedDay] != null ? String(weighIns[selectedDay]) : "");
  }, [selectedDay, weighIns]);

  const commitWeighIn = () => {
    const s = rawWeighIn.trim().replace(",", ".");
    if (s === "") {
      setWeighIns(prev => { const n = { ...prev }; delete n[selectedDay]; return n; });
      return;
    }
    const w = parseFloat(s);
    if (isNaN(w) || w <= 0) {
      setRawWeighIn(weighIns[selectedDay] != null ? String(weighIns[selectedDay]) : "");
      return;
    }
    const clamped = Math.min(300, Math.max(30, w));
    setWeighIns(prev => ({ ...prev, [selectedDay]: clamped }));
    setRawWeighIn(String(clamped));
  };

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const [lastAddedId, setLastAddedId] = useState(null);

  const onSaveMeal = (payload) => {
    if (editingMeal) {
      setMealsByDay(prev => ({
        ...prev,
        [selectedDay]: (prev[selectedDay] || []).map(m => m.id === editingMeal.id ? { ...m, ...payload } : m),
      }));
    } else {
      const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const id = newId();
      setMealsByDay(prev => ({ ...prev, [selectedDay]: [...(prev[selectedDay] || []), { id, time, ...payload }] }));
      setLastAddedId(id);
    }
    setSheetOpen(false); setEditingMeal(null); setPulseKey(k => k + 1);
  };
  const onDeleteMeal = id => {
    setMealsByDay(prev => ({ ...prev, [selectedDay]: (prev[selectedDay] || []).filter(x => x.id !== id) }));
    setPulseKey(k => k + 1);
  };
  const closeSheet = () => { setSheetOpen(false); setEditingMeal(null); };
  const openEdit = (m) => { setEditingMeal(m); setSheetOpen(true); };

  // Libellé de quantité affiché sur la ligne de repas
  const qtyLabel = m => {
    if (m.unit === "portion" && m.qty != null) {
      const u = m.baseUnit === "ml" ? "ml" : "g";
      return `×${m.qty}${m.servingSize ? " · " + Math.round(m.qty * m.servingSize) + " " + u : ""}`;
    }
    if ((m.unit === "g" || m.unit === "ml") && m.qty != null) return `${m.qty} ${m.unit}`;
    return null;
  };

  const selDate  = parseDay(selectedDay);
  const dayLabel = isToday ? "Aujourd'hui" : selDate.getDate() + " " + MONTH_FR[selDate.getMonth()];
  const isFutureDay = selectedDay > TODAY;

  const shell = isMobile
    ? { width: "100%", height: "100%", borderRadius: 0, overflow: "hidden", position: "relative", background: theme.bg, color: theme.text, letterSpacing: "-0.01em", display: "flex", flexDirection: "column" }
    : { width: "100%", maxWidth: 440, height: "92vh", maxHeight: 860, borderRadius: 32, overflow: "hidden", position: "relative", background: theme.bg, color: theme.text, boxShadow: "0 30px 60px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.08)", letterSpacing: "-0.01em", display: "flex", flexDirection: "column" };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: dark ? "#1a1a18" : "#EFEDE6", fontFamily: '"Inter Tight", ui-sans-serif, system-ui, sans-serif', padding: isMobile ? 0 : 20, boxSizing: "border-box" }}>
      <div style={shell}>
        <ProfileButton page={page} setPage={setPage} theme={theme} accent={accent} dark={dark} />
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {page === "track" ? (
            <TrackPage
              theme={theme} accent={accent} setAccent={setAccent} dark={dark} setDark={setDark}
              selDate={selDate} dayLabel={dayLabel} isFutureDay={isFutureDay} budget={budget}
              projectedWeight={projectedWeight} rawWeighIn={rawWeighIn} setRawWeighIn={setRawWeighIn} commitWeighIn={commitWeighIn}
              tweenedAvg={tweenedAvg} tweenedNext7={tweenedNext7}
              plan={plan} daysToGoal={daysToGoal} tweenedDays={tweenedDays}
              zoom={zoom} setZoom={setZoom} curveStyle={curveStyle} setCurveStyle={setCurveStyle}
              sim={sim} weighInPts={weighInPts} todayDay={todayDay} pulseKey={pulseKey}
              projGoalDate={projGoalDate} deltaDays={deltaDays}
              selectedDay={selectedDay} setSelectedDay={setSelectedDay} mealsByDay={mealsByDay}
              tweenedEaten={tweenedEaten} eaten={eaten} remaining={remaining}
              meals={meals} isToday={isToday} lastAddedId={lastAddedId} openEdit={openEdit} onDeleteMeal={onDeleteMeal} qtyLabel={qtyLabel}
              sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} editingMeal={editingMeal} setEditingMeal={setEditingMeal} closeSheet={closeSheet} onSaveMeal={onSaveMeal}
            />
          ) : (
            <MetabolismPage profile={profile} setProfile={setProfile} plan={plan} onReplan={replan} theme={theme} accent={accent} />
          )}
        </div>
      </div>
    </div>
  );
}
