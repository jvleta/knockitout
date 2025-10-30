import { onAuthStateChanged } from "firebase/auth";
import { createTodoList } from "./ToDoListViewModel.js";
import { signInUser, signOutUser } from "./SignUpViewModel.js";
import { getFirebase } from "./firebase.js";

const DEFAULT_ITEMS = [
  { description: "sign in with your Gmail account", completed: false },
  { description: "create some tasks", completed: false },
  { description: "knock them out!", completed: false },
];

const { auth } = getFirebase();

const init = () => {
  const userNameElement = document.getElementById("user-name");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const addButton = document.getElementById("add-button");
  const saveButton = document.getElementById("save-button");
  const listElement = document.getElementById("todo-list");
  const modalElement = document.getElementById("modal-one");
  const imageContainer = document.getElementById("knockouts");

  const toDoList = createTodoList({
    listElement,
    modalElement,
    imageContainer,
  });

  const setLoggedOutState = () => {
    userNameElement.textContent = "";
    loginButton.classList.remove("is-hidden");
    logoutButton.classList.add("is-hidden");
    saveButton.classList.add("is-hidden");
    toDoList.setUid("");
    toDoList.setItems(DEFAULT_ITEMS);
  };

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("signed in");
      userNameElement.textContent = `User: ${user.displayName || "Anonymous"}`;
      loginButton.classList.add("is-hidden");
      logoutButton.classList.remove("is-hidden");
      saveButton.classList.remove("is-hidden");
      toDoList.setUid(user.uid);
      toDoList.setItems([]);
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

  saveButton.addEventListener("click", () => {
    toDoList.saveTodoItems();
  });

  // Show default items before auth state resolves.
  setLoggedOutState();
};

document.addEventListener("DOMContentLoaded", init);
