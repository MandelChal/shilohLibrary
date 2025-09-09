// NotificationCenter.jsx - מרכז הודעות למשתמשים
import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, XCircle, Info, Trash2, Eye, MarkAsRead } from 'lucide-react';

export default function NotificationCenter({ user, onClose }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, unread, success, error

    useEffect(() => {
        loadNotifications();
        // רענון הודעות כל 30 שניות
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const userNotifications = await getNotifications(user.id || user.username);
            setNotifications(userNotifications);
            console.log('הודעות נטענו למשתמש:', userNotifications.length);
        } catch (error) {
            console.error('שגיאה בטעינת הודעות:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error('שגיאה בסימון הודעה כנקראה:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            for (const notification of unreadNotifications) {
                await markNotificationAsRead(notification.id);
            }
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('שגיאה בסימון כל ההודעות:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        if (confirm('האם אתה בטוח שברצונך למחוק את ההודעה?')) {
            try {
                await deleteNotification(notificationId);
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
            } catch (error) {
                console.error('שגיאה במחיקת הודעה:', error);
            }
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            default: return <Info className="w-5 h-5 text-blue-600" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'success': return 'border-green-200 bg-green-50';
            case 'error': return 'border-red-200 bg-red-50';
            case 'warning': return 'border-yellow-200 bg-yellow-50';
            default: return 'border-blue-200 bg-blue-50';
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        switch (filter) {
            case 'unread': return !notification.isRead;
            case 'success': return notification.type === 'success';
            case 'error': return notification.type === 'error';
            default: return true;
        }
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* כותרת */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Bell className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold">ההודעות שלי</h2>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {unreadCount} חדשות
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* פילטרים */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            הכל ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === 'unread'
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            לא נקראו ({unreadCount})
                        </button>
                        <button
                            onClick={() => setFilter('success')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === 'success'
                                ? 'bg-green-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            אישורים
                        </button>
                        <button
                            onClick={() => setFilter('error')}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === 'error'
                                ? 'bg-red-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            דחיות
                        </button>
                    </div>
                </div>

                {/* רשימת הודעות */}
                <div className="max-h-96 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">טוען הודעות...</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <div className="text-lg font-medium mb-2">אין הודעות</div>
                            <div className="text-sm">
                                {filter === 'all' ? 'אין לך הודעות כרגע' : `אין הודעות מסוג ${filter === 'unread' ? 'לא נקראות' : filter}`}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`relative border rounded-lg p-4 transition-all ${notification.isRead
                                        ? 'border-gray-200 bg-gray-50'
                                        : `${getNotificationColor(notification.type)} border-l-4`
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className={`text-sm font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'
                                                        }`}>
                                                        {notification.title}
                                                    </h3>
                                                    <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'
                                                        }`}>
                                                        {notification.message}
                                                    </p>
                                                    <div className="text-xs text-gray-400 mt-2">
                                                        {new Date(notification.createdAt).toLocaleDateString('he-IL')}
                                                        {' '}
                                                        {new Date(notification.createdAt).toLocaleTimeString('he-IL')}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 mr-2">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                            title="סמן כנקרא"
                                                        >
                                                            <Eye className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="p-1 rounded hover:bg-red-100 transition-colors"
                                                        title="מחק הודעה"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* נקודה כחולה לסימון הודעה לא נקראה */}
                                    {!notification.isRead && (
                                        <div className="absolute left-2 top-4 w-2 h-2 bg-blue-600 rounded-full"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* פוטר */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>סה״כ {notifications.length} הודעות</div>
                        <div className="flex gap-4">
                            <button
                                onClick={loadNotifications}
                                disabled={loading}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                                {loading ? 'מרענן...' : 'רענן'}
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-green-600 hover:text-green-800"
                                >
                                    סמן הכל כנקרא
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// פונקציות עזר לניהול הודעות - להוסיף ל-dbHelpers.js

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