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

// עדכון הפונקציה updateLoanRequestStatus לתמיכה בסטטוסים חדשים
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
        // שינוי: לא נשתמש ב-orderBy כדי להימנע משגיאות האינדקס
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const notifications = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
            });
        });
        // מיון בצד הלקוח במקום ב-Firebase
        return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error('שגיאה בטעינת הודעות:', error);
        // fallback ל-localStorage אם Firebase נכשל
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
export const notifyAdminReturnRequest = async (returnData) => {
    try {
        const users = await getUsers();
        const admins = users.filter(user => user.role === 'admin' && user.isActive !== false);

        const message = `בקשת החזרת ספר חדשה:

ספר: "${returnData.bookTitle}"
מחזיר: ${returnData.requesterName}
תאריך בקשת החזרה: ${new Date().toLocaleDateString('he-IL')}

יש לבדוק ולאשר את החזרת הספר במערכת הניהול.`;

        for (const admin of admins) {
            const notificationData = {
                userId: admin.id,
                title: 'בקשת החזרת ספר חדשה',
                message,
                type: 'info',
                relatedId: returnData.loanRequestId,
                relatedType: 'return_request',
                bookTitle: returnData.bookTitle,
                bookId: returnData.bookId,
                createdAt: new Date().toISOString(),
                isRead: false
            };

            await addNotification(notificationData);
        }

        console.log(`הודעה על בקשת החזרה נשלחה ל-${admins.length} מנהלים`);
    } catch (error) {
        console.error('שגיאה בשליחת הודעה למנהלים:', error);
    }
};
// עדכון הפונקציה sendLoanRequestNotification לתמיכה בהחזרה
export const sendLoanRequestNotification = async (userId, requestData, newStatus, adminNotes = '', returnDate = null) => {
    let title, message, type;

    const getReturnDate = () => {
        if (returnDate) return returnDate;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);
        return futureDate.toLocaleDateString('he-IL');
    };

    const getBookLocation = () => {
        if (requestData.bookLocation) {
            return `${requestData.bookLocation.color} ${requestData.bookLocation.letter}${requestData.bookLocation.number}`;
        }
        return 'פנה לספרן לקבלת המיקום';
    };

    switch (newStatus) {
        case 'approved':
            title = `${requestData.requesterName}, הספר "${requestData.bookTitle}" אושר להשאלה!`;
            message = `הספר אושר להשאלה עד תאריך ${getReturnDate()}
      
מיקום הספר: ${getBookLocation()}
פנה לספרן עם תעודת זהות לאיסוף

${adminNotes ? `הערת הספרן: ${adminNotes}` : 'בהצלחה בלימודים!'}`;
            type = 'success';

            // הוספת אירוע החזרה ללוח השנה
            try {
                const returnEventDate = new Date();
                returnEventDate.setDate(returnEventDate.getDate() + 14);

                const eventData = {
                    title: `החזרת ספר: ${requestData.bookTitle}`,
                    description: `מועד החזרה של הספר "${requestData.bookTitle}" לספרייית שילה`,
                    date: returnEventDate.toISOString(),
                    time: '18:00',
                    createdAt: new Date().toISOString(),
                    createdBy: 'מערכת הודעות',
                    type: 'book_return',
                    bookId: requestData.bookId,
                    userId: userId,
                    loanRequestId: requestData.id
                };

                await addEvent(eventData);
                console.log('אירוע החזרת ספר נוסף ללוח השנה');
            } catch (error) {
                console.error('שגיאה בהוספת אירוע ללוח שנה:', error);
            }
            break;

        case 'rejected':
            title = `${requestData.requesterName}, בקשת ההשאלה נדחתה`;
            message = `הבקשה לספר "${requestData.bookTitle}" נדחתה.

${adminNotes ? `סיבת הדחיה: ${adminNotes}` : 'יייתכן שהספר כבר מושאל או בתחזוקה.'}

ניתן לפנות לספרן לקבלת מידע נוסף או לבקש ספר חלופי.`;
            type = 'error';
            break;

        case 'returned':
            title = `${requestData.requesterName}, הספר הוחזר בהצלחה`;
            message = `הספר "${requestData.bookTitle}" הוחזר בהצלחה לספרייית שילה.

תודה שהשתמשת בשירותי הספרייה!
${adminNotes ? `הערת הספרן: ${adminNotes}` : ''}`;
            type = 'success';
            break;

        case 'pending_return':
            title = `${requestData.requesterName}, בקשת החזרה התקבלה`;
            message = `בקשת החזרה לספר "${requestData.bookTitle}" התקבלה במערכת.

הספרן יבדוק את הבקשה ויאשר את החזרת הספר בהקדם.
תקבל הודעה כאשר החזרה תאושר.`;
            type = 'info';
            break;

        default:
            return;
    }

    try {
        const notificationData = {
            userId,
            title,
            message,
            type,
            relatedId: requestData.id || null,
            relatedType: 'loan_request',
            bookTitle: requestData.bookTitle,
            bookId: requestData.bookId,
            createdAt: new Date().toISOString(),
            isRead: false
        };

        await addNotification(notificationData);
        console.log(`הודעה נשלחה למשתמש ${requestData.requesterName}: ${title}`);
    } catch (error) {
        console.error('שגיאה בשליחת הודעה:', error);
        console.log(`הודעה (לא נשמרה): ${title} - ${message}`);
    }
};

