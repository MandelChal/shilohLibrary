// src/components/BookEditor.jsx
import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, X } from 'lucide-react';
import { getCategories } from '../utils/dbHelpers';

export default function BookEditor({ book, onSave, onCancel, isNew = false }) {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(book || {
        title: '',
        author: '',
        location: { color: '', letter: '', number: '' },
        description: '',
        image: '/api/placeholder/200/250',
        rating: 4.0,
        status: 'available',
        category: ''
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // טעינת קטגוריות מה-DB
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch (err) {
                console.error('שגיאה בטעינת קטגוריות', err);
            }
        };
        loadCategories();
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title?.trim()) newErrors.title = 'שם הספר נדרש';
        if (!formData.author?.trim()) newErrors.author = 'שם המחבר נדרש';
        if (!formData.location?.color?.trim()) newErrors.locationColor = 'צבע נדרש';
        if (!formData.location?.letter?.trim()) newErrors.locationLetter = 'אות נדרשת';
        if (!formData.location?.number?.trim()) newErrors.locationNumber = 'מספר נדרש';
        if (!formData.category) newErrors.category = 'קטגוריה נדרשת';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            await onSave(formData);
            console.log('ספר נשמר בהצלחה');
            onCancel(); // סגירת חלון העורך
        } catch (error) {
            console.error('שגיאה בשמירת ספר:', error);
            alert('שגיאה בשמירת הספר: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const updateLocation = (field, value) => {
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [field]: value
            }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-right">
                            {isNew ? 'הוספת ספר חדש' : 'עריכת ספר'}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-full"
                            disabled={saving}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* שם הספר + מחבר */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-right">שם הספר</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className={`w-full p-2 border rounded text-right ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="הכנס שם הספר"
                                    disabled={saving}
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-right">שם המחבר</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                                    className={`w-full p-2 border rounded text-right ${errors.author ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="הכנס שם המחבר"
                                    disabled={saving}
                                />
                                {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author}</p>}
                            </div>
                        </div>

                        {/* סטטוס */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">סטטוס</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded text-right"
                                disabled={saving}
                            >
                                <option value="available">זמין</option>
                                <option value="processing">בעיבוד</option>
                                <option value="borrowed">מושאל</option>
                                <option value="maintenance">תחזוקה</option>
                            </select>
                        </div>

                        {/* קטגוריה */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">קטגוריה</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className={`w-full p-2 border rounded text-right ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                                disabled={saving}
                            >
                                <option value="">בחר קטגוריה</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                        </div>

                        {/* מיקום בספרייה */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">מיקום בספרייה</label>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <input
                                        type="text"
                                        value={formData.location?.color || ''}
                                        onChange={(e) => updateLocation('color', e.target.value)}
                                        className={`w-full p-2 border rounded text-right ${errors.locationColor ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="צבע"
                                        disabled={saving}
                                    />
                                    {errors.locationColor && <p className="text-red-500 text-xs mt-1">{errors.locationColor}</p>}
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={formData.location?.letter || ''}
                                        onChange={(e) => updateLocation('letter', e.target.value)}
                                        className={`w-full p-2 border rounded text-right ${errors.locationLetter ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="אות"
                                        disabled={saving}
                                    />
                                    {errors.locationLetter && <p className="text-red-500 text-xs mt-1">{errors.locationLetter}</p>}
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={formData.location?.number || ''}
                                        onChange={(e) => updateLocation('number', e.target.value)}
                                        className={`w-full p-2 border rounded text-right ${errors.locationNumber ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="מספר"
                                        disabled={saving}
                                    />
                                    {errors.locationNumber && <p className="text-red-500 text-xs mt-1">{errors.locationNumber}</p>}
                                </div>
                            </div>
                        </div>

                        {/* דירוג */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">דירוג</label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                value={formData.rating}
                                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                                className="w-full p-2 border border-gray-300 rounded text-right"
                                disabled={saving}
                            />
                        </div>

                        {/* תיאור */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">תיאור</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded text-right"
                                rows="4"
                                placeholder="תיאור הספר"
                                disabled={saving}
                            />
                        </div>

                        {/* כפתורים */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                disabled={saving}
                            >
                                ביטול
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={saving || Object.keys(errors).length > 0}
                            >
                                <Save size={16} />
                                {saving ? (isNew ? 'מוסיף...' : 'שומר...') : 'שמור'}
                            </button>
                        </div>

                        {/* שגיאות */}
                        {Object.keys(errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-red-800">
                                    <div className="font-medium text-sm">יש לתקן את השגיאות הבאות:</div>
                                    <ul className="text-xs mt-1 space-y-0.5">
                                        {Object.entries(errors).map(([field, error]) => (
                                            <li key={field}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}