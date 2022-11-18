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
  ]);
  
  self.addTodoItem = function () {
    self.toDoItems.push(new ToDoItem("", false));
  };

  self.removeTodoItem = function (todoItem) {
    self.toDoItems.remove(todoItem);
  };

  self.loadTodoItems = async function() {
    const querySnapshot = await getDoc(docRef);    
    const data = querySnapshot.data().data;
    console.log(this.toDoItems());
    this.toDoItems.removeAll();

    data.forEach(item => {
      self.toDoItems.push(new ToDoItem(item.description, item.completed));
    });
  }

  self.saveTodoItems = async function() {
    console.log(self.toDoItems());

    try {
      await updateDoc(docRef, {
        data: self.toDoItems().map(item => { return {completed: item.isCompleted(), description: item.task()}})
      }, {merge: true}
      );
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
    
  };
}

ko.applyBindings(new ListViewModel());
