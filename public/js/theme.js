document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  const icon = themeToggle.querySelector("i");
  if (!icon) return;

  const THEME_KEY = "theme";
  const CLASS_DARK = "dark";
  const ICON_SUN = "bi-sun-fill";
  const ICON_MOON = "bi-moon-fill";

  const applyTheme = (isDark) => {
    document.documentElement.classList.toggle(CLASS_DARK, isDark);
    icon.classList.replace(
      isDark ? ICON_MOON : ICON_SUN,
      isDark ? ICON_SUN : ICON_MOON
    );
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  };

  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  const initialIsDark =
    savedTheme === "dark" || (!savedTheme && systemPrefersDark);

  applyTheme(initialIsDark);

  themeToggle.addEventListener("click", () => {
    const isDark = !document.documentElement.classList.contains(CLASS_DARK);
    applyTheme(isDark);
  });
});
