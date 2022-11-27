import ko from "knockout";
import { signInWithPopup, signInWithRedirect, signOut, GoogleAuthProvider } from "firebase/auth";
import { getFirebase } from "./firebase.js";

const { auth } = getFirebase();
const provider = new GoogleAuthProvider();

const SignUpViewModel = function () {
  let self = this;

  self.userName = ko.observable(null);
  self.isLoggedIn = ko.observable(false);

  self.signInUser = function () {
    // signInWithRedirect(auth, provider);

    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
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

  self.signOutUser = function () {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
      })
      .catch((error) => {
        // An error happened.
      });
  };
};

export default SignUpViewModel;
