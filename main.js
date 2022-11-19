import { initializeApp } from "firebase/app";
import {
  doc,
  collection,
  addDoc,
  getFirestore,
  updateDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAeZdcYt6MKmhRef2QwVYr33GJZ258cKsM",
  authDomain: "knock-it-out.firebaseapp.com",
  projectId: "knock-it-out",
  storageBucket: "knock-it-out.appspot.com",
  messagingSenderId: "600141360369",
  appId: "1:600141360369:web:ff1fb41ba1c0673f0e0d50",
  measurementId: "G-09MJF8VK52",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

import ko from "knockout";

function ToDoItem(task, isCompleted) {
  this.task = ko.observable(task);
  this.isCompleted = ko.observable(isCompleted);
}

function ListViewModel() {
  var self = this;

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

ko.applyBindings(new ListViewModel());

import knockout1 from './images/knockout1.gif';
import knockout2 from './images/knockout2.gif';
import knockout3 from './images/knockout3.gif';
import knockout4 from './images/knockout4.gif';
import knockout5 from './images/knockout5.gif';
import knockout6 from './images/knockout6.gif';
import knockout7 from './images/knockout7.gif';
import knockout8 from './images/knockout8.gif';
import knockout9 from './images/knockout9.gif';
import knockout10 from './images/knockout10.gif';

const dostuff = () => {
  

  window.setInterval(function(){
    const index = Math.floor(Math.random() * 5) + 1;
    const imageContainer = document.getElementById("knockouts");
    imagefile = images[index];
    imageContainer.innerHTML = `<p><img src=${imagefile} width="500" height="500"></p>`
  }, 5000);   
}
const images = [knockout1, knockout2, knockout3, knockout4, knockout5];
export default images;