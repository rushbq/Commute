import { useState } from "react";
import { ExternalLink, Link } from "lucide-react";
import { parseGoogleMapsUrl, isShortUrl } from "../services/url-parser";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

/**
 * 座標輸入元件。
 * 支援貼上 Google Maps 連結解析座標，或手動輸入經緯度。
 * 短網址（maps.app.goo.gl）會自動在新分頁開啟，引導使用者複製完整連結回來貼上。
 *
 * @param {{ center: { lat: number, lng: number }, onChange: (center: { lat: number, lng: number }) => void }} props
 */
export function CoordinateInput({ center, onChange }) {
  const [urlText, setUrlText] = useState("");
  const [parseError, setParseError] = useState("");
  const [shortUrlHint, setShortUrlHint] = useState(false);

  function handleParse() {
    setParseError("");
    setShortUrlHint(false);

    const trimmed = urlText.trim();

    if (!trimmed) {
      setParseError("請貼上 Google Maps 連結或座標");
      return;
    }

    if (isShortUrl(trimmed)) {
      // 自動開啟短網址到新分頁，讓瀏覽器展開為完整 URL
      window.open(trimmed, "_blank", "noopener,noreferrer");
      setShortUrlHint(true);
      setUrlText("");
      return;
    }

    const result = parseGoogleMapsUrl(trimmed);

    if (!result) {
      setParseError("無法解析座標，請確認連結格式正確");
      return;
    }

    onChange({ lat: result.lat, lng: result.lng });
    setUrlText("");
  }

  function handlePaste(event) {
    const pasted = event.clipboardData?.getData("text") || "";

    if (!pasted.trim()) return;

    const trimmed = pasted.trim();

    // 短網址：自動開啟新分頁
    if (isShortUrl(trimmed)) {
      event.preventDefault();
      window.open(trimmed, "_blank", "noopener,noreferrer");
      setShortUrlHint(true);
      setUrlText("");
      setParseError("");
      return;
    }

    // 完整連結或座標：自動解析
    const result = parseGoogleMapsUrl(trimmed);

    if (result) {
      event.preventDefault();
      onChange({ lat: result.lat, lng: result.lng });
      setUrlText("");
      setParseError("");
      setShortUrlHint(false);
    }
  }

  function handleLatChange(value) {
    const lat = value === "" ? "" : Number(value);
    onChange({ ...center, lat: Number.isFinite(lat) ? lat : "" });
  }

  function handleLngChange(value) {
    const lng = value === "" ? "" : Number(value);
    onChange({ ...center, lng: Number.isFinite(lng) ? lng : "" });
  }

  return (
    <div className="space-y-3">
      {/* 連結解析區 */}
      <div className="space-y-2">
        <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link className="h-3 w-3" />
          貼上 Google Maps 連結
        </span>
        <div className="flex gap-2">
          <input
            className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="連結或座標（如 24.95,121.39）"
            value={urlText}
            onChange={(event) => {
              setUrlText(event.target.value);
              setParseError("");
              setShortUrlHint(false);
            }}
            onPaste={handlePaste}
          />
          <Button variant="secondary" size="sm" onClick={handleParse} type="button">
            解析
          </Button>
        </div>
        {parseError ? (
          <p className="text-xs text-red-500 dark:text-red-400">{parseError}</p>
        ) : null}
        {shortUrlHint ? (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 dark:bg-amber-900/20">
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              已在新分頁開啟地圖，請複製瀏覽器網址列的<strong>完整連結</strong>後回來貼上。
            </p>
          </div>
        ) : null}
      </div>

      {/* 手動經緯度 */}
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            緯度 <Badge variant="brand">必填</Badge>
          </span>
          <input
            className="h-9 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            type="number"
            step="any"
            value={center?.lat ?? ""}
            onChange={(event) => handleLatChange(event.target.value)}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            經度 <Badge variant="brand">必填</Badge>
          </span>
          <input
            className="h-9 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            type="number"
            step="any"
            value={center?.lng ?? ""}
            onChange={(event) => handleLngChange(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * 地點輸入元件（用於起點/終點）。
 * 支援貼上 Google Maps 連結自動解析為座標字串，或手動輸入地名/地址。
 *
 * @param {{ label: string, value: string, onChange: (value: string) => void, required?: boolean, optional?: boolean }} props
 */
export function PlaceInput({ label, value, onChange, required = false, optional = false }) {
  const [parseHint, setParseHint] = useState("");

  function handlePaste(event) {
    const pasted = event.clipboardData?.getData("text") || "";
    const trimmed = pasted.trim();

    if (!trimmed) return;

    // 短網址不自動處理，讓使用者手動貼上完整連結
    if (isShortUrl(trimmed)) return;

    const result = parseGoogleMapsUrl(trimmed);

    if (result) {
      event.preventDefault();
      onChange(`${result.lat},${result.lng}`);
      setParseHint("已從連結解析座標");
      setTimeout(() => setParseHint(""), 3000);
    }
  }

  return (
    <label className="grid min-w-0 gap-2">
      <span className="flex min-h-[28px] flex-wrap items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required ? <Badge variant="brand">必填</Badge> : null}
        {!required && optional ? <Badge variant="neutral">選填</Badge> : null}
      </span>
      <input
        className="h-11 min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        placeholder="地名、地址，或貼上 Google Maps 連結"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setParseHint("");
        }}
        onPaste={handlePaste}
      />
      {parseHint ? (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">{parseHint}</span>
      ) : null}
    </label>
  );
}
