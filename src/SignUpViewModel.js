// TODO: Add JSDoc comments.
import { signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { getFirebase } from "./firebase.js";

const { auth } = getFirebase();
const provider = new GoogleAuthProvider();

/**
 * Initiates a Google sign-in flow for the current user.
 *
 * @returns {Promise<import("firebase/auth").UserCredential>} Resolves with the authenticated user credential.
 * @throws {import("firebase/app").FirebaseError} Propagates Firebase auth errors that occur during sign-in.
 */
export const signInUser = () =>
  signInWithPopup(auth, provider).catch((error) => {
    console.error("Error signing in", error);
    throw error;
  });

/**
 * Signs the current user out of Firebase Authentication.
 *
 * @returns {Promise<void>} Resolves when the user is successfully signed out.
 * @throws {import("firebase/app").FirebaseError} Propagates Firebase auth errors that occur during sign-out.
 */
export const signOutUser = () =>
  signOut(auth).catch((error) => {
    console.error("Error signing out", error);
    throw error;
  });
