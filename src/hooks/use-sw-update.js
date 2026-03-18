/**
 * SW Update Hook
 *
 * 偵測新版 Service Worker 是否就緒（waiting 狀態）。
 * 提供 applyUpdate() 讓使用者主動觸發更新並重新載入頁面。
 */

import { useEffect, useState } from "react";

export function useSwUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration = null;

    function handleUpdateFound() {
      const newWorker = registration?.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        // 新 SW 已安裝完成，且有舊的 SW 正在控制頁面 → 有新版本可用
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }
      });
    }

    // 監聽 SW 啟動後廣播的 SW_ACTIVATED 訊息
    // （第一次安裝不觸發，只有舊→新切換才觸發）
    function handleSwMessage(event) {
      if (event.data?.type === "SW_ACTIVATED" && navigator.serviceWorker.controller) {
        // SW 已在背景切換，提示使用者重新載入
        setUpdateAvailable(true);
      }
    }

    navigator.serviceWorker.addEventListener("message", handleSwMessage);

    // 取得目前已有的 registration（若存在），監聽 updatefound
    navigator.serviceWorker.ready.then((reg) => {
      registration = reg;

      // 若已有 waiting 的 SW（使用者長時間沒重整）
      if (reg.waiting && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
      }

      reg.addEventListener("updatefound", handleUpdateFound);
    });

    // 讓瀏覽器主動去檢查 SW 是否有更新（補足某些瀏覽器不自動輪詢的情況）
    navigator.serviceWorker.ready.then((reg) => reg.update()).catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      if (registration) {
        registration.removeEventListener("updatefound", handleUpdateFound);
      }
    };
  }, []);

  function applyUpdate() {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        // 有 waiting 的 SW → 叫它跳過等待直接接管
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    });

    // SW 切換後 controllerchange 會觸發，此時 reload 取得新版 JS
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true }
    );

    // 若沒有 waiting（SW_ACTIVATED 情境，SW 已自動切換），直接 reload
    setTimeout(() => window.location.reload(), 1000);
  }

  return { updateAvailable, applyUpdate };
}
