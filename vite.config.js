import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Rutas relativas para que el build también funcione abriendo el archivo
    // directamente desde el disco, sin servidor.
    base: "./",
  },
});
