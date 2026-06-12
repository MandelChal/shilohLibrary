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

const createNotificationHash = (notificationData) => {
    const hashString = `${notificationData.userId}_${notificationData.title}_${notificationData.relatedType}_${notificationData.relatedId}`;
    return hashString.replace(/\s+/g, '_').toLowerCase();
};

// ------------------------------------------------------
// 🔍 בדיקת קיום הודעה דומה
// ------------------------------------------------------

const checkDuplicateNotification = async (notificationData, timeWindowHours = 24) => {
    try {
        const notifications = await getNotifications(notificationData.userId);
        const now = new Date();
        const timeWindow = timeWindowHours * 60 * 60 * 1000;

        return notifications.some(notif => {
            const notifTime = new Date(notif.createdAt);
            const timeDiff = now - notifTime;

            return (
                notif.title === notificationData.title &&
                notif.relatedType === notificationData.relatedType &&
                notif.relatedId === notificationData.relatedId &&
                timeDiff < timeWindow
            );
        });
    } catch (error) {
        console.error('שגיאה בבדיקת כפילות הודעות:', error);
        return false;
    }
};

// ------------------------------------------------------
// ➕ הוספת הודעה חדשה עם בדיקת כפילויות
// ------------------------------------------------------

export const addNotificationSafe = async (notificationData) => {
    try {
        // בדיקת כפילות
        const isDuplicate = await checkDuplicateNotification(notificationData);

        if (isDuplicate) {
            console.log('הודעה דומה כבר קיימת, לא נוצרת הודעה חדשה');
            return null;
        }

        // יצירת hash ייחודי
        const notificationHash = createNotificationHash(notificationData);

        const enhancedNotification = {
            ...notificationData,
            notificationHash,
            createdAt: new Date().toISOString(),
            read: false
        };

        if (!isFirebaseEnabled) {
            const saved = localStorage.getItem('libraryNotifications');
            const notifications = saved ? JSON.parse(saved) : [];

            const newNotification = {
                id: Date.now().toString(),
                ...enhancedNotification
            };

            notifications.unshift(newNotification);
            localStorage.setItem('libraryNotifications', JSON.stringify(notifications));

            console.log('✅ הודעה חדשה נוצרה:', newNotification.title);
            return newNotification;
        }

        const docRef = await addDoc(collection(db, 'notifications'), {
            ...enhancedNotification,
            createdAt: serverTimestamp()
        });

        console.log('✅ הודעה חדשה נוצרה ב-Firebase:', notificationData.title);
        return { id: docRef.id, ...enhancedNotification };

    } catch (error) {
        console.error('שגיאה בהוספת הודעה:', error);
        throw error;
    }
};

// ------------------------------------------------------
// 🧹 ניקוי הודעות ישנות (למנוע בלאגן)
// ------------------------------------------------------

export const cleanOldNotifications = async (userId, daysToKeep = 30) => {
    try {
        const notifications = await getNotifications(userId);
        const now = new Date();
        const cutoffDate = new Date(now - daysToKeep * 24 * 60 * 60 * 1000);

        let deletedCount = 0;

        for (const notification of notifications) {
            const notifDate = new Date(notification.createdAt);
            if (notifDate < cutoffDate && notification.read) {
                await deleteNotification(notification.id);
                deletedCount++;
            }
        }

        console.log(`🧹 נמחקו ${deletedCount} הודעות ישנות`);
        return deletedCount;

    } catch (error) {
        console.error('שגיאה בניקוי הודעות ישנות:', error);
        return 0;
    }
};

// ------------------------------------------------------
// 📅 מערכת תזכורות אוטומטית יומית
// ------------------------------------------------------

export const checkAndSendReturnReminders = async () => {
    try {
        console.log('🔔 בודק תזכורות החזרה...');

        const loanRequests = await getLoanRequests();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let remindersSent = 0;

        for (const request of loanRequests) {
            if (request.status !== 'approved') continue;
            if (!request.expectedReturnDate) continue;

            const returnDate = new Date(request.expectedReturnDate);
            returnDate.setHours(0, 0, 0, 0);

            const daysUntilReturn = Math.ceil((returnDate - now) / (1000 * 60 * 60 * 24));

            // תזכורת יום לפני
            if (daysUntilReturn === 1) {
                await addNotificationSafe({
                    userId: request.requesterId,
                    title: '⏰ תזכורת: החזרת ספר מחר',
                    message: `הספר "${request.bookTitle}" אמור להיות מוחזר מחר (${returnDate.toLocaleDateString('he-IL')}).\n\nאנא דאג להחזיר את הספר במועד.`,
                    type: 'warning',
                    relatedId: request.id,
                    relatedType: 'return_reminder_1day',
                    bookId: request.bookId,
                    bookTitle: request.bookTitle
                });
                remindersSent++;
            }

            // התראה על איחור
            if (daysUntilReturn < 0) {
                const daysOverdue = Math.abs(daysUntilReturn);

                await addNotificationSafe({
                    userId: request.requesterId,
                    title: '🚨 ספר באיחור!',
                    message: `הספר "${request.bookTitle}" אמור היה להיות מוחזר לפני ${daysOverdue} ימים.\n\nאנא החזר את הספר בהקדם האפשרי.`,
                    type: 'error',
                    relatedId: request.id,
                    relatedType: 'overdue_alert',
                    bookId: request.bookId,
                    bookTitle: request.bookTitle
                });
                remindersSent++;
            }
        }

        console.log(`✅ נשלחו ${remindersSent} תזכורות`);
        return remindersSent;

    } catch (error) {
        console.error('שגיאה בבדיקת תזכורות:', error);
        return 0;
    }
};

