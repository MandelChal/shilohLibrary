// NotificationCenter.jsx - מרכז הודעות משופר עם פרטי ספר מלאים
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X, RefreshCw, Book, MapPin, Calendar, User } from 'lucide-react';
import {
    getNotifications,
    markNotificationAsRead,
    deleteNotification,
    getUnreadNotificationsCount,
    getBooks
} from '../utils/dbHelpers';

export default function NotificationCenter({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);

    // טעינת הודעות וספרים בטעינה ראשונית
    useEffect(() => {
        if (user) {
            loadNotifications();
            loadBooks();
            // רענון כל דקה
            const interval = setInterval(loadNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadBooks = async () => {
        try {
            const booksData = await getBooks();
            setBooks(booksData);
        } catch (error) {
            console.error('שגיאה בטעינת ספרים:', error);
        }
    };

    const loadNotifications = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const [notificationsData, unreadCountData] = await Promise.all([
                getNotifications(user.id || user.username),
                getUnreadNotificationsCount(user.id || user.username)
            ]);

            setNotifications(notificationsData);
            setUnreadCount(unreadCountData);
            console.log(`נטענו ${notificationsData.length} הודעות, ${unreadCountData} לא נקראו`);
        } catch (error) {
            console.error('שגיאה בטעינת הודעות:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = useCallback(async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);

            // עדכון state מקומי
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            console.log('הודעה סומנה כנקראה:', notificationId);
        } catch (error) {
            console.error('שגיאה בסימון הודעה כנקראה:', error);
            alert('שגיאה בעדכון ההודעה');
        }
    }, []);

    const handleDeleteNotification = useCallback(async (notificationId) => {
        try {
            await deleteNotification(notificationId);

            // עדכון state מקומי
            setNotifications(prev => {
                const notifToDelete = prev.find(n => n.id === notificationId);
                const newNotifs = prev.filter(notif => notif.id !== notificationId);

                // עדכון מונה הלא נקראות רק אם ההודעה שנמחקה לא נקראה
                if (notifToDelete && !notifToDelete.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }

                return newNotifs;
            });

            console.log('הודעה נמחקה:', notificationId);
        } catch (error) {
            console.error('שגיאה במחיקת הודעה:', error);
            alert('שגיאה במחיקת ההודעה');
        }
    }, []);

    const handleMarkAllAsRead = useCallback(async () => {
        try {
            // סימון כל ההודעות הלא נקראות
            const unreadNotifications = notifications.filter(n => !n.isRead);

            for (const notification of unreadNotifications) {
                await markNotificationAsRead(notification.id);
            }

            // עדכון state מקומי
            setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
            setUnreadCount(0);

            console.log('כל ההודעות סומנו כנקראו');
        } catch (error) {
            console.error('שגיאה בסימון כל ההודעות:', error);
            alert('שגיאה בעדכון ההודעות');
        }
    }, [notifications]);

    const toggleNotificationCenter = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const getBookDetails = (bookId) => {
        return books.find(book => book.id === bookId);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'עכשיו';
        if (diffMins < 60) return `לפני ${diffMins} דקות`;
        if (diffHours < 24) return `לפני ${diffHours} שעות`;
        return `לפני ${diffDays} ימים`;
    };

    const openNotificationDetail = (notification) => {
        setSelectedNotification(notification);
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }
    };

    if (!user) return null;

    return (
        <div className="relative inline-block">
            <button
                onClick={toggleNotificationCenter}
                disabled={loading}
                className={`relative p-2 rounded-full transition-all duration-200 ${isOpen
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100 text-gray-600'
                    } disabled:opacity-50`}
                title="הודעות"
            >
                <Bell className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 max-h-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* כותרת */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">הודעות</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadNotifications}
                                disabled={loading}
                                className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                                title="רענן הודעות"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={loading}
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                                >
                                    סמן הכל כנקרא
                                </button>
                            )}
                        </div>
                    </div>

                    {/* תוכן ההודעות */}
                    <div className="max-h-64 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <div className="animate-pulse">טוען הודעות...</div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <div className="text-lg font-medium mb-1">אין הודעות חדשות</div>
                                <div className="text-sm">כל ההודעות שלך נקראו</div>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 transition-all hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50 border-r-4 border-blue-400' : ''
                                        }`}
                                    onClick={() => openNotificationDetail(notification)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                                <div className="font-medium text-gray-800 truncate">
                                                    {notification.title}
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>

                                            <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                {notification.message.split('\n')[0]}
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{getTimeAgo(notification.createdAt)}</span>
                                                {notification.bookTitle && (
                                                    <span className="text-blue-600 flex items-center gap-1">
                                                        <Book className="w-3 h-3" />
                                                        {notification.bookTitle}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification.id);
                                                    }}
                                                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                                    title="סמן כנקרא"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteNotification(notification.id);
                                                }}
                                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                                title="מחק הודעה"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* כותרת תחתונה */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
                            <span className="text-xs text-gray-500">
                                סה"כ {notifications.length} הודעות
                                {unreadCount > 0 && ` • ${unreadCount} לא נקראו`}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* חלון פרטי הודעה מפורט */}
            {selectedNotification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{getNotificationIcon(selectedNotification.type)}</span>
                                    <h3 className="text-lg font-semibold text-gray-800">פרטי הודעה</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* כותרת ההודעה */}
                            <div className="mb-4">
                                <h4 className="text-xl font-bold text-gray-900 mb-2">
                                    {selectedNotification.title}
                                </h4>
                                <div className="text-sm text-gray-500">
                                    {new Date(selectedNotification.createdAt).toLocaleDateString('he-IL', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            {/* פרטי הספר אם זמין */}
                            {selectedNotification.bookId && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <Book className="w-5 h-5" />
                                        פרטי הספר
                                    </h5>
                                    {(() => {
                                        const book = getBookDetails(selectedNotification.bookId);
                                        if (book) {
                                            return (
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">שם הספר:</span>
                                                        <span>{book.title}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">מחבר:</span>
                                                        <span>{book.author}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">מיקום:</span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {book.location.color} {book.location.letter}{book.location.number}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">סטטוס:</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${book.status === 'available' ? 'bg-green-100 text-green-700' :
                                                                book.status === 'borrowed' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {book.status === 'available' ? 'זמין' :
                                                                book.status === 'borrowed' ? 'מושאל' : 'תחזוקה'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="text-sm text-blue-700">
                                                    ספר: {selectedNotification.bookTitle || 'לא זמין'}
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            )}

                            {/* תוכן ההודעה */}
                            <div className="mb-6">
                                <h5 className="font-semibold text-gray-800 mb-2">תוכן ההודעה</h5>
                                <div className="text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 p-4 rounded-lg">
                                    {selectedNotification.message}
                                </div>
                            </div>

                            {/* סטטוס בקשה */}
                            {selectedNotification.type && (
                                <div className="mb-4">
                                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${selectedNotification.type === 'success' ? 'bg-green-100 text-green-800' :
                                            selectedNotification.type === 'error' ? 'bg-red-100 text-red-800' :
                                                selectedNotification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                        }`}>
                                        <span>{getNotificationIcon(selectedNotification.type)}</span>
                                        {selectedNotification.type === 'success' ? 'בקשה אושרה' :
                                            selectedNotification.type === 'error' ? 'בקשה נדחתה' :
                                                selectedNotification.type === 'warning' ? 'תזכורת' : 'מידע כללי'}
                                    </div>
                                </div>
                            )}

                            {/* פעולות */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    סגור
                                </button>
                                {!selectedNotification.isRead && (
                                    <button
                                        onClick={() => {
                                            handleMarkAsRead(selectedNotification.id);
                                            setSelectedNotification(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        סמן כנקרא
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}