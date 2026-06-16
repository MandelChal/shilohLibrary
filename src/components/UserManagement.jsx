import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, Eye, EyeOff, Shield, User, X } from 'lucide-react';
import {
    getUsers,
    addUser as addUserToFirebase,
    updateUser as updateUserInFirebase,
    deleteUser as deleteUserFromFirebase,
    checkUserExists
} from '../utils/dbHelpers';

// ------------------------------------------------------
// 👥 קומפוננטת ניהול משתמשים מתקדמת עם Firebase
// ------------------------------------------------------
export default function UserManagement({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        name: '',
        role: 'user',
        email: '',
        phone: ''
    });

    // טעינת משתמשים מ-Firebase
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersData = await getUsers();
            setUsers(usersData);
            console.log('משתמשים נטענו:', usersData.length);
        } catch (error) {
            console.error('שגיאה בטעינת משתמשים:', error);
            alert('שגיאה בטעינת המשתמשים: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // הוספת משתמש חדש
    const handleAddUser = async (e) => {
        e.preventDefault();

        if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) {
            alert('יש למלא את כל השדות החובה');
            return;
        }

        // בדיקת תקינות אימייל 
        if (newUser.email.trim()) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(newUser.email.trim())) {
                alert('כתובת האימייל שהוקלדה אינה תקינה. נא להזין כתובת מייל אמיתית (לדוגמה: name@domain.com)');
                return; // עוצר את השליחה
            }
        }

        setLoading(true);
        try {
            // בדיקה שלא קיים משתמש עם אותו שם משתמש
            const userExists = await checkUserExists(newUser.username.trim());
            if (userExists) {
                alert('שם משתמש זה כבר קיים במערכת');
                setLoading(false);
                return;
            }

            const userToAdd = {
                ...newUser,
                username: newUser.username.trim(),
                name: newUser.name.trim(),
                email: newUser.email.trim(),
                phone: newUser.phone.trim(),
                createdBy: currentUser.name,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            const savedUser = await addUserToFirebase(userToAdd);
            setUsers(prev => [...prev, savedUser]);

            // איפוס הטופס
            setNewUser({ username: '', password: '', name: '', role: 'user', email: '', phone: '' });
            setShowAddForm(false);

            console.log('משתמש נוסף בהצלחה:', savedUser.name);

        } catch (error) {
            console.error('שגיאה בהוספת משתמש:', error);
            alert('שגיאה בהוספת המשתמש: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // פונקציה ייעודית לסגירת המודאל ואיפוס כל השדות למצבם המקורי
    const handleCloseAddForm = () => {
        setShowAddForm(false);
        // איפוס שדות הטקסט
        setNewUser({
            username: '',
            password: '',
            name: '',
            role: 'user',
            email: '',
            phone: ''
        });
        // איפוס מצב הראות של הסיסמה (אם השתמשת בסטייט showPassword)
        if (typeof setShowPassword === 'function') {
            setShowPassword(false);
        }
    };
    // עריכת משתמש
    const handleEditUser = (user) => {
        setEditingUser({ ...user });
    };

    // שמירת עריכה
    const handleSaveEdit = async () => {
        if (!editingUser.username.trim() || !editingUser.name.trim()) {
            alert('יש למלא את כל השדות החובה');
            return;
        }

        setLoading(true);
        try {
            // בדיקה שלא קיים משתמש אחר עם אותו שם משתמש
            const userExists = await checkUserExists(editingUser.username.trim());
            const currentUserWithSameName = users.find(u => u.username === editingUser.username.trim());

            if (userExists && currentUserWithSameName && currentUserWithSameName.id !== editingUser.id) {
                alert('שם משתמש זה כבר קיים במערכת');
                setLoading(false);
                return;
            }

            const updatedUserData = {
                username: editingUser.username.trim(),
                name: editingUser.name.trim(),
                role: editingUser.role,
                email: editingUser.email.trim(),
                phone: editingUser.phone.trim(),
                isActive: editingUser.isActive,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.name
            };

            // אם הסיסמה השתנתה, נוסיף אותה לעדכון
            if (editingUser.password && editingUser.password.trim()) {
                updatedUserData.password = editingUser.password.trim();
            }

            await updateUserInFirebase(editingUser.id, updatedUserData);

            setUsers(prev => prev.map(user =>
                user.id === editingUser.id
                    ? { ...user, ...updatedUserData }
                    : user
            ));

            setEditingUser(null);
            console.log('משתמש עודכן בהצלחה:', updatedUserData.name);

        } catch (error) {
            console.error('שגיאה בעדכון משתמש:', error);
            alert('שגיאה בעדכון המשתמש: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // מחיקת משתמש
    const handleDeleteUser = async (userId) => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;

        // אי אפשר למחוק את עצמך
        if (userToDelete.id === currentUser.id) {
            alert('לא ניתן למחוק את המשתמש הנוכחי');
            return;
        }

        if (confirm(`האם אתה בטוח שברצונך למחוק את המשתמש "${userToDelete.name}"?\nפעולה זו אינה הפיכה!`)) {
            setLoading(true);
            try {
                await deleteUserFromFirebase(userId);
                setUsers(prev => prev.filter(user => user.id !== userId));
                console.log('משתמש נמחק בהצלחה:', userToDelete.name);
            } catch (error) {
                console.error('שגיאה במחיקת משתמש:', error);
                alert('שגיאה במחיקת המשתמש: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    // החלפת סטטוס פעיל/לא פעיל
    const toggleUserStatus = async (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        setLoading(true);
        try {
            const newStatus = !user.isActive;
            await updateUserInFirebase(userId, {
                isActive: newStatus,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.name
            });

            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, isActive: newStatus } : u
            ));

            console.log(`סטטוס משתמש ${user.name} שונה ל-${newStatus ? 'פעיל' : 'לא פעיל'}`);

        } catch (error) {
            console.error('שגיאה בעדכון סטטוס משתמש:', error);
            alert('שגיאה בעדכון הסטטוס: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* כותרת וסטטיסטיקות */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold">ניהול משתמשים</h2>
                        {loading && <div className="text-sm text-blue-600">טוען...</div>}
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
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

            {/*  חלונית מודאל להוספת משתמש */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* רקע כהה שסוגר את החלונית בלחיצה עליו */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                        onClick={handleCloseAddForm}
                    ></div>

                    {/* החלונית עצמה */}
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* כותרת החלונית */}
                        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                            <h3 className="text-xl font-bold text-stone-800">הוספת משתמש חדש</h3>
                            <button 
                                onClick={handleCloseAddForm}
                                className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-stone-500" />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        שם משתמש * (באנגלית)
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.username}
                                        // הגבלה לאנגלית בלבד 
                                        onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value.replace(/[^a-zA-Z]/g, '') }))}
                                        className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50/50"
                                        placeholder="username"
                                        required
                                        dir="ltr"
                                    />
                                </div>
                                {/* סיסמה עם כפתור עין */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        סיסמה *
                                    </label>
                                    <div className="relative">
                                        <input
                                            // הטיפוס משתנה דינמית בין password ל-text בהתאם לסטייט
                                            type={showPassword ? 'text' : 'password'}
                                            value={newUser.password}
                                            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full rounded-xl border border-stone-300 pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50/50 text-right"
                                            placeholder="סיסמה חזקה"
                                            required
                                        />
                                        {/* כפתור העין שממוקם בצד שמאל של תיבת הקלט */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        שם מלא *
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value.replace(/[^א-ת\s]/g, '') }))}
                                        className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50/50"
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
                                        className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50/50"
                                    >
                                        <option value="user">משתמש רגיל</option>
                                        <option value="admin">מנהל מערכת</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        טלפון
                                    </label>
                                    <input
                                        type="tel"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value.replace(/[^\d]/g, '') }))}
                                        maxLength={10}
                                        className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50/50"
                                        placeholder="05X-XXXXXXX"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        אימייל
                                    </label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50/50"
                                        placeholder="email@example.com"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'יוצר משתמש...' : 'צור משתמש חדש'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseAddForm}
                                    className="px-6 py-3 border border-stone-300 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors"
                                >
                                    ביטול
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* רשימת משתמשים */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">רשימת משתמשים קיימים</h3>
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
                                            disabled={loading}
                                        />
                                        <input
                                            type="text"
                                            value={editingUser.name}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="שם מלא"
                                            disabled={loading}
                                        />
                                        <select
                                            value={editingUser.role}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={loading}
                                        >
                                            <option value="user">משתמש רגיל</option>
                                            <option value="admin">מנהל</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            type="email"
                                            value={editingUser.email || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="אימייל"
                                            disabled={loading}
                                        />
                                        <input
                                            type="tel"
                                            value={editingUser.phone || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="טלפון"
                                            disabled={loading}
                                        />
                                        <input
                                            type="password"
                                            value={editingUser.password || ''}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, password: e.target.value }))}
                                            className="rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="סיסמה חדשה (אופציונלי)"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={loading}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                                        >
                                            {loading ? 'שומר...' : 'שמור'}
                                        </button>
                                        <button
                                            onClick={() => setEditingUser(null)}
                                            disabled={loading}
                                            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm disabled:opacity-50"
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
                                            {user.createdAt && (
                                                <div className="text-xs text-stone-400 mt-1">
                                                    נוצר: {new Date(user.createdAt).toLocaleDateString('he-IL')}
                                                    {user.createdBy && ` על ידי ${user.createdBy}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleUserStatus(user.id)}
                                            disabled={loading}
                                            className={`p-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${user.isActive === false
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            title={user.isActive === false ? 'הפעל משתמש' : 'השבת משתמש'}
                                        >
                                            {user.isActive === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            disabled={loading}
                                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                                            title="עריכה"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {user.id !== currentUser.id && (
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={loading}
                                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
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
                    {users.length === 0 && !loading && (
                        <div className="text-center py-8 text-stone-500">
                            אין משתמשים במערכת. הוסף משתמש ראשון כדי להתחיל.
                        </div>
                    )}
                    {loading && users.length === 0 && (
                        <div className="text-center py-8 text-blue-500">
                            טוען משתמשים מ-Firebase...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}