import React, { useState } from 'react';

// ------------------------------------------------------
// 🔐 קומפוננטת התחברות
// ------------------------------------------------------
export default function LoginScreen({ onLogin }) {
    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);

        console.log("מנסה להתחבר עם:", loginData.username, loginData.password);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            if (loginData.username.trim() === "admin" && loginData.password.trim() === "123") {
                console.log("התחברות מנהל מוצלחת");
                onLogin({
                    id: "1",
                    name: "מנהל הספרייה",
                    role: "admin",
                    username: "admin"
                });
            } else if (loginData.username.trim() === "user" && loginData.password.trim() === "123") {
                console.log("התחברות משתמש מוצלחת");
                onLogin({
                    id: "2",
                    name: "משתמש רגיל",
                    role: "user",
                    username: "user"
                });
            } else {
                console.log("פרטי התחברות שגויים");
                alert("שם משתמש או סיסמה שגויים\n\nנסה:\nמנהל: admin / 123\nמשתמש: user / 123");
            }
        } catch (error) {
            console.error("שגיאה בהתחברות:", error);
            alert("שגיאה בהתחברות. נסה שוב.");
        }

        setIsLoading(false);
    };

    return (
        <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-700 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">סׅל</div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">ספריית שִׁלֹה</h1>
                    <p className="text-stone-600">התחברות למערכת</p>
                </div>

                <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-lg">
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-stone-700 mb-2 block">שם משתמש</span>
                            <input
                                type="text"
                                value={loginData.username}
                                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                                className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                placeholder="הכניסו שם משתמש"
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
                            />
                        </label>

                        <button
                            onClick={handleLogin}
                            disabled={isLoading || !loginData.username.trim() || !loginData.password.trim()}
                            className="w-full rounded-xl py-3 bg-emerald-700 text-white font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "מתחבר..." : "התחברות"}
                        </button>

                        {/* כפתורי התחברות מהירה לבדיקה */}
                        <div className="pt-4 border-t border-stone-200">
                            <div className="text-xs text-stone-500 mb-2 text-center">התחברות מהירה לבדיקה:</div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setLoginData({ username: "admin", password: "123" });
                                        setTimeout(() => handleLogin(), 100);
                                    }}
                                    disabled={isLoading}
                                    className="flex-1 text-xs py-2 px-3 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                                >
                                    התחבר כמנהל
                                </button>
                                <button
                                    onClick={() => {
                                        setLoginData({ username: "user", password: "123" });
                                        setTimeout(() => handleLogin(), 100);
                                    }}
                                    disabled={isLoading}
                                    className="flex-1 text-xs py-2 px-3 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                                >
                                    התחבר כמשתמש
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-white/50 rounded-xl border border-stone-200">
                    <div className="text-sm text-stone-600">
                        <strong>לבדיקה:</strong><br />
                        מנהל: admin / 123<br />
                        משתמש: user / 123
                    </div>
                </div>
            </div>
        </div>
    );
}