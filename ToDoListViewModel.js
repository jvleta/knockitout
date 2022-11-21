import ko from "knockout";
import getFirebase from "./firebase.js";
import { doc, updateDoc, getDoc } from "firebase/firestore";

const { db } = getFirebase();

function ToDoItem(task, isCompleted) {
  this.task = ko.observable(task);
  this.isCompleted = ko.observable(isCompleted);
}

function ToDoListViewModel() {
  const self = this;

  const docRef = doc(db, "todos", "iGWnr6GGZgrTHiikeC4N");

  self.loadTodoItems = function () {
    const docRef = doc(db, "todos", "iGWnr6GGZgrTHiikeC4N");
    let todos = ko.observableArray([]);
    getDoc(docRef).then((querySnapshot) => {
      const data = querySnapshot.data().data;
      console.log(this.toDoItems());
      data.forEach((item) => {
        todos.push(new ToDoItem(item.description, item.completed));
      });
    });

    return todos;
  };

  self.addTodoItem = function () {
    self.toDoItems.push(new ToDoItem("", false));
  };

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

  self.toDoItems = self.loadTodoItems();
}

export default ToDoListViewModel;
