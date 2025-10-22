// BorrowedBooks.jsx - מתוקן עם כפתור החזרת ספר
import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, MapPin, RotateCcw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import {
    getUserBorrowedBooks,
    getBooks,
    updateLoanRequestStatus,
    updateBook,
    notifyAdminReturnRequest
} from '../utils/dbHelpers';

export default function BorrowedBooks({ user, onBookReturned }) {
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [returningBookId, setReturningBookId] = useState(null);

    useEffect(() => {
        if (user) {
            loadBorrowedBooks();
            loadAllBooks();
        }
    }, [user]);

    const loadBorrowedBooks = async () => {
        setLoading(true);
        try {
            const borrowed = await getUserBorrowedBooks(user.id);
            setBorrowedBooks(borrowed);
            console.log('נטענו ספרים מושאלים:', borrowed.length);
        } catch (error) {
            console.error('שגיאה בטעינת ספרים מושאלים:', error);
            alert('שגיאה בטעינת הספרים המושאלים');
        } finally {
            setLoading(false);
        }
    };

    const loadAllBooks = async () => {
        try {
            const allBooks = await getBooks();
            setBooks(allBooks);
        } catch (error) {
            console.error('שגיאה בטעינת ספרים:', error);
        }
    };

    const getBookDetails = (bookId) => {
        return books.find(book => book.id === bookId);
    };

    const calculateDaysUntilReturn = (loanDate) => {
        const loan = new Date(loanDate);
        const returnDate = new Date(loan);
        returnDate.setDate(loan.getDate() + 14); // 14 ימים להשאלה

        const today = new Date();
        const diffTime = returnDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { returnDate, daysLeft: diffDays };
    };

    // פונקציה חדשה לבקשת החזרה על ידי המשתמש
    const handleUserReturnRequest = async (loanRequestId, bookId, bookTitle) => {
        if (!confirm(`האם אתה בטוח שברצונך להחזיר את הספר "${bookTitle}"?
        
הספר יועבר לסטטוס "ממתין לאישור החזרה" עד שהאדמין יאשר את החזרה.`)) {
            return;
        }

        setReturningBookId(loanRequestId);
        try {
            // עדכון סטטוס הבקשה ל"pending_return"
            await updateLoanRequestStatus(loanRequestId, 'pending_return', 'המשתמש ביקש להחזיר את הספר');

            // עדכון סטטוס הספר ל"בעיבוד החזרה"
            await updateBook(bookId, {
                status: 'processing_return',
                returnRequestDate: new Date().toISOString(),
                returnRequestBy: user.name
            });

            // שליחת הודעה לאדמינים
            await notifyAdminReturnRequest({
                bookTitle,
                requesterName: user.name,
                loanRequestId,
                bookId
            });

            // עדכון הרשימה המקומית
            setBorrowedBooks(prev => prev.map(book =>
                book.id === loanRequestId
                    ? { ...book, status: 'pending_return', returnRequested: true }
                    : book
            ));

            alert('בקשת החזרה נשלחה בהצלחה! הספר יוחזר לזמין לאחר אישור האדמין.');

        } catch (error) {
            console.error('שגיאה בבקשת החזרת ספר:', error);
            alert('שגיאה בבקשת החזרת הספר: ' + error.message);
        } finally {
            setReturningBookId(null);
        }
    };

    const getStatusColor = (daysLeft, returnRequested = false) => {
        if (returnRequested) return 'text-purple-600 bg-purple-100 border-purple-300'; // החזרה מבוקשת
        if (daysLeft < 0) return 'text-red-600 bg-red-100 border-red-300'; // איחור
        if (daysLeft <= 3) return 'text-orange-600 bg-orange-100 border-orange-300'; // עוד מעט
        return 'text-green-600 bg-green-100 border-green-300'; // בסדר
    };

    const getStatusText = (daysLeft, returnRequested = false) => {
        if (returnRequested) return 'ממתין לאישור החזרה';
        if (daysLeft < 0) return `איחור של ${Math.abs(daysLeft)} ימים`;
        if (daysLeft === 0) return 'יש להחזיר היום!';
        if (daysLeft === 1) return 'יש להחזיר מחר';
        return `נותרו ${daysLeft} ימים`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="rounded-3xl border border-stone-200 bg-white p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold">הספרים שלי</h2>
                    </div>
                    <div className="text-center py-8 text-blue-600">
                        טוען ספרים מושאלים...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* כותרת וסטטיסטיקות */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-semibold">הספרים שלי</h2>
                    </div>
                    <button
                        onClick={loadBorrowedBooks}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        רענן
                    </button>
                </div>

                {/* סטטיסטיקות מהירות */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">{borrowedBooks.length}</div>
                        <div className="text-sm text-blue-700">ספרים מושאלים</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="text-2xl font-bold text-orange-900">
                            {borrowedBooks.filter(book => {
                                const { daysLeft } = calculateDaysUntilReturn(book.updatedAt || book.createdAt);
                                return daysLeft <= 3 && daysLeft >= 0;
                            }).length}
                        </div>
                        <div className="text-sm text-orange-700">מועד החזרה קרוב</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                        <div className="text-2xl font-bold text-red-900">
                            {borrowedBooks.filter(book => {
                                const { daysLeft } = calculateDaysUntilReturn(book.updatedAt || book.createdAt);
                                return daysLeft < 0;
                            }).length}
                        </div>
                        <div className="text-sm text-red-700">באיחור</div>
                    </div>
                </div>
            </div>

            {/* רשימת ספרים מושאלים */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">ספרים שברשותך</h3>

                {borrowedBooks.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">אין ספרים מושאלים</h3>
                        <p className="text-gray-500">כל הספרים שלך הוחזרו או שלא השאלת ספרים עדיין</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {borrowedBooks.map(loanRequest => {
                            const bookDetails = getBookDetails(loanRequest.bookId);
                            const { returnDate, daysLeft } = calculateDaysUntilReturn(loanRequest.updatedAt || loanRequest.createdAt);
                            const isReturning = returningBookId === loanRequest.id;
                            const returnRequested = loanRequest.status === 'pending_return' || loanRequest.returnRequested;

                            return (
                                <div
                                    key={loanRequest.id}
                                    className="border rounded-xl p-4 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold text-lg">{loanRequest.bookTitle}</h4>
                                                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(daysLeft, returnRequested)}`}>
                                                    {getStatusText(daysLeft, returnRequested)}
                                                </span>
                                            </div>

                                            <div className="text-sm text-gray-600 space-y-1">
                                                {bookDetails && (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span><strong>מחבר:</strong> {bookDetails.author}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" />
                                                            <span><strong>מיקום:</strong> {bookDetails.location.color} {bookDetails.location.letter}{bookDetails.location.number}</span>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span><strong>תאריך החזרה:</strong> {returnDate.toLocaleDateString('he-IL')}</span>
                                                </div>
                                                <div>
                                                    <strong>הושאל:</strong> {new Date(loanRequest.updatedAt || loanRequest.createdAt).toLocaleDateString('he-IL')}
                                                </div>
                                                {loanRequest.adminNotes && (
                                                    <div className="text-blue-600">
                                                        <strong>הערת ספרן:</strong> {loanRequest.adminNotes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {/* כפתור בקשת החזרה */}
                                            {!returnRequested ? (
                                                <button
                                                    onClick={() => handleUserReturnRequest(loanRequest.id, loanRequest.bookId, loanRequest.bookTitle)}
                                                    disabled={isReturning}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isReturning ? (
                                                        <>
                                                            <RotateCcw className="w-4 h-4 animate-spin" />
                                                            שולח בקשה...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ArrowLeft className="w-4 h-4" />
                                                            בקש החזרה
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg">
                                                    <CheckCircle className="w-4 h-4" />
                                                    החזרה מבוקשת
                                                </div>
                                            )}

                                            {daysLeft < 0 && !returnRequested && (
                                                <div className="flex items-center gap-1 text-red-600 text-xs">
                                                    <AlertCircle className="w-3 h-3" />
                                                    יש להחזיר בדחיפות!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* הנחיות והערות חשובות */}
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">הנחיות חשובות</h3>
                <div className="text-blue-700 space-y-2 text-sm">
                    {/* <div>• תקופת השאלה רגילה היא 14 ימים מיום האישור</div> */}
                    <div>• ניתן לבקש החזרה מוקדמת באמצעות הכפתור "בקש החזרה"</div>
                    <div>• בעיכוב החזרה יש להקפיד על החזרה מהירה</div>
                    <div>• לשאלות או הארכת השאלה, פנה לספרן</div>
                    <div>• השמירה על הספרים באחריותך האישית</div>
                </div>
            </div>
        </div>
    );
}