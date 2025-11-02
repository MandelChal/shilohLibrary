// firebaseServices.js - שירותי Firebase לניהול נתונים
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './firebase';

// ==============================================
// 🔐 פונקציות אימות משתמשים
// ==============================================

// התחברות משתמש
export const loginUser = async (username, password) => {
    try {
        // חיפוש משתמש לפי שם משתמש
        const usersQuery = query(
            collection(db, 'users'),
            where('username', '==', username)
        );
        const usersSnapshot = await getDocs(usersQuery);

        if (usersSnapshot.empty) {
            throw new Error('משתמש לא נמצא');
        }

        const userData = usersSnapshot.docs[0].data();

        // בדיקת סיסמה (בסיסית - לייצור צריך הצפנה)
        if (userData.password !== password) {
            throw new Error('סיסמה שגויה');
        }

        return {
            id: usersSnapshot.docs[0].id,
            ...userData
        };
    } catch (error) {
        console.error('שגיאה בהתחברות:', error);
        throw error;
    }
};

// יצירת משתמש חדש ב-Firestore (לא Auth)
export const createUserInFirestore = async (userData) => {
    try {
        const docRef = await addDoc(collection(db, 'users'), {
            ...userData,
            createdAt: serverTimestamp(),
            isActive: true
        });
        return { id: docRef.id, ...userData };
    } catch (error) {
        console.error('שגיאה ביצירת משתמש ב-Firestore:', error);
        throw error;
    }
};

// בדיקת אם משתמש קיים
export const checkUserExists = async (username) => {
    try {
        const usersQuery = query(
            collection(db, 'users'),
            where('username', '==', username)
        );
        const usersSnapshot = await getDocs(usersQuery);
        return !usersSnapshot.empty;
    } catch (error) {
        console.error('שגיאה בבדיקת קיום משתמש:', error);
        return false;
    }
};

// עדכון סיסמת משתמש
export const updateUserPassword = async (userId, newPassword) => {
    if (!isFirebaseEnabled) {
        const users = await getUsers();
        const updatedUsers = users.map(user =>
            user.id === userId ? { ...user, password: newPassword, updatedAt: new Date().toISOString() } : user
        );
        localStorage.setItem('libraryUsers', JSON.stringify(updatedUsers));
        return;
    }

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            password: newPassword, // בסביבת ייצור צריך הצפנה!
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('שגיאה בעדכון סיסמה:', error);
        throw error;
    }
};

// יצירת משתמש חדש
export const createUser = async (userData) => {
    try {
        const docRef = await addDoc(collection(db, 'users'), {
            ...userData,
            createdAt: serverTimestamp(),
            isActive: true
        });
        return docRef.id;
    } catch (error) {
        console.error('שגיאה ביצירת משתמש:', error);
    }
};