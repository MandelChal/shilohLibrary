// components/ReturnRequestsManagement.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, User, CheckCircle, X, RefreshCw, ArrowLeft, MapPin } from 'lucide-react';
import {
    getLoanRequests,
    updateLoanRequestStatus,
    updateBook,
    getBooks,
    sendLoanRequestNotification
} from '../utils/dbHelpers';

export default function ReturnRequestsManagement({ currentUser }) {
    const [returnRequests, setReturnRequests] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState(null);

    useEffect(() => {
        loadReturnRequests();
        loadBooks();
    }, []);

    const loadReturnRequests = async () => {
        setLoading(true);
        try {
            const allRequests = await getLoanRequests();
            // סינון בקשות החזרה בלבד
            const pendingReturns = allRequests.filter(req => req.status === 'pending_return');
            setReturnRequests(pendingReturns);
            console.log('נטענו בקשות החזרה:', pendingReturns.length);
        } catch (error) {
            console.error('שגיאה בטעינת בקשות החזרה:', error);
            alert('שגיאה בטעינת בקשות החזרה');
        } finally {
            setLoading(false);
        }
    };

    const loadBooks = async () => {
        try {
            const booksData = await getBooks();
            setBooks(booksData);
        } catch (error) {
            console.error('שגיאה בטעינת ספרים:', error);
        }
    };

    const getBookDetails = (bookId) => {
        return books.find(book => book.id === bookId);
    };

    const handleApproveReturn = async (requestId, bookId, bookTitle, requesterName, requesterId) => {
        if (!confirm(`האם אתה בטוח שברצונך לאשר את החזרת הספר "${bookTitle}"?`)) {
            return;
        }

        setProcessingRequestId(requestId);
        try {
            // עדכון סטטוס הבקשה ל-returned
            await updateLoanRequestStatus(requestId, 'returned', 'החזרה אושרה על ידי האדמין');

            // עדכון סטטוס הספר לזמין
            await updateBook(bookId, {
                status: 'available',
                borrowedBy: null,
                borrowDate: null,
                returnDate: new Date().toISOString(),
                returnApprovedBy: currentUser.name
            });

            // עדכון הרשימה המקומית
            setReturnRequests(prev => prev.filter(req => req.id !== requestId));

            // שליחת הודעה למשתמש
            const request = returnRequests.find(r => r.id === requestId);
            if (request) {
                await sendLoanRequestNotification(
                    requesterId,
                    request,
                    'returned',
                    'החזרת הספר אושרה בהצלחה. תודה על השימוש בשירותי הספרייה!'
                );
            }

            alert('החזרת הספר אושרה בהצלחה!');

        } catch (error) {
            console.error('שגיאה באישור החזרה:', error);
            alert('שגיאה באישור החזרה: ' + error.message);
        } finally {
            setProcessingRequestId(null);
        }
    };

    const calculateBorrowDuration = (borrowDate) => {
        if (!borrowDate) return 'לא ידוע';

        const borrowed = new Date(borrowDate);
        const now = new Date();
        const diffTime = now - borrowed;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'הושאל היום';
        if (diffDays === 1) return 'הושאל אתמול';
        return `הושאל לפני ${diffDays} ימים`;
    };

    return (
        <div className="space-y-6">
            {/* כותרת וסטטיסטיקות */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <ArrowLeft className="w-6 h-6 text-purple-600" />
                        <h2 className="text-2xl font-semibold">ניהול בקשות החזרה</h2>
                        {loading && <div className="text-sm text-purple-600">טוען...</div>}
                    </div>
                    <button
                        onClick={loadReturnRequests}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        רענן
                    </button>
                </div>

                {/* סטטיסטיקות */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">{returnRequests.length}</div>
                        <div className="text-sm text-purple-700">בקשות החזרה ממתינות</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                            {returnRequests.filter(req => {
                                const reqDate = new Date(req.updatedAt || req.createdAt);
                                const today = new Date();
                                return reqDate.toDateString() === today.toDateString();
                            }).length}
                        </div>
                        <div className="text-sm text-green-700">בקשות היום</div>
                    </div>
                </div>
            </div>

            {/* רשימת בקשות החזרה */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">בקשות החזרה ממתינות לאישור</h3>

                {returnRequests.length === 0 ? (
                    <div className="text-center py-12">
                        <ArrowLeft className="mx-auto text-gray-400 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">אין בקשות החזרה ממתינות</h3>
                        <p className="text-gray-500">כל הבקשות טופלו או שאין בקשות חדשות</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {returnRequests.map(request => {
                            const bookDetails = getBookDetails(request.bookId);
                            const isProcessing = processingRequestId === request.id;

                            return (
                                <div
                                    key={request.id}
                                    className="border rounded-xl p-4 bg-purple-50 border-purple-200 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold text-lg">{request.bookTitle}</h4>
                                                <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 border border-purple-300">
                                                    ממתין לאישור החזרה
                                                </span>
                                            </div>

                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    <span><strong>מחזיר:</strong> {request.requesterName}</span>
                                                </div>

                                                {bookDetails && (
                                                    <>
                                                        <div><strong>מחבר:</strong> {bookDetails.author}</div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" />
                                                            <span><strong>מיקום:</strong> {bookDetails.location.color} {bookDetails.location.letter}{bookDetails.location.number}</span>
                                                        </div>
                                                    </>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span><strong>תאריך בקשת החזרה:</strong> {new Date(request.updatedAt || request.createdAt).toLocaleDateString('he-IL')}</span>
                                                </div>

                                                <div>
                                                    <strong>משך השאלה:</strong> {calculateBorrowDuration(request.createdAt)}
                                                </div>

                                                {request.contactPhone && (
                                                    <div><strong>טלפון:</strong> {request.contactPhone}</div>
                                                )}

                                                {request.notes && (
                                                    <div className="text-blue-700 bg-blue-50 p-2 rounded mt-2">
                                                        <strong>הערות המשתמש:</strong> {request.notes}
                                                    </div>
                                                )}

                                                {request.adminNotes && (
                                                    <div className="text-green-700 bg-green-50 p-2 rounded mt-2">
                                                        <strong>הערות קודמות:</strong> {request.adminNotes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 flex-shrink-0">
                                            <button
                                                onClick={() => handleApproveReturn(
                                                    request.id,
                                                    request.bookId,
                                                    request.bookTitle,
                                                    request.requesterName,
                                                    request.requesterId
                                                )}
                                                disabled={isProcessing}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        מאשר...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        אשר החזרה
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                disabled={isProcessing}
                                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                                דחה
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* הנחיות */}
            <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">הנחיות לטיפול בבקשות החזרה</h3>
                <div className="text-purple-700 space-y-2 text-sm">
                    <div>• בדוק את מצב הספר לפני אישור החזרה</div>
                    <div>• וודא שהספר הוחזר פיזית לספרייה</div>
                    <div>• לאחר אישור החזרה, הספר יהיה זמין להשאלה מחדש</div>
                    <div>• המשתמש יקבל הודעת אישור על השלמת תהליך ההחזרה</div>
                    <div>• במידה והספר פגום, סמן אותו לתחזוקה לפני החזרה למדף</div>
                </div>
            </div>
        </div>
    );
}