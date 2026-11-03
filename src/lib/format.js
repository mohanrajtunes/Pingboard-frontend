// Small formatting helpers. Every figure on screen goes through one of these,
// so decimals and units stay the same everywhere.

export const pct = (value) =>
  value === null || value === undefined ? "–" : `${Number(value).toFixed(2)}%`;

export const ms = (value) =>
  value === null || value === undefined ? "–" : `${Math.round(value).toLocaleString("en")} ms`;

export function ago(iso) {
  if (!iso) return "Never";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function clock(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function dateTime(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${clock(iso)}`;
}

export function duration(seconds) {
  if (seconds === null || seconds === undefined) return "Ongoing";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export const host = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

export const statusLabel = { up: "Up", down: "Down", unknown: "Waiting" };
