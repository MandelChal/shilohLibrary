import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Calendar, Bell, User, Users, Settings } from 'lucide-react';
import UserManagement from './UserManagement';

// ------------------------------------------------------
// 🛡️ פאנל ניהול (Admin Panel)
// ------------------------------------------------------
export default function AdminPanel({ events, onDeleteEvent, announcements, currentUser }) {
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    // טעינת משתמשים מ-localStorage
    useEffect(() => {
        const savedUsers = localStorage.getItem('libraryUsers');
        if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
        } else {
            // משתמשים ברירת מחדל
            const defaultUsers = [
                {
                    id: '1',
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
                    id: '2',
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
            setUsers(defaultUsers);
            localStorage.setItem('libraryUsers', JSON.stringify(defaultUsers));
        }
    }, []);

    // שמירת משתמשים ב-localStorage
    const handleUpdateUsers = (updatedUsers) => {
        setUsers(updatedUsers);
        localStorage.setItem('libraryUsers', JSON.stringify(updatedUsers));
    };

    return (
        <div className="space-y-6">
            {/* כותרת ותפריט ניווט */}
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
                        onClick={() => setActiveTab('events')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'events'
                                ? 'bg-blue-600 text-white'
                                : 'border border-stone-300 hover:bg-stone-100'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        ניהול אירועים
                    </button>
                </div>

                {/* סטטיסטיקות מתקדמות - רק בטאב סקירה כללית */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <h3 className="font-medium text-blue-900">אירועים</h3>
                            </div>
                            <div className="text-2xl font-bold text-blue-900">{events.length}</div>
                            <div className="text-sm text-blue-700">סה״כ אירועים במערכת</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Bell className="w-5 h-5 text-green-600" />
                                <h3 className="font-medium text-green-900">הודעות</h3>
                            </div>
                            <div className="text-2xl font-bold text-green-900">{announcements?.length || 0}</div>
                            <div className="text-sm text-green-700">הודעות פעילות</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                <h3 className="font-medium text-purple-900">משתמשים</h3>
                            </div>
                            <div className="text-2xl font-bold text-purple-900">{users.length}</div>
                            <div className="text-sm text-purple-700">משתמשים רשומים</div>
                        </div>
                    </div>
                )}
            </div>

            {/* תוכן הטאבים */}
            {activeTab === 'users' && (
                <UserManagement
                    currentUser={currentUser}
                    users={users}
                    onUpdateUsers={handleUpdateUsers}
                />
            )}

            {activeTab === 'categories' && (
                <CategoryManagement
                    categories={categories}
                    onUpdateCategories={onUpdateCategories}
                    books={books}
                />
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
                                <div>סה״כ אירועים: {events.length}</div>
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
                                        </div>
                                        <button
                                            onClick={() => onDeleteEvent(event.id)}
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

            {activeTab === 'overview' && (
                <div className="rounded-3xl border border-stone-200 bg-white p-5">
                    <h3 className="font-medium mb-4">סיכום פעילות המערכת</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium mb-2">משתמשים פעילים</h4>
                            <div className="text-sm text-gray-600">
                                <div>מנהלים: {users.filter(u => u.role === 'admin' && u.isActive !== false).length}</div>
                                <div>משתמשים רגילים: {users.filter(u => u.role === 'user' && u.isActive !== false).length}</div>
                                <div>לא פעילים: {users.filter(u => u.isActive === false).length}</div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium mb-2">אירועים קרובים</h4>
                            <div className="text-sm text-gray-600">
                                אירועים בשבוע הקרוב: {events.filter(e => {
                                    const eventDate = new Date(e.date);
                                    const now = new Date();
                                    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                                    return eventDate >= now && eventDate <= nextWeek;
                                }).length}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}