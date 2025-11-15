import { onAuthStateChanged } from "firebase/auth";
import { createTodoList } from "./ToDoListViewModel.js";
import { signInUser, signOutUser } from "./SignUpViewModel.js";
import { getFirebase } from "./firebase.js";
import { initThemeToggle } from "./ThemeManager.js";

// Default tasks to display when the user is logged out.
const DEFAULT_ITEMS = [
  {
    description: "sign in with your Gmail account",
    details: "",
    completed: false,
  },
  { description: "create some tasks", details: "", completed: false },
  { description: "knock them out!", details: "", completed: false },
];

const { auth } = getFirebase();

const init = () => {
  // Cache DOM references used across the app lifecycle.
  const userNameElement = document.getElementById("user-name");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const addButton = document.getElementById("add-button");
  const listElement = document.getElementById("todo-list");
  const modalElement = document.getElementById("modal-one");
  const imageContainer = document.getElementById("knockouts");
  const yearElement = document.getElementById("current-year");
  const themeToggle = document.getElementById("theme-toggle");

  // Enable light/dark theme toggling.
  initThemeToggle(themeToggle);

  // Create a todo list instance that manages rendering and persistence.
  const toDoList = createTodoList({
    listElement,
    modalElement,
    imageContainer,
  });

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Configure UI defaults for signed-out visitors.
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

// Kick off initialization once the DOM is ready.
document.addEventListener("DOMContentLoaded", init);
