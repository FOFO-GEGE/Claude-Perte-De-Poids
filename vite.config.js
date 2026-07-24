import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — chemins relatifs, requis pour que le bundle se charge
// correctement une fois embarqué dans la coquille native Capacitor.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
  },
});