// 📄 dbHelpers.js

export const getUserBorrowedBooks = async (userId) => {
    if (!isFirebaseEnabled) {
        const saved = localStorage.getItem('libraryLoanRequests');
        const allRequests = saved ? JSON.parse(saved) : [];

        const borrowed = allRequests.filter(req =>
            req.requesterId === userId &&
            (req.status === 'approved' || req.status === 'pending_return')
        );

        // ✨ סינון כפילויות לפי bookId
        const uniqueBorrowed = borrowed.filter(
            (req, index, self) =>
                index === self.findIndex(r => r.bookId === req.bookId)
        );

        return uniqueBorrowed;
    }

    try {
        const q = query(
            collection(db, 'loanRequests'),
            where('requesterId', '==', userId),
            where('status', 'in', ['approved', 'pending_return'])
        );
        const querySnapshot = await getDocs(q);

        const borrowedBooks = [];
        querySnapshot.forEach((doc) => {
            borrowedBooks.push({ id: doc.id, ...doc.data() });
        });

        // ✨ סינון כפילויות לפי bookId
        const uniqueBorrowed = borrowedBooks.filter(
            (req, index, self) =>
                index === self.findIndex(r => r.bookId === req.bookId)
        );

        return uniqueBorrowed;
    } catch (error) {
        console.error('שגיאה בטעינת ספרים מושאלים:', error);
        return [];
    }
};


// פונקציה חדשה להחזרת ספר על ידי המשתמש
export const returnBookByUser = async (loanRequestId, bookId, userId) => {
    try {
        // עדכון סטטוס הבקשה ל-returned
        await updateLoanRequestStatus(loanRequestId, 'returned', 'הוחזר על ידי המשתמש באפליקציה');

        // עדכון סטטוס הספר לזמין
        await updateBook(bookId, {
            status: 'available',
            borrowedBy: null,
            borrowDate: null,
            returnDate: new Date().toISOString()
        });

        // מחיקת אירוע החזרה מהלוח שנה
        const events = await getEvents();
        const returnEvent = events.find(event =>
            event.type === 'book_return' &&
            event.bookId === bookId &&
            event.userId === userId
        );

        if (returnEvent) {
            await deleteEvent(returnEvent.id);
            console.log('אירוע החזרת הספר נמחק מהלוח שנה');
        }

        console.log('הספר הוחזר בהצלחה');
        return true;
    } catch (error) {
        console.error('שגיאה בהחזרת ספר:', error);
        throw error;
    }
};

// פונקציה פשוטה למנהלים
export const notifyAdminNewRequest = async (requestData) => {
    try {
        const users = await getUsers();
        const admins = users.filter(user => user.role === 'admin' && user.isActive !== false);

        const message = `בקשה חדשה להשאלת ספר:

ספר: "${requestData.bookTitle}"
מבקש: ${requestData.requesterName}
טלפון: ${requestData.contactPhone}
${requestData.expectedReturnDate ? `החזרה מתוכננת: ${new Date(requestData.expectedReturnDate).toLocaleDateString('he-IL')}` : ''}
${requestData.notes ? `הערות: ${requestData.notes}` : ''}`;

        for (const admin of admins) {
            const notificationData = {
                userId: admin.id,
                title: 'בקשת השאלה חדשה ממתינה',
                message,
                type: 'info',
                relatedId: requestData.id,
                relatedType: 'new_loan_request',
                createdAt: new Date().toISOString(),
                isRead: false
            };

            await addNotification(notificationData);
        }

        console.log(`הודעה על בקשה חדשה נשלחה ל-${admins.length} מנהלים`);
    } catch (error) {
        console.error('שגיאה בשליחת הודעה למנהלים:', error);
    }
};


// פונקציה חדשה לשליחת תזכורות החזרת ספרים
export const sendReturnReminder = async (userId, loanData, daysUntilReturn) => {
    const message = daysUntilReturn <= 0
        ? `הספר "${loanData.bookTitle}" אמור היה להיות מוחזר. אנא החזר בהקדם.`
        : `הספר "${loanData.bookTitle}" אמור להיות מוחזר בעוד ${daysUntilReturn} ימים.`;

    await addNotification({
        userId,
        title: 'תזכורת החזרת ספר',
        message,
        type: 'warning',
        relatedId: loanData.id,
        relatedType: 'return_reminder'
    });
};

// ------------------------------------------------------
// 📄 פונקציות עזר
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
            console.log('יוצר משתמשים ברירת מחדל...');

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
            console.log('משתמשים ברירת מחדל נוצרו בהצלחה');
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
// קבלת מספר הודעות לא נקראות
export const getUnreadNotificationsCount = async (userId) => {
    try {
        const notifications = await getNotifications(userId);
        return notifications.filter(n => !n.isRead).length;
    } catch (error) {
        console.error('שגיאה בספירת הודעות לא נקראות:', error);
        return 0;
    }
};

