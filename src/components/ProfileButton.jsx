// ── Bouton profil (rond, en haut) ──────────────────────────────────────────
export function ProfileButton({ page, setPage, theme, accent, dark }) {
  const onProfile = page === "metabolism";
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px 0", flexShrink: 0 }}>
      <button onClick={() => setPage(onProfile ? "track" : "metabolism")}
        style={{ width: 56, height: 56, borderRadius: "50%", border: `1px solid ${theme.hairline}`, background: onProfile ? accent : theme.chipBg, color: onProfile ? "#fff" : theme.text, fontFamily: "inherit", fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: dark ? "0 4px 14px rgba(0,0,0,0.5)" : "0 4px 14px rgba(0,0,0,0.12)", transition: "background 200ms, color 200ms" }}>
        {onProfile ? "Suivi" : "Profil"}
      </button>
    </div>
  );
}
