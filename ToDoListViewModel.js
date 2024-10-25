// ToDoListViewModel.js

import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getFirebase } from "./firebase.js";
import { images } from "./images.js";

const { db } = getFirebase();

export function ToDoItem(task, isCompleted) {
  this.task = task;
  this.isCompleted = isCompleted;

  this.completeTask = function () {
    if (this.isCompleted) {
      const modal = document.getElementById("modal-one");
      modal.classList.add("open");
      const index = Math.floor(Math.random() * images.length);
      const imageContainer = document.getElementById("knockouts");
      imageContainer.innerHTML = `<p><img src=${images[index]} width="500" height="500"></p>`;
      setTimeout(() => {
        modal.classList.remove("open");
      }, 3000);
    }
  };
}

export function ToDoListViewModel() {
  this.isCompleted = false;
  this.completeTask = function () {
    console.log(this.isCompleted);
    if (this.isCompleted) {
      const modal = document.getElementById("modal-one");
      modal.classList.add("open");
      const index = Math.floor(Math.random() * images.length);
      const imageContainer = document.getElementById("knockouts");
      imageContainer.innerHTML = `<p><img src=${images[index]} width="500" height="500"></p>`;
      setTimeout(() => {
        modal.classList.remove("open");
      }, 3000);
    }
  };

  this.uid = "";
  this.toDoItems = [];

  const docRef = doc(db, "todos", "iGWnr6GGZgrTHiikeC4N");

  // Renders the to-do items in the DOM
  this.renderToDoItems = function () {
    console.log('yesssssss');
    const toDoListElement = document.querySelector(".todo-list");
    toDoListElement.innerHTML = ""; // Clear existing items

    this.toDoItems.forEach((item, index) => {
      
      const listItem = document.createElement("li");
      listItem.classList.toggle("completed", item.isCompleted);

      listItem.innerHTML = `
        <input class="task-checkbox larger" type="checkbox" ${
          item.isCompleted ? "checked" : ""
        }>
        <input class="task-text" placeholder="Enter a new task" value="${
          item.task
        }">
        <button class="button button--remove">x</button>
      `;

      // Event listeners
      listItem
        .querySelector(".task-checkbox")
        .addEventListener("change", () => {
          console.log('you got knocked the fuck out!!!');
         
          this.isCompleted = !item.isCompleted;
          this.completeTask();
          //this.renderToDoItems();
        });

      listItem
        .querySelector(".button--remove")
        .addEventListener("click", () => {
          this.toDoItems.splice(index, 1);
          this.renderToDoItems();
        });

      toDoListElement.appendChild(listItem);
    });
  };

  this.loadTodoItems = function () {
    getDoc(docRef).then((docSnap) => {
      this.toDoItems = docSnap
        .data()
        .data.map((item) => new ToDoItem(item.description, item.completed));
      this.renderToDoItems();
    });
  };

  this.addTodoItem = function () {
    this.toDoItems.push(new ToDoItem("", false));
    this.renderToDoItems();
  };

  this.saveTodoItems = async function () {
    const dataToSave = this.toDoItems.map((item) => ({
      description: item.task,
      completed: item.isCompleted,
    }));

    await updateDoc(docRef, { data: dataToSave });
  };
}
