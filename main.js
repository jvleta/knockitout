import { initializeApp } from "firebase/app";
import { doc, collection, addDoc, getFirestore, updateDoc, getDocs, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAeZdcYt6MKmhRef2QwVYr33GJZ258cKsM",
  authDomain: "knock-it-out.firebaseapp.com",
  projectId: "knock-it-out",
  storageBucket: "knock-it-out.appspot.com",
  messagingSenderId: "600141360369",
  appId: "1:600141360369:web:ff1fb41ba1c0673f0e0d50",
  measurementId: "G-09MJF8VK52"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);


import ko from 'knockout';

function ToDoItem(task, isCompleted) {
  this.task = ko.observable(task);
  this.isCompleted = ko.observable(isCompleted);
}

function ListViewModel() {
  var self = this;

  const docRef = doc(db, "todos", "iGWnr6GGZgrTHiikeC4N");
    
  self.toDoItems = ko.observableArray([
    new ToDoItem("Walk the dog", false),
    new ToDoItem("Do more stuff", false),
    new ToDoItem("Some stuff that's done", true),
  ]);

  self.addTodoItem = function () {
    self.toDoItems.push(new ToDoItem("", false));
  };

  self.removeTodoItem = function (todoItem) {
    self.toDoItems.remove(todoItem);
  };

  // self.loadTodoItems = async function() {
  //   const querySnapshot = await getDoc(docRef);    
  //   const data = querySnapshot.data().data;
  //   console.log(this.toDoItems());
  //   const todos = data.map(item => new ToDoItem(item.description, item.completed));
  //   self.toDoItems = ko.observableArray(todos);
  // }

  self.saveTodoItems = async function() {
    console.log(self.toDoItems());
    try {
      await updateDoc(docRef, {
        data: [
          {
            description: "this is a task",
            completed: true
          },
          {
            description: "this is another task",
            completed: false
          }
        ]
      }, {merge: true}
      );
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
    
  };
}

ko.applyBindings(new ListViewModel());
