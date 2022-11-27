import ko from "knockout";
import { onAuthStateChanged } from "firebase/auth";
import {ToDoItem, ToDoListViewModel} from "./ToDoListViewModel";
import SignUpViewModel from "./SignUpViewModel";
import { getFirebase } from "./firebase";

const vm = {
  signUp: new SignUpViewModel(),
  toDoList: new ToDoListViewModel(),
};

ko.applyBindings(vm);

const { auth } = getFirebase();

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('signed in');
    vm.signUp.userName(`User: ${user.displayName}`);
    vm.signUp.isLoggedIn(true);
    vm.toDoList.uid(user.uid);
    vm.toDoList.toDoItems.removeAll();
    vm.toDoList.loadTodoItems();
  } else {
    console.log('signed out');
    vm.signUp.userName("");
    vm.signUp.isLoggedIn(false);
    vm.toDoList.uid(null);
    vm.toDoList.toDoItems.removeAll();
    vm.toDoList.toDoItems([new ToDoItem("sign in with your Gmail account", false), new ToDoItem("create some tasks", false), new ToDoItem("knock them out!", false)])
  }
});
