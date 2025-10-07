// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIibIUY6R1MBZ0FH3DvxjPTvd22gz1140",
  authDomain: "my-basic-signup-page.firebaseapp.com",
  projectId: "my-basic-signup-page",
  storageBucket: "my-basic-signup-page.firebasestorage.app",
  messagingSenderId: "15008762931",
  appId: "1:15008762931:web:d28ab25f8aa67c17e86746",
  measurementId: "G-62KWEFEEQM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// helper wrapper to use similar names as original script
export async function createUserEmailPassword(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function saveUserDoc(uid, data) {
  const userRef = doc(db, "users", uid);
  return setDoc(userRef, { ...data, createdAt: serverTimestamp() });
}

export { auth, db, app };
