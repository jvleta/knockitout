import ko from "knockout";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getFirebase } from "./firebase.js";

const { db } = getFirebase();

function ToDoItem(task, isCompleted) {
  this.task = ko.observable(task);
  this.isCompleted = ko.observable(isCompleted);
}

function ToDoListViewModel() {
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
    console.log('trying to add a todo item');
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
}

export default ToDoListViewModel;
