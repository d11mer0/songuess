import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgr(), // Додано підтримку SVG як React-компонентів
  ],
  server: {
    port: 3001,
  },
  base: "/",
});