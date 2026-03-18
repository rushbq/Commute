/**
 * Settings Validator Service
 *
 * 負責設定資料的驗證邏輯。
 * 純函式，不依賴任何 React 或瀏覽器 API。
 */

export function validateSettings(settings) {
  const errors = [];

  settings.modules.forEach((moduleItem, moduleIndex) => {
    const moduleName = moduleItem.name?.trim() || `模組 ${moduleIndex + 1}`;

    if (!moduleItem.name?.trim()) {
      errors.push(`模組 ${moduleIndex + 1}：模組名稱為必填`);
    }

    if ((moduleItem.mode || "route") === "traffic") {
      // 驗證 viewGroups（新結構）
      const viewGroups = Array.isArray(moduleItem.viewGroups) ? moduleItem.viewGroups : [];

      viewGroups.forEach((group, groupIndex) => {
        const groupName = group.name?.trim() || `群組 ${groupIndex + 1}`;

        if (!group.name?.trim()) {
          errors.push(`${moduleName} / 群組 ${groupIndex + 1}：群組名稱為必填`);
        }

        const views = Array.isArray(group.views) ? group.views : [];

        if (views.length === 0) {
          errors.push(`${moduleName} / ${groupName}：至少需要一個觀測點`);
        }

        views.forEach((view, viewIndex) => {
          if (!Number.isFinite(Number(view.center?.lat))) {
            errors.push(`${moduleName} / ${groupName} / 觀測點 ${viewIndex + 1}：緯度為必填`);
          }

          if (!Number.isFinite(Number(view.center?.lng))) {
            errors.push(`${moduleName} / ${groupName} / 觀測點 ${viewIndex + 1}：經度為必填`);
          }
        });
      });

      if (viewGroups.length === 0) {
        errors.push(`${moduleName}：至少需要一個觀測群組`);
      }
    } else {
      if (!moduleItem.origin?.trim()) {
        errors.push(`${moduleName}：共用起點為必填`);
      }

      if (!moduleItem.destination?.trim()) {
        errors.push(`${moduleName}：共用終點為必填`);
      }
    }
  });

  return errors;
}

export function createDefaultTrafficViews() {
  return [
    {
      name: "觀測點 A",
      label: "主要觀測",
      accentColor: "#336dff",
      center: { lat: 24.9345, lng: 121.4187 },
      zoom: 14
    },
    {
      name: "觀測點 B",
      label: "替代觀測",
      accentColor: "#7c3aed",
      center: { lat: 24.9894, lng: 121.4225 },
      zoom: 14
    }
  ];
}

export function ensureTrafficViews(views) {
  return Array.isArray(views) && views.length ? views : createDefaultTrafficViews();
}

export function ensureColor(value, index) {
  if (/^#[0-9a-fA-F]{6}$/.test(value || "")) {
    return value;
  }

  return index === 0 ? "#336dff" : "#7c3aed";
}

/**
 * 模組排程選項標籤。
 */
export const SCHEDULE_OPTIONS = [
  { value: "light", label: "白天預設" },
  { value: "dark", label: "夜覽預設" },
  { value: "always", label: "全時段" }
];

/**
 * 模組色彩調色盤，用於設定頁區分不同模組。
 */
export const MODULE_PALETTE = [
  { border: "#336dff", bg: "rgba(51,109,255,0.06)", text: "#336dff" },
  { border: "#7c3aed", bg: "rgba(124,58,237,0.06)", text: "#7c3aed" },
  { border: "#d97706", bg: "rgba(217,119,6,0.06)", text: "#d97706" },
  { border: "#059669", bg: "rgba(5,150,105,0.06)", text: "#059669" },
  { border: "#dc2626", bg: "rgba(220,38,38,0.06)", text: "#dc2626" },
  { border: "#0891b2", bg: "rgba(8,145,178,0.06)", text: "#0891b2" }
];

export function getModulePaletteColor(index) {
  return MODULE_PALETTE[index % MODULE_PALETTE.length];
}

/**
 * 子觀測點色彩調色盤，用於首頁卡片區分同群組內的觀測點。
 */
export const SUB_VIEW_PALETTE = ["#336dff", "#7c3aed", "#d97706"];
export const MAX_SUB_VIEWS = 3;

export function getSubViewColor(index) {
  return SUB_VIEW_PALETTE[index % SUB_VIEW_PALETTE.length];
}

/**
 * 建立預設 viewGroups 結構（新模組用）。
 */
export function createDefaultViewGroups() {
  return [
    {
      name: "",
      zoom: 14,
      views: [
        { name: "", center: { lat: "", lng: "" }, isWaypoint: false }
      ]
    }
  ];
}
