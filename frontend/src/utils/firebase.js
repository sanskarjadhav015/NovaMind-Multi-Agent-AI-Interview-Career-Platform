// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"



const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "novamindai-7f9a3.firebaseapp.com",
  projectId: "novamindai-7f9a3",
  storageBucket: "novamindai-7f9a3.firebasestorage.app",
  messagingSenderId: "122007589597",
  appId: "1:122007589597:web:fb3be023476e1184478134",
  measurementId: "G-6CT0NKYHYK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider
export {auth, provider }