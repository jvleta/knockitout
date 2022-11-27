import ko from "knockout";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getFirebase } from "./firebase.js";

import knockout1 from "./images/knockout1.gif";
import knockout2 from "./images/knockout2.gif";
import knockout3 from "./images/knockout3.gif";
import knockout4 from "./images/knockout4.gif";
import knockout5 from "./images/knockout5.gif";
import knockout6 from "./images/knockout6.gif";
import knockout7 from "./images/knockout7.gif";
import knockout8 from "./images/knockout8.gif";
import knockout9 from "./images/knockout9.gif";
import knockout10 from "./images/knockout10.gif";
import knockout11 from "./images/knockout11.gif";
import knockout12 from "./images/knockout12.gif";
import knockout13 from "./images/knockout13.gif";
import knockout14 from "./images/knockout14.gif";
import knockout15 from "./images/knockout15.gif";

const images = [
  knockout1,
  knockout2,
  knockout3,
  knockout4,
  knockout5,
  knockout6,
  knockout7,
  knockout8,
  knockout9,
  knockout10,
  knockout11,
  knockout12,
  knockout13,
  knockout14,
  knockout15,
];

const { db } = getFirebase();

export function ToDoItem(task, isCompleted) {
  this.task = ko.observable(task);
  this.isCompleted = ko.observable(isCompleted);

  this.completeTask = function () {    
    if (this.isCompleted()) {
      const modal = document.getElementById("modal-one");
      modal.classList.add("open");
      const index = Math.floor(Math.random() * images.length) + 1;
      console.log(index);
      const imageContainer = document.getElementById("knockouts");
      const imagefile = images[index];
      imageContainer.innerHTML = `<p><img src=${imagefile} width="500" height="500"></p>`;
      setTimeout(() => {
        modal.classList.remove("open");
      }, 3000);
    }
    return true;
  };
}

export function ToDoListViewModel() {
  const self = this;

  self.uid = ko.observable("");
  self.toDoItems = ko.observableArray([]);

  const docRef = doc(db, "todos", "iGWnr6GGZgrTHiikeC4N");

  self.loadTodoItems = function () {
    const docRef = doc(db, "todos", "iGWnr6GGZgrTHiikeC4N");
    getDoc(docRef).then((querySnapshot) => {
      const data = querySnapshot.data().data;
      data.forEach((item) => {
        self.toDoItems.push(new ToDoItem(item.description, item.completed));
      });
    });
  };

  self.addTodoItem = function () {
    console.log("trying to add a todo item");
    self.toDoItems.push(new ToDoItem("", false));
  };

  self.completeTask = function (todoItem) {};
  self.removeTodoItem = function (todoItem) {
    self.toDoItems.remove(todoItem);
  };

  self.saveTodoItems = async function () {
    console.log(self.toDoItems());

    try {
      await updateDoc(
        docRef,
        {
          data: self.toDoItems().map((item) => {
            return { completed: item.isCompleted(), description: item.task() };
          }),
        },
        { merge: true }
      );
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };
}
