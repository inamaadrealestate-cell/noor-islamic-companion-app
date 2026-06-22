import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Compile the app output for older Safari/iOS Safari instead of leaving only modern syntax.
    target: "es2018",
    cssTarget: "safari13",
    chunkSizeWarningLimit: 1800,
  },
  esbuild: {
    target: "es2018",
  },
});
