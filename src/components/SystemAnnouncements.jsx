import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { addAnnouncement, deleteAnnouncement } from '../utils/dbHelpers';

// ------------------------------------------------------
// 🔔 קומפוננטת הודעות מערכת (מסתובבות) עם Firebase
// ------------------------------------------------------
export default function SystemAnnouncements({ user, announcements, onAddAnnouncement, onDeleteAnnouncement }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: "", message: "", type: "info" });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // החלפה אוטומטית של הודעות כל 5 שניות
    useEffect(() => {
        if (announcements.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [announcements.length]);

    // וודא שהאינדקס הנוכחי תקין
    useEffect(() => {
        if (currentIndex >= announcements.length && announcements.length > 0) {
            setCurrentIndex(0);
        }
    }, [announcements.length, currentIndex]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.title.trim()) {
            alert('נא למלא כותרת להודעה');
            return;
        }

        setLoading(true);
        try {
            const announcementData = {
                title: newAnnouncement.title.trim(),
                message: newAnnouncement.message.trim(),
                type: newAnnouncement.type,
                createdAt: new Date().toISOString(),
                createdBy: user.name
            };

            const savedAnnouncement = await addAnnouncement(announcementData);


            if (onAddAnnouncement) {
                onAddAnnouncement(savedAnnouncement);
            }

            // איפוס הטופס
            setNewAnnouncement({ title: "", message: "", type: "info" });
            setShowAddForm(false);

            console.log('הודעה נוספה בהצלחה:', savedAnnouncement.title);

        } catch (error) {
            console.error('שגיאה בהוספת הודעה:', error);
            alert('שגיאה בהוספת ההודעה: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (announcementId) => {
        if (!confirm("האם אתה בטוח שברצונך למחוק את ההודעה?")) {
            return;
        }

        setLoading(true);
        try {
            // מחיקה מהמסד נתונים תחילה
            await deleteAnnouncement(announcementId);

            // עדכון הקומפוננטה האב (App.jsx)
            if (onDeleteAnnouncement) {
                onDeleteAnnouncement(announcementId);
            }

            // עדכון האינדקס הנוכחי אם צריך
            const remainingAnnouncements = announcements.filter(a => a.id !== announcementId);
            if (currentIndex >= remainingAnnouncements.length && remainingAnnouncements.length > 0) {
                setCurrentIndex(0);
            } else if (remainingAnnouncements.length === 0) {
                setCurrentIndex(0);
            }

            console.log('הודעה נמחקה בהצלחה:', announcementId);

        } catch (error) {
            console.error('שגיאה במחיקת הודעה:', error);
            alert('שגיאה במחיקת ההודעה: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    const nextAnnouncement = () => {
        if (announcements.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }
    };

    const prevAnnouncement = () => {
        if (announcements.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
        }
    };

    // אם אין הודעות ולא מנהל, אל תציג כלום
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
                        {loading && (
                            <span className="text-xs text-blue-600">מעדכן...</span>
                        )}
                    </div>
                    {user.role === 'admin' && (
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            הוספת הודעה
                        </button>
                    )}
                </div>

                {/* טופס הוספת הודעה */}
                {showAddForm && (
                    <form onSubmit={handleAdd} className="mt-4 p-4 bg-white rounded-xl border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                                type="text"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="כותרת הודעה *"
                                className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loading}
                            />
                            <input
                                type="text"
                                value={newAnnouncement.message}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="תוכן ההודעה"
                                className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                            <select
                                value={newAnnouncement.type}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, type: e.target.value }))}
                                className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            >
                                <option value="info">מידע</option>
                                <option value="warning">אזהרה</option>
                                <option value="success">הודעה חיובית</option>
                            </select>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading || !newAnnouncement.title.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'מפרסם...' : 'פרסם'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    disabled={loading}
                                    className="px-3 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                                >
                                    ביטול
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
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-medium">{currentAnnouncement.title}</span>
                                        {currentAnnouncement.createdBy && (
                                            <span className="text-xs opacity-75">• {currentAnnouncement.createdBy}</span>
                                        )}
                                        {currentAnnouncement.createdAt && (
                                            <span className="text-xs opacity-75">
                                                • {new Date(currentAnnouncement.createdAt).toLocaleDateString('he-IL')}
                                            </span>
                                        )}
                                    </div>
                                    {currentAnnouncement.message && (
                                        <div className="text-sm opacity-90 mt-1">
                                            {currentAnnouncement.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* כפתורי ניווט אם יש יותר מהודעה אחת */}
                                {announcements.length > 1 && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={prevAnnouncement}
                                            disabled={loading}
                                            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50"
                                            title="הודעה קודמת"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={nextAnnouncement}
                                            disabled={loading}
                                            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50"
                                            title="הודעה הבאה"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* כפתור מחיקה למנהל */}
                                {user.role === 'admin' && (
                                    <button
                                        onClick={() => handleDelete(currentAnnouncement.id)}
                                        disabled={loading}
                                        className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-white/50 transition-colors disabled:opacity-50"
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
                                        disabled={loading}
                                        className={`w-2 h-2 rounded-full transition-colors disabled:opacity-50 ${index === currentIndex ? 'bg-blue-600' : 'bg-blue-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* הודעה אם אין הודעות */}
                {announcements.length === 0 && user.role === 'admin' && (
                    <div className="mt-3 text-center py-4 text-blue-600 text-sm">
                        אין הודעות במערכת. הוסף הודעה ראשונה כדי להתחיל.
                    </div>
                )}
            </div>
        </div>
    );
}