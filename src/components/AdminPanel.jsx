import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Calendar, Bell, User, Users, Settings, Book, Tag, Mail } from 'lucide-react';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import FirebaseStatus from './FirebaseStatus';
import AdminContactMessages from './AdminContactMessages';
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

// נתוני דמה לבדיקה מקומית כשה-Firebase המקומי ריק מנתונים
const dummyMessages = [
    {
        id: "dummy1",
        name: "אלעד כהן",
        email: "elad@gmail.com",
        message: "שלום, אשמח לדעת האם הספר 'חומש רש\"י' פנוי להשאלה מחר בבוקר?",
        createdAt: new Date().toISOString(),
        status: "new"
    },
    {
        id: "dummy2",
        name: "מיכל אברהם",
        email: "michal@outlook.com",
        message: "היי, יש לי שאלה לגבי שעות הפתיחה של הספרייה בערבי חגים. תודה!",
        createdAt: new Date().toISOString(),
        status: "new"
    }
];

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

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        setLocalAnnouncements(announcements || []);
    }, [announcements]);

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

    return (
        <div className="space-y-6">
            {/* כותרת ותפריט טאבים */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <h2 className="text-2xl font-semibold mb-6">פאנל ניהול מתקדם</h2>

                {/* תפריט טאבים */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'border border-stone-300 hover:bg-stone-100'}`}
                    >
                        <Settings className="w-4 h-4" />
                        סקירה כללית
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'border border-stone-300 hover:bg-stone-100'}`}
                    >
                        <Users className="w-4 h-4" />
                        ניהול משתמשים
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'border border-stone-300 hover:bg-stone-100'}`}
                    >
                        <Tag className="w-4 h-4" />
                        ניהול קטגוריות
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'events' ? 'bg-blue-600 text-white' : 'border border-stone-300 hover:bg-stone-100'}`}
                    >
                        <Calendar className="w-4 h-4" />
                        ניהול אירועים
                    </button>
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'announcements' ? 'bg-blue-600 text-white' : 'border border-stone-300 hover:bg-stone-100'}`}
                    >
                        <Bell className="w-4 h-4" />
                        ניהול הודעות
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'messages' ? 'bg-blue-600 text-white' : 'border border-stone-300 hover:bg-stone-100'}`}
                    >
                        <Mail className="w-4 h-4" />
                        פניות משתמשים
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
                            <div className="text-2xl font-bold text-blue-900">{loading ? '...' : stats.users}</div>
                            <div className="text-sm text-blue-700">{loading ? 'טוען...' : `${stats.activeUsers} פעילים`}</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Book className="w-5 h-5 text-green-600" />
                                <h3 className="font-medium text-green-900">ספרים</h3>
                            </div>
                            <div className="text-2xl font-bold text-green-900">{loading ? '...' : stats.books}</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                <h3 className="font-medium text-purple-900">אירועים</h3>
                            </div>
                            <div className="text-2xl font-bold text-purple-900">{loading ? '...' : stats.events}</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Bell className="w-5 h-5 text-orange-600" />
                                <h3 className="font-medium text-orange-900">הודעות</h3>
                            </div>
                            <div className="text-2xl font-bold text-orange-900">{loading ? '...' : stats.announcements}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* תוכן הטאבים הפנימיים */}
            {activeTab === 'users' && <UserManagement currentUser={currentUser} />}
            {activeTab === 'categories' && <CategoryManagement currentUser={currentUser} />}
            {activeTab === 'messages' && <AdminContactMessages defaultMessages={dummyMessages} />}
            
            {activeTab === 'events' && (
                <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-medium">ניהול אירועים</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {events.map(event => (
                                <div key={event.id} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{event.title}</div>
                                        <div className="text-xs text-stone-500">{new Date(event.date).toLocaleDateString('he-IL')}</div>
                                    </div>
                                    <button onClick={() => onDeleteEvent(event.id)} className="text-red-600 p-2">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
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
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {announcements.map(announcement => (
                                <div key={announcement.id} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{announcement.title}</div>
                                        <div className="text-xs text-stone-500">{announcement.message}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <FirebaseStatus />
                    <div className="rounded-3xl border border-stone-200 bg-white p-5">
                        <h3 className="font-medium mb-4">סיכום פעילות המערכת</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium mb-2">משתמשים</h4>
                                <div className="text-sm text-gray-600">
                                    <div>מנהלים: {stats.admins}</div>
                                    <div>משתמשים רגילים: {stats.regularUsers}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}