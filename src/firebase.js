/**
 * Firebase configuration and helper utilities for authentication and Firestore.
 * This module centralizes initialization so other files can import the ready-to-use instances.
 */
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getFirestore, updateDoc, getDoc } from "firebase/firestore";

// Firebase project credentials. These are safe for client-side usage and match the Firebase console configuration.
const firebaseConfig = {
  apiKey: "AIzaSyAeZdcYt6MKmhRef2QwVYr33GJZ258cKsM",
  authDomain: "knock-it-out.firebaseapp.com",
  projectId: "knock-it-out",
  storageBucket: "knock-it-out.appspot.com",
  messagingSenderId: "600141360369",
  appId: "1:600141360369:web:ff1fb41ba1c0673f0e0d50",
  measurementId: "G-09MJF8VK52",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Exposes initialized Firebase services so other modules can reuse the same instances.
 * @returns {{ app: import("firebase/app").FirebaseApp, auth: import("firebase/auth").Auth, db: import("firebase/firestore").Firestore }}
 */
export const getFirebase = () => {
  return { app, auth, db };
};

/**
 * Initiates a Google sign-in flow using a popup.
 * Consumers may attach additional handlers to the returned promise if they need the credential details.
 * @returns {Promise<import("firebase/auth").UserCredential>} Resolves with the authenticated user's credential.
 */
export const signInUser = () => {
  const provider = new GoogleAuthProvider();
  // Return the promise so callers can respond to success or failure.
  return signInWithPopup(auth, provider)
    .then((result) => {
      // Access token can be used to interact with other Google APIs on behalf of the user.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // Signed-in user profile.
      const user = result.user;
      // ...
    })
    .catch((error) => {
      // Maintain detailed error information for analytics or user feedback.
      const errorCode = error.code;
      const errorMessage = error.message;
      // Email used during the failed attempt.
      const email = error.customData.email;
      // AuthCredential used during the attempt.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // Log the error details including the email for analytics or user feedback.
      console.error("Sign-in error:", { errorCode, errorMessage, email, credential });
    });
};

/**
 * Persists the todo items for the given user into Firestore.
 *
 * @param {string} uid Firebase Authentication UID for the current user.
 * @param {Array<unknown>} toDoItems Collection of todo data to store.
 * @returns {Promise<void>} Resolves when Firestore acknowledges the update.
 */
export const saveToDoListItems = async (uid, toDoItems) => {
  const docRef = doc(db, "todos", uid);
  try {
    // Merge ensures previously written fields remain intact.
    await updateDoc(
      docRef,
      {
        data: toDoItems,
      },
      { merge: true }
    );
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

/**
 * Loads todo items for the specified user.
 * Note: This function currently returns an empty array immediately and populates it asynchronously.
 *
 * @param {string} uid Firebase Authentication UID for the current user.
export const loadToDoListItems = async (uid) => {
  console.log('yooooooo', uid);
  const docRef = doc(db, "todos", uid);
  console.log(docRef);
  try {
    const querySnapshot = await getDoc(docRef);
    return querySnapshot.data()?.data || [];
  } catch (e) {
    console.error("Error loading document: ", e);
    return [];
  }
};
