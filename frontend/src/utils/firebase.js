// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "novamind-interview.firebaseapp.com",
  projectId: "novamind-interview",
  storageBucket: "novamind-interview.firebasestorage.app",
  messagingSenderId: "846544109897",
  appId: "1:846544109897:web:1a62e25e054d84aa281a98",
  measurementId: "G-EPV0H28XZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
