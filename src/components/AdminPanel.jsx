import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Calendar, Bell, User, Users, Settings, Book, Tag } from 'lucide-react';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import FirebaseStatus from './FirebaseStatus';
import {
    getUsers,
    getBooks,
    getCategories,
    getAnnouncements,
    getEvents,
    deleteEvent as deleteEventFromFirebase,
    deleteAnnouncement as deleteAnnouncementFromFirebase,
    subscribeToCollection
} from '../utils/dbHelpers';

export default function AdminPanel({ events, onDeleteEvent, announcements, currentUser }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        users: 0,
        books: 0,
        categories: 0,
        events: 0,
        announcements: 0,
        activeUsers: 0,
        admins: 0,
        regularUsers: 0
    });
    const [loading, setLoading] = useState(true);
    const [localAnnouncements, setLocalAnnouncements] = useState([]);
    // טעינת סטטיסטיקות מ-Firebase
    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        setLocalAnnouncements(announcements || []);
    }, [announcements]);

    // מעקב אחר שינויים בזמן אמת
    useEffect(() => {
        const unsubscribeUsers = subscribeToCollection('users', (usersData) => {
            updateStatsFromUsers(usersData);
        });

        const unsubscribeBooks = subscribeToCollection('books', (booksData) => {
            updateStatsFromBooks(booksData);
        });

        const unsubscribeCategories = subscribeToCollection('categories', (categoriesData) => {
            updateStatsFromCategories(categoriesData);
        });

        const unsubscribeEvents = subscribeToCollection('events', (eventsData) => {
            updateStatsFromEvents(eventsData);
        });

        const unsubscribeAnnouncements = subscribeToCollection('announcements', (announcementsData) => {
            updateStatsFromAnnouncements(announcementsData);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeBooks();
            unsubscribeCategories();
            unsubscribeEvents();
            unsubscribeAnnouncements();
        };
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const [usersData, booksData, categoriesData, eventsData, announcementsData] = await Promise.all([
                getUsers(),
                getBooks(),
                getCategories(),
                getEvents(),
                getAnnouncements()
            ]);

            const activeUsers = usersData.filter(u => u.isActive !== false).length;
            const admins = usersData.filter(u => u.role === 'admin').length;
            const regularUsers = usersData.filter(u => u.role === 'user').length;

            setStats({
                users: usersData.length,
                books: booksData.length,
                categories: categoriesData.length,
                events: eventsData.length,
                announcements: announcementsData.length,
                activeUsers,
                admins,
                regularUsers
            });

            console.log('סטטיסטיקות נטענו:', {
                users: usersData.length,
                books: booksData.length,
                categories: categoriesData.length,
                events: eventsData.length,
                announcements: announcementsData.length
            });

        } catch (error) {
            console.error('שגיאה בטעינת סטטיסטיקות:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatsFromUsers = (usersData) => {
        const activeUsers = usersData.filter(u => u.isActive !== false).length;
        const admins = usersData.filter(u => u.role === 'admin').length;
        const regularUsers = usersData.filter(u => u.role === 'user').length;

        setStats(prev => ({
            ...prev,
            users: usersData.length,
            activeUsers,
            admins,
            regularUsers
        }));
    };

    const updateStatsFromBooks = (booksData) => {
        setStats(prev => ({ ...prev, books: booksData.length }));
    };

    const updateStatsFromCategories = (categoriesData) => {
        setStats(prev => ({ ...prev, categories: categoriesData.length }));
    };

    const updateStatsFromEvents = (eventsData) => {
        setStats(prev => ({ ...prev, events: eventsData.length }));
    };

    const updateStatsFromAnnouncements = (announcementsData) => {
        setStats(prev => ({ ...prev, announcements: announcementsData.length }));
    };

    const handleDeleteEvent = async (eventId) => {
        if (confirm("האם אתה בטוח שברצונך למחוק את האירוע?")) {
            try {
                await deleteEventFromFirebase(eventId);
                console.log('אירוע נמחק בהצלחה:', eventId);
                // הסטטיסטיקות יתעדכנו אוטומטית דרך subscribeToCollection
            } catch (error) {
                console.error('שגיאה במחיקת אירוע:', error);
                alert('שגיאה במחיקת האירוע: ' + error.message);
            }
        }
    };

    const handleDeleteAnnouncement = async (announcementId) => {
        if (confirm("האם אתה בטוח שברצונך למחוק את ההודעה?")) {
            try {
                await deleteAnnouncementFromFirebase(announcementId);
                console.log('הודעה נמחקה בהצלחה:', announcementId);
                // הסטטיסטיקות יתעדכנו אוטומטית דרך subscribeToCollection
            } catch (error) {
                console.error('שגיאה במחיקת הודעה:', error);
                alert('שגיאה במחיקת ההודעה: ' + error.message);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* כותרת ותפריט טאבים */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <h2 className="text-2xl font-semibold mb-6">פאנל ניהול מתקדם</h2>

                {/* תפריט טאבים */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview'
                            ? 'bg-blue-600 text-white'
                            : 'border border-stone-300 hover:bg-stone-100'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        סקירה כללית
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'users'
                            ? 'bg-blue-600 text-white'
                            : 'border border-stone-300 hover:bg-stone-100'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        ניהול משתמשים
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'categories'
                            ? 'bg-blue-600 text-white'
                            : 'border border-stone-300 hover:bg-stone-100'
                            }`}
                    >
                        <Tag className="w-4 h-4" />
                        ניהול קטגוריות
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'events'
                            ? 'bg-blue-600 text-white'
                            : 'border border-stone-300 hover:bg-stone-100'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        ניהול אירועים
                    </button>
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'announcements'
                            ? 'bg-blue-600 text-white'
                            : 'border border-stone-300 hover:bg-stone-100'
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        ניהול הודעות
                    </button>
                </div>

                {/* סטטיסטיקות מתקדמות - רק בטאב סקירה כללית */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                <h3 className="font-medium text-blue-900">משתמשים</h3>
                            </div>
                            <div className="text-2xl font-bold text-blue-900">
                                {loading ? '...' : stats.users}
                            </div>
                            <div className="text-sm text-blue-700">
                                {loading ? 'טוען...' : `${stats.activeUsers} פעילים • ${stats.admins} מנהלים`}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Book className="w-5 h-5 text-green-600" />
                                <h3 className="font-medium text-green-900">ספרים</h3>
                            </div>
                            <div className="text-2xl font-bold text-green-900">
                                {loading ? '...' : stats.books}
                            </div>
                            <div className="text-sm text-green-700">ספרים בקטלוג</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                <h3 className="font-medium text-purple-900">אירועים</h3>
                            </div>
                            <div className="text-2xl font-bold text-purple-900">
                                {loading ? '...' : stats.events}
                            </div>
                            <div className="text-sm text-purple-700">אירועים פעילים</div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Bell className="w-5 h-5 text-orange-600" />
                                <h3 className="font-medium text-orange-900">הודעות</h3>
                            </div>
                            <div className="text-2xl font-bold text-orange-900">
                                {loading ? '...' : stats.announcements}
                            </div>
                            <div className="text-sm text-orange-700">הודעות פעילות</div>
                        </div>
                    </div>
                )}
            </div>

            {/* תוכן הטאבים */}
            {activeTab === 'users' && (
                <UserManagement currentUser={currentUser} />
            )}

            {activeTab === 'categories' && (
                <CategoryManagement currentUser={currentUser} />
            )}

            {activeTab === 'events' && (
                <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-medium">ניהול אירועים</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <h4 className="font-medium text-emerald-800 mb-2">סטטיסטיקות</h4>
                            <div className="text-sm text-emerald-700">
                                <div>סה״כ אירועים: {loading ? '...' : stats.events}</div>
                                <div>אירועים החודש: {events.filter(e => {
                                    const eventDate = new Date(e.date);
                                    const now = new Date();
                                    return eventDate.getMonth() === now.getMonth() &&
                                        eventDate.getFullYear() === now.getFullYear();
                                }).length}</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">רשימת אירועים</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {events.map(event => (
                                    <div key={event.id} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{event.title}</div>
                                            <div className="text-xs text-stone-500">
                                                {new Date(event.date).toLocaleDateString('he-IL')}
                                                {event.time && ` • ${event.time}`}
                                            </div>
                                            {event.description && (
                                                <div className="text-xs text-stone-600 mt-1 line-clamp-1">
                                                    {event.description}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="text-red-600 hover:text-red-800 p-2"
                                            title="מחק אירוע"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <div className="text-sm text-stone-500 text-center py-4">
                                        אין אירועים במערכת
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'announcements' && (
                <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium">ניהול הודעות מערכת</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="font-medium text-blue-800 mb-2">סטטיסטיקות</h4>
                            <div className="text-sm text-blue-700">
                                <div>סה״כ הודעות: {loading ? '...' : stats.announcements}</div>
                                <div>הודעות היום: {announcements.filter(a => {
                                    const announcementDate = new Date(a.createdAt);
                                    const today = new Date();
                                    return announcementDate.toDateString() === today.toDateString();
                                }).length}</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">רשימת הודעות</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {announcements.map(announcement => (
                                    <div key={announcement.id} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{announcement.title}</div>
                                            <div className="text-xs text-stone-500">
                                                {new Date(announcement.createdAt).toLocaleDateString('he-IL')}
                                                {announcement.createdBy && ` • ${announcement.createdBy}`}
                                            </div>
                                            {announcement.message && (
                                                <div className="text-xs text-stone-600 mt-1 line-clamp-2">
                                                    {announcement.message}
                                                </div>
                                            )}
                                            <div className={`inline-block mt-1 px-2 py-1 rounded text-xs ${announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                announcement.type === 'success' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {announcement.type === 'warning' ? 'אזהרה' :
                                                    announcement.type === 'success' ? 'הודעה חיובית' : 'מידע'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                                            className="text-red-600 hover:text-red-800 p-2"
                                            title="מחק הודעה"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {announcements.length === 0 && (
                                    <div className="text-sm text-stone-500 text-center py-4">
                                        אין הודעות במערכת
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* הוסף FirebaseStatus */}
                    <FirebaseStatus />

                    <div className="rounded-3xl border border-stone-200 bg-white p-5">
                        <h3 className="font-medium mb-4">סיכום פעילות המערכת</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium mb-2">משתמשים פעילים</h4>
                                <div className="text-sm text-gray-600">
                                    {loading ? (
                                        <div>טוען נתונים...</div>
                                    ) : (
                                        <>
                                            <div>מנהלים: {stats.admins}</div>
                                            <div>משתמשים רגילים: {stats.regularUsers}</div>
                                            <div>לא פעילים: {stats.users - stats.activeUsers}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium mb-2">תוכן המערכת</h4>
                                <div className="text-sm text-gray-600">
                                    {loading ? (
                                        <div>טוען נתונים...</div>
                                    ) : (
                                        <>
                                            <div>קטגוריות ספרים: {stats.categories}</div>
                                            <div>ספרים בקטלוג: {stats.books}</div>
                                            <div>אירועים פעילים: {stats.events}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}