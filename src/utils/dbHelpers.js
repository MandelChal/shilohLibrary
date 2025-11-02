// ------------------------------------------------------
// 🗄️ עזרי מסד נתונים - Firebase + localStorage fallback + מערכת הודעות
// ------------------------------------------------------

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

import { db, isFirebaseEnabled } from './firebase';

// מהארטיפקט הקודם - כל הפונקציות הקיימות
export const loginUser = async (username, password) => {
    console.log('מנסה התחברות עם:', username);

    if (!isFirebaseEnabled) {
        console.log('Firebase לא זמין - מחפש ב-localStorage');
        const saved = localStorage.getItem('libraryUsers');
        const users = saved ? JSON.parse(saved) : [];

        const user = users.find(u =>
            u.username === username && u.password === password && u.isActive !== false
        );

        if (!user) {
            throw new Error('שם משתמש או סיסמה שגויים');
        }

        return user;
    }

    try {
        const usersQuery = query(
            collection(db, 'users'),
            where('username', '==', username)
        );
        const usersSnapshot = await getDocs(usersQuery);

        if (usersSnapshot.empty) {
            throw new Error('משתמש לא נמצא');
        }

        const userData = usersSnapshot.docs[0].data();

        if (userData.password !== password) {
            throw new Error('סיסמה שגויה');
        }

        if (userData.isActive === false) {
            throw new Error('המשתמש אינו פעיל');
        }

        return {
            id: usersSnapshot.docs[0].id,
            ...userData
        };
    } catch (error) {
        console.error('שגיאה בהתחברות Firebase:', error);
        throw error;
    }
};

export const getUsers = async () => {
    if (!isFirebaseEnabled) {
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
        const saved = localStorage.getItem('libraryUsers');
        return saved ? JSON.parse(saved) : [];
    }
};

export const addUser = async (userData) => {
    if (!isFirebaseEnabled) {
        const users = await getUsers();
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('libraryUsers', JSON.stringify(users));
        return newUser;
    }

    try {
        const docRef = await addDoc(collection(db, 'users'), {
            ...userData,
            createdAt: serverTimestamp()
        });
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
            user.id === userId ? { ...user, ...userData, updatedAt: new Date().toISOString() } : user
        );
        localStorage.setItem('libraryUsers', JSON.stringify(updatedUsers));
        return;
    }

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...userData,
            updatedAt: serverTimestamp()
        });
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

export const checkUserExists = async (username) => {
    if (!isFirebaseEnabled) {
        const users = await getUsers();
        return users.some(u => u.username === username);
    }

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

// ------------------------------------------------------
// 📚 ניהול ספרים
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
        const newBook = {
            id: Date.now().toString(),
            ...bookData,
            createdAt: new Date().toISOString()
        };
        books.push(newBook);
        localStorage.setItem('libraryBooks', JSON.stringify(books));
        return newBook;
    }

    try {
        const docRef = await addDoc(collection(db, 'books'), {
            ...bookData,
            createdAt: serverTimestamp()
        });
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
            book.id === bookId ? { ...book, ...bookData, updatedAt: new Date().toISOString() } : book
        );
        localStorage.setItem('libraryBooks', JSON.stringify(updatedBooks));
        return;
    }

    try {
        const bookRef = doc(db, 'books', bookId);
        await updateDoc(bookRef, {
            ...bookData,
            updatedAt: serverTimestamp()
        });
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
// 🏷️ ניהול קטגוריות
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
        const newCategory = {
            ...categoryData,
            createdAt: new Date().toISOString()
        };
        categories.push(newCategory);
        localStorage.setItem('libraryCategories', JSON.stringify(categories));
        return newCategory;
    }

    try {
        const docRef = await addDoc(collection(db, 'categories'), {
            ...categoryData,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...categoryData };
    } catch (error) {
        console.error('שגיאה בהוספת קטגוריה:', error);
        throw error;
    }
};

