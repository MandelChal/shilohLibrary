// src/components/BookEditor.jsx - עם תמיכה בתמונות מרובות
import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, X, Upload } from 'lucide-react';
import { getCategories } from '../utils/dbHelpers';
import { uploadMultipleImages, deleteBookImage } from '../utils/imageUtils';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';

export default function BookEditor({ book, onSave, onCancel, isNew = false }) {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(book || {
        title: '',
        author: '',
        location: { color: '', letter: '', number: '' },
        description: '',
        images: [], // שינוי מ-image לimages - מערך של תמונות
        rating: 4.0,
        status: 'available',
        category: ''
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);

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

    // המרת תמונה יחידה למערך (תאימות לאחור)
    useEffect(() => {
        if (book && book.image && !book.images) {
            setFormData(prev => ({
                ...prev,
                images: [book.image]
            }));
        }
    }, [book]);

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

    const handleImagesSelected = (files) => {
        setSelectedFiles(files);
    };

    const uploadImages = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        try {
            // יצירת ID זמני לספר חדש
            const bookId = formData.id || `temp_${Date.now()}`;

            const uploadedImages = await uploadMultipleImages(
                selectedFiles,
                bookId,
                (current, total, message) => {
                    setUploadProgress({ current, total, message });
                }
            );

            // הוספת התמונות החדשות לרשימה הקיימת
            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), ...uploadedImages.map(img => img.url)]
            }));

            // ניקוי הקבצים שנבחרו
            setSelectedFiles([]);
            setUploadProgress(null);

        } catch (error) {
            console.error('שגיאה בהעלאת תמונות:', error);
            alert('שגיאה בהעלאת התמונות: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleImageDelete = (index) => {
        const imageToDelete = formData.images[index];

        // מחיקה מהמערך
        const updatedImages = formData.images.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, images: updatedImages }));

        // מחיקה מ-Firebase Storage (אם זה לא URL מקומי)
        if (imageToDelete && !imageToDelete.startsWith('blob:')) {
            deleteBookImage(imageToDelete, formData.id || 'temp');
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            // העלאת תמונות שנבחרו אם יש כאלה
            if (selectedFiles.length > 0) {
                await uploadImages();
            }

            // הכנת נתוני הספר לשמירה
            const bookData = {
                ...formData,
                // שמירת תמונה ראשונה כ-image לתאימות לאחור
                image: formData.images && formData.images.length > 0 ? formData.images[0] : '/api/placeholder/200/250'
            };

            await onSave(bookData);
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
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-right">
                            {isNew ? 'הוספת ספר חדש' : 'עריכת ספר'}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-full"
                            disabled={saving || uploading}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
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
                                    disabled={saving || uploading}
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
                                    disabled={saving || uploading}
                                />
                                {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author}</p>}
                            </div>
                        </div>

                        {/* סטטוס + קטגוריה */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-right">סטטוס</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded text-right"
                                    disabled={saving || uploading}
                                >
                                    <option value="available">זמין</option>
                                    <option value="processing">בעיבוד</option>
                                    <option value="borrowed">מושאל</option>
                                    <option value="maintenance">תחזוקה</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-right">קטגוריה</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className={`w-full p-2 border rounded text-right ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                                    disabled={saving || uploading}
                                >
                                    <option value="">בחר קטגוריה</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                            </div>
                        </div>

                        {/* מיקום הספר */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">מיקום הספר</label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <input
                                        type="text"
                                        value={formData.location?.color || ''}
                                        onChange={(e) => updateLocation('color', e.target.value)}
                                        className={`w-full p-2 border rounded text-right ${errors.locationColor ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="צבע"
                                        disabled={saving || uploading}
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
                                        disabled={saving || uploading}
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
                                        disabled={saving || uploading}
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
                                disabled={saving || uploading}
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
                                disabled={saving || uploading}
                            />
                        </div>

                        {/* העלאת תמונות */}
                        <div>
                            <label className="block text-sm font-medium mb-4 text-right">תמונות הספר</label>

                            {/* תמונות קיימות */}
                            {formData.images && formData.images.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">תמונות קיימות:</h4>
                                    <ImageGallery
                                        images={formData.images}
                                        canEdit={true}
                                        onImageDelete={handleImageDelete}
                                        className="mb-4"
                                    />
                                </div>
                            )}

                            {/* העלאת תמונות חדשות */}
                            <ImageUpload
                                onImagesSelected={handleImagesSelected}
                                maxFiles={5}
                                disabled={uploading || saving}
                                className="mb-4"
                            />

                            {/* כפתור העלאה */}
                            {selectedFiles.length > 0 && (
                                <button
                                    onClick={uploadImages}
                                    disabled={uploading || saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload size={16} />
                                    {uploading ? 'מעלה תמונות...' : `העלה ${selectedFiles.length} תמונות`}
                                </button>
                            )}

                            {/* התקדמות העלאה */}
                            {uploadProgress && (
                                <div className="mt-2 p-2 bg-blue-50 rounded border">
                                    <div className="text-sm text-blue-700">
                                        {uploadProgress.message} ({uploadProgress.current}/{uploadProgress.total})
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* כפתורים */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                disabled={saving || uploading}
                            >
                                ביטול
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={saving || uploading || Object.keys(errors).length > 0}
                            >
                                <Save size={16} />
                                {saving ? (isNew ? 'מוסיף ספר...' : 'שומר שינויים...') :
                                    uploading ? 'מעלה תמונות...' :
                                        (isNew ? 'הוסף ספר' : 'שמור שינויים')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}