// ------------------------------------------------------
// 📊 התראה למנהלים על ספרים באיחור
// ------------------------------------------------------

export const notifyAdminsAboutOverdueBooks = async () => {
    try {
        const loanRequests = await getLoanRequests();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const overdueBooks = loanRequests.filter(request => {
            if (request.status !== 'approved' || !request.expectedReturnDate) return false;

            const returnDate = new Date(request.expectedReturnDate);
            returnDate.setHours(0, 0, 0, 0);

            return returnDate < now;
        }).map(request => {
            const returnDate = new Date(request.expectedReturnDate);
            const daysOverdue = Math.ceil((now - returnDate) / (1000 * 60 * 60 * 24));
            return { ...request, daysOverdue };
        });

        if (overdueBooks.length === 0) {
            console.log('✅ אין ספרים באיחור');
            return;
        }

        const users = await getUsers();
        const admins = users.filter(user => user.role === 'admin' && user.isActive !== false);

        const message = `📚 דוח ספרים באיחור - ${now.toLocaleDateString('he-IL')}

סה"כ ${overdueBooks.length} ספרים באיחור:

${overdueBooks.map(book =>
            `• "${book.bookTitle}" - ${book.requesterName}\n  📞 ${book.contactPhone} | ⏱️ איחור: ${book.daysOverdue} ימים`
        ).join('\n\n')}

יש ליצור קשר עם המשאילים להחזרת הספרים.`;

        for (const admin of admins) {
            await addNotificationSafe({
                userId: admin.id,
                title: `📊 דוח איחורים - ${overdueBooks.length} ספרים`,
                message,
                type: 'warning',
                relatedType: 'overdue_report',
                relatedId: `overdue_${now.toISOString().split('T')[0]}`
            });
        }

        console.log(`✅ דוח איחורים נשלח ל-${admins.length} מנהלים`);

    } catch (error) {
        console.error('שגיאה בשליחת דוח איחורים:', error);
    }
};

// ------------------------------------------------------
// 🎯 הודעות ממוקדות לפי שלב
// ------------------------------------------------------

// 1️⃣ הודעה למנהל על בקשה חדשה
export const notifyAdminNewLoanRequest = async (requestData) => {
    try {
        const users = await getUsers();
        const admins = users.filter(user => user.role === 'admin' && user.isActive !== false);

        const message = `📖 בקשת השאלה חדשה התקבלה

ספר: "${requestData.bookTitle}"
מבקש: ${requestData.requesterName}
טלפון: ${requestData.contactPhone}
${requestData.expectedReturnDate ? `\nתאריך החזרה מבוקש: ${new Date(requestData.expectedReturnDate).toLocaleDateString('he-IL')}` : ''}
${requestData.notes ? `\n\nהערות המשתמש:\n${requestData.notes}` : ''}

⏳ הבקשה ממתינה לאישורך במערכת הניהול.`;

        for (const admin of admins) {
            await addNotificationSafe({
                userId: admin.id,
                title: '🆕 בקשת השאלה חדשה',
                message,
                type: 'info',
                relatedId: requestData.id,
                relatedType: 'new_loan_request',
                bookId: requestData.bookId,
                bookTitle: requestData.bookTitle
            });
        }

        console.log(`✅ הודעה על בקשה חדשה נשלחה ל-${admins.length} מנהלים`);

    } catch (error) {
        console.error('שגיאה בשליחת הודעה למנהלים:', error);
    }
};

// 2️⃣ הודעה למשתמש על אישור השאלה
export const notifyUserLoanApproved = async (userId, requestData, adminNotes = '') => {
    try {
        const returnDate = requestData.expectedReturnDate
            ? new Date(requestData.expectedReturnDate).toLocaleDateString('he-IL')
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL');

        const location = requestData.bookLocation
            ? `${requestData.bookLocation.color} ${requestData.bookLocation.letter}${requestData.bookLocation.number}`
            : 'פנה לספרן לקבלת המיקום';

        const message = `הבקשה שלך אושרה!

הספר "${requestData.bookTitle}" זמין להשאלה עד תאריך ${returnDate}.

מיקום הספר: ${location}


${adminNotes ? `💬 הערת הספרן:\n${adminNotes}` : ''}

תקבל תזכורת יום לפני מועד ההחזרה.

בהצלחה בלימודים! `;

        await addNotificationSafe({
            userId,
            title: 'בקשת ההשאלה אושרה!',
            message,
            type: 'success',
            relatedId: requestData.id,
            relatedType: 'loan_approved',
            bookId: requestData.bookId,
            bookTitle: requestData.bookTitle
        });

        console.log(`הודעת אישור נשלחה למשתמש ${requestData.requesterName}`);

    } catch (error) {
        console.error('שגיאה בשליחת הודעת אישור:', error);
    }
};

// 3️⃣ הודעה למשתמש על דחיית בקשה
export const notifyUserLoanRejected = async (userId, requestData, adminNotes = '') => {
    try {
        const message = `בקשת ההשאלה נדחתה

הבקשה לספר "${requestData.bookTitle}" לא אושרה.

${adminNotes ? ` סיבת הדחיה:\n${adminNotes}\n\n` : ''}הספר עשוי להיות מושאל כרגע או בתחזוקה.

 מה אפשר לעשות?
• פנה לספרן לברר פרטים נוספים
• בקש ספר חלופי בנושא דומה
• נסה שוב במועד מאוחר יותר`;

        await addNotificationSafe({
            userId,
            title: 'בקשת השאלה נדחתה',
            message,
            type: 'error',
            relatedId: requestData.id,
            relatedType: 'loan_rejected',
            bookId: requestData.bookId,
            bookTitle: requestData.bookTitle
        });

        console.log(`הודעת דחייה נשלחה למשתמש ${requestData.requesterName}`);

    } catch (error) {
        console.error('שגיאה בשליחת הודעת דחייה:', error);
    }
};

// 4️⃣ הודעה על בקשת החזרה (למשתמש ולמנהל)
export const notifyReturnRequest = async (requestData) => {
    try {
        // הודעה למשתמש
        await addNotificationSafe({
            userId: requestData.requesterId,
            title: 'בקשת החזרה התקבלה',
            message: `בקשת ההחזרה שלך לספר "${requestData.bookTitle}" התקבלה במערכת.\n\n הספרן יבדוק את הבקשה ויאשר את ההחזרה בהקדם.\n\nתקבל הודעה כאשר ההחזרה תאושר.`,
            type: 'info',
            relatedId: requestData.id,
            relatedType: 'return_request_received',
            bookId: requestData.bookId,
            bookTitle: requestData.bookTitle
        });

        // הודעה למנהלים
        const users = await getUsers();
        const admins = users.filter(user => user.role === 'admin' && user.isActive !== false);

        for (const admin of admins) {
            await addNotificationSafe({
                userId: admin.id,
                title: 'בקשת החזרת ספר',
                message: `המשתמש ${requestData.requesterName} ביקש להחזיר ספר:\n\n "${requestData.bookTitle}"\n ${requestData.contactPhone}\n\n יש לבדוק ולאשר את החזרת הספר במערכת.`,
                type: 'info',
                relatedId: requestData.id,
                relatedType: 'return_request_admin',
                bookId: requestData.bookId,
                bookTitle: requestData.bookTitle
            });
        }

        console.log(` הודעות החזרה נשלחו למשתמש ול-${admins.length} מנהלים`);

    } catch (error) {
        console.error('שגיאה בשליחת הודעות החזרה:', error);
    }
};

// 5️⃣ הודעה על החזרה שאושרה
export const notifyReturnCompleted = async (userId, requestData, adminNotes = '') => {
    try {
        const message = ` הספר הוחזר בהצלחה!

הספר "${requestData.bookTitle}" הוחזר לספרייה.

תודה רבה על השימוש בשירותי הספרייה! 🙏

${adminNotes ? `💬 הערת הספרן:\n${adminNotes}` : ''}

מוזמן לשאול ספרים נוספים בכל עת.`;

        await addNotificationSafe({
            userId,
            title: ' החזרה הושלמה',
            message,
            type: 'success',
            relatedId: requestData.id,
            relatedType: 'return_completed',
            bookId: requestData.bookId,
            bookTitle: requestData.bookTitle
        });

        console.log(` הודעת החזרה הושלמה נשלחה למשתמש`);

    } catch (error) {
        console.error('שגיאה בשליחת הודעת החזרה:', error);
    }
};

// ------------------------------------------------------
// ⚙️ פונקציה מרכזית לניהול הודעות לפי סטטוס
// ------------------------------------------------------

export const sendLoanStatusNotification = async (userId, requestData, newStatus, adminNotes = '') => {
    try {
        switch (newStatus) {
            case 'approved':
                await notifyUserLoanApproved(userId, requestData, adminNotes);
                await createAllLoanEvents(userId, requestData, {
                    id: requestData.bookId,
                    title: requestData.bookTitle,
                    author: requestData.bookAuthor,
                    location: requestData.bookLocation
                });
                break;

            case 'rejected':
                await notifyUserLoanRejected(userId, requestData, adminNotes);
                break;

            case 'pending_return':
                await notifyReturnRequest(requestData);
                break;

            case 'returned':
                await notifyReturnCompleted(userId, requestData, adminNotes);

                // מחיקת אירועי החזרה מהלוח שנה
                const events = await getEvents();
                const userBookEvents = events.filter(event =>
                    event.userId === userId &&
                    event.bookId === requestData.bookId &&
                    (event.type === 'book_loan' || event.type === 'book_return')
                );

                for (const event of userBookEvents) {
                    await deleteEvent(event.id);
                }
                break;
        }

    } catch (error) {
        console.error('שגיאה בשליחת הודעת סטטוס:', error);
    }
};

