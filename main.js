import ko from "knockout";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getFirestore, updateDoc, getDoc } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

let userInfo = {
  name: null,
  id: null,
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    userInfo.id = user.uid;
    userInfo.name = user.displayName;
    console.log(userInfo);
  } else {
    userInfo.id = null;
    userInfo.name = null;
  }
});

function ToDoItem(task, isCompleted) {
  this.task = ko.observable(task);
  this.isCompleted = ko.observable(isCompleted);
}

function UserInfoViewModel() {
  let self = this;

  self.isLoggedIn = kos.observable(false);
  self.username = ko.observable();
  self.id = ko.observable();

  self.loginUser = function () {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log(user);
        // ...
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  };
  self.logoutUser = function () {
    signOut(auth).then(() => {
      // Sign-out successful.
    }).catch((error) => {
      // An error happened.
    });
  };
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
ko.applyBindings(new UserInfoViewModel());