export const updateCategory = async (categoryId, categoryData) => {
    if (!isFirebaseEnabled) {
        const categories = await getCategories();
        const updatedCategories = categories.map(category =>
            category.id === categoryId ? { ...category, ...categoryData, updatedAt: new Date().toISOString() } : category
        );
        localStorage.setItem('libraryCategories', JSON.stringify(updatedCategories));
        return;
    }

    try {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, {
            ...categoryData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('שגיאה בעדכון קטגוריה:', error);
        throw error;
    }
};

export const deleteCategory = async (categoryId) => {
    if (!isFirebaseEnabled) {
        const categories = await getCategories();
        const filteredCategories = categories.filter(category => category.id !== categoryId);
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
// 📅 ניהול אירועים
// ------------------------------------------------------

export const getEvents = async () => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryEvents');
        return saved ? JSON.parse(saved) : [];
    }

    try {
        const q = query(collection(db, 'events'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const events = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                ...data,
                date: data.date?.toDate ? data.date.toDate().toISOString() : data.date
            });
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
        const newEvent = {
            id: Date.now().toString(),
            ...eventData,
            createdAt: new Date().toISOString()
        };
        events.unshift(newEvent);
        localStorage.setItem('libraryEvents', JSON.stringify(events));
        return newEvent;
    }

    try {
        const docRef = await addDoc(collection(db, 'events'), {
            ...eventData,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...eventData };
    } catch (error) {
        console.error('שגיאה בהוספת אירוע:', error);
        throw error;
    }
};

export const deleteEvent = async (eventId) => {
    if (!isFirebaseEnabled) {
        const events = await getEvents();
        const filteredEvents = events.filter(event => event.id !== eventId);
        localStorage.setItem('libraryEvents', JSON.stringify(filteredEvents));
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
// 📢 ניהול הודעות מערכת
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
        const newAnnouncement = {
            id: Date.now().toString(),
            ...announcementData,
            createdAt: new Date().toISOString()
        };
        announcements.unshift(newAnnouncement);
        localStorage.setItem('libraryAnnouncements', JSON.stringify(announcements));
        return newAnnouncement;
    }

    try {
        const docRef = await addDoc(collection(db, 'announcements'), {
            ...announcementData,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...announcementData };
    } catch (error) {
        console.error('שגיאה בהוספת הודעה:', error);
        throw error;
    }
};

export const deleteAnnouncement = async (announcementId) => {
    if (!isFirebaseEnabled) {
        const announcements = await getAnnouncements();
        const filteredAnnouncements = announcements.filter(announcement => announcement.id !== announcementId);
        localStorage.setItem('libraryAnnouncements', JSON.stringify(filteredAnnouncements));
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
// 📋 בקשות השאלה (Loan Requests)
// ------------------------------------------------------

export const getLoanRequests = async () => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryLoanRequests');
        return saved ? JSON.parse(saved) : [];
    }

    try {
        const q = query(collection(db, 'loanRequests'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const requests = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        return requests;
    } catch (error) {
        console.error('שגיאה בטעינת בקשות השאלה:', error);
        const saved = localStorage.getItem('libraryLoanRequests');
        return saved ? JSON.parse(saved) : [];
    }
};

export const addLoanRequest = async (requestData) => {
    if (!isFirebaseEnabled) {
        const requests = await getLoanRequests();
        const newRequest = {
            id: Date.now().toString(),
            ...requestData,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        requests.unshift(newRequest);
        localStorage.setItem('libraryLoanRequests', JSON.stringify(requests));
        return newRequest;
    }

    try {
        const docRef = await addDoc(collection(db, 'loanRequests'), {
            ...requestData,
            createdAt: serverTimestamp(),
            status: 'pending'
        });
        return { id: docRef.id, ...requestData };
    } catch (error) {
        console.error('שגיאה בהוספת בקשת השאלה:', error);
        throw error;
    }
};

// **עדכון מרכזי - פונקציה שמשלחת הודעה אוטומטית**
export const updateLoanRequestStatus = async (requestId, newStatus, adminNotes = '') => {
    if (!isFirebaseEnabled) {
        const requests = await getLoanRequests();
        const updatedRequests = requests.map(req =>
            req.id === requestId
                ? {
                    ...req,
                    status: newStatus,
                    adminNotes,
                    updatedAt: new Date().toISOString()
                }
                : req
        );
        localStorage.setItem('libraryLoanRequests', JSON.stringify(updatedRequests));

        // שליחת הודעה למשתמש
        const request = requests.find(r => r.id === requestId);
        if (request) {
            await sendLoanRequestNotification(request.requesterId, request, newStatus, adminNotes);
        }

        return;
    }

    try {
        const requestRef = doc(db, 'loanRequests', requestId);
        await updateDoc(requestRef, {
            status: newStatus,
            adminNotes,
            updatedAt: serverTimestamp()
        });

        // קבלת נתוני הבקשה לשליחת הודעה
        const requestDoc = await getDoc(requestRef);
        if (requestDoc.exists()) {
            const requestData = { id: requestDoc.id, ...requestDoc.data() };
            await sendLoanRequestNotification(requestData.requesterId, requestData, newStatus, adminNotes);
        }

    } catch (error) {
        console.error('שגיאה בעדכון סטטוס בקשת השאלה:', error);
        throw error;
    }
};

export const deleteLoanRequest = async (requestId) => {
    if (!isFirebaseEnabled) {
        const requests = await getLoanRequests();
        const filteredRequests = requests.filter(req => req.id !== requestId);
        localStorage.setItem('libraryLoanRequests', JSON.stringify(filteredRequests));
        return;
    }

    try {
        await deleteDoc(doc(db, 'loanRequests', requestId));
    } catch (error) {
        console.error('שגיאה במחיקת בקשת השאלה:', error);
        throw error;
    }
};

// ------------------------------------------------------
// 🔔 מערכת הודעות למשתמשים
// ------------------------------------------------------

// קבלת הודעות למשתמש
export const getNotifications = async (userId) => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryNotifications');
        const allNotifications = saved ? JSON.parse(saved) : [];
        return allNotifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const notifications = [];
        querySnapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() });
        });
        return notifications;
    } catch (error) {
        console.error('שגיאה בטעינת הודעות:', error);
        const saved = localStorage.getItem('libraryNotifications');
        const allNotifications = saved ? JSON.parse(saved) : [];
        return allNotifications.filter(n => n.userId === userId);
    }
};