// ------------------------------------------------------
// 🤖 פונקציה להפעלה יומית אוטומטית
// ------------------------------------------------------

export const runDailyNotificationTasks = async () => {
    try {
        console.log(' מפעיל משימות הודעות יומיות...');

        // תזכורות החזרה
        const reminders = await checkAndSendReturnReminders();

        // דוח איחורים למנהלים
        await notifyAdminsAboutOverdueBooks();

        // ניקוי הודעות ישנות (למשתמשים שקראו אותן)
        const users = await getUsers();
        let totalCleaned = 0;

        for (const user of users) {
            const cleaned = await cleanOldNotifications(user.id, 30);
            totalCleaned += cleaned;
        }

        console.log(` משימות יומיות הושלמו: ${reminders} תזכורות, ${totalCleaned} הודעות נוקו`);
    } catch (error) {
        console.error('שגיאה במשימות יומיות:', error);
    }
};

// // ------------------------------------------------------
// // 📤 ייצוא כל הפונקציות
// // ------------------------------------------------------

// export {
//     addNotificationSafe as addNotification,
//     checkDuplicateNotification,
//     cleanOldNotifications,
//     checkAndSendReturnReminders,
//     notifyAdminNewLoanRequest,
//     notifyUserLoanApproved,
//     notifyUserLoanRejected,
//     notifyReturnRequest,
//     notifyReturnCompleted,
//     sendLoanStatusNotification,
//     runDailyNotificationTasks
// };
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
        // במצב localStorage
        const saved = localStorage.getItem('libraryAnnouncements');
        const announcements = saved ? JSON.parse(saved) : [];
        const filteredAnnouncements = announcements.filter(announcement => announcement.id !== announcementId);
        localStorage.setItem('libraryAnnouncements', JSON.stringify(filteredAnnouncements));
        console.log('הודעה נמחקה מ-localStorage:', announcementId);
        return;
    }

    try {
        // מחיקה מ-Firebase
        await deleteDoc(doc(db, 'announcements', announcementId));
        console.log('הודעה נמחקה מ-Firebase:', announcementId);
    } catch (error) {
        console.error('שגיאה במחיקת הודעה מ-Firebase:', error);
        throw new Error(`שגיאה במחיקת הודעה: ${error.message}`);
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
        // const requestDoc = await getDoc(requestRef);
        // if (requestDoc.exists()) {
        //     const requestData = { id: requestDoc.id, ...requestDoc.data() };
        //     await sendLoanRequestNotification(requestData.requesterId, requestData, newStatus, adminNotes);
        // }

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
            read: false  // ✅ שונה מ-isRead ל-read
        };
        notifications.unshift(newNotification);
        localStorage.setItem('libraryNotifications', JSON.stringify(notifications));
        return newNotification;
    }

    try {
        const docRef = await addDoc(collection(db, 'notifications'), {
            ...notificationData,
            createdAt: serverTimestamp(),
            read: false  // ✅ שונה מ-isRead ל-read
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
            n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n  // ✅ שונה מ-isRead ל-read
        );
        localStorage.setItem('libraryNotifications', JSON.stringify(updatedNotifications));
        return;
    }

    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true,  // ✅ שונה מ-isRead ל-read
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
                read: false  // ✅ שונה מ-isRead ל-read
            };

            await addNotification(notificationData);
        }

        console.log(`הודעה על בקשת החזרה נשלחה ל-${admins.length} מנהלים`);
    } catch (error) {
        console.error('שגיאה בשליחת הודעה למנהלים:', error);
    }
};
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

            // יצירת אירועי החזרה אוטומטיים
            try {
                await createAutomaticReturnEvents(requestData, userId);
            } catch (error) {
                console.error('שגיאה ביצירת אירועי החזרה אוטומטיים:', error);
            }
            break;

        case 'rejected':
            title = `${requestData.requesterName}, בקשת ההשאלה נדחתה`;
            message = `הבקשה לספר "${requestData.bookTitle}" נדחתה.

${adminNotes ? `סיבת הדחיה: ${adminNotes}` : 'ייתכן שהספר כבר מושאל או בתחזוקה.'}

ניתן לפנות לספרן לקבלת מידע נוסף או לבקש ספר חלופי.`;
            type = 'error';
            break;

        case 'returned':
            title = `${requestData.requesterName}, הספר הוחזר בהצלחה`;
            message = `הספר "${requestData.bookTitle}" הוחזר בהצלחה לספרייה.

תודה שהשתמשת בשירותי הספרייה!
${adminNotes ? `הערת הספרן: ${adminNotes}` : ''}`;
            type = 'success';

            // מחיקת אירועי השאלה והחזרה מהלוח שנה של המשתמש
            try {
                const events = await getEvents();
                const userBookEvents = events.filter(event =>
                    event.userId === userId &&
                    event.bookId === requestData.bookId &&
                    (event.type === 'book_loan' || event.type === 'book_return')
                );

                for (const event of userBookEvents) {
                    await deleteEvent(event.id);
                }
                console.log('אירועי השאלה והחזרה נמחקו מלוח השנה של המשתמש');
            } catch (error) {
                console.error('שגיאה במחיקת אירועים:', error);
            }
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
            read: false
        };

        await addNotification(notificationData);
        console.log(`הודעה נשלחה למשתמש ${requestData.requesterName}: ${title}`);
    } catch (error) {
        console.error('שגיאה בשליחת הודעה:', error);
        console.log(`הודעה (לא נשמרה): ${title} - ${message}`);
    }
};

export const createAdminLoanEvent = async (requestData, adminUser) => {
    try {
        const eventData = {
            title: `השאלה: ${requestData.bookTitle}`,
            description: `ספר הושאל ל${requestData.requesterName}\nטלפון: ${requestData.contactPhone}`,
            date: new Date().toISOString(),
            time: '09:00',
            createdAt: new Date().toISOString(),
            createdBy: 'מערכת ניהול',
            type: 'admin_loan_tracking',
            eventType: 'admin_book_tracking',
            bookId: requestData.bookId,
            userId: adminUser.id,
            loanRequestId: requestData.id,
            isPersonal: false, // אירוע מערכת - יוצג לכל המנהלים
            requesterName: requestData.requesterName
        };

        await addEvent(eventData);
        console.log('אירוע מעקב השאלה נוצר עבור מנהלים');
    } catch (error) {
        console.error('שגיאה ביצירת אירוע מעקב השאלה:', error);
    }
};
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
                read: false  // ✅ שונה מ-isRead ל-read
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
        return notifications.filter(n => !n.read).length;  // ✅ שונה מ-isRead ל-read
    } catch (error) {
        console.error('שגיאה בספירת הודעות לא נקראות:', error);
        return 0;
    }
};

// פונקציה חדשה למניעת הודעות כפולות
export const addNotificationWithDuplicateCheck = async (notificationData) => {
    try {
        // בדיקה אם קיימת הודעה דומה
        const existingNotifications = await getNotifications(notificationData.userId);
        const isDuplicate = existingNotifications.some(notif =>
            notif.title === notificationData.title &&
            notif.message === notificationData.message &&
            notif.relatedType === notificationData.relatedType &&
            notif.relatedId === notificationData.relatedId &&
            // בדיקה שההודעה נוצרה ב-24 השעות האחרונות
            new Date() - new Date(notif.createdAt) < 24 * 60 * 60 * 1000
        );

        if (isDuplicate) {
            console.log('הודעה דומה כבר קיימת, לא נוצרת הודעה חדשה');
            return null;
        }

        return await addNotification(notificationData);
    } catch (error) {
        console.error('שגיאה בבדיקת הודעות כפולות:', error);
        // אם יש שגיאה, נוסיף את ההודעה בכל מקרה
        return await addNotification(notificationData);
    }
};

// ------------------------------------------------------
// 📅 פונקציות אירועי החזרת ספרים
// ------------------------------------------------------

// יצירת אירוע החזרת ספר למשתמש
export const createReturnEvent = async (userId, bookData, returnDate) => {
    try {
        const eventData = {
            title: `החזרת ספר: ${bookData.title}`,
            description: `מועד החזרה של הספר "${bookData.title}" לספרייה\nמחבר: ${bookData.author}\nמיקום: ${bookData.location?.color || ''} ${bookData.location?.letter || ''}${bookData.location?.number || ''}`,
            date: returnDate.toISOString(),
            time: '18:00',
            createdBy: 'מערכת אוטומטית',
            bookId: bookData.id,
            bookTitle: bookData.title,
            userId: userId,
            bookOwnerId: userId,
            isPersonal: true, // אירוע אישי - רק למשתמש
            returnDate: returnDate.toISOString()
        };

        const event = await createEventWithType(eventData, 'book_return');
        console.log(`אירוע החזרת ספר נוצר עבור משתמש ${userId}: ${bookData.title}`);
        return event;
    } catch (error) {
        console.error('שגיאה ביצירת אירוע החזרת ספר:', error);
        throw error;
    }
};

// יצירת אירוע החזרת ספר למנהל (מעקב)
export const createAdminReturnEvent = async (adminUserId, bookData, borrowerName, returnDate) => {
    try {
        const eventData = {
            title: `החזרה מתוכננת: ${bookData.title}`,
            description: `ספר "${bookData.title}" אמור להיות מוחזר על ידי ${borrowerName}\nתאריך החזרה: ${returnDate.toLocaleDateString('he-IL')}\nמחבר: ${bookData.author}`,
            date: returnDate.toISOString(),
            time: '18:00',
            createdBy: 'מערכת אוטומטית',
            bookId: bookData.id,
            bookTitle: bookData.title,
            userId: adminUserId,
            borrowerName: borrowerName,
            isPersonal: false, // אירוע מערכת - יוצג לכל המנהלים
            returnDate: returnDate.toISOString()
        };

        const event = await createEventWithType(eventData, 'admin_event');
        console.log(`אירוע מעקב החזרה נוצר עבור מנהל ${adminUserId}: ${bookData.title}`);
        return event;
    } catch (error) {
        console.error('שגיאה ביצירת אירוע מעקב החזרה:', error);
        throw error;
    }
};

// בדיקת ספרים שפג תוקפם
export const checkOverdueBooks = async () => {
    try {
        const today = new Date();
        const loanRequests = await getLoanRequests();
        const overdueBooks = [];

        // מציאת ספרים שפג תוקפם
        for (const request of loanRequests) {
            if (request.status === 'approved' && request.expectedReturnDate) {
                const returnDate = new Date(request.expectedReturnDate);
                if (returnDate < today) {
                    overdueBooks.push({
                        ...request,
                        daysOverdue: Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24))
                    });
                }
            }
        }

        if (overdueBooks.length > 0) {
            // שליחת התראה למנהלים על ספרים שפג תוקפם
            await notifyAdminsAboutOverdueBooks(overdueBooks);
        }

        return overdueBooks;
    } catch (error) {
        console.error('שגיאה בבדיקת ספרים שפג תוקפם:', error);
        return [];
    }
};

// // התראה למנהלים על ספרים שפג תוקפם
// export const notifyAdminsAboutOverdueBooks = async (overdueBooks) => {
//     try {
//         const users = await getUsers();
//         const admins = users.filter(user => user.role === 'admin' && user.isActive !== false);

//         for (const admin of admins) {
//             const overdueCount = overdueBooks.length;
//             const message = `יש ${overdueCount} ספרים שפג תוקפם:

// ${overdueBooks.map(book =>
//                 `• "${book.bookTitle}" - ${book.requesterName} (${book.daysOverdue} ימים)`
//             ).join('\n')}

// יש ליצור קשר עם המשאילים להחזרת הספרים.`;

//             const notificationData = {
//                 userId: admin.id,
//                 title: `התראה: ${overdueCount} ספרים שפג תוקפם`,
//                 message,
//                 type: 'warning',
//                 relatedType: 'overdue_books',
//                 createdAt: new Date().toISOString(),
//                 read: false
//             };

//             await addNotificationWithDuplicateCheck(notificationData);
//         }

//         console.log(`התראה על ${overdueBooks.length} ספרים שפג תוקפם נשלחה ל-${admins.length} מנהלים`);
//     } catch (error) {
//         console.error('שגיאה בשליחת התראה על ספרים שפג תוקפם:', error);
//     }
// };


// ------------------------------------------------------
// 📱 מערכת אימות מספרי טלפון
// ------------------------------------------------------

// פונקציה לאימות פורמט מספר טלפון ישראלי
export const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return {
            isValid: false,
            error: 'מספר טלפון לא תקין'
        };
    }

    // ניקוי המספר מכל התווים שאינם ספרות
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');

    // בדיקת אורך המספר
    if (cleanNumber.length < 9 || cleanNumber.length > 10) {
        return {
            isValid: false,
            error: 'מספר טלפון חייב להכיל 9-10 ספרות'
        };
    }

    // בדיקת פורמט ישראלי
    const israeliPhonePattern = /^(0[2-9]|5[0-9])[0-9]{7,8}$/;
    if (!israeliPhonePattern.test(cleanNumber)) {
        return {
            isValid: false,
            error: 'מספר טלפון לא תואם לפורמט ישראלי'
        };
    }

    return {
        isValid: true,
        cleanNumber: cleanNumber,
        formattedNumber: formatPhoneNumber(cleanNumber)
    };
};

// פונקציה לעיצוב מספר טלפון
export const formatPhoneNumber = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');

    if (cleanNumber.length === 9) {
        return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3, 6)}-${cleanNumber.slice(6)}`;
    } else if (cleanNumber.length === 10) {
        return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3, 6)}-${cleanNumber.slice(6)}`;
    }

    return phoneNumber;
};

// פונקציה לבדיקה שמספר הטלפון שייך למשתמש המבקש
export const validateUserPhoneNumber = async (userId, providedPhone) => {
    try {
        // קבלת נתוני המשתמש
        const users = await getUsers();
        const user = users.find(u => u.id === userId || u.username === userId);

        if (!user) {
            return {
                isValid: false,
                error: 'משתמש לא נמצא'
            };
        }

        // אימות פורמט המספר
        const phoneValidation = validatePhoneNumber(providedPhone);
        if (!phoneValidation.isValid) {
            return phoneValidation;
        }

        // בדיקה שהמספר תואם למשתמש
        const userPhone = user.phone ? user.phone.replace(/[^\d]/g, '') : '';
        const providedPhoneClean = phoneValidation.cleanNumber;

        if (userPhone && userPhone !== providedPhoneClean) {
            return {
                isValid: false,
                error: 'מספר הטלפון לא תואם למשתמש המחובר'
            };
        }

        return {
            isValid: true,
            user: user,
            formattedNumber: phoneValidation.formattedNumber
        };

    } catch (error) {
        console.error('שגיאה בבדיקת מספר טלפון:', error);
        return {
            isValid: false,
            error: 'שגיאה בבדיקת מספר הטלפון'
        };
    }
};

