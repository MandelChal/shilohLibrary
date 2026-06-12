import React, { useState } from 'react';
import { loginUser } from '../utils/dbHelpers';

// ------------------------------------------------------
// 🔐 קומפוננטת התחברות עם Firebase - גרסת דיבוג
// ------------------------------------------------------
export default function LoginScreen({ onLogin }) {
    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState("");

    // פונקציה ליצירת משתמשי ברירת מחדל
    const createDefaultUsers = () => {
        const defaultUsers = [
            {
                id: 'admin-default',
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
                id: 'user1-default',
                username: 'user1',
                password: 'user123',
                name: 'משתמש להדוגמה',
                role: 'user',
                email: 'user@library.com',
                phone: '050-7654321',
                createdAt: new Date().toISOString(),
                createdBy: 'מנהל ראשי',
                isActive: true
            }
        ];

        localStorage.setItem('libraryUsers', JSON.stringify(defaultUsers));
        console.log('משתמשי ברירת מחדל נוצרו ב-localStorage');
        setDebugInfo("משתמשי ברירת מחדל נוצרו!");
        return defaultUsers;
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();

        if (!loginData.username.trim() || !loginData.password.trim()) {
            alert('נא למלא שם משתמש וסיסמה');
            return;
        }

        setIsLoading(true);
        setDebugInfo("מנסה להתחבר...");

        try {
            console.log("מנסה להתחבר עם:", loginData.username);

            // ננסה להתחבר עם Firebase/localStorage
            const userData = await loginUser(loginData.username, loginData.password);

            console.log("התחברות מוצלחת:", userData.name);
            setDebugInfo("התחברות מוצלחת!");
            onLogin(userData);

        } catch (error) {
            console.error("שגיאה בהתחברות:", error);
            setDebugInfo(`שגיאה: ${error.message}`);

            // אם נכשלנו, ניצור משתמשי ברירת מחדל וננסה שוב
            try {
                setDebugInfo("יוצר משתמשי ברירת מחדל...");
                const defaultUsers = createDefaultUsers();

                // חיפוש משתמש במשתמשי ברירת המחדל שיצרנו
                const user = defaultUsers.find(u =>
                    u.username === loginData.username && u.password === loginData.password
                );

                if (user) {
                    console.log("התחברות עם משתמש ברירת מחדל:", user.name);
                    setDebugInfo("התחברות מוצלחת עם משתמש ברירת מחדל!");
                    onLogin(user);
                } else {
                    // בדיקה אם זה אחד מהמשתמשים הצפויים
                    if (loginData.username === "admin" && loginData.password === "admin123") {
                        const adminUser = {
                            id: "admin-direct",
                            name: "מנהל הספרייה",
                            role: "admin",
                            username: "admin"
                        };
                        console.log("התחברות ישירה כמנהל");
                        setDebugInfo("התחברות ישירה כמנהל!");
                        onLogin(adminUser);
                    } else if (loginData.username === "user1" && loginData.password === "user123") {
                        const regularUser = {
                            id: "user1-direct",
                            name: "משתמש רגיל",
                            role: "user",
                            username: "user1"
                        };
                        console.log("התחברות ישירה כמשתמש");
                        setDebugInfo("התחברות ישירה כמשתמש!");
                        onLogin(regularUser);
                    } else {
                        setDebugInfo(`שם משתמש או סיסמה שגויים. נסה: admin/admin123 או user1/user123`);
                        alert(`שגיאה בהתחברות: ${error.message}\n\nלבדיקה נסה:\nמנהל: admin / admin123\nמשתמש: user1 / user123`);
                    }
                }
            } catch (defaultError) {
                console.error("שגיאה ביצירת משתמשי ברירת מחדל:", defaultError);
                setDebugInfo("שגיאה ביצירת משתמשי ברירת מחדל");
                alert('שגיאה במערכת. נסה לרענן את הדף.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // התחברות מהירה
    const quickLogin = (userType) => {
        if (userType === 'admin') {
            setLoginData({ username: 'admin', password: 'admin123' });
        } else {
            setLoginData({ username: 'user1', password: 'user123' });
        }
        setTimeout(() => handleLogin(), 100);
    };

    // פונקציה לניקוי localStorage
    const clearLocalStorage = () => {
        localStorage.clear();
        setDebugInfo("localStorage נוקה. נסה להתחבר שוב.");
        console.log("localStorage נוקה");
    };

    // פונקציה לבדיקת מצב localStorage
    const checkLocalStorage = () => {
        const users = localStorage.getItem('libraryUsers');
        if (users) {
            const parsedUsers = JSON.parse(users);
            setDebugInfo(`נמצאו ${parsedUsers.length} משתמשים ב-localStorage`);
            console.log("משתמשים ב-localStorage:", parsedUsers);
        } else {
            setDebugInfo("אין משתמשים ב-localStorage");
            console.log("אין נתונים ב-localStorage");
        }
    };

    return (
        <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-700 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">סׅל</div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">ספריית שִׁלֹה</h1>
                    <p className="text-stone-600">התחברות למערכת</p>
                </div>

                {/* מידע דיבוג */}
                {debugInfo && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        <strong>מצב:</strong> {debugInfo}
                    </div>
                )}

                <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-lg">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-stone-700 mb-2 block">שם משתמש</span>
                            <input
                                type="text"
                                value={loginData.username}
                                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                                className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                placeholder="הכניסו שם משתמש"
                                required
                                disabled={isLoading}
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-stone-700 mb-2 block">סיסמה</span>
                            <input
                                type="password"
                                value={loginData.password}
                                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                placeholder="הכניסו סיסמה"
                                required
                                disabled={isLoading}
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={isLoading || !loginData.username.trim() || !loginData.password.trim()}
                            className="w-full rounded-xl py-3 bg-emerald-700 text-white font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "מתחבר..." : "התחברות"}
                        </button>
                    </form>

                    {/* כפתורי התחברות מהירה לבדיקה */}
                    <div className="pt-4 border-t border-stone-200 mt-4">
                        <div className="text-xs text-stone-500 mb-2 text-center">התחברות מהירה לבדיקה:</div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => quickLogin("admin")}
                                disabled={isLoading}
                                className="flex-1 text-xs py-2 px-3 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors"
                            >
                                התחבר כמנהל
                            </button>
                            <button
                                onClick={() => quickLogin("user")}
                                disabled={isLoading}
                                className="flex-1 text-xs py-2 px-3 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors"
                            >
                                התחבר כמשתמש
                            </button>
                        </div>
                    </div>

                    {/* כפתורי דיבוג */}
                    <div className="pt-4 border-t border-stone-200 mt-4">
                        <div className="text-xs text-stone-500 mb-2 text-center">כלי דיבוג:</div>
                        <div className="flex gap-2">
                            <button
                                onClick={checkLocalStorage}
                                disabled={isLoading}
                                className="flex-1 text-xs py-2 px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
                            >
                                בדוק נתונים
                            </button>
                            <button
                                onClick={clearLocalStorage}
                                disabled={isLoading}
                                className="flex-1 text-xs py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                            >
                                נקה נתונים
                            </button>
                            <button
                                onClick={createDefaultUsers}
                                disabled={isLoading}
                                className="flex-1 text-xs py-2 px-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
                            >
                                צור משתמשים
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-white/50 rounded-xl border border-stone-200">
                    <div className="text-sm text-stone-600">
                        <strong>לבדיקה:</strong><br />
                        מנהל: admin / admin123<br />
                        משתמש: user1 / user123<br />
                        <br />
                        <div className="text-xs text-blue-600">
                            גרסת דיבוג - מציגה מידע על מצב המערכת
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}