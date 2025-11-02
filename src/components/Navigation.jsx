import React from 'react';

// ------------------------------------------------------
// 🏠 קומפוננטת סרגל ניווט עליון
// ------------------------------------------------------
export default function Navigation() {
    return (
        <nav className="bg-white border-b border-stone-200 shadow-sm">
            <div className="mx-auto max-w-6xl px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* לוגו */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-bold">
                            סל
                        </div>
                        <h1 className="text-xl font-semibold text-stone-800">ספריית שִׁלֹה</h1>
                    </div>

                    {/* תפריט ניווט */}
                    <div className="flex gap-8">
                        <a
                            href="#about"
                            className="text-stone-700 hover:text-emerald-600 font-medium transition-colors cursor-pointer"
                        >
                            על הישיבה
                        </a>
                        <a
                            href="#catalog"
                            className="text-stone-700 hover:text-emerald-600 font-medium transition-colors cursor-pointer"
                        >
                            קטלוג ספרים
                        </a>
                        <a
                            href="#contact"
                            className="text-stone-700 hover:text-emerald-600 font-medium transition-colors cursor-pointer"
                        >
                            יצירת קשר
                        </a>
                        <a
                            href="#hours"
                            className="text-stone-700 hover:text-emerald-600 font-medium transition-colors cursor-pointer"
                        >
                            שעות פתיחה
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}