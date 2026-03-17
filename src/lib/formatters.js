export function formatDuration(totalSeconds) {
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${totalMinutes} 分鐘`;
  }

  if (!minutes) {
    return `${hours} 小時`;
  }

  return `${hours} 小時 ${minutes} 分鐘`;
}

export function formatDistance(distanceMeters) {
  return `${(distanceMeters / 1000).toFixed(1)} 公里`;
}

export function formatDateTime(date) {
  if (!(date instanceof Date)) {
    return "尚未更新";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

export function formatCountdown(seconds) {
  return `${Math.max(0, seconds)} 秒後更新`;
}
