const THEME_STORAGE_KEY = "knockitout-theme";
const DARK_MODE = "dark";
const LIGHT_MODE = "light";

/**
 * Retrieve the stored theme preference from localStorage.
 * @returns {"dark"|"light"|null} Stored theme value or null when unavailable.
 */
const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
};

/**
 * Persist the selected theme to localStorage.
 * @param {"dark"|"light"} mode Theme value to persist.
 * @returns {void}
 */
const persistTheme = (mode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    // Ignore storage errors (e.g., private browsing restrictions)
  }
};

/**
 * Apply the theme to the document and sync the toggle control state.
 * @param {"dark"|"light"} mode Theme value that should be applied.
 * @param {HTMLInputElement|undefined} toggleElement Checkbox toggle controlling the theme.
 * @returns {void}
 */
const applyTheme = (mode, toggleElement) => {
  if (mode === LIGHT_MODE) {
    document.body.classList.add("theme-light");
  } else {
    document.body.classList.remove("theme-light");
  }

  if (toggleElement) {
    toggleElement.checked = mode !== LIGHT_MODE;
  }
};

/**
 * Determine the initial theme, preferring stored user choice, then system preference.
 * @returns {"dark"|"light"} Theme mode that should be active.
 */
const resolveInitialTheme = () => {
  const stored = getStoredTheme();
  if (stored === LIGHT_MODE || stored === DARK_MODE) {
    return stored;
  }

  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return DARK_MODE;
  }

  return DARK_MODE;
};

/**
 * Initialize the theme toggle UI and apply persisted or inferred theme settings.
 * @param {HTMLInputElement|undefined} toggleElement Checkbox toggle controlling the theme.
 * @returns {void}
 */
export const initThemeToggle = (toggleElement) => {
  const initialMode = resolveInitialTheme();
  applyTheme(initialMode, toggleElement);

  if (toggleElement) {
    toggleElement.addEventListener("change", () => {
      const mode = toggleElement.checked ? DARK_MODE : LIGHT_MODE;
      applyTheme(mode, toggleElement);
      persistTheme(mode);
    });
  }

  if (initialMode !== getStoredTheme()) {
    persistTheme(initialMode);
  }
};
