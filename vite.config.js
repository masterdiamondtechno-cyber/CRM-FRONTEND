import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

if (process.env.VERCEL === "1") {
  const apiBaseUrl = process.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    console.warn("⚠️ Warning: VITE_API_BASE_URL is not configured yet. Set it in Vercel project settings once your backend is deployed.");
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
