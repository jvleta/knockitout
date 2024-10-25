import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirebase } from "./firebase.js";

const { auth } = getFirebase();
const provider = new GoogleAuthProvider();

class SignUpViewModel {
  constructor() {
    this.userName = null;
    this.isLoggedIn = false;

    // Initialize DOM elements
    this.userNameEl = document.getElementById("user-name"); // Element where username will be displayed
    this.loginStatusEl = document.getElementById("login-status"); // Element where login status will be displayed
    this.updateDOM();
  }

  updateDOM() {
    // Update DOM based on the current state
    if (this.userNameEl) this.userNameEl.textContent = this.userName || "Guest";
    if (this.loginStatusEl)
      this.loginStatusEl.textContent = this.isLoggedIn
        ? "Logged In"
        : "Logged Out";
  }

  signInUser() {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        this.userName = user.displayName;
        this.isLoggedIn = true;
        this.updateDOM();
      })
      .catch((error) => {
        console.error("Sign-in error:", error.message);
      });
  }

  signOutUser() {
    signOut(auth)
      .then(() => {
        this.userName = null;
        this.isLoggedIn = false;
        this.updateDOM();
      })
      .catch((error) => {
        console.error("Sign-out error:", error.message);
      });
  }
}

// Usage example
const signUpViewModel = new SignUpViewModel();
document
  .getElementById("sign-in-btn")
  .addEventListener("click", () => signUpViewModel.signInUser());
document
  .getElementById("sign-out-btn")
  .addEventListener("click", () => signUpViewModel.signOutUser());

export default SignUpViewModel;
