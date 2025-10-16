import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["axios"], // 🧩 axios ni Vite optimizatsiyaga kiritamiz
  },
  server: {
    port: 3030,  // 🔥 frontend 3030-portda ishlaydi
    open: true,  // avtomatik brauzer ochiladi
    host: true,  // LAN orqali kirish imkonini beradi
    hmr: {
      overlay: false, // ❌ qora error overlay chiqmasin
    },
  },
});
