// src/utils/imageUtils.js - פונקציות טיפול בתמונות
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseEnabled } from './firebase';
/**
 * העלאת תמונה ל-Firebase Storage
 * @param {File} file - קובץ התמונה
 * @param {string} bookId - מזהה הספר
 * @param {string} imageId - מזהה התמונה (אופציונלי)
 * @returns {Promise<string>} URL של התמונה
 */
export const uploadBookImage = async (file, bookId, imageId = null) => {
    if (!isFirebaseEnabled || !storage) {
        console.warn('Firebase Storage לא זמין - משתמש ב-URL מקומי');
        return URL.createObjectURL(file);
    }

    try {
        // יצירת שם ייחודי לתמונה
        const timestamp = Date.now();
        const fileName = imageId || `${timestamp}_${file.name}`;

        // יצירת reference ל-Storage
        const imageRef = ref(storage, `books/${bookId}/${fileName}`);

        // העלאת הקובץ
        const snapshot = await uploadBytes(imageRef, file);

        // קבלת URL להורדה
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log('✅ תמונה הועלתה בהצלחה:', downloadURL);
        return downloadURL;

    } catch (error) {
        console.error('❌ שגיאה בהעלאת תמונה:', error);
        throw new Error('שגיאה בהעלאת התמונה: ' + error.message);
    }
};

/**
 * העלאת מספר תמונות
 * @param {FileList|Array} files - רשימת קבצי תמונות
 * @param {string} bookId - מזהה הספר
 * @param {Function} onProgress - פונקציה לעדכון התקדמות (אופציונלי)
 * @returns {Promise<Array>} מערך URLs של התמונות
 */
export const uploadMultipleImages = async (files, bookId, onProgress = null) => {
    const filesArray = Array.from(files);
    const imageUrls = [];

    for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];

        try {
            // עדכון התקדמות
            if (onProgress) {
                onProgress(i + 1, filesArray.length, `מעלה תמונה ${i + 1}...`);
            }

            const url = await uploadBookImage(file, bookId);
            imageUrls.push({
                url,
                name: file.name,
                size: file.size,
                uploadedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error(`שגיאה בהעלאת תמונה ${file.name}:`, error);
            // המשך לתמונה הבאה גם במקרה של שגיאה
        }
    }

    return imageUrls;
};

/**
 * מחיקת תמונה מ-Firebase Storage
 * @param {string} imageUrl - URL של התמונה למחיקה
 * @param {string} bookId - מזהה הספר
 */
export const deleteBookImage = async (imageUrl, bookId) => {
    if (!isFirebaseEnabled || !storage) {
        console.warn('Firebase Storage לא זמין');
        return;
    }

    try {
        // חילוץ שם הקובץ מה-URL
        const fileName = imageUrl.split('/').pop().split('?')[0];
        const imageRef = ref(storage, `books/${bookId}/${fileName}`);

        await deleteObject(imageRef);
        console.log('✅ תמונה נמחקה בהצלחה');

    } catch (error) {
        console.error('❌ שגיאה במחיקת תמונה:', error);
        // לא זורקים שגיאה כי זה לא קריטי
    }
};

/**
 * בדיקת תקינות קובץ תמונה
 * @param {File} file - קובץ התמונה
 * @returns {Object} תוצאת הבדיקה
 */
export const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'סוג קובץ לא נתמך. יש להעלות קבצי JPG, PNG או WEBP בלבד'
        };
    }

    if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'גודל הקובץ גדול מדי. מקסימום 5MB'
        };
    }

    return { isValid: true };
};

/**
 * יצירת תמונה ממוזערת (אופציונלי - לביצועים)
 * @param {File} file - קובץ התמונה
 * @param {number} maxWidth - רוחב מקסימלי
 * @param {number} maxHeight - גובה מקסימלי
 * @returns {Promise<Blob>} תמונה ממוזערת
 */
export const createThumbnail = (file, maxWidth = 300, maxHeight = 300) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // חישוב יחס גודל
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;

            canvas.width = width;
            canvas.height = height;

            // ציור התמונה הממוזערת
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(resolve, 'image/jpeg', 0.8);
        };

        img.src = URL.createObjectURL(file);
    });
};