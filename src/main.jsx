import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.jsx";

const root = document.getElementById("root");

// Filet de sécurité : un écran blanc silencieux est le pire diagnostic possible.
// Si le montage React échoue (ou plante plus tard), on affiche l'erreur au lieu de rien.
function showFatalError(err) {
  console.error(err);
  if (root && !root.hasChildNodes()) {
    root.innerHTML =
      '<div style="padding:24px;font-family:ui-sans-serif,system-ui,sans-serif;color:#B62828;white-space:pre-wrap;">'
      + "Erreur au chargement de l'application :\n\n"
      + String((err && err.message) || err)
      + "</div>";
  }
}
window.addEventListener("error", e => showFatalError(e.error || e.message));
window.addEventListener("unhandledrejection", e => showFatalError(e.reason));

// Nettoyage de l'ancien service worker de la PWA (stratégie network-first, remplacée
// par ce build Vite) : le fichier sw.js se désinstalle désormais lui-même.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

try {
  createRoot(root).render(<App />);
} catch (err) {
  showFatalError(err);
}
