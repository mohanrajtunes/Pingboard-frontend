// Light / dark mode. Colours live as variables in app.css (:root and [data-mode="dark"]).
const KEY = "pingboard-mode";

export function loadTheme() {
  let mode = null;
  try { mode = localStorage.getItem(KEY); } catch { /* storage can be blocked */ }
  if (mode !== "light" && mode !== "dark") {
    mode = "dark"; // dark first; the toggle remembers a visitor's choice
  }
  document.documentElement.dataset.mode = mode;
  return mode;
}

export function setMode(mode) {
  document.documentElement.dataset.mode = mode;
  try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
}
