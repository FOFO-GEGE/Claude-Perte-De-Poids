import { MAX_SIM_DAYS } from "../lib/plan.js";

// ── Courbe ────────────────────────────────────────────────────────────────
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || pts[i+1];
    d += ` C ${p1.x+(p2.x-p0.x)/6} ${p1.y+(p2.y-p0.y)/6},${p2.x-(p3.x-p1.x)/6} ${p2.y-(p3.y-p1.y)/6},${p2.x} ${p2.y}`;
  }
  return d;
}

export function ProjectionCurve({
  plan, sim, weighIns, todayDay, curveStyle, zoom,
  accent, text, muted, hairline, pulseKey, height = 190
}) {
  const width = 340;
  const padL = 18, padR = 34, padT = 22, padB = 24;
  const iW = width - padL - padR, iH = height - padT - padB;

  const projEnd = sim.reachedDay ?? (sim.pts.length - 1);

  // Fenêtre X : 30 jours autour d'aujourd'hui, ou horizon complet
  let xMin, xMax;
  if (zoom === "30") {
    xMin = Math.max(0, todayDay - 5);
    xMax = xMin + 30;
  } else {
    xMin = 0;
    xMax = Math.max(8, plan.days, projEnd, todayDay) + 4;
  }
  const span = xMax - xMin || 1;

  // Poids théorique à un jour donné (droite fixe départ → objectif)
  const theoAt = d => d >= plan.days
    ? plan.goalWeight
    : plan.startWeight + (plan.goalWeight - plan.startWeight) * (d / plan.days);

  const visPts = sim.pts.filter(p => p.day >= xMin - 1 && p.day <= xMax + 1);
  const visWeighIns = weighIns.filter(p => p.day >= xMin && p.day <= xMax);

  const wVals = [
    ...visPts.map(p => p.w),
    theoAt(xMin), theoAt(Math.min(xMax, plan.days)),
    ...visWeighIns.map(p => p.w),
  ];
  if (zoom !== "30") { wVals.push(plan.startWeight, plan.goalWeight); }
  const pad = zoom === "30" ? 0.35 : 0.8;
  const wMax = Math.max(...wVals) + pad;
  const wMin = Math.min(...wVals) - pad;

  const x = d => padL + ((d - xMin) / span) * iW;
  const y = w => padT + ((wMax - w) / (wMax - wMin || 1)) * iH;

  // Sous-échantillonnage au-delà de 160 points
  const step = Math.max(1, Math.ceil(visPts.length / 160));
  const shown = visPts.filter((_, i) => i % step === 0 || i === visPts.length - 1);
  const projPts = shown.map(p => ({ x: x(p.day), y: y(p.w) }));
  const projD = smoothPath(projPts);

  // Théorique : segment visible uniquement
  const tA = Math.max(xMin, 0), tB = Math.min(xMax, plan.days);
  const thD = tB > tA ? `M ${x(tA)} ${y(theoAt(tA))} L ${x(tB)} ${y(theoAt(tB))}` : "";

  const baseY = padT + iH;
  const areaD = projD && projPts.length > 1
    ? `${projD} L ${projPts[projPts.length-1].x} ${baseY} L ${projPts[0].x} ${baseY} Z`
    : "";
  const dash = curveStyle === "dotted" ? "1 5" : undefined;

  const inView = d => d >= xMin && d <= xMax;
  const goalVisible = plan.goalWeight >= wMin && plan.goalWeight <= wMax;
  const todayX = x(Math.max(xMin, Math.min(todayDay, xMax)));
  const todayW = sim.pts[Math.min(todayDay, sim.pts.length - 1)]?.w ?? plan.startWeight;
  const clipId = "chartClip";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={padL} y={padT - 6} width={iW} height={iH + 12} />
        </clipPath>
      </defs>

      {/* Ligne objectif */}
      {goalVisible && <>
        <line x1={padL} x2={width-padR} y1={y(plan.goalWeight)} y2={y(plan.goalWeight)} stroke={hairline} strokeDasharray="2 4" strokeWidth="1" />
        <text x={width-padR+4} y={y(plan.goalWeight)+3} fontSize="10" fill={muted} fontFamily="ui-sans-serif">{plan.goalWeight.toFixed(1)}</text>
      </>}

      {/* Repère aujourd'hui */}
      <line x1={todayX} x2={todayX} y1={padT} y2={baseY} stroke={hairline} strokeWidth="1" />

      <g clipPath={`url(#${clipId})`}>
        {/* Courbe THÉORIQUE — fixe, pointillés accent */}
        {thD && <path d={thD} fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="4 5" opacity="0.55" />}

        {/* Courbe PROJETÉE — pilotée par les calories */}
        {curveStyle === "area" && areaD && <path d={areaD} fill={accent} opacity="0.10" stroke="none" />}
        {projD && <path d={projD} fill="none" stroke={text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />}

        {/* Pesées réelles (optionnelles) */}
        {visWeighIns.map((p, i) => (
          <circle key={i} cx={x(p.day)} cy={y(p.w)} r="2.6" fill="none" stroke={accent} strokeWidth="1.4" />
        ))}
      </g>

      {/* Fin THÉORIQUE — cercle creux */}
      {inView(plan.days) && <>
        <circle cx={x(plan.days)} cy={y(plan.goalWeight)} r="3.4" fill="none" stroke={accent} strokeWidth="1.4" opacity="0.75" />
        <text x={x(plan.days)} y={y(plan.goalWeight) - 8} fontSize="8.5" fill={accent} opacity="0.8" fontFamily="ui-sans-serif" textAnchor="middle">TH</text>
      </>}

      {/* Fin PROJETÉE — cercle plein */}
      {sim.reachedDay != null && inView(sim.reachedDay) && <>
        <circle cx={x(sim.reachedDay)} cy={y(plan.goalWeight)} r="3.4" fill={text} />
        <text x={x(sim.reachedDay)} y={y(plan.goalWeight) + 14} fontSize="8.5" fill={text} fontFamily="ui-sans-serif" textAnchor="middle">PROJ</text>
      </>}

      {/* Point aujourd'hui */}
      <g key={pulseKey}>
        <circle cx={todayX} cy={y(todayW)} r="3.6" fill={text} />
        <circle cx={todayX} cy={y(todayW)} r="3.6" fill="none" stroke={text} strokeWidth="1.2" opacity="0.55">
          <animate attributeName="r" from="3.6" to="22" dur="1.4s" begin="0s" fill="freeze" />
          <animate attributeName="opacity" from="0.55" to="0" dur="1.4s" begin="0s" fill="freeze" />
        </circle>
      </g>

      {/* Labels d'axe */}
      <text x={todayX} y={height-4} fontSize="9" fill={muted} fontFamily="ui-sans-serif" textAnchor="middle" style={{letterSpacing:"0.1em"}}>AUJ</text>
      <text x={width-padR} y={height-4} fontSize="9" fill={muted} fontFamily="ui-sans-serif" textAnchor="end" style={{letterSpacing:"0.1em"}}>
        {zoom === "30" ? "+" + (xMax - todayDay) + "J" : (sim.reachedDay != null ? sim.reachedDay + "J" : ">" + MAX_SIM_DAYS + "J")}
      </text>
    </svg>
  );
}
