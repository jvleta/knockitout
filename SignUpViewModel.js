import { signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { getFirebase } from "./firebase.js";

const { auth } = getFirebase();
const provider = new GoogleAuthProvider();

export const signInUser = () =>
  signInWithPopup(auth, provider).catch((error) => {
    console.error("Error signing in", error);
    throw error;
  });

export const signOutUser = () =>
  signOut(auth).catch((error) => {
    console.error("Error signing out", error);
    throw error;
  });
