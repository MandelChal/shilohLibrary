// NotificationCenter.jsx - מרכז הודעות משופר עם ביצועים טובים יותר
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, Check, X, RefreshCw, Book, MapPin, Calendar, Trash2, CheckCheck } from 'lucide-react';
import {
    getNotifications,
    markNotificationAsRead,
    deleteNotification,
    getUnreadNotificationsCount,
    getBooks,
    cleanOldNotifications
} from '../utils/dbHelpers';

export default function NotificationCenter({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [filter, setFilter] = useState('all'); // all, unread, read

    // טעינת נתונים בטעינה ראשונית
    useEffect(() => {
        if (user) {
            loadNotifications();
            loadBooks();

            // רענון אוטומטי כל דקה
            const interval = setInterval(loadNotifications, 60000);

            // ניקוי הודעות ישנות פעם ביום
            const cleanupInterval = setInterval(() => {
                cleanOldNotifications(user.id || user.username, 30);
            }, 24 * 60 * 60 * 1000);

            return () => {
                clearInterval(interval);
                clearInterval(cleanupInterval);
            };
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

    const loadNotifications = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const [notificationsData, unreadCountData] = await Promise.all([
                getNotifications(user.id || user.username),
                getUnreadNotificationsCount(user.id || user.username)
            ]);

            setNotifications(notificationsData);
            setUnreadCount(unreadCountData);

        } catch (error) {
            console.error('שגיאה בטעינת הודעות:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleMarkAsRead = useCallback(async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);

            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, read: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

        } catch (error) {
            console.error('שגיאה בסימון הודעה כנקראה:', error);
        }
    }, []);

    const handleDeleteNotification = useCallback(async (notificationId, isRead) => {
        try {
            await deleteNotification(notificationId);

            setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

            if (!isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

        } catch (error) {
            console.error('שגיאה במחיקת הודעה:', error);
        }
    }, []);

    const handleMarkAllAsRead = useCallback(async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);

            await Promise.all(
                unreadNotifications.map(notification =>
                    markNotificationAsRead(notification.id)
                )
            );

            setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
            setUnreadCount(0);

        } catch (error) {
            console.error('שגיאה בסימון כל ההודעות:', error);
        }
    }, [notifications]);

    const handleDeleteAllRead = useCallback(async () => {
        try {
            const readNotifications = notifications.filter(n => n.read);

            if (readNotifications.length === 0) {
                alert('אין הודעות קרואות למחיקה');
                return;
            }

            if (!confirm(`האם למחוק ${readNotifications.length} הודעות קרואות?`)) {
                return;
            }

            await Promise.all(
                readNotifications.map(notification =>
                    deleteNotification(notification.id)
                )
            );

            setNotifications(prev => prev.filter(n => !n.read));

        } catch (error) {
            console.error('שגיאה במחיקת הודעות קרואות:', error);
        }
    }, [notifications]);

    const toggleNotificationCenter = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const getBookDetails = useCallback((bookId) => {
        return books.find(book => book.id === bookId);
    }, [books]);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'error': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-yellow-50 border-yellow-200';
            case 'info': return 'bg-blue-50 border-blue-200';
            default: return 'bg-gray-50 border-gray-200';
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
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }
    };

    // סינון הודעות לפי פילטר
    const filteredNotifications = useMemo(() => {
        switch (filter) {
            case 'unread':
                return notifications.filter(n => !n.read);
            case 'read':
                return notifications.filter(n => n.read);
            default:
                return notifications;
        }
    }, [notifications, filter]);

    if (!user) return null;

    return (
        <div className="relative inline-block">
            {/* כפתור פתיחה */}
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

            {/* חלון הודעות */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 max-h-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* כותרת */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
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
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
                                        title="סמן הכל כנקרא"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                                {notifications.some(n => n.read) && (
                                    <button
                                        onClick={handleDeleteAllRead}
                                        disabled={loading}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                                        title="מחק הודעות קרואות"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* פילטרים */}
                        <div className="flex gap-2 text-sm">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-3 py-1 rounded-full transition-colors ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                הכל ({notifications.length})
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-3 py-1 rounded-full transition-colors ${filter === 'unread'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                לא נקראו ({unreadCount})
                            </button>
                            <button
                                onClick={() => setFilter('read')}
                                className={`px-3 py-1 rounded-full transition-colors ${filter === 'read'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                נקראו ({notifications.length - unreadCount})
                            </button>
                        </div>
                    </div>

                    {/* תוכן ההודעות */}
                    <div className="max-h-64 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <div className="animate-pulse">טוען הודעות...</div>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <div className="text-lg font-medium mb-1">
                                    {filter === 'unread' ? 'אין הודעות חדשות' :
                                        filter === 'read' ? 'אין הודעות קרואות' :
                                            'אין הודעות'}
                                </div>
                            </div>
                        ) : (
                            filteredNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 transition-all hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50 border-r-4 border-blue-400' : ''
                                        }`}
                                    onClick={() => openNotificationDetail(notification)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                                <div className="font-medium text-gray-800 truncate text-sm">
                                                    {notification.title}
                                                </div>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>

                                            <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                {notification.message.split('\n')[0]}
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{getTimeAgo(notification.createdAt)}</span>
                                                {notification.bookTitle && (
                                                    <span className="text-blue-600 flex items-center gap-1 truncate max-w-[120px]">
                                                        <Book className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{notification.bookTitle}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                            {!notification.read && (
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
                                                    handleDeleteNotification(notification.id, notification.read);
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
                    {filteredNotifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
                            <span className="text-xs text-gray-500">
                                {filter === 'all' && `סה"כ ${notifications.length} הודעות`}
                                {filter === 'unread' && `${unreadCount} הודעות לא נקראו`}
                                {filter === 'read' && `${notifications.length - unreadCount} הודעות קרואות`}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* חלון פרטי הודעה מפורט */}
            {selectedNotification && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedNotification(null)}
                >
                    <div
                        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`sticky top-0 border-b p-4 ${getTypeColor(selectedNotification.type)}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getNotificationIcon(selectedNotification.type)}</span>
                                    <h3 className="text-lg font-semibold text-gray-800">פרטי הודעה</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
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
                            {selectedNotification.bookId && (() => {
                                const book = getBookDetails(selectedNotification.bookId);
                                return book ? (
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                            <Book className="w-5 h-5" />
                                            פרטי הספר
                                        </h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="font-medium">שם הספר:</span>
                                                <span className="text-left">{book.title}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium">מחבר:</span>
                                                <span className="text-left">{book.author}</span>
                                            </div>
                                            {book.location && (
                                                <div className="flex justify-between">
                                                    <span className="font-medium">מיקום:</span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {book.location.color} {book.location.letter}{book.location.number}
                                                    </span>
                                                </div>
                                            )}
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
                                    </div>
                                ) : selectedNotification.bookTitle ? (
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <Book className="w-5 h-5" />
                                            <span className="font-medium">{selectedNotification.bookTitle}</span>
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            {/* תוכן ההודעה */}
                            <div className="mb-6">
                                <h5 className="font-semibold text-gray-800 mb-2">תוכן ההודעה</h5>
                                <div className="text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {selectedNotification.message}
                                </div>
                            </div>

                            {/* פעולות */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    סגור
                                </button>
                                {!selectedNotification.read && (
                                    <button
                                        onClick={() => {
                                            handleMarkAsRead(selectedNotification.id);
                                            setSelectedNotification(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        סמן כנקרא
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        handleDeleteNotification(selectedNotification.id, selectedNotification.read);
                                        setSelectedNotification(null);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    מחק
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}