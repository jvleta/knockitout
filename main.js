import ko from "knockout";
import { onAuthStateChanged } from "firebase/auth";
import ToDoListViewModel from "./ToDoListViewModel";
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
    vm.signUp.userName(user.displayName);
    vm.signUp.isLoggedIn(true);
    vm.toDoList.uid(user.uid);
    vm.toDoList.toDoItems.removeAll();
    vm.toDoList.loadTodoItems();
  } else {
    console.log('signed out');
    vm.signUp.userName("Anonymous");
    vm.signUp.isLoggedIn(false);
    vm.toDoList.uid(null);
    vm.toDoList.toDoItems.removeAll();
  }
});