// הוספת הודעה חדשה
export const addNotification = async (notificationData) => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryNotifications');
        const notifications = saved ? JSON.parse(saved) : [];
        const newNotification = {
            id: Date.now().toString(),
            ...notificationData,
            createdAt: new Date().toISOString(),
            isRead: false
        };
        notifications.unshift(newNotification);
        localStorage.setItem('libraryNotifications', JSON.stringify(notifications));
        return newNotification;
    }

    try {
        const docRef = await addDoc(collection(db, 'notifications'), {
            ...notificationData,
            createdAt: serverTimestamp(),
            isRead: false
        });
        return { id: docRef.id, ...notificationData };
    } catch (error) {
        console.error('שגיאה בהוספת הודעה:', error);
        throw error;
    }
};

// סימון הודעה כנקראה
export const markNotificationAsRead = async (notificationId) => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryNotifications');
        const notifications = saved ? JSON.parse(saved) : [];
        const updatedNotifications = notifications.map(n =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        );
        localStorage.setItem('libraryNotifications', JSON.stringify(updatedNotifications));
        return;
    }

    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            isRead: true,
            readAt: serverTimestamp()
        });
    } catch (error) {
        console.error('שגיאה בסימון הודעה כנקראה:', error);
        throw error;
    }
};

// מחיקת הודעה
export const deleteNotification = async (notificationId) => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryNotifications');
        const notifications = saved ? JSON.parse(saved) : [];
        const filteredNotifications = notifications.filter(n => n.id !== notificationId);
        localStorage.setItem('libraryNotifications', JSON.stringify(filteredNotifications));
        return;
    }

    try {
        await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
        console.error('שגיאה במחיקת הודעה:', error);
        throw error;
    }
};

