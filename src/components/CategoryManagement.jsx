import React, { useState } from 'react';
import { FolderPlus, Plus, Trash2, Edit2, Save, X, AlertCircle, Tag } from 'lucide-react';

// ------------------------------------------------------
// 📂 קומפוננטת ניהול קטגוריות ספרים
// ------------------------------------------------------
export default function CategoryManagement({ categories, onUpdateCategories, books }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({
        id: '',
        name: '',
        color: 'blue'
    });

    // צבעים זמינים לקטגוריות
    const availableColors = [
        { id: 'blue', name: 'כחול', class: 'bg-blue-500' },
        { id: 'green', name: 'ירוק', class: 'bg-green-500' },
        { id: 'purple', name: 'סגול', class: 'bg-purple-500' },
        { id: 'red', name: 'אדום', class: 'bg-red-500' },
        { id: 'yellow', name: 'צהוב', class: 'bg-yellow-500' },
        { id: 'indigo', name: 'כחול כהה', class: 'bg-indigo-500' },
        { id: 'pink', name: 'ורוד', class: 'bg-pink-500' },
        { id: 'gray', name: 'אפור', class: 'bg-gray-500' },
        { id: 'orange', name: 'כתום', class: 'bg-orange-500' },
        { id: 'teal', name: 'טורקיז', class: 'bg-teal-500' },
        { id: 'cyan', name: 'ציאן', class: 'bg-cyan-500' },
        { id: 'emerald', name: 'ירוק זמרגד', class: 'bg-emerald-500' }
    ];

    // יצירת ID יחודי לקטגוריה
    const generateId = (name) => {
        return name.toLowerCase()
            .replace(/[^a-zA-Z0-9\u0590-\u05FF\s]/g, '') // רק אותיות ומספרים (כולל עברית)
            .replace(/\s+/g, '_') // החלפת רווחים ב-_
            .substring(0, 20); // מגבלת אורך
    };

    // בדיקה כמה ספרים משתמשים בקטגוריה
    const getBooksInCategory = (categoryId) => {
        return books.filter(book => book.category === categoryId).length;
    };

    // הוספת קטגוריה חדשה
    const handleAddCategory = (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) {
            alert('יש למלא את שם הקטגוריה');
            return;
        }

        const id = generateId(newCategory.name);

        // בדיקה שלא קיימת קטגוריה עם אותו ID
        if (categories.some(cat => cat.id === id)) {
            alert('קטגוריה עם שם דומה כבר קיימת במערכת');
            return;
        }

        const categoryToAdd = {
            id,
            name: newCategory.name.trim(),
            color: newCategory.color,
            createdAt: new Date().toISOString()
        };

        onUpdateCategories([...categories, categoryToAdd]);
        setNewCategory({ id: '', name: '', color: 'blue' });
        setShowAddForm(false);
    };

    // עריכת קטגוריה
    const handleEditCategory = (category) => {
        setEditingCategory({ ...category });
    };

    // שמירת עריכה
    const handleSaveEdit = () => {
        if (!editingCategory.name.trim()) {
            alert('יש למלא את שם הקטגוריה');
            return;
        }

        const updatedCategories = categories.map(cat =>
            cat.id === editingCategory.id
                ? { ...editingCategory, updatedAt: new Date().toISOString() }
                : cat
        );
        onUpdateCategories(updatedCategories);
        setEditingCategory(null);
    };

    // מחיקת קטגוריה
    const handleDeleteCategory = (categoryId) => {
        const booksCount = getBooksInCategory(categoryId);

        if (booksCount > 0) {
            alert(`לא ניתן למחוק קטגוריה זו כיוון שיש ${booksCount} ספרים השייכים אליה. יש להעביר את הספרים לקטגוריה אחרת תחילה.`);
            return;
        }

        const category = categories.find(cat => cat.id === categoryId);
        if (confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`)) {
            const updatedCategories = categories.filter(cat => cat.id !== categoryId);
            onUpdateCategories(updatedCategories);
        }
    };

    const getColorClass = (colorId) => {
        const color = availableColors.find(c => c.id === colorId);
        return color ? color.class : 'bg-gray-500';
    };

    return (
        <div className="space-y-6">
            {/* כותרת וסטטיסטיקות */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Tag className="w-6 h-6 text-purple-600" />
                        <h2 className="text-2xl font-semibold">ניהול קטגוריות ספרים</h2>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        הוסף קטגוריה חדשה
                    </button>
                </div>

                {/* סטטיסטיקות מהירות */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">{categories.length}</div>
                        <div className="text-sm text-purple-700">סה״כ קטגוריות</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">{books.length}</div>
                        <div className="text-sm text-blue-700">סה״כ ספרים</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                            {categories.filter(cat => getBooksInCategory(cat.id) > 0).length}
                        </div>
                        <div className="text-sm text-green-700">קטגוריות פעילות</div>
                    </div>
                </div>
            </div>

            {/* טופס הוספת קטגוריה */}
            {showAddForm && (
                <div className="rounded-3xl border border-stone-200 bg-white p-6">
                    <h3 className="text-lg font-semibold mb-4">הוספת קטגוריה חדשה</h3>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    שם הקטגוריה *
                                </label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="למשל: ספרי מוסר"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    צבע הקטגוריה
                                </label>
                                <div className="grid grid-cols-6 gap-2">
                                    {availableColors.map(color => (
                                        <button
                                            key={color.id}
                                            type="button"
                                            onClick={() => setNewCategory(prev => ({ ...prev, color: color.id }))}
                                            className={`w-8 h-8 rounded-lg ${color.class} ${newCategory.color === color.id
                                                    ? 'ring-2 ring-stone-400 ring-offset-2'
                                                    : ''
                                                }`}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* תצוגה מקדימה */}
                        {newCategory.name && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-sm text-gray-600 mb-2">תצוגה מקדימה:</div>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm text-white ${getColorClass(newCategory.color)}`}>
                                    {newCategory.name}
                                </span>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                            >
                                הוסף קטגוריה
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-6 py-3 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors"
                            >
                                ביטול
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* רשימת קטגוריות */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">רשימת קטגוריות קיימות</h3>
                <div className="space-y-3">
                    {categories.map(category => {
                        const booksCount = getBooksInCategory(category.id);
                        return (
                            <div key={category.id} className="border rounded-xl p-4 transition-all border-stone-200">
                                {editingCategory && editingCategory.id === category.id ? (
                                    // מצב עריכה
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={editingCategory.name}
                                                onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                                                className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="שם הקטגוריה"
                                            />
                                            <div>
                                                <div className="text-sm text-gray-600 mb-2">בחר צבע:</div>
                                                <div className="grid grid-cols-6 gap-1">
                                                    {availableColors.map(color => (
                                                        <button
                                                            key={color.id}
                                                            type="button"
                                                            onClick={() => setEditingCategory(prev => ({ ...prev, color: color.id }))}
                                                            className={`w-6 h-6 rounded ${color.class} ${editingCategory.color === color.id
                                                                    ? 'ring-2 ring-stone-400'
                                                                    : ''
                                                                }`}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveEdit}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                            >
                                                <Save className="w-4 h-4 inline mr-1" />
                                                שמור
                                            </button>
                                            <button
                                                onClick={() => setEditingCategory(null)}
                                                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm"
                                            >
                                                <X className="w-4 h-4 inline mr-1" />
                                                ביטול
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // מצב תצוגה
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg ${getColorClass(category.color)} flex items-center justify-center`}>
                                                <FolderPlus className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {category.name}
                                                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getColorClass(category.color)}`}>
                                                        {category.name}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-stone-600">
                                                    ID: {category.id} • {booksCount} ספרים
                                                </div>
                                                {category.createdAt && (
                                                    <div className="text-xs text-stone-500">
                                                        נוצר: {new Date(category.createdAt).toLocaleDateString('he-IL')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditCategory(category)}
                                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                                title="ערוך קטגוריה"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className={`p-2 rounded-lg transition-colors ${booksCount > 0
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                                title={booksCount > 0 ? `לא ניתן למחוק - יש ${booksCount} ספרים` : 'מחק קטגוריה'}
                                                disabled={booksCount > 0}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {categories.length === 0 && (
                        <div className="text-center py-8 text-stone-500">
                            <Tag className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                            <div className="text-lg font-medium mb-2">אין קטגוריות במערכת</div>
                            <div className="text-sm">הוסף קטגוריה ראשונה כדי להתחיל</div>
                        </div>
                    )}
                </div>

                {/* אזהרות ועצות */}
                {categories.length > 0 && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-blue-800">
                                <div className="font-medium mb-1">טיפים לניהול קטגוריות:</div>
                                <ul className="text-sm space-y-1">
                                    <li>• קטגוריות עם ספרים לא ניתנות למחיקה</li>
                                    <li>• השתמש בצבעים שונים להבחנה קלה</li>
                                    <li>• שמות קטגוריות חייבים להיות יחודיים</li>
                                    <li>• שינוי שם קטגוריה ישפיע על כל הספרים השייכים אליה</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}