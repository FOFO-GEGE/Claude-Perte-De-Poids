import { useState, useEffect, useMemo, useRef } from "react";
import { fmt, parseDay, addDays, TODAY, DAY_FR, MONTH_FR, MONTH_FULL } from "../lib/dates.js";

// ── Calendrier horizontal ─────────────────────────────────────────────────
export function DayStrip({ selectedDay, setSelectedDay, mealsByDay, theme, accent }) {
  const PAST = 30, FUTURE = 60;   // plage réduite (91 jours au lieu de 361)
  const days = useMemo(
    () => Array.from({ length: PAST + FUTURE + 1 }, (_, i) => addDays(new Date(), i - PAST)),
    []
  );
  const scrollRef = useRef(null);
  const [visibleMonth, setVisibleMonth] = useState("");

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-key='${selectedDay}']`);
    if (el) el.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [selectedDay]);

  // Mois affiché : mesuré sur les éléments réels (plus de largeur codée en dur)
  const updateVisibleMonth = () => {
    const el = scrollRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = null, bestDist = Infinity;
    for (const child of el.children) {
      const c = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(c - center);
      if (dist < bestDist) { bestDist = dist; best = child; }
    }
    const key = best && best.getAttribute("data-key");
    if (key) {
      const d = parseDay(key);
      setVisibleMonth(`${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`);
    }
  };

  useEffect(() => { updateVisibleMonth(); }, [selectedDay]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px 8px" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.fainter }}>
          {visibleMonth || "Calendrier"}
        </div>
        {selectedDay !== TODAY && (
          <button onClick={() => setSelectedDay(TODAY)}
            style={{ background: "transparent", border: `1px solid ${theme.hairline}`, color: theme.muted, fontSize: 10, padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Aujourd'hui
          </button>
        )}
      </div>
      <div ref={scrollRef} onScroll={updateVisibleMonth}
        style={{ display: "flex", overflowX: "auto", gap: 6, padding: "0 18px 2px", scrollbarWidth: "none" }}>
        {days.map(d => {
          const key = fmt(d);
          const isSelected = key === selectedDay;
          const isToday = key === TODAY;
          const isFuture = key > TODAY;
          const hasMeals = (mealsByDay[key] || []).length > 0;
          return (
            <button key={key} data-key={key} onClick={() => setSelectedDay(key)}
              style={{
                flexShrink: 0, width: 44, display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, padding: "10px 0 8px", borderRadius: 14, border: "none",
                background: isSelected ? accent : "transparent",
                opacity: isFuture && !isSelected ? 0.62 : 1,
                cursor: "pointer", transition: "background 200ms",
              }}>
              <span style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: isSelected ? "rgba(255,255,255,0.7)" : theme.fainter }}>
                {DAY_FR[d.getDay()]}
              </span>
              <span style={{ fontSize: 15, fontWeight: isToday ? 600 : 400, color: isSelected ? "#fff" : theme.text, lineHeight: 1 }}>
                {d.getDate()}
              </span>
              <span style={{ fontSize: 8.5, color: isSelected ? "rgba(255,255,255,0.55)" : theme.fainter }}>
                {MONTH_FR[d.getMonth()]}
              </span>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: hasMeals ? (isSelected ? "rgba(255,255,255,0.8)" : accent) : "transparent" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
