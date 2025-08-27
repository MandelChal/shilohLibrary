import React from 'react';
import { Shield, Trash2, Calendar, Bell, User } from 'lucide-react';

// ------------------------------------------------------
// 🛡️ פאנל ניהול (Admin Panel)
// ------------------------------------------------------
export default function AdminPanel({ events, onDeleteEvent, announcements }) {
    return (
        <div className="space-y-6">
            {/* סטטיסטיקות מתקדמות */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <h2 className="text-2xl font-semibold mb-6">פאנל ניהול מתקדם</h2>

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
                            <User className="w-5 h-5 text-purple-600" />
                            <h3 className="font-medium text-purple-900">משתמשים</h3>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">2</div>
                        <div className="text-sm text-purple-700">משתמשים רשומים</div>
                    </div>
                </div>
            </div>

            {/* ניהול אירועים */}
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
        </div>
    );
}