import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const getFirebase = () => {
  return { app, auth, db };
};

export const signInUser = () => {
  const provider = new GoogleAuthProvider();
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

export const saveToDoListITems = async (uid, toDoItems) => {
  const docRef = doc(db, "todos", uid);
  try {
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

export const loadToDoListItems = (uid) => {
  let toDoItems = [];
  console.log('yooooooo', uid);
  const docRef = doc(db, "todos", uid);
  console.log(docRef);
  getDoc(docRef).then((querySnapshot) => {
    console.log({docRef, db, querySnapshot});
    toDoItems = querySnapshot.data().data;
  });
  return toDoItems;
};