// שליחת הודעה אוטומטית לעדכון בקשת השאלה
export const sendLoanRequestNotification = async (userId, requestData, newStatus, adminNotes = '') => {
    let title, message, type;

    switch (newStatus) {
        case 'approved':
            title = 'בקשת השאלה אושרה! 📚';
            message = `בקשתך לספר "${requestData.bookTitle}" אושרה. הספר מוכן לאיסוף. ${adminNotes ? `הערת האדמין: ${adminNotes}` : ''}`;
            type = 'success';
            break;
        case 'rejected':
            title = 'בקשת השאלה נדחתה';
            message = `בקשתך לספר "${requestData.bookTitle}" נדחתה. ${adminNotes ? `סיבה: ${adminNotes}` : 'ניתן לפנות לספרן לפרטים נוספים.'}`;
            type = 'error';
            break;
        case 'returned':
            title = 'ספר הוחזר בהצלחה';
            message = `הספר "${requestData.bookTitle}" הוחזר בהצלחה. תודה שהשתמשת בספריה! ${adminNotes ? `הערת האדמין: ${adminNotes}` : ''}`;
            type = 'success';
            break;
        default:
            return;
    }

    try {
        await addNotification({
            userId,
            title,
            message,
            type,
            relatedId: requestData.id || null,
            relatedType: 'loan_request'
        });
        console.log(`הודעה נשלחה למשתמש ${userId} בנושא ${title}`);
    } catch (error) {
        console.error('שגיאה בשליחת הודעה:', error);
    }
};

// קבלת מספר הודעות לא נקראות
export const getUnreadNotificationsCount = async (userId) => {
    const notifications = await getNotifications(userId);
    return notifications.filter(n => !n.isRead).length;
};

// ------------------------------------------------------
// 🔄 פונקציות עזר
// ------------------------------------------------------

export const subscribeToCollection = (collectionName, callback) => {
    if (!isFirebaseEnabled) {
        return () => { };
    }

    try {
        const q = query(collection(db, collectionName));
        return onSnapshot(q, (querySnapshot) => {
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            callback(data);
        });
    } catch (error) {
        console.error(`שגיאה במעקב אחר ${collectionName}:`, error);
        return () => { };
    }
};

export const initializeDefaultData = async () => {
    try {
        console.log('מאתחל נתונים בסיסיים...');

        const existingUsers = await getUsers();
        if (existingUsers.length === 0) {
            console.log('יוצר משתמשי ברירת מחדל...');

            const defaultUsers = [
                {
                    username: 'admin',
                    password: 'admin123',
                    name: 'מנהל ראשי',
                    role: 'admin',
                    email: 'admin@library.com',
                    phone: '050-1234567',
                    isActive: true
                },
                {
                    username: 'user1',
                    password: 'user123',
                    name: 'משתמש להדגמה',
                    role: 'user',
                    email: 'user@library.com',
                    phone: '050-7654321',
                    isActive: true
                }
            ];

            for (const user of defaultUsers) {
                await addUser(user);
            }
            console.log('משתמשי ברירת מחדל נוצרו בהצלחה');
        }

        const existingCategories = await getCategories();
        if (existingCategories.length === 0) {
            console.log('יוצר קטגוריות ברירת מחדל...');

            const defaultCategories = [
                { id: 'torah', name: 'תנ"ך ותורה', color: 'blue' },
                { id: 'nevi', name: 'נביאים וכתובים', color: 'green' },
                { id: 'midrash', name: 'מדרשים', color: 'purple' },
                { id: 'talmud', name: 'משניות וגמרא', color: 'red' },
                { id: 'halacha', name: 'הלכה', color: 'yellow' },
                { id: 'responsa', name: 'שו"ת', color: 'indigo' },
                { id: 'prayer', name: 'תפילה וחסידות', color: 'pink' },
                { id: 'thought', name: 'מחשבה ומוסר', color: 'gray' },
                { id: 'history', name: 'היסטוריה', color: 'orange' }
            ];

            for (const category of defaultCategories) {
                await addCategory(category);
            }
            console.log('קטגוריות ברירת מחדל נוצרו בהצלחה');
        }

        console.log('אתחול נתונים הושלם בהצלחה');

    } catch (error) {
        console.error('שגיאה באתחול נתונים:', error);
    }
};