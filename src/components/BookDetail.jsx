// שחזור מערכת בקשות השאלה - קבצים נוספים נדרשים

// 1. BookDetail.jsx - עם מערכת בקשות השאלה מלאה
import React, { useState } from 'react';
import { X, Edit2, Trash2, Heart, Star, FileText, MapPin, Bell } from 'lucide-react';
import { getStatusColor, getStatusText, getCategoryColor } from '../utils/bookHelpers';
import {
    addLoanRequest,
    updateBook,
    updateLoanRequestStatus,
    createAllLoanEvents,
    notifyUserLoanRejected,
    notifyUserLoanApproved,
    getBooks,
    notifyAdminNewRequest
} from '../utils/dbHelpers';

const BookDetail = ({
    book,
    favorites,
    toggleFavorite,
    onClose,
    user,
    onEditBook,
    onDeleteBook,
    categories,
    pendingRequests = [],
    onUpdateRequestStatus
}) => {
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [loanData, setLoanData] = useState({
        contactPhone: '',
        notes: '',
        returnDate: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');

    const handleLoanRequest = async (e) => {
        e.preventDefault();

        if (!loanData.contactPhone.trim()) {
            alert('יש למלא מספר טלפון ליצירת קשר');
            return;
        }

        setSubmitting(true);
        try {
            const requestData = {
                bookId: book.id,
                bookTitle: book.title,
                bookAuthor: book.author,
                bookLocation: book.location,
                requesterId: user.id || user.username,
                requesterName: user.name,
                contactPhone: loanData.contactPhone.trim(),
                notes: loanData.notes.trim(),
                expectedReturnDate: loanData.returnDate || null,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            // הוספת הבקשה למסד הנתונים
            await addLoanRequest(requestData);

            // עדכון סטטוס הספר ל"בעיבוד"
            await updateBook(book.id, {
                status: 'processing',
                processingBy: user.name,
                processingDate: new Date().toISOString()
            });

            // שליחת הודעה למנהלים
            await notifyAdminNewRequest(requestData);

            alert(`בקשתך נשלחה בהצלחה!
    
פרטי הבקשה:
• ספר: ${book.title}
• מבקש: ${user.name}
• טלפון: ${loanData.contactPhone}

הספר מועבר כעת לסטטוס "בעיבוד".
הנהלת הספרייה תבדוק את הבקשה ותחזור אליך בהקדם.`);

            setShowLoanForm(false);
            setLoanData({ contactPhone: '', notes: '', returnDate: '' });
            onClose(); // סגירת חלון פרטי הספר

        } catch (error) {
            console.error('שגיאה בשליחת בקשת השאלה:', error);
            alert('שגיאה בשליחת הבקשה: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateRequestStatus = async (requestId, newStatus) => {
        setSubmitting(true);
        try {
            await updateLoanRequestStatus(requestId, newStatus, adminNotes);
            const handleUpdateRequestStatus = async (requestId, newStatus) => {
                setSubmitting(true);
                try {
                    const request = pendingRequests.find(r => r.id === requestId);

                    await updateLoanRequestStatus(requestId, newStatus, adminNotes);

                    // 🔔 שליחת הודעה למשתמש בהתאם לסטטוס
                    if (newStatus === 'approved') {
                        await notifyUserLoanApproved(request.requesterId, request, adminNotes);

                        const returnDate = new Date();
                        returnDate.setDate(returnDate.getDate() + 14);

                        await updateBook(book.id, {
                            status: 'borrowed',
                            borrowedBy: request?.requesterName,
                            borrowDate: new Date().toISOString(),
                            expectedReturnDate: returnDate.toISOString()
                        });

                        await createAllLoanEvents(request.requesterId, request, book);
                    }

                    if (newStatus === 'rejected') {
                        await notifyUserLoanRejected(request.requesterId, request, adminNotes);

                        await updateBook(book.id, {
                            status: 'available',
                            processingBy: null,
                            processingDate: null
                        });
                    }

                    if (onUpdateRequestStatus) {
                        await onUpdateRequestStatus(requestId, newStatus, book.id);
                    }

                    setSelectedRequest(null);
                    setAdminNotes('');
                    onClose();

                    const statusMessage = newStatus === 'approved' ? 'הבקשה אושרה והספר הועבר למצב מושאל' :
                        newStatus === 'rejected' ? 'הבקשה נדחתה והספר חזר למצב זמין' :
                            'הבקשה עודכנה';
                    alert(statusMessage);

                } catch (error) {
                    console.error('שגיאה בעדכון בקשה:', error);
                    alert('שגיאה בעדכון הבקשה: ' + error.message);
                } finally {
                    setSubmitting(false);
                }
            };
            // אם מאשרים - עדכון סטטוס הספר למושאל
            if (newStatus === 'approved') {
                const request = pendingRequests.find(r => r.id === requestId);
                const returnDate = new Date();
                returnDate.setDate(returnDate.getDate() + 14); // 14 ימים להשאלה

                await updateBook(book.id, {
                    status: 'borrowed',
                    borrowedBy: request?.requesterName,
                    borrowDate: new Date().toISOString(),
                    expectedReturnDate: returnDate.toISOString()
                });
                await createAllLoanEvents(
                    request.requesterId,
                    request,
                    book
                );
            }

            // אם דוחים - החזרת הספר לזמין
            if (newStatus === 'rejected') {
                await updateBook(book.id, {
                    status: 'available',
                    processingBy: null,
                    processingDate: null
                });
            }

            if (onUpdateRequestStatus) {
                await onUpdateRequestStatus(requestId, newStatus, book.id);
            }

            setSelectedRequest(null);
            setAdminNotes('');
            onClose();
            const statusMessage = newStatus === 'approved' ? 'הבקשה אושרה והספר הועבר למצב מושאל' :
                newStatus === 'rejected' ? 'הבקשה נדחתה והספר חזר למצב זמין' :
                    'הבקשה עודכנה';
            alert(statusMessage);

        } catch (error) {
            console.error('שגיאה בעדכון בקשה:', error);
            alert('שגיאה בעדכון הבקשה: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
                    >
                        <X size={16} />
                    </button>
                    {user?.role === 'admin' && (
                        <div className="absolute top-4 left-16 flex gap-2 z-10">
                            <button
                                onClick={() => onEditBook(book)}
                                className="bg-blue-500 text-white rounded-full p-2 shadow-md hover:bg-blue-600"
                                title="ערוך ספר"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDeleteBook(book.id)}
                                className="bg-red-500 text-white rounded-full p-2 shadow-md hover:bg-red-600"
                                title="מחק ספר"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                    <img
                        src={book.image}
                        alt={book.title}
                        className="w-full h-64 object-cover"
                    />
                    <div className={`absolute bottom-4 left-4 px-3 py-1 rounded text-sm ${getStatusColor(book.status)}`}>
                        {getStatusText(book.status)}
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <button
                            onClick={() => toggleFavorite(book.id)}
                            className={`p-3 rounded-full ${favorites.has(book.id) ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                                } hover:scale-110 transition-transform`}
                        >
                            <Heart size={20} fill={favorites.has(book.id) ? 'white' : 'none'} />
                        </button>
                        <div className="text-right flex-1 mr-4">
                            <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
                            <p className="text-lg text-gray-600 mb-2">{book.author}</p>
                            <div className="flex items-center justify-end mb-2">
                                <span className="text-sm text-gray-500 ml-2">דירוג:</span>
                                <div className="flex items-center">
                                    <Star className="text-yellow-400 fill-current mr-1" size={16} />
                                    <span className="font-medium">{book.rating}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* בקשות השאלה ממתינות - לאדמין */}
                    {user?.role === 'admin' && pendingRequests.length > 0 && (
                        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                בקשות השאלה ממתינות ({pendingRequests.length})
                            </h4>
                            <div className="space-y-3">
                                {pendingRequests.map(request => (
                                    <div key={request.id} className="bg-white rounded-lg p-3 border border-yellow-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800">{request.requesterName}</div>
                                                <div className="text-sm text-gray-600">
                                                    טלפון: {request.contactPhone}
                                                </div>
                                                {request.expectedReturnDate && (
                                                    <div className="text-sm text-gray-600">
                                                        החזרה משוערת: {new Date(request.expectedReturnDate).toLocaleDateString('he-IL')}
                                                    </div>
                                                )}
                                                {request.notes && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        הערות: {request.notes}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500">
                                                    נשלח: {new Date(request.createdAt).toLocaleDateString('he-IL')} {new Date(request.createdAt).toLocaleTimeString('he-IL')}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedRequest(request)}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                    disabled={submitting}
                                                >
                                                    טפל בבקשה
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* כפתור בקשת השאלה - רק למשתמשים רגילים ורק אם הספר זמין */}
                    {user?.role !== 'admin' && book.status === 'available' && !showLoanForm && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-green-700">זמין להשאלה</span>
                                </div>
                                <button
                                    onClick={() => setShowLoanForm(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-all duration-200 border border-green-200 shadow-sm hover:shadow-md text-sm font-medium"
                                    disabled={submitting}
                                >
                                    <span className="text-base">📖</span>
                                    בקש השאלת ספר
                                </button>
                            </div>
                        </div>
                    )}

                    {/* טופס בקשת השאלה */}
                    {showLoanForm && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-3">בקשת השאלת ספר</h4>
                            <form onSubmit={handleLoanRequest} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-1">
                                        מספר טלפון ליצירת קשר *
                                    </label>
                                    <input
                                        type="tel"
                                        value={loanData.contactPhone}
                                        onChange={(e) => setLoanData(prev => ({ ...prev, contactPhone: e.target.value }))}
                                        className="w-full rounded-lg border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="050-1234567"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-1">
                                        תאריך החזרה משוער (אופציונלי)
                                    </label>
                                    <input
                                        type="date"
                                        value={loanData.returnDate}
                                        onChange={(e) => setLoanData(prev => ({ ...prev, returnDate: e.target.value }))}
                                        className="w-full rounded-lg border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-1">
                                        הערות נוספות (אופציונלי)
                                    </label>
                                    <textarea
                                        value={loanData.notes}
                                        onChange={(e) => setLoanData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full rounded-lg border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="למה אתה זקוק לספר? מתי תרצה לאסוף?"
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting || !loanData.contactPhone.trim()}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'שולח בקשה...' : 'שלח בקשה'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowLoanForm(false)}
                                        disabled={submitting}
                                        className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* סטטוסי ספר אחרים */}
                    {book.status === 'borrowed' && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-orange-700">כרגע מושאל</span>
                                </div>
                                <p className="text-xs text-orange-600">הספר יהיה זמין שוב כשיוחזר</p>
                                {book.borrowedBy && (
                                    <p className="text-xs text-orange-600 mt-1">מושאל ל: {book.borrowedBy}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {book.status === 'processing' && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-blue-700">בעיבוד</span>
                                </div>
                                <p className="text-xs text-blue-600">הבקשה נבדקת על ידי הנהלת הספרייה</p>
                            </div>
                        </div>
                    )}

                    {book.status === 'maintenance' && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-red-700">בתחזוקה</span>
                                </div>
                                <p className="text-xs text-red-600">הספר אינו זמין כעת להשאלה</p>
                            </div>
                        </div>
                    )}

                    {/* פרטי הספר */}
                    <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="text-right">
                                <h4 className="font-semibold mb-2 flex items-center justify-end">
                                    <FileText size={16} className="ml-2" />
                                    קטגוריה
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-sm text-white bg-${getCategoryColor(book.category, categories)}-500`}>
                                    {categories.find(c => c.id === book.category)?.name}
                                </span>
                            </div>

                            <div className="text-right">
                                <h4 className="font-semibold mb-2 flex items-center justify-end">
                                    <MapPin size={16} className="ml-2" />
                                    מיקום בספרייה
                                </h4>
                                <div className="bg-gray-100 p-3 rounded">
                                    <div className="text-sm">
                                        <strong>צבע:</strong> {book.location.color}<br />
                                        <strong>אות:</strong> {book.location.letter}<br />
                                        <strong>מספר:</strong> {book.location.number}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <h4 className="font-semibold mb-2">תיאור הספר</h4>
                            <p className="text-gray-700 leading-relaxed">{book.description}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* חלון טיפול בבקשה - לאדמין */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold mb-4">טיפול בבקשת השאלה</h3>

                            <div className="space-y-3 mb-6">
                                <div><strong>ספר:</strong> {book.title}</div>
                                <div><strong>מבקש:</strong> {selectedRequest.requesterName}</div>
                                <div><strong>טלפון:</strong> {selectedRequest.contactPhone}</div>
                                {selectedRequest.expectedReturnDate && (
                                    <div><strong>החזרה משוערת:</strong> {new Date(selectedRequest.expectedReturnDate).toLocaleDateString('he-IL')}</div>
                                )}
                                {selectedRequest.notes && (
                                    <div><strong>הערות המבקש:</strong> {selectedRequest.notes}</div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">הערות אדמין (אופציונלי)</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="הערות לבקשה..."
                                    disabled={submitting}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'approved')}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {submitting ? 'מעדכן...' : 'אשר השאלה'}
                                </button>
                                <button
                                    onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'rejected')}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {submitting ? 'מעדכן...' : 'דחה בקשה'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedRequest(null);
                                        setAdminNotes('');
                                    }}
                                    disabled={submitting}
                                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                                >
                                    ביטול
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookDetail;