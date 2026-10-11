import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFZ9BnRy4rtp0sl7_XITnoCiEvpgO0mNQ",
  authDomain: "porikkhaghor.firebaseapp.com",
  projectId: "porikkhaghor",
  storageBucket: "porikkhaghor.firebasestorage.app",
  messagingSenderId: "626368248235",
  appId: "1:626368248235:web:f539cd2afcd463594c3aee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