// פונקציה מעודכנת להוספת בקשת השאלה עם אימות טלפון
export const addLoanRequestWithPhoneValidation = async (requestData) => {
    try {
        // אימות מספר הטלפון
        const phoneValidation = await validateUserPhoneNumber(
            requestData.requesterId,
            requestData.contactPhone
        );

        if (!phoneValidation.isValid) {
            throw new Error(phoneValidation.error);
        }

        // הוספת הבקשה עם מספר הטלפון המאומת
        const validatedRequestData = {
            ...requestData,
            contactPhone: phoneValidation.formattedNumber,
            phoneValidated: true,
            validatedAt: new Date().toISOString()
        };

        return await addLoanRequest(validatedRequestData);

    } catch (error) {
        console.error('שגיאה באימות מספר טלפון:', error);
        throw error;
    }
};

// ------------------------------------------------------
// 🎨 מערכת סוגי אירועים עם קידוד צבעים
// ------------------------------------------------------

// הגדרת סוגי אירועים וצבעיהם
export const EVENT_TYPES = {
    ADMIN_EVENT: {
        type: 'admin_event',
        name: 'אירוע מנהל',
        color: 'bg-blue-100 border-blue-200 text-blue-800',
        icon: '👑',
        visibility: 'all' // נראה לכל המשתמשים
    },
    BOOK_RETURN: {
        type: 'book_return',
        name: 'החזרת ספר',
        color: 'bg-orange-100 border-orange-200 text-orange-800',
        icon: '📚',
        visibility: 'owner_and_admin' // נראה לבעל הספר + מנהל
    },
    PERSONAL: {
        type: 'personal',
        name: 'אירוע אישי',
        color: 'bg-green-100 border-green-200 text-green-800',
        icon: '👤',
        visibility: 'creator_and_admin' // נראה ליוצר + מנהל
    }
};


export const getEventColor = (eventType) => {
    const eventTypeConfig = Object.values(EVENT_TYPES).find(
        config => config.type === eventType
    );
    return eventTypeConfig ? eventTypeConfig.color : 'bg-gray-100 border-gray-200 text-gray-800';
};

export const getEventIcon = (eventType) => {
    const eventTypeConfig = Object.values(EVENT_TYPES).find(
        config => config.type === eventType
    );
    return eventTypeConfig ? eventTypeConfig.icon : '📅';
};

export const isEventVisibleToUser = (event, userId, userRole) => {
    const eventTypeConfig = Object.values(EVENT_TYPES).find(
        config => config.type === event.type
    );

    if (!eventTypeConfig) {
        return false; // סוג אירוע לא מוכר
    }

    switch (eventTypeConfig.visibility) {
        case 'all':
            return true; // נראה לכל המשתמשים

        case 'owner_and_admin':
            // נראה לבעל הספר + מנהל
            return userRole === 'admin' ||
                event.userId === userId ||
                event.bookOwnerId === userId;

        case 'creator_and_admin':
            // נראה ליוצר + מנהל
            return userRole === 'admin' ||
                event.createdBy === userId ||
                event.userId === userId;

        default:
            return false;
    }
};

export const filterEventsByVisibility = (events, userId, userRole) => {
    return events.filter(event => isEventVisibleToUser(event, userId, userRole));
};

export const createEventWithType = async (eventData, eventType = 'personal') => {
    try {
        const eventTypeConfig = EVENT_TYPES[eventType.toUpperCase()] || EVENT_TYPES.PERSONAL;

        const enhancedEventData = {
            ...eventData,
            type: eventTypeConfig.type,
            eventType: eventTypeConfig.type,
            color: eventTypeConfig.color,
            icon: eventTypeConfig.icon,
            visibility: eventTypeConfig.visibility,
            createdAt: new Date().toISOString()
        };

        return await addEvent(enhancedEventData);
    } catch (error) {
        console.error('שגיאה ביצירת אירוע עם סוג:', error);
        throw error;
    }
};
//create all loan events (user return event + admin tracking event + overdue alert)
export const CALENDAR_EVENT_TYPES = {
    BOOK_LOAN: {
        type: 'book_loan',
        name: 'השאלת ספר',
        color: '#10b981',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-400',
        textColor: 'text-green-800',
        icon: '📚'
    },
    BOOK_RETURN: {
        type: 'book_return',
        name: 'החזרת ספר',
        color: '#f59e0b',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-400',
        textColor: 'text-orange-800',
        icon: '📖'
    },
    ADMIN_PUBLIC: {
        type: 'admin_public',
        name: 'אירוע ציבורי',
        color: '#3b82f6',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-400',
        textColor: 'text-blue-800',
        icon: '📢'
    },
    ADMIN_TRACKING: {
        type: 'admin_tracking',
        name: 'מעקב אדמין',
        color: '#8b5cf6',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-400',
        textColor: 'text-purple-800',
        icon: '👁️'
    },
    OVERDUE_ALERT: {
        type: 'overdue_alert',
        name: 'ספר באיחור',
        color: '#ef4444',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-400',
        textColor: 'text-red-800',
        icon: '⚠️'
    }
};

