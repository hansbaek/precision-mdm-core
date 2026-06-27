/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 벤더를 성격별 청크로 분리 — 단일 거대 번들을 쪼개 캐싱 효율을 높이고
        // 초기 로드를 분산한다. (화면별 분할은 App.tsx 의 React.lazy 가 담당)
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id))
            return "react-vendor";
          if (/[\\/]node_modules[\\/](framer-motion|motion|motion-dom|motion-utils)[\\/]/.test(id))
            return "motion-vendor";
          if (/[\\/]node_modules[\\/](radix-ui|@radix-ui|@floating-ui|cmdk|lucide-react|sonner)[\\/]/.test(id))
            return "ui-vendor";
          if (/[\\/]node_modules[\\/](i18next|react-i18next|i18next-browser-languagedetector)[\\/]/.test(id))
            return "i18n-vendor";
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
