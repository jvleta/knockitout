// main.js

import { ToDoListViewModel } from "./ToDoListViewModel.js";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebase } from "./firebase.js";

const { auth } = getFirebase();

const toDoList = new ToDoListViewModel();

document
  .querySelector(".button--add")
  .addEventListener("click", () => toDoList.addTodoItem());
document
  .querySelector(".save-button")
  .addEventListener("click", () => toDoList.saveTodoItems());

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.querySelector(
      ".user-name"
    ).textContent = `User: ${user.displayName}`;
    toDoList.uid = user.uid;
    toDoList.loadTodoItems();
  } else {
    document.querySelector(".user-name").textContent = "";
    toDoList.toDoItems = [];
    toDoList.renderToDoItems();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  toDoList.renderToDoItems();
});