export const createAllLoanEvents = async (userId, loanRequest, bookData) => {
    try {
        console.log('יוצר אירועי לוח שנה עבור השאלת ספר...');

        const returnDate = loanRequest.expectedReturnDate
            ? new Date(loanRequest.expectedReturnDate)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        // 1. אירוע החזרה למשתמש (כתום) - רק למשתמש שהשאיל
        await addEvent({
            title: `החזרה: ${bookData.title}`,
            description: `תזכורת להחזרת ספר לספרייה\n📚 ${bookData.title}\n✍️ ${bookData.author}\n📅 יש להחזיר היום!`,
            date: returnDate.toISOString(),
            time: '09:00',
            type: CALENDAR_EVENT_TYPES.BOOK_RETURN.type,
            color: CALENDAR_EVENT_TYPES.BOOK_RETURN.color,
            icon: CALENDAR_EVENT_TYPES.BOOK_RETURN.icon,
            userId: userId,  // רק למשתמש ספציפי
            bookId: bookData.id,
            bookTitle: bookData.title,
            loanRequestId: loanRequest.id,
            isPersonal: true,  // אירוע אישי
            createdBy: 'מערכת אוטומטית'
        });

        // 2. אירוע מעקב למנהלים (סגול) - רק למנהלים
        const users = await getUsers();
        const admins = users.filter(u => u.role === 'admin' && u.isActive !== false);


        await addEvent({
            title: `מעקב: ${bookData.title}`,
            description: `ספר מושאל\n📚 ${bookData.title}\n👤 ${loanRequest.requesterName}\n📅 החזרה: ${returnDate.toLocaleDateString('he-IL')}`,
            date: returnDate.toISOString(),
            time: '18:00',
            type: CALENDAR_EVENT_TYPES.ADMIN_TRACKING.type,
            color: CALENDAR_EVENT_TYPES.ADMIN_TRACKING.color,
            icon: CALENDAR_EVENT_TYPES.ADMIN_TRACKING.icon,
            // userId: admin.id,  // לכל אדמין בנפרד
            userId: null,
            bookId: bookData.id,
            bookTitle: bookData.title,
            borrowerName: loanRequest.requesterName,
            loanRequestId: loanRequest.id,
            isPersonal: false,  // אירוע מערכת - אבל רק למנהלים
            forAdminsOnly: true,
            createdBy: 'מערכת מעקב'
        });


        console.log('✅ אירועים נוצרו בהצלחה');
    } catch (error) {
        console.error('שגיאה ביצירת אירועים:', error);
    }
};
// מחיקת כל האירועים הקשורים להשאלה
export const deleteAllLoanEvents = async (loanRequestId) => {
    try {
        const events = await getEvents();
        const loanEvents = events.filter(event => event.loanRequestId === loanRequestId);

        for (const event of loanEvents) {
            await deleteEvent(event.id);
        }

        console.log(`✅ נמחקו ${loanEvents.length} אירועים`);
    } catch (error) {
        console.error('שגיאה במחיקת אירועים:', error);
    }
};

// התראות איחור לאדמין (אדום)
export const createOverdueAlerts = async () => {
    try {
        const loanRequests = await getLoanRequests();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueRequests = loanRequests.filter(request => {
            if (request.status !== 'approved' || !request.expectedReturnDate) return false;
            const returnDate = new Date(request.expectedReturnDate);
            returnDate.setHours(0, 0, 0, 0);
            return returnDate < today;
        });

        const books = await getBooks();
        const users = await getUsers();
        const admins = users.filter(u => u.role === 'admin' && u.isActive !== false);

        for (const request of overdueRequests) {
            const book = books.find(b => b.id === request.bookId);
            if (!book) continue;

            const daysOverdue = Math.ceil((today - new Date(request.expectedReturnDate)) / (1000 * 60 * 60 * 24));

            for (const admin of admins) {
                await addEvent({
                    title: `איחור! ${book.title}`,
                    description: `ספר באיחור של ${daysOverdue} ימים!
📚 ${book.title}
👤 ${request.requesterName}
📞 ${request.contactPhone}
🚨 יש ליצור קשר בהקדם!`,
                    date: new Date().toISOString(),
                    time: '10:00',
                    type: CALENDAR_EVENT_TYPES.OVERDUE_ALERT.type,
                    color: CALENDAR_EVENT_TYPES.OVERDUE_ALERT.color,
                    icon: CALENDAR_EVENT_TYPES.OVERDUE_ALERT.icon,
                    userId: admin.id,
                    bookId: book.id,
                    loanRequestId: request.id,
                    daysOverdue: daysOverdue,
                    isPersonal: false,
                    createdBy: 'מערכת התראות'
                });
            }
        }
    } catch (error) {
        console.error('שגיאה ביצירת התראות איחור:', error);
    }
};

