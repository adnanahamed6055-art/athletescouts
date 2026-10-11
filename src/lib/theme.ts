const KEY = "as-theme";
export type Theme = "dark" | "light";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("light", t === "light");
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  applyTheme(t);
}
