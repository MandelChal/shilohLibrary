import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Database, Cloud, RefreshCw } from 'lucide-react';
import { db, isFirebaseEnabled } from '../utils/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

// קומפוננט לבדיקת מצב Firebase
export default function FirebaseStatus() {
    const [status, setStatus] = useState({
        initialized: false,
        canRead: false,
        canWrite: false,
        error: null,
        testing: false
    });

    const testFirebaseConnection = async () => {
        setStatus(prev => ({ ...prev, testing: true, error: null }));

        try {
            console.log('בודק חיבור Firebase...');

            // בדיקה 1: האם Firebase מאותחל
            if (!isFirebaseEnabled || !db) {
                throw new Error('Firebase לא מאותחל או לא זמין');
            }

            console.log('✅ Firebase מאותחל');

            // בדיקה 2: נסיון קריאה
            console.log('בודק הרשאות קריאה...');
            const testCollection = collection(db, 'test');
            await getDocs(testCollection);

            console.log('✅ הרשאות קריאה עובדות');

            // בדיקה 3: נסיון כתיבה
            console.log('בודק הרשאות כתיבה...');
            const testDoc = await addDoc(collection(db, 'test'), {
                message: 'Firebase connection test',
                timestamp: new Date().toISOString()
            });

            console.log('✅ הרשאות כתיבה עובדות');

            // ניקוי - מחיקת המסמך שיצרנו
            await deleteDoc(doc(db, 'test', testDoc.id));
            console.log('✅ ניקוי הושלם');

            setStatus({
                initialized: true,
                canRead: true,
                canWrite: true,
                error: null,
                testing: false
            });

        } catch (error) {
            console.error('❌ שגיאה בבדיקת Firebase:', error);
            setStatus({
                initialized: isFirebaseEnabled,
                canRead: false,
                canWrite: false,
                error: error.message,
                testing: false
            });
        }
    };

    // בדיקה אוטומטית בטעינה
    useEffect(() => {
        testFirebaseConnection();
    }, []);

    const getStatusIcon = () => {
        if (status.testing) {
            return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
        }
        if (status.error) {
            return <XCircle className="w-5 h-5 text-red-500" />;
        }
        if (status.canWrite && status.canRead) {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    };

    const getStatusText = () => {
        if (status.testing) return 'בודק חיבור...';
        if (status.error) return 'שגיאה בחיבור';
        if (status.canWrite && status.canRead) return 'Firebase פעיל ותקין';
        if (status.canRead) return 'קריאה בלבד - בעיה בכתיבה';
        if (status.initialized) return 'מאותחל אך לא פעיל';
        return 'Firebase לא זמין';
    };

    const getStatusColor = () => {
        if (status.testing) return 'border-blue-200 bg-blue-50';
        if (status.error) return 'border-red-200 bg-red-50';
        if (status.canWrite && status.canRead) return 'border-green-200 bg-green-50';
        return 'border-yellow-200 bg-yellow-50';
    };

    return (
        <div className={`border rounded-xl p-4 ${getStatusColor()}`}>
            <div className="flex items-center gap-3 mb-3">
                {getStatusIcon()}
                <div>
                    <h3 className="font-medium">מצב Firebase</h3>
                    <p className="text-sm text-gray-600">{getStatusText()}</p>
                </div>
                <button
                    onClick={testFirebaseConnection}
                    disabled={status.testing}
                    className="mr-auto px-3 py-2 text-xs bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    {status.testing ? 'בודק...' : 'בדוק שוב'}
                </button>
            </div>

            {/* פרטים טכניים */}
            <div className="text-xs space-y-1">
                <div className="flex justify-between">
                    <span>מאותחל:</span>
                    <span className={status.initialized ? 'text-green-600' : 'text-red-600'}>
                        {status.initialized ? '✅' : '❌'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>הרשאות קריאה:</span>
                    <span className={status.canRead ? 'text-green-600' : 'text-red-600'}>
                        {status.canRead ? '✅' : '❌'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>הרשאות כתיבה:</span>
                    <span className={status.canWrite ? 'text-green-600' : 'text-red-600'}>
                        {status.canWrite ? '✅' : '❌'}
                    </span>
                </div>
                {status.error && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-xs">
                        <strong>שגיאה:</strong> {status.error}
                    </div>
                )}
            </div>

            {/* הודרכה למצב מקומי */}
            {!status.canWrite && (
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <div className="flex items-start gap-2">
                        <Database className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-800">
                            <strong>מצב מקומי פעיל:</strong><br />
                            הנתונים נשמרים ב-localStorage של הדפדפן בלבד.
                            כדי לעבוד עם Firebase, נדרש תיקון ההגדרות.
                        </div>
                    </div>
                </div>
            )}

            {/* מידע על Project ID */}
            <div className="mt-3 text-xs text-gray-500">
                <strong>Project ID:</strong> {db?.app?.options?.projectId || 'לא זמין'}
            </div>
        </div>
    );
}