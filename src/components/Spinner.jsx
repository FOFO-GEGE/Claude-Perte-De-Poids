export function Spinner({ accent }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: accent, animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}
