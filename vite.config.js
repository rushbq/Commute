import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

/**
 * Vite 插件：在 build 時將 __CACHE_VERSION__ 替換為 build timestamp。
 * 每次 deploy 都會產生新的快取名稱，讓瀏覽器自動清除舊快取。
 */
function injectSwVersion() {
  const buildVersion = Date.now().toString(36); // 短 base-36 timestamp，例如 "lzqk0g8"

  return {
    name: "inject-sw-version",
    apply: "build",
    closeBundle() {
      const swDest = path.resolve("dist/service-worker.js");
      if (!fs.existsSync(swDest)) return;

      const content = fs.readFileSync(swDest, "utf-8");
      const updated = content.replaceAll("__CACHE_VERSION__", buildVersion);
      fs.writeFileSync(swDest, updated);

      console.log(`\x1b[32m✓\x1b[39m SW cache version: ${buildVersion}`);
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), injectSwVersion()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "127.0.0.1",
      protocol: "ws",
      clientPort: 5173
    }
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true
  }
});
