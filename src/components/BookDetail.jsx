import React, { useState } from 'react';
import { X, Edit2, Trash2, Heart, Star, FileText, MapPin, Bell, User, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStatusColor, getStatusText, getCategoryColor } from '../utils/bookHelpers';
import {
    addLoanRequest,
    updateBook,
    updateLoanRequestStatus,
    createAllLoanEvents,
    notifyUserLoanRejected,
    notifyUserLoanApproved,
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [phoneError, setPhoneError] = useState('');

    // ניהול תמונות - אם אין תמונות, אל תציג תמונה דיפולטיבית
    const images = book.images && book.images.length > 0 ? book.images :
        (book.image && book.image !== '/api/placeholder/200/250' ? [book.image] : []);

    // ניהול גלריית תמונות
    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

    // אימות מספר טלפון
    const validatePhone = (phone) => {
        // בדיקה בסיסית לפורמט טלפון ישראלי
        const phoneRegex = /^(05\d{8}|0[2-4,8-9]\d{7})$/;
        const cleanPhone = phone.replace(/[-\s]/g, '');
        return phoneRegex.test(cleanPhone);
    };

    const handleLoanRequest = async (e) => {
        e.preventDefault();
        setPhoneError('');

        if (!loanData.contactPhone.trim()) {
            setPhoneError('יש למלא מספר טלפון ליצירת קשר');
            return;
        }

        // אימות מספר טלפון
        if (!validatePhone(loanData.contactPhone.trim())) {
            setPhoneError('מספר הטלפון אינו תקין. הזן מספר בפורמט: 050-1234567');
            return;
        }

        // בדיקה מול פרטי המשתמש במערכת (אם קיים שדה טלפון)
        if (user.phone && user.phone !== loanData.contactPhone.trim()) {
            setPhoneError('מספר הטלפון אינו תואם לפרטי המשתמש במערכת');
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

            await addLoanRequest(requestData);
            await updateBook(book.id, {
                status: 'processing',
                processingBy: user.name,
                processingDate: new Date().toISOString()
            });
            await notifyAdminNewRequest(requestData);

            alert(`בקשתך נשלחה בהצלחה!
    
פרטי הבקשה:
• ספר: ${book.title}
• מבקש: ${user.name}
• טלפון: ${loanData.contactPhone}

הספר מועבר כעת לסטטוס "בעיבוד".
הנהלת הספרייה תבדוק את הבקשה ותחזור אליך בהקדם.`);

            // סגירה אוטומטית של הטופס
            setShowLoanForm(false);
            setLoanData({ contactPhone: '', notes: '', returnDate: '' });
            setPhoneError('');

        } catch (error) {
            console.error('שגיאה בשליחת בקשת השאלה:', error);
            alert('שגיאה בשליחת הבקשה: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelLoan = () => {
        setShowLoanForm(false);
        setLoanData({ contactPhone: '', notes: '', returnDate: '' });
        setPhoneError('');
    };

    const handleUpdateRequestStatus = async (requestId, newStatus) => {
        setSubmitting(true);
        try {
            const request = pendingRequests.find(r => r.id === requestId);
            await updateLoanRequestStatus(requestId, newStatus, adminNotes);

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[98vh] md:max-h-[95vh] overflow-hidden">

                {/* כותרת עליונה עם כפתורי פעולה */}
                <div className="flex justify-between items-center p-3 md:p-4 border-b">
                    <button
                        onClick={onClose}
                        className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {user?.role === 'admin' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onEditBook(book)}
                                className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                                title="ערוך ספר"
                            >
                                <Edit2 size={20} />
                            </button>
                            <button
                                onClick={() => onDeleteBook(book.id)}
                                className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                title="מחק ספר"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-y-auto max-h-[calc(98vh-60px)] md:max-h-[calc(95vh-80px)]">
                    {/* תוכן מרכזי */}
                    <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-6 p-3 md:p-6">

                        {/* גלריית תמונות */}
                        {images.length > 0 && (
                            <div className="w-full md:w-1/2">
                                <div className="relative">
                                    {/* פריסה למובייל - תמונה גדולה עם תמונות קטנות בצד */}
                                    <div className="flex gap-3 md:block">
                                        {/* תמונות ממוזערות - בטור במובייל */}
                                        {images.length > 1 && (
                                            <div className="flex flex-col gap-2 md:hidden">
                                                {images.map((image, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentImageIndex(index)}
                                                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${index === currentImageIndex
                                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <img
                                                            src={image}
                                                            alt={`תמונה ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* תמונה ראשית */}
                                        <div className="relative bg-gray-100 rounded-lg overflow-hidden flex-1">
                                            <img
                                                src={images[currentImageIndex]}
                                                alt={book.title}
                                                className="w-full h-56 md:h-80 object-cover"
                                            />

                                            {/* חיצים למעבר בין תמונות */}
                                            {images.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={prevImage}
                                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
                                                    >
                                                        <ChevronLeft size={17} />
                                                    </button>
                                                    <button
                                                        onClick={nextImage}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
                                                    >
                                                        <ChevronRight size={20} />
                                                    </button>

                                                    {/* מחוון מיקום */}
                                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                                                        {images.map((_, index) => (
                                                            <div
                                                                key={index}
                                                                className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* תמונות ממוזערות - בשורה בדסקטופ */}
                                    {images.length > 1 && (
                                        <div className="hidden md:flex gap-2 mt-3 overflow-x-auto pb-2">
                                            {images.map((image, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentImageIndex(index)}
                                                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${index === currentImageIndex
                                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <img
                                                        src={image}
                                                        alt={`תמונה ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* פרטי הספר */}
                        <div className={`${images.length > 0 ? 'w-full md:w-1/2' : 'w-full'} space-y-3 md:space-y-4`}>
                            {/* כותרת וכפתור מועדפים */}
                            <div className="flex justify-between items-start text-right">
                                <div className="text-right w-full">
                                    <h1 className="text-2xl md:text-3xl font-bold mb-1">{book.title}</h1>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 text-sm md:text-base">
                                        {/* <div className="flex items-center gap-2">
                                            <Star className="text-yellow-400 fill-current" size={16} />
                                            <span className="text-gray-500">דירוג:</span>
                                            <span className="text-gray-900">{book.rating}</span>
                                        </div> */}
                                        {/* <span className="text-gray-400">|</span> */}
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-gray-500" />
                                            <span className="text-gray-500">מחבר:</span>
                                            <span className="text-gray-900">{book.author}</span>
                                        </div>
                                        <span className="text-gray-400">|</span>
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-500" />
                                            <span className="text-gray-500">קטגוריה:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs text-white bg-${getCategoryColor(book.category, categories)}-500`}>
                                                {categories.find(c => c.id === book.category)?.name}
                                            </span>
                                        </div>
                                        <span className="text-gray-400">|</span>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-500" />
                                            <span className="text-gray-500">מיקום:</span>
                                            <span className="text-gray-900 text-sm">
                                                {book.location.color} {book.location.letter}{book.location.number}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleFavorite(book.id)}
                                    className={`p-2 md:p-3 rounded-full transition-all ${favorites.has(book.id)
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Heart size={20} fill={favorites.has(book.id) ? 'white' : 'none'} />
                                </button>
                            </div>

                            {/* תיאור הספר */}
                            {book.description && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <h3 className="font-semibold mb-1 text-right text-sm md:text-base">תיאור הספר</h3>
                                    <p className="text-gray-700 leading-normal text-right text-sm md:text-base">{book.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* תוכן נוסף */}
                    <div className="px-3 md:px-6 space-y-4 md:space-y-6 pb-4">
                        {/* בקשות השאלה ממתינות - לאדמין */}
                        {user?.role === 'admin' && pendingRequests.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium text-green-700">זמין להשאלה</span>
                                </div>
                                <button
                                    onClick={() => setShowLoanForm(true)}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    disabled={submitting}
                                >
                                    📖 בקש השאלת ספר
                                </button>
                            </div>
                        )}

                        {/* סטטוסי ספר אחרים */}
                        {book.status === 'borrowed' && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 md:p-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1 md:mb-2">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                        <span className="font-medium text-orange-700 text-sm md:text-base">כרגע מושאל</span>
                                    </div>

                                    {/* פרטי השאלה למנהל */}
                                    {user?.role === 'admin' && book.borrowedBy && (
                                        <div className="mt-2 md:mt-3 text-xs md:text-sm">
                                            <div className="flex items-center justify-center gap-2 text-orange-700">
                                                <div className="flex items-center gap-1">
                                                    <User size={12} />
                                                    <span>מושאל ל: {book.borrowedBy}</span>
                                                </div>
                                                <span>|</span>
                                                {book.borrowDate && (
                                                    <>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            <span>תאריך השאלה: {new Date(book.borrowDate).toLocaleDateString('he-IL')}</span>
                                                        </div>
                                                        <span>|</span>
                                                    </>
                                                )}
                                                {book.expectedReturnDate && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        <span>החזרה משוערת: {new Date(book.expectedReturnDate).toLocaleDateString('he-IL')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {book.status === 'processing' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium text-blue-700">בעיבוד</span>
                                </div>
                                {/* <p className="text-sm text-blue-600">הבקשה נבדקת על ידי הנהלת הספרייה</p> */}
                            </div>
                        )}

                        {book.status === 'maintenance' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="font-medium text-red-700">בתחזוקה</span>
                                </div>
                                <p className="text-sm text-red-600">הספר אינו זמין כעת להשאלה</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* חלונית טופס בקשת השאלה */}
            {showLoanForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xl font-semibold text-blue-800">בקשת השאלת ספר</h4>
                                <button
                                    onClick={handleCancelLoan}
                                    className="p-1 hover:bg-gray-100 rounded-full"
                                    disabled={submitting}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">ספר:</div>
                                <div className="font-medium">{book.title}</div>
                                <div className="text-sm text-gray-600">מאת: {book.author}</div>
                            </div>

                            <form onSubmit={handleLoanRequest} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">
                                        מספר טלפון ליצירת קשר *
                                    </label>
                                    <input
                                        type="tel"
                                        value={loanData.contactPhone}
                                        onChange={(e) => {
                                            setLoanData(prev => ({ ...prev, contactPhone: e.target.value }));
                                            setPhoneError('');
                                        }}
                                        className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${phoneError ? 'border-red-500' : 'border-blue-300'
                                            }`}
                                        placeholder="050-1234567"
                                        required
                                        disabled={submitting}
                                    />
                                    {phoneError && (
                                        <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-2">
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
                                    <label className="block text-sm font-medium text-blue-700 mb-2">
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

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting || !loanData.contactPhone.trim()}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'שולח בקשה...' : 'שלח בקשה'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelLoan}
                                        disabled={submitting}
                                        className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* חלון טיפול בבקשה - לאדמין */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
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
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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