import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js lives in its own lazily loaded chunk (the 3D town).
    chunkSizeWarningLimit: 1100,
  },
});
