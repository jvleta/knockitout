import ko from "knockout";
import ToDoListViewModel from "./ToDoListViewModel";
import SignUpViewModel from "./SignUpViewModel";

const ViewModels = {
  signUp: new SignUpViewModel(),
  toDoList: new ToDoListViewModel(),
};

ko.applyBindings(ViewModels);
