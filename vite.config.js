import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

if (process.env.VERCEL === "1") {
  const apiBaseUrl = process.env.VITE_API_BASE_URL;
  if (!apiBaseUrl || !/^https:\/\/[^/]+\/api\/v1\/?$/.test(apiBaseUrl)) {
    throw new Error("Set VITE_API_BASE_URL to the HTTPS backend URL ending in /api/v1 in Vercel project settings.");
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
