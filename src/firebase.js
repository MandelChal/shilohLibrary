// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAftm6WfmZRQ64mVQlCAS6vWZ6FJZoCL4I",
    authDomain: "shilo-9fb0b.firebaseapp.com",
    projectId: "shilo-9fb0b",
    storageBucket: "shilo-9fb0b.firebasestorage.app",
    messagingSenderId: "1047885603466",
    appId: "1:1047885603466:web:c3c084374f747d76f0c373"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };