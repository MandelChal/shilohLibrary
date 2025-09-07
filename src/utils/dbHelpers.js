// ------------------------------------------------------
// 🔥 Firebase Database Helpers - פונקציות עזר לעבודה עם Firestore
// ------------------------------------------------------

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from './firebase.js';

// ------------------------------------------------------
// 👥 משתמשים (Users)
// ------------------------------------------------------

export const getUsers = async () => {
    if (!isFirebaseEnabled) {
        console.warn('Firebase לא מחובר, חזרה ל-localStorage');
        const saved = localStorage.getItem('libraryUsers');
        return saved ? JSON.parse(saved) : [];
    }

    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error('שגיאה בטעינת משתמשים:', error);
        // fallback ל-localStorage
        const saved = localStorage.getItem('libraryUsers');
        return saved ? JSON.parse(saved) : [];
    }
};

export const addUser = async (userData) => {
    if (!isFirebaseEnabled) {
        console.warn('Firebase לא מחובר, שמירה ב-localStorage');
        const users = await getUsers();
        const newUser = { id: Date.now().toString(), ...userData };
        users.push(newUser);
        localStorage.setItem('libraryUsers', JSON.stringify(users));
        return newUser;
    }

    try {
        const docRef = await addDoc(collection(db, 'users'), userData);
        return { id: docRef.id, ...userData };
    } catch (error) {
        console.error('שגיאה בהוספת משתמש:', error);
        throw error;
    }
};

export const updateUser = async (userId, userData) => {
    if (!isFirebaseEnabled) {
        const users = await getUsers();
        const updatedUsers = users.map(user =>
            user.id === userId ? { ...user, ...userData } : user
        );
        localStorage.setItem('libraryUsers', JSON.stringify(updatedUsers));
        return;
    }

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, userData);
    } catch (error) {
        console.error('שגיאה בעדכון משתמש:', error);
        throw error;
    }
};

export const deleteUser = async (userId) => {
    if (!isFirebaseEnabled) {
        const users = await getUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        localStorage.setItem('libraryUsers', JSON.stringify(filteredUsers));
        return;
    }

    try {
        await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
        console.error('שגיאה במחיקת משתמש:', error);
        throw error;
    }
};

// ------------------------------------------------------
// 📚 ספרים (Books)
// ------------------------------------------------------

export const getBooks = async () => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryBooks');
        return saved ? JSON.parse(saved) : [];
    }

    try {
        const querySnapshot = await getDocs(collection(db, 'books'));
        const books = [];
        querySnapshot.forEach((doc) => {
            books.push({ id: doc.id, ...doc.data() });
        });
        return books;
    } catch (error) {
        console.error('שגיאה בטעינת ספרים:', error);
        const saved = localStorage.getItem('libraryBooks');
        return saved ? JSON.parse(saved) : [];
    }
};

export const addBook = async (bookData) => {
    if (!isFirebaseEnabled) {
        const books = await getBooks();
        const newBook = { id: Date.now().toString(), ...bookData };
        books.push(newBook);
        localStorage.setItem('libraryBooks', JSON.stringify(books));
        return newBook;
    }

    try {
        const docRef = await addDoc(collection(db, 'books'), bookData);
        return { id: docRef.id, ...bookData };
    } catch (error) {
        console.error('שגיאה בהוספת ספר:', error);
        throw error;
    }
};

export const updateBook = async (bookId, bookData) => {
    if (!isFirebaseEnabled) {
        const books = await getBooks();
        const updatedBooks = books.map(book =>
            book.id === bookId ? { ...book, ...bookData } : book
        );
        localStorage.setItem('libraryBooks', JSON.stringify(updatedBooks));
        return;
    }

    try {
        const bookRef = doc(db, 'books', bookId);
        await updateDoc(bookRef, bookData);
    } catch (error) {
        console.error('שגיאה בעדכון ספר:', error);
        throw error;
    }
};

export const deleteBook = async (bookId) => {
    if (!isFirebaseEnabled) {
        const books = await getBooks();
        const filteredBooks = books.filter(book => book.id !== bookId);
        localStorage.setItem('libraryBooks', JSON.stringify(filteredBooks));
        return;
    }

    try {
        await deleteDoc(doc(db, 'books', bookId));
    } catch (error) {
        console.error('שגיאה במחיקת ספר:', error);
        throw error;
    }
};

// ------------------------------------------------------
// 📂 קטגוריות (Categories)
// ------------------------------------------------------

export const getCategories = async () => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryCategories');
        return saved ? JSON.parse(saved) : [];
    }

    try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        return categories;
    } catch (error) {
        console.error('שגיאה בטעינת קטגוריות:', error);
        const saved = localStorage.getItem('libraryCategories');
        return saved ? JSON.parse(saved) : [];
    }
};

export const addCategory = async (categoryData) => {
    if (!isFirebaseEnabled) {
        const categories = await getCategories();
        const newCategory = { id: Date.now().toString(), ...categoryData };
        categories.push(newCategory);
        localStorage.setItem('libraryCategories', JSON.stringify(categories));
        return newCategory;
    }

    try {
        const docRef = await addDoc(collection(db, 'categories'), categoryData);
        return { id: docRef.id, ...categoryData };
    } catch (error) {
        console.error('שגיאה בהוספת קטגוריה:', error);
        throw error;
    }
};

export const updateCategory = async (categoryId, categoryData) => {
    if (!isFirebaseEnabled) {
        const categories = await getCategories();
        const updatedCategories = categories.map(cat =>
            cat.id === categoryId ? { ...cat, ...categoryData } : cat
        );
        localStorage.setItem('libraryCategories', JSON.stringify(updatedCategories));
        return;
    }

    try {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, categoryData);
    } catch (error) {
        console.error('שגיאה בעדכון קטגוריה:', error);
        throw error;
    }
};

export const deleteCategory = async (categoryId) => {
    if (!isFirebaseEnabled) {
        const categories = await getCategories();
        const filteredCategories = categories.filter(cat => cat.id !== categoryId);
        localStorage.setItem('libraryCategories', JSON.stringify(filteredCategories));
        return;
    }

    try {
        await deleteDoc(doc(db, 'categories', categoryId));
    } catch (error) {
        console.error('שגיאה במחיקת קטגוריה:', error);
        throw error;
    }
};

// ------------------------------------------------------
// 🔔 הודעות מערכת (Announcements)
// ------------------------------------------------------

export const getAnnouncements = async () => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryAnnouncements');
        return saved ? JSON.parse(saved) : [];
    }

    try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const announcements = [];
        querySnapshot.forEach((doc) => {
            announcements.push({ id: doc.id, ...doc.data() });
        });
        return announcements;
    } catch (error) {
        console.error('שגיאה בטעינת הודעות:', error);
        const saved = localStorage.getItem('libraryAnnouncements');
        return saved ? JSON.parse(saved) : [];
    }
};

export const addAnnouncement = async (announcementData) => {
    if (!isFirebaseEnabled) {
        const announcements = await getAnnouncements();
        const newAnnouncement = { id: Date.now().toString(), ...announcementData };
        announcements.unshift(newAnnouncement);
        localStorage.setItem('libraryAnnouncements', JSON.stringify(announcements));
        return newAnnouncement;
    }

    try {
        const docRef = await addDoc(collection(db, 'announcements'), announcementData);
        return { id: docRef.id, ...announcementData };
    } catch (error) {
        console.error('שגיאה בהוספת הודעה:', error);
        throw error;
    }
};

export const deleteAnnouncement = async (announcementId) => {
    if (!isFirebaseEnabled) {
        const announcements = await getAnnouncements();
        const filtered = announcements.filter(ann => ann.id !== announcementId);
        localStorage.setItem('libraryAnnouncements', JSON.stringify(filtered));
        return;
    }

    try {
        await deleteDoc(doc(db, 'announcements', announcementId));
    } catch (error) {
        console.error('שגיאה במחיקת הודעה:', error);
        throw error;
    }
};

// ------------------------------------------------------
// 📅 אירועים (Events)
// ------------------------------------------------------

export const getEvents = async () => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryEvents');
        return saved ? JSON.parse(saved) : [];
    }

    try {
        const q = query(collection(db, 'events'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const events = [];
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });
        return events;
    } catch (error) {
        console.error('שגיאה בטעינת אירועים:', error);
        const saved = localStorage.getItem('libraryEvents');
        return saved ? JSON.parse(saved) : [];
    }
};

export const addEvent = async (eventData) => {
    if (!isFirebaseEnabled) {
        const events = await getEvents();
        const newEvent = { id: Date.now().toString(), ...eventData };
        events.push(newEvent);
        localStorage.setItem('libraryEvents', JSON.stringify(events));
        return newEvent;
    }

    try {
        const docRef = await addDoc(collection(db, 'events'), eventData);
        return { id: docRef.id, ...eventData };
    } catch (error) {
        console.error('שגיאה בהוספת אירוע:', error);
        throw error;
    }
};

export const deleteEvent = async (eventId) => {
    if (!isFirebaseEnabled) {
        const events = await getEvents();
        const filtered = events.filter(event => event.id !== eventId);
        localStorage.setItem('libraryEvents', JSON.stringify(filtered));
        return;
    }

    try {
        await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
        console.error('שגיאה במחיקת אירוע:', error);
        throw error;
    }
};

// ------------------------------------------------------
// 🔄 פונקציות כלליות ומעקב שינויים
// ------------------------------------------------------

// פונקציה למעקב אחר שינויים בזמן אמת
export const subscribeToCollection = (collectionName, callback) => {
    if (!isFirebaseEnabled) {
        console.warn('Firebase לא מחובר - אין מעקב בזמן אמת');
        return () => { }; // return empty unsubscribe function
    }

    try {
        const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            callback(items);
        });
        return unsubscribe;
    } catch (error) {
        console.error(`שגיאה במעקב אחר ${collectionName}:`, error);
        return () => { };
    }
};

// פונקציה לאתחול ברירות מחדל
export const initializeDefaultData = async () => {
    try {
        // אתחול משתמשים ברירת מחדל
        const users = await getUsers();
        if (users.length === 0) {
            const defaultUsers = [
                {
                    username: 'admin',
                    password: 'admin123',
                    name: 'מנהל ראשי',
                    role: 'admin',
                    email: 'admin@library.com',
                    phone: '050-1234567',
                    createdAt: new Date().toISOString(),
                    createdBy: 'מערכת',
                    isActive: true
                },
                {
                    username: 'user1',
                    password: 'user123',
                    name: 'משתמש לדוגמה',
                    role: 'user',
                    email: 'user@library.com',
                    phone: '050-7654321',
                    createdAt: new Date().toISOString(),
                    createdBy: 'מנהל ראשי',
                    isActive: true
                }
            ];

            for (const user of defaultUsers) {
                await addUser(user);
            }
            console.log('משתמשי ברירת מחדל נוצרו');
        }

        // אתחול קטגוריות ברירת מחדל
        const categories = await getCategories();
        if (categories.length === 0) {
            const defaultCategories = [
                { id: 'halacha', name: 'הלכה', color: 'blue' },
                { id: 'aggadah', name: 'אגדה', color: 'green' },
                { id: 'philosophy', name: 'מחשבה', color: 'purple' }
            ];

            for (const category of defaultCategories) {
                await addCategory(category);
            }
            console.log('קטגוריות ברירת מחדל נוצרו');
        }

        return true;
    } catch (error) {
        console.error('שגיאה באתחול ברירות מחדל:', error);
        return false;
    }
};

// פונקציה לניקוי כל הנתונים (למקרי חירום)
export const clearAllData = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו בלתי הפיכה!')) {
        return;
    }

    try {
        if (isFirebaseEnabled) {
            // מחיקת כל האוספים
            const collections = ['users', 'books', 'categories', 'announcements', 'events'];
            for (const collectionName of collections) {
                const snapshot = await getDocs(collection(db, collectionName));
                for (const docSnapshot of snapshot.docs) {
                    await deleteDoc(doc(db, collectionName, docSnapshot.id));
                }
            }
        }

        // מחיקת localStorage גם כן
        localStorage.removeItem('libraryUsers');
        localStorage.removeItem('libraryBooks');
        localStorage.removeItem('libraryCategories');
        localStorage.removeItem('libraryAnnouncements');
        localStorage.removeItem('libraryEvents');

        console.log('כל הנתונים נמחקו');
        return true;
    } catch (error) {
        console.error('שגיאה במחיקת נתונים:', error);
        throw error;
    }
};