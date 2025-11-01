import { onAuthStateChanged } from "firebase/auth";
import { createTodoList } from "./ToDoListViewModel.js";
import { signInUser, signOutUser } from "./SignUpViewModel.js";
import { getFirebase } from "./firebase.js";

const DEFAULT_ITEMS = [
  { description: "sign in with your Gmail account", completed: false },
  { description: "create some tasks", completed: false },
  { description: "knock them out!", completed: false },
];

const THEME_STORAGE_KEY = "knockitout-theme";
const DARK_MODE = "dark";
const LIGHT_MODE = "light";

const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
};

const persistTheme = (mode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    // Ignore storage errors (e.g., private browsing restrictions)
  }
};

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

const initThemeToggle = (toggleElement) => {
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

const { auth } = getFirebase();

const init = () => {
  const userNameElement = document.getElementById("user-name");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const addButton = document.getElementById("add-button");
  const listElement = document.getElementById("todo-list");
  const modalElement = document.getElementById("modal-one");
  const imageContainer = document.getElementById("knockouts");
  const yearElement = document.getElementById("current-year");
  const themeToggle = document.getElementById("theme-toggle");

  initThemeToggle(themeToggle);

  const toDoList = createTodoList({
    listElement,
    modalElement,
    imageContainer,
  });

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const setLoggedOutState = () => {
    userNameElement.textContent = "";
    loginButton.classList.remove("is-hidden");
    logoutButton.classList.add("is-hidden");
    toDoList.setUid("");
    toDoList.setItems(DEFAULT_ITEMS, { triggerSave: false });
  };

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("signed in");
      userNameElement.textContent = `User: ${user.displayName || "Anonymous"}`;
      loginButton.classList.add("is-hidden");
      logoutButton.classList.remove("is-hidden");
      toDoList.setUid(user.uid);
      toDoList.setItems([], { triggerSave: false });
      toDoList
        .loadTodoItems()
        .catch((error) => console.error("Error loading todos", error));
    } else {
      console.log("signed out");
      setLoggedOutState();
    }
  });

  loginButton.addEventListener("click", () => {
    signInUser().catch(() => {
      // Error already logged in signInUser
    });
  });

  logoutButton.addEventListener("click", () => {
    signOutUser().catch(() => {
      // Error already logged in signOutUser
    });
  });

  addButton.addEventListener("click", () => {
    toDoList.addTodoItem();
  });

  // Show default items before auth state resolves.
  setLoggedOutState();
};

document.addEventListener("DOMContentLoaded", init);
