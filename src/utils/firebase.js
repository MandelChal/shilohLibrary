// ------------------------------------------------------
// ⚙️ Firebase Configuration
// ------------------------------------------------------

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// קונפיגורציה - תחליפו עם הערכים האמיתיים מ-Firebase Console
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "PLACEHOLDER",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "PLACEHOLDER.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "PLACEHOLDER",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "PLACEHOLDER.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "PLACEHOLDER",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "PLACEHOLDER"
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
export const isFirebaseEnabled = !!app;

// Export Firebase app
export default app;