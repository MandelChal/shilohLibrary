// firebase.js - תצורת Firebase עם Storage
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// קונפיגורציה - עם הערכים האמיתיים שלך מ-Firebase Console
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAftm6WfmZRQ64mVQlCAS6vWZ6FJZoCL4I",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shilo-9fb0b.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shilo-9fb0b",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shilo-9fb0b.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1047885603466",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1047885603466:web:c3c084374f747d76f0c373"
};

// אתחול Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    // במקרה של שגיאה - ניתן להריץ במצב מקומי
    app = null;
}

// Export services
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;
export const isFirebaseEnabled = !!app;

// Export Firebase app
export default app;