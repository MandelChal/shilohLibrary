import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Eye, EyeOff, Shield, User } from 'lucide-react';

// ------------------------------------------------------
// 👥 קומפוננטת ניהול משתמשים מתקדמת
// ------------------------------------------------------
export default function UserManagement({ currentUser, users, onUpdateUsers }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        name: '',
        role: 'user',
        email: '',
        phone: ''
    });

    // הוספת משתמש חדש
    const handleAddUser = (e) => {
        e.preventDefault();
        if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) {
            alert('יש למלא את כל השדות החובה');
            return;
        }

        // בדיקה שלא קיים משתמש עם אותו שם משתמש
        if (users.some(user => user.username === newUser.username.trim())) {
            alert('שם משתמש זה כבר קיים במערכת');
            return;
        }

        const userToAdd = {
            id: Date.now().toString(),
            ...newUser,
            username: newUser.username.trim(),
            createdAt: new Date().toISOString(),
            createdBy: currentUser.name,
            isActive: true
        };

        onUpdateUsers([...users, userToAdd]);
        setNewUser({ username: '', password: '', name: '', role: 'user', email: '', phone: '' });
        setShowAddForm(false);
    };

    // עריכת משתמש
    const handleEditUser = (userId) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setEditingUser({ ...user });
        }
    };

    // שמירת עריכה
    const handleSaveEdit = () => {
        if (!editingUser.username.trim() || !editingUser.name.trim()) {
            alert('יש למלא את כל השדות החובה');
            return;
        }

        // בדיקה שלא קיים משתמש אחר עם אותו שם משתמש
        if (users.some(user => user.username === editingUser.username.trim() && user.id !== editingUser.id)) {
            alert('שם משתמש זה כבר קיים במערכת');
            return;
        }

        const updatedUsers = users.map(user =>
            user.id === editingUser.id
                ? { ...editingUser, updatedAt: new Date().toISOString() }
                : user
        );
        onUpdateUsers(updatedUsers);
        setEditingUser(null);
    };

    // מחיקת משתמש
    const handleDeleteUser = (userId) => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;

        // אי אפשר למחוק את עצמך
        if (userToDelete.id === currentUser.id) {
            alert('לא ניתן למחוק את המשתמש הנוכחי');
            return;
        }

        if (confirm(`האם אתה בטוח שברצונך למחוק את המשתמש "${userToDelete.name}"?`)) {
            const updatedUsers = users.filter(user => user.id !== userId);
            onUpdateUsers(updatedUsers);
        }
    };

    // החלפת סטטוס פעיל/לא פעיל
    const toggleUserStatus = (userId) => {
        const updatedUsers = users.map(user =>
            user.id === userId
                ? { ...user, isActive: !user.isActive, updatedAt: new Date().toISOString() }
                : user
        );
        onUpdateUsers(updatedUsers);
    };

    return (
        <div className="space-y-6">
            {/* כותרת וסטטיסטיקות */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold">ניהול משתמשים</h2>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        הוסף משתמש חדש
                    </button>
                </div>

                {/* סטטיסטיקות מהירות */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">{users.length}</div>
                        <div className="text-sm text-blue-700">סה״כ משתמשים</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                            {users.filter(u => u.isActive !== false).length}
                        </div>
                        <div className="text-sm text-green-700">משתמשים פעילים</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">
                            {users.filter(u => u.role === 'admin').length}
                        </div>
                        <div className="text-sm text-purple-700">מנהלים</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="text-2xl font-bold text-orange-900">
                            {users.filter(u => u.role === 'user').length}
                        </div>
                        <div className="text-sm text-orange-700">משתמשים רגילים</div>
                    </div>
                </div>
            </div>

            {/* טופס הוספת משתמש */}
            {showAddForm && (
                <div className="rounded-3xl border border-stone-200 bg-white p-6">
                    <h3 className="text-lg font-semibold mb-4">הוספת משתמש חדש</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    שם משתמש *
                                </label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="שם משתמש יחודי (באנגלית)"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    סיסמה *
                                </label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="סיסמה חזקה"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    שם מלא *
                                </label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="שם מלא של המשתמש"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    תפקיד *
                                </label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="user">משתמש רגיל</option>
                                    <option value="admin">מנהל</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    אימייל
                                </label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="כתובת אימייל"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    טלפון
                                </label>
                                <input
                                    type="tel"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="מספר טלפון"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleAddUser}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                הוסף משתמש
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-6 py-3 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* רשימת משתמשים */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">רשימת משתמשים</h3>
                <div className="space-y-3">
                    {users.map(user => (
                        <div key={user.id} className={`border rounded-xl p-4 transition-all ${user.isActive === false ? 'bg-gray-50 border-gray-300' : 'border-stone-200'
                            }`}>
                            {editingUser && editingUser.id === user.id ? (
                                // מצב עריכה
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            value={editingUser.username}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, username: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="שם משתמש"
                                        />
                                        <input
                                            type="text"
                                            value={editingUser.name}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="שם מלא"
                                        />
                                        <select
                                            value={editingUser.role}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="user">משתמש רגיל</option>
                                            <option value="admin">מנהל</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="email"
                                            value={editingUser.email || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="אימייל"
                                        />
                                        <input
                                            type="tel"
                                            value={editingUser.phone || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="טלפון"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                        >
                                            שמור
                                        </button>
                                        <button
                                            onClick={() => setEditingUser(null)}
                                            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm"
                                        >
                                            ביטול
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // מצב תצוגה
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                                            }`}>
                                            {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {user.name}
                                                {user.id === currentUser.id && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                        אתה
                                                    </span>
                                                )}
                                                {user.isActive === false && (
                                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                                        לא פעיל
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-stone-600">
                                                @{user.username} • {user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}
                                            </div>
                                            {(user.email || user.phone) && (
                                                <div className="text-xs text-stone-500">
                                                    {user.email && <span>{user.email}</span>}
                                                    {user.email && user.phone && <span> • </span>}
                                                    {user.phone && <span>{user.phone}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleUserStatus(user.id)}
                                            className={`p-2 rounded-lg text-sm transition-colors ${user.isActive === false
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            title={user.isActive === false ? 'הפעל משתמש' : 'השבת משתמש'}
                                        >
                                            {user.isActive === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleEditUser(user.id)}
                                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                            title="עריכה"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {user.id !== currentUser.id && (
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                title="מחיקה"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {users.length === 0 && (
                        <div className="text-center py-8 text-stone-500">
                            אין משתמשים במערכת
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}