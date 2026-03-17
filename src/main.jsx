import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

function registerServiceWorker() {
  const isSecureLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const canRegister =
    "serviceWorker" in navigator &&
    window.location.protocol !== "file:" &&
    (window.isSecureContext || isSecureLocalhost);

  if (!canRegister) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`)
      .catch((error) => console.error("Service worker registration failed.", error));
  });
}
