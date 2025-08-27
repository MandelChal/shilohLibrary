import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';

// ------------------------------------------------------
// 🔔 קומפוננטת הודעות מערכת (מסתובבות)
// ------------------------------------------------------
export default function SystemAnnouncements({ user, announcements, onAddAnnouncement, onDeleteAnnouncement }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: "", message: "", type: "info" });
    const [currentIndex, setCurrentIndex] = useState(0);

    // החלפה אוטומטית של הודעות כל 5 שניות
    useEffect(() => {
        if (announcements.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [announcements.length]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.title.trim()) return;

        await onAddAnnouncement({
            ...newAnnouncement,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            createdBy: user.name
        });

        setNewAnnouncement({ title: "", message: "", type: "info" });
        setShowAddForm(false);
    };

    const nextAnnouncement = () => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
    };

    const prevAnnouncement = () => {
        setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    if (!announcements.length && user.role !== 'admin') return null;

    const currentAnnouncement = announcements[currentIndex];

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <div className="mx-auto max-w-6xl px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">הודעות מערכת</span>
                        {announcements.length > 1 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {currentIndex + 1} מתוך {announcements.length}
                            </span>
                        )}
                    </div>
                    {user.role === 'admin' && (
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            הוספת הודעה
                        </button>
                    )}
                </div>

                {showAddForm && (
                    <form onSubmit={handleAdd} className="mt-4 p-4 bg-white rounded-xl border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="כותרת הודעה"
                                className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <input
                                type="text"
                                value={newAnnouncement.message}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="תוכן ההודעה"
                                className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                                <select
                                    value={newAnnouncement.type}
                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, type: e.target.value }))}
                                    className="flex-1 rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="info">מידע</option>
                                    <option value="warning">אזהרה</option>
                                    <option value="success">הודעה חיובית</option>
                                </select>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    פרסם
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* הצגת הודעה אחת בכל פעם */}
                {announcements.length > 0 && currentAnnouncement && (
                    <div className="mt-3">
                        <div className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-500 ${currentAnnouncement.type === 'warning' ? 'bg-yellow-100 border border-yellow-300' :
                                currentAnnouncement.type === 'success' ? 'bg-green-100 border border-green-300' :
                                    'bg-blue-100 border border-blue-300'
                            }`}>
                            <div className="flex items-center gap-3 flex-1">
                                <div>
                                    <span className="font-medium">{currentAnnouncement.title}</span>
                                    {currentAnnouncement.message && (
                                        <span className="mr-2 text-sm opacity-80">— {currentAnnouncement.message}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* כפתורי ניווט אם יש יותר מהודעה אחת */}
                                {announcements.length > 1 && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={prevAnnouncement}
                                            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                                            title="הודעה קודמת"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={nextAnnouncement}
                                            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                                            title="הודעה הבאה"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* כפתור מחיקה למנהל */}
                                {user.role === 'admin' && (
                                    <button
                                        onClick={() => {
                                            onDeleteAnnouncement(currentAnnouncement.id);
                                            // אם זו ההודעה האחרונה, חזור להתחלה
                                            if (currentIndex >= announcements.length - 1) {
                                                setCurrentIndex(0);
                                            }
                                        }}
                                        className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-white/50 transition-colors"
                                        title="מחק הודעה"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* נקודות אינדיקטור */}
                        {announcements.length > 1 && (
                            <div className="flex justify-center gap-1 mt-2">
                                {announcements.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-blue-600' : 'bg-blue-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}