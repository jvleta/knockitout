import ko from "knockout";

const SignUpViewModel = function () {
  let self = this;

  self.userName = ko.observable('Rusty Shackleford');
  self.userPassword = ko.observable();

  self.signup = function () {
    console.log("signing up " + self.userName());
  };
};

export default SignUpViewModel;