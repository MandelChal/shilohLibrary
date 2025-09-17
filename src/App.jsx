import React, { useEffect, useMemo, useState } from "react";
import { User, Settings, Calendar, LogOut, Trash2, Book, Search, Heart, MapPin, Filter, ArrowRight, Star, FileText, X, Plus, Edit2, Save, AlertCircle, BookOpen, RotateCcw } from "lucide-react";

// Components
import LoginScreen from './components/LoginScreen';
import Navigation from './components/Navigation';
import SystemAnnouncements from './components/SystemAnnouncements';
import AdminPanel from './components/AdminPanel';
import { Bell, RefreshCw } from 'lucide-react';
import NotificationCenter from './components/NotificationCenter';
import BorrowedBooks from './components/BorrowedBooks';
import ReturnRequestsManagement from './components/ReturnRequestsManagement';




// Utils - עבודה עברית בלבד
import {
  fmtHebDay,
  fmtHebMonthYear,
  fmtHebFull,
  fmtGregShort,
  toISODateKey,
  startOfDay,
  monthMatrix,
  getHolidaysForDate,
  getHebrewDate,
  holidayTypesHebrew,
  getShabbatTimes,
  isShabbat,
  isErevShabbat,
  getCachedJewishEventsForMonth,
  getParsha,
  getHebrewDayLetter,
  getHebrewHolidayName
} from './utils/dateHelpers';

// Firebase DB helpers
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
  getEvents,
  addEvent,
  deleteEvent,
  subscribeToCollection,
  initializeDefaultData,
  addLoanRequest,
  getLoanRequests,
  updateLoanRequestStatus,
  deleteLoanRequest,
  sendLoanRequestNotification, // ← הוסף את זה
  notifyAdminNewRequest
} from './utils/dbHelpers';

// Firebase config
import { db, isFirebaseEnabled } from './utils/firebase';



// קטגוריות ספרים - יעמסו מ-Firebase או יישארו כ-fallback
const initialCategories = [
  { id: 'torah', name: 'תנ"ך ותורה', color: 'blue' },
  { id: 'nevi', name: 'נביאים וכתובים', color: 'green' },
  { id: 'midrash', name: 'מדרשים', color: 'purple' },
  { id: 'talmud', name: 'משניות וגמרא', color: 'red' },
  { id: 'halacha', name: 'הלכה', color: 'yellow' },
  { id: 'responsa', name: 'שו"ת', color: 'indigo' },
  { id: 'prayer', name: 'תפילה וחסידות', color: 'pink' },
  { id: 'thought', name: 'מחשבה ומוסר', color: 'gray' },
  { id: 'history', name: 'היסטוריה', color: 'orange' }
];

// פונקציות עזר לספרים
const getStatusColor = (status) => {
  switch (status) {
    case 'available': return 'text-green-600 bg-green-100';
    case 'borrowed': return 'text-orange-600 bg-orange-100';
    case 'processing': return 'text-blue-600 bg-blue-100'; // חדש
    case 'maintenance': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};


const getStatusText = (status) => {
  switch (status) {
    case 'available': return 'זמין';
    case 'borrowed': return 'מושאל';
    case 'processing': return 'בעיבוד'; // חדש
    case 'maintenance': return 'תחזוקה';
    default: return 'לא ידוע';
  }
};


const getCategoryColor = (category, categories) => {
  const cat = categories.find(c => c.id === category);
  return cat ? cat.color : 'gray';
};
export const BookEditor = ({ book, onSave, onCancel, isNew = false }) => {
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

  // טעינת קטגוריות מה־DB
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
          <h2 className="text-2xl font-bold mb-6 text-right">
            {isNew ? 'הוספת ספר חדש' : 'עריכת ספר'}
          </h2>

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
                className="w-full p-2 border border-gray-300 rounded text-right"
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
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving || Object.keys(errors).length > 0}
              >
                <Save size={16} className="inline mr-2" />
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
};



const BookDetail = ({ book, favorites, toggleFavorite, onClose, user, onEditBook, onDeleteBook, categories, pendingRequests = [], onUpdateRequestStatus }) => {
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
        status: 'pending'
      };

      // הוספת הבקשה למסד הנתונים
      await addLoanRequest(requestData);

      // עדכון סטטוס הספר ל"בעיבוד" ברגע שמגישים בקשה
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
      }

      // אם דוחים - החזרת הספר לזמין
      if (newStatus === 'rejected') {
        await updateBook(book.id, {
          status: 'available',
          processingBy: null,
          processingDate: null
        });
      }

      // קריאה לפונקציה של הקומפוננט האב לעדכון
      if (onUpdateRequestStatus) {
        await onUpdateRequestStatus(requestId, newStatus, book.id);
      }

      setSelectedRequest(null);
      setAdminNotes('');

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

          {/* אם הספר מושאל - הצגת מידע */}
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

          {/* אם הספר בתחזוקה */}
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

const BookCatalog = ({ books, setBooks, user, categories, onBooksChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [showBookEditor, setShowBookEditor] = useState(false);

  // הוסף state לבקשות השאלה
  const [loanRequests, setLoanRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Initialize favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('libraryFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // טעינת בקשות השאלה לאדמין
  useEffect(() => {
    if (user?.role === 'admin') {
      loadLoanRequests();
    }
  }, [user]);

  const loadLoanRequests = async () => {
    setLoadingRequests(true);
    try {
      const requests = await getLoanRequests();
      setLoanRequests(requests);
      console.log('בקשות השאלה נטענו לקטלוג:', requests.length);
    } catch (error) {
      console.error('שגיאה בטעינת בקשות השאלה:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('libraryFavorites', JSON.stringify([...favorites]));
  }, [favorites]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.includes(searchQuery) ||
      book.author.includes(searchQuery) ||
      book.description.includes(searchQuery);
    const matchesCategory = !selectedCategory || book.category === selectedCategory;
    const matchesFavorites = !showFavorites || favorites.has(book.id);

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const toggleFavorite = (bookId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(bookId)) {
      newFavorites.delete(bookId);
    } else {
      newFavorites.add(bookId);
    }
    setFavorites(newFavorites);
  };

  // פונקציה לקבלת בקשות לספר מסוים
  const getBookRequests = (bookId) => {
    return loanRequests.filter(request =>
      request.bookId === bookId && request.status === 'pending'
    );
  };

  // עריכת ספר
  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowBookEditor(true);
    setSelectedBook(null);
  };

  // הוספת ספר חדש
  const handleAddBook = () => {
    setEditingBook(null);
    setShowBookEditor(true);
  };

  // שמירת ספר (חדש או עריכה)
  const handleSaveBook = async (bookData) => {
    try {
      if (editingBook) {
        // עדכון ספר קיים
        await updateBook(editingBook.id, bookData);
        const updatedBooks = books.map(book =>
          book.id === editingBook.id ? { ...bookData, id: editingBook.id } : book
        );
        setBooks(updatedBooks);
      } else {
        // הוספת ספר חדש
        const newBook = await addBook(bookData);
        setBooks(prev => [...prev, newBook]);
        console.log('ספר חדש נוסף בהצלחה:', newBook.title);
      }
      // סגירה אוטומטית של החלונית אחרי שמירה מוצלחת
      setShowBookEditor(false);
      setEditingBook(null);

      const action = editingBook ? 'עודכן' : 'נוסף';
      alert(`הספר "${bookData.title}" ${action} בהצלחה!`);
    } catch (error) {
      alert('שגיאה בשמירת הספר: ' + error.message);
      throw error; // מעביר את השגיאה הלאה לטיפול ב-BookEditor
    }
  };

  // מחיקת ספר
  const handleDeleteBook = async (bookId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הספר? פעולה זו לא ניתנת לביטול.')) {
      try {
        await deleteBook(bookId);
        setBooks(prev => prev.filter(book => book.id !== bookId));
        setSelectedBook(null);
        // הסרה מהמועדפים אם קיים
        const newFavorites = new Set(favorites);
        newFavorites.delete(bookId);
        setFavorites(newFavorites);
        console.log('ספר נמחק בהצלחה');
      } catch (error) {
        console.error('שגיאה במחיקת ספר:', error);
        alert('שגיאה במחיקת הספר: ' + error.message);
      }
    }
  };

  // טיפול בבקשת השאלה מהקטלוג
  const handleLoanRequestFromCatalog = async (requestData) => {
    // רענון הבקשות אחרי הוספת בקשה חדשה
    if (user?.role === 'admin') {
      setTimeout(() => {
        loadLoanRequests();
      }, 1000);
    }
  };


  const handleUpdateRequestStatus = async (requestId, newStatus, bookId) => {
    try {
      console.log('מעדכן בקשה בקטלוג:', requestId, newStatus, bookId);

      await updateLoanRequestStatus(requestId, newStatus, '');

      // עדכון סטטוס הספר אם מאושר
      if (newStatus === 'approved' && bookId) {
        const request = loanRequests.find(r => r.id === requestId);
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 14);

        await updateBook(bookId, {
          status: 'borrowed',
          borrowedBy: request?.requesterName,
          borrowDate: new Date().toISOString(),
          expectedReturnDate: returnDate.toISOString()
        });

        // עדכון רשימת הספרים ב-state המקומי
        setBooks(prev => prev.map(book =>
          book.id === bookId
            ? {
              ...book,
              status: 'borrowed',
              borrowedBy: request?.requesterName,
              borrowDate: new Date().toISOString()
            }
            : book
        ));
      }

      // רענון הבקשות
      await loadLoanRequests();

      console.log('עדכון בקשה הושלם בהצלחה');

    } catch (error) {
      console.error('שגיאה בעדכון בקשה:', error);
      alert('שגיאה בעדכון הבקשה: ' + error.message);
    }
  };
  return (
    <div className="space-y-6">
      {/* כותרת וכפתורים */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">קטלוג ספרים</h2>
          <p className="text-gray-600 mt-1">חפש וגלה ספרים בספריית שִׁלֹה</p>
          {user?.role === 'admin' && loadingRequests && (
            <p className="text-sm text-blue-600">טוען בקשות השאלה...</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user.role === 'admin' && (
            <>
              <button
                onClick={handleAddBook}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Plus size={16} />
                הוסף ספר חדש
              </button>
              <button
                onClick={loadLoanRequests}
                disabled={loadingRequests}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loadingRequests ? "animate-spin" : ""} />
                רענן בקשות
              </button>
            </>
          )}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-4 py-2 rounded-lg ${showFavorites ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
              } hover:opacity-80 transition-opacity`}
          >
            <Heart size={16} className="inline ml-2" />
            מועדפים ({favorites.size})
          </button>
        </div>
      </div>

      {/* אינדיקטור בקשות ממתינות לאדמין */}
      {user?.role === 'admin' && loanRequests.filter(r => r.status === 'pending').length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              יש {loanRequests.filter(r => r.status === 'pending').length} בקשות השאלה ממתינות לאישור
            </span>
          </div>
        </div>
      )}

      {/* חיפוש */}
      <div className="relative">
        <input
          type="text"
          placeholder="חפש ספרים, מחברים או נושאים..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
        />
        <Search className="absolute right-4 top-3.5 text-gray-400" size={20} />
      </div>

      {/* קטגוריות */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Filter className="ml-2" size={20} />
          חיפוש לפי קטגוריות
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedCategory ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } border`}
          >
            הכל
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === category.id
                ? `bg-${category.color}-500 text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } border`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* תוצאות */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {showFavorites ? 'הספרים המועדפים שלך' : `נמצאו ${filteredBooks.length} ספרים`}
          {selectedCategory && ` בקטגוריה: ${categories.find(c => c.id === selectedCategory)?.name}`}
        </h3>

        {/* רשת ספרים */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                setSelectedBook={setSelectedBook}
                user={user}
                onEditBook={handleEditBook}
                onDeleteBook={handleDeleteBook}
                categories={categories}
                // הוסף נתוני בקשות לכרטיס
                pendingRequests={user?.role === 'admin' ? getBookRequests(book.id) : []}
                onUpdateRequestStatus={handleUpdateRequestStatus}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Book className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">לא נמצאו ספרים</h3>
            <p className="text-gray-500">נסה לשנות את מילות החיפוש או הקטגוריה</p>
          </div>
        )}
      </div>

      {/* פרטי ספר */}
      {selectedBook && (
        <BookDetail
          book={selectedBook}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onClose={() => setSelectedBook(null)}
          user={user}
          onEditBook={handleEditBook}
          onDeleteBook={handleDeleteBook}
          categories={categories}
          onLoanRequest={handleLoanRequestFromCatalog}
          // הוסף נתוני בקשות לחלון הפרטי
          pendingRequests={user?.role === 'admin' ? getBookRequests(selectedBook.id) : []}
          onUpdateRequestStatus={handleUpdateRequestStatus}
        />
      )}

      {/* עורך ספרים */}
      {showBookEditor && (
        <BookEditor
          book={editingBook}
          isNew={!editingBook}
          onSave={handleSaveBook}
          onCancel={() => {
            setShowBookEditor(false);
            setEditingBook(null);
          }}
          categories={categories}
        />
      )}
    </div>
  );
};

// החלף את הקומפוננט BookCard הקיים שלך עם זה:
const BookCard = ({ book, favorites, toggleFavorite, setSelectedBook, user, onEditBook, onDeleteBook, categories, pendingRequests = [], onUpdateRequestStatus }) => {
  const hasRequests = pendingRequests.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={book.image}
          alt={book.title}
          className="w-full h-48 object-cover"
        />

        {/* אינדיקטור בקשות השאלה לאדמין */}
        {user?.role === 'admin' && hasRequests && (
          <div className="absolute top-2 right-12 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold animate-pulse">
            {pendingRequests.length}
          </div>
        )}

        <button
          onClick={() => toggleFavorite(book.id)}
          className={`absolute top-2 right-2 p-2 rounded-full ${favorites.has(book.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
            } hover:scale-110 transition-transform`}
        >
          <Heart size={16} fill={favorites.has(book.id) ? 'white' : 'none'} />
        </button>

        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs text-white bg-${getCategoryColor(book.category, categories)}-500`}>
          {categories.find(c => c.id === book.category)?.name}
        </div>

        <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs ${getStatusColor(book.status)}`}>
          {getStatusText(book.status)}
        </div>

        {user?.role === 'admin' && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {hasRequests && (
              <button
                onClick={() => setSelectedBook(book)}
                className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                title={`יש ${pendingRequests.length} בקשות השאלה`}
              >
                <Bell size={14} />
              </button>
            )}
            <button
              onClick={() => onEditBook(book)}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              title="ערוך ספר"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDeleteBook(book.id)}
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="מחק ספר"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 text-right">{book.title}</h3>
        <p className="text-gray-600 mb-2 text-right flex items-center justify-end">
          <User size={14} className="ml-1" />
          {book.author}
        </p>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Star className="text-yellow-400 fill-current" size={14} />
            <span className="text-sm text-gray-600 ml-1">{book.rating}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin size={14} className="ml-1" />
            <span>{book.location.color} {book.location.letter}{book.location.number}</span>
          </div>
        </div>

        {/* הצגת בקשות השאלה לאדמין */}
        {user?.role === 'admin' && hasRequests && (
          <div className="mb-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-xs text-yellow-800 font-medium">
              🔔 {pendingRequests.length} בקשות השאלה ממתינות
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              {pendingRequests[0]?.requesterName}
              {pendingRequests.length > 1 && ` ועוד ${pendingRequests.length - 1}`}
            </div>
          </div>
        )}

        <p className="text-gray-700 text-sm mb-3 text-right line-clamp-2">
          {book.description}
        </p>

        <button
          onClick={() => setSelectedBook(book)}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
        >
          {user?.role === 'admin' && hasRequests ? 'צפה בפרטים ובקשות' : 'צפה בפרטים'}
          <ArrowRight size={16} className="mr-2" />
        </button>
      </div>
    </div>
  );
};

const LoanRequestsManagement = ({ currentUser }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const requestsData = await getLoanRequests();
      setRequests(requestsData);
      console.log('בקשות השאלה נטענו:', requestsData.length);
    } catch (error) {
      console.error('שגיאה בטעינת בקשות:', error);
      alert('שגיאה בטעינת הבקשות: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus, bookId = null) => {
    setLoading(true);
    try {
      // עדכון סטטוס הבקשה
      await updateLoanRequestStatus(requestId, newStatus, adminNotes);

      // אם מאשרים - עדכון סטטוס הספר למושאל
      if (newStatus === 'approved' && bookId) {
        await updateBook(bookId, {
          status: 'borrowed',
          borrowedBy: requests.find(r => r.id === requestId)?.requesterName,
          borrowDate: new Date().toISOString()
        });
      }

      // אם מחזירים ספר - עדכון חזרה לזמין
      if (newStatus === 'returned' && bookId) {
        await updateBook(bookId, {
          status: 'available',
          borrowedBy: null,
          borrowDate: null,
          returnDate: new Date().toISOString()
        });
      }

      // עדכון רשימת הבקשות
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: newStatus, adminNotes, updatedAt: new Date().toISOString() }
          : req
      ));

      setSelectedRequest(null);
      setAdminNotes('');
      console.log(`בקשה ${requestId} עודכנה לסטטוס: ${newStatus}`);

    } catch (error) {
      console.error('שגיאה בעדכון בקשה:', error);
      alert('שגיאה בעדכון הבקשה: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הבקשה?')) {
      setLoading(true);
      try {
        await deleteLoanRequest(requestId);
        setRequests(prev => prev.filter(req => req.id !== requestId));
        console.log('בקשה נמחקה:', requestId);
      } catch (error) {
        console.error('שגיאה במחיקת בקשה:', error);
        alert('שגיאה במחיקת הבקשה: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'returned': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'ממתין לאישור';
      case 'approved': return 'אושר - מושאל';
      case 'rejected': return 'נדחה';
      case 'returned': return 'הוחזר';
      default: return 'לא ידוע';
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');

  return (
    <div className="space-y-6">
      {/* כותרת וסטטיסטיקות */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Book className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold">ניהול בקשות השאלה</h2>
            {loading && <div className="text-sm text-blue-600">טוען...</div>}
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            רענן
          </button>
        </div>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-900">{pendingRequests.length}</div>
            <div className="text-sm text-yellow-700">ממתינות לאישור</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-900">{approvedRequests.length}</div>
            <div className="text-sm text-green-700">מושאלים כעת</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">{requests.length}</div>
            <div className="text-sm text-blue-700">סה״כ בקשות</div>
          </div>
        </div>
      </div>

      {/* בקשות ממתינות */}
      {pendingRequests.length > 0 && (
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">בקשות ממתינות לאישור</h3>
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <div key={request.id} className="bg-white rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{request.bookTitle}</h4>
                      <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>מבקש:</strong> {request.requesterName}</div>
                      <div><strong>טלפון:</strong> {request.contactPhone}</div>
                      {request.expectedReturnDate && (
                        <div><strong>תאריך החזרה משוער:</strong> {new Date(request.expectedReturnDate).toLocaleDateString('he-IL')}</div>
                      )}
                      {request.notes && (
                        <div><strong>הערות:</strong> {request.notes}</div>
                      )}
                      <div><strong>תאריך בקשה:</strong> {new Date(request.createdAt).toLocaleDateString('he-IL')}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      disabled={loading}
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

      {/* ספרים מושאלים כעת */}
      {approvedRequests.length > 0 && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">ספרים מושאלים כעת</h3>
          <div className="space-y-3">
            {approvedRequests.map(request => (
              <div key={request.id} className="bg-white rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{request.bookTitle}</h4>
                      <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>שואל:</strong> {request.requesterName} • {request.contactPhone}</div>
                      <div><strong>תאריך אישור:</strong> {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString('he-IL') : 'לא ידוע'}</div>
                      {request.expectedReturnDate && (
                        <div><strong>החזרה משוערת:</strong> {new Date(request.expectedReturnDate).toLocaleDateString('he-IL')}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'returned', request.bookId)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      disabled={loading}
                    >
                      סמן כהוחזר
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* חלון טיפול בבקשה */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">טיפול בבקשת השאלה</h3>

              <div className="space-y-3 mb-6">
                <div><strong>ספר:</strong> {selectedRequest.bookTitle}</div>
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
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'approved', selectedRequest.bookId)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'מעדכן...' : 'אשר השאלה'}
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'מעדכן...' : 'דחה בקשה'}
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminNotes('');
                  }}
                  disabled={loading}
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
// ------------------------------------------------------
// קומפוננטה ראשית עם לוח יהודי עברי בלבד + Firebase
// ------------------------------------------------------
export default function LibrarySystem() {
  const [user, setUser] = useState(null);
  const [today] = useState(new Date());
  const [cursor, setCursor] = useState(startOfDay(new Date()));
  const [selected, setSelected] = useState(startOfDay(new Date()));
  const [events, setEvents] = useState([]);
  const [monthlyHolidays, setMonthlyHolidays] = useState([]);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", time: "" });
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState("calendar");
  const [borrowedBooksCount, setBorrowedBooksCount] = useState(0);

  const grid = useMemo(() => monthMatrix(cursor), [cursor]);

  // טעינה ראשונית של נתונים מ-Firebase
  useEffect(() => {
    const initializeData = async () => {
      try {
        // אתחול נתונים בריריות מחדל אם צריך
        await initializeDefaultData();

        // טעינת נתונים
        const [booksData, categoriesData, announcementsData, eventsData] = await Promise.all([
          getBooks(),
          getCategories(),
          getAnnouncements(),
          getEvents()
        ]);

        console.log('נתונים נטענו מ-Firebase:', {
          books: booksData.length,
          categories: categoriesData.length,
          announcements: announcementsData.length,
          events: eventsData.length
        });

        setBooks(booksData.length > 0 ? booksData : initialBooks);
        setCategories(categoriesData.length > 0 ? categoriesData : initialCategories);
        setAnnouncements(announcementsData.length > 0 ? announcementsData : [
          {
            id: "1",
            title: "ברוכים הבאים למערכת החדשה!",
            message: "המערכת מושדרה עם לוח שנה עברי מלא וחגים יהודיים אוטומטיים + קטלוג ספרים דיגיטלי",
            type: "success",
            createdAt: new Date().toISOString(),
            createdBy: "מנהל המערכת"
          }
        ]);
        setEvents(eventsData);

      } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
        // fallback לנתונים מקומיים
        setBooks(initialBooks);
        setCategories(initialCategories);
        setAnnouncements([
          {
            id: "1",
            title: "מצב מקומי",
            message: "המערכת רצה במצב מקומי ללא חיבור ל-Firebase",
            type: "warning",
            createdAt: new Date().toISOString(),
            createdBy: "מערכת"
          }
        ]);
      }
    };

    initializeData();
  }, []);

  // טעינת חגים יהודיים לחודש הנוכחי
  useEffect(() => {
    try {
      const holidays = getCachedJewishEventsForMonth(cursor.getFullYear(), cursor.getMonth());
      setMonthlyHolidays(holidays);
      console.log(`נטענו ${holidays.length} אירועי יהודיים לחודש ${cursor.getMonth() + 1}/${cursor.getFullYear()}`);
    } catch (error) {
      console.error('שגיאה בטעינת חגים יהודיים:', error);
      setMonthlyHolidays([]);
    }
  }, [cursor]);

  // מעקב אחר שינויים ב-Firebase בזמן אמת
  useEffect(() => {
    if (!isFirebaseEnabled || !db) {
      console.log('רץ במצב מקומי - Firebase לא מוגדר');
      return;
    }

    const unsubscribeEvents = subscribeToCollection('events', (eventsData) => {
      setEvents(eventsData);
      console.log('אירועים עודכנו מ-Firebase:', eventsData.length);
    });

    const unsubscribeBooks = subscribeToCollection('books', (booksData) => {
      setBooks(booksData);
      console.log('ספרים עודכנו מ-Firebase:', booksData.length);
    });

    const unsubscribeCategories = subscribeToCollection('categories', (categoriesData) => {
      setCategories(categoriesData);
      console.log('קטגוריות עודכנו מ-Firebase:', categoriesData.length);
    });

    const unsubscribeAnnouncements = subscribeToCollection('announcements', (announcementsData) => {
      setAnnouncements(announcementsData);
      console.log('הודעות עודכנו מ-Firebase:', announcementsData.length);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeBooks();
      unsubscribeCategories();
      unsubscribeAnnouncements();
    };
  }, []);

  const eventsByKey = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      let jsDate;
      if (ev.date?.toDate) {
        jsDate = ev.date.toDate(); // Firebase Timestamp
      } else {
        jsDate = new Date(ev.date); // ISO string
      }
      const key = toISODateKey(jsDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [events]);

  // מיפוי חגים יהודיים לפי תאריך
  const holidaysByKey = useMemo(() => {
    const map = new Map();
    for (const holiday of monthlyHolidays) {
      const key = holiday.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(holiday);
    }
    return map;
  }, [monthlyHolidays]);

  const monthLabelHeb = fmtHebMonthYear.format(cursor);
  const monthLabelGreg = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(cursor);

  // התחברות משתמש - *** מתוקן כאן ***
  const handleLogin = (userData) => {
    try {
      console.log('מקבל נתוני משתמש מ-LoginScreen:', userData);

      // בדיקה שהנתונים תקינים
      if (!userData || !userData.name) {
        console.error('נתוני משתמש לא תקינים:', userData);
        alert('שגיאה בנתוני המשתמש');
        return;
      }

      setUser(userData);
      console.log('התחברות מוצלחת למערכת:', userData.name);
    } catch (error) {
      console.error('שגיאה בטיפול בהתחברות:', error);
      alert('שגיאה בהתחברות למערכת: ' + error.message);
    }
  };

  async function handleAddEvent() {
    if (!newEvent.title.trim()) return;
    setLoading(true);

    try {
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        time: newEvent.time.trim(),
        date: selected.toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user.name
      };

      const savedEvent = await addEvent(eventData);
      console.log('אירוע נשמר:', savedEvent);

      setNewEvent({ title: "", description: "", time: "" });
      setPanelOpen(false);
    } catch (error) {
      console.error('שגיאה בשמירת האירוע:', error);
      alert("שגיאה בשמירת האירוע: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את האירוע?")) {
      try {
        await deleteEvent(eventId);
        console.log('אירוע נמחק:', eventId);
      } catch (error) {
        console.error('שגיאה במחיקת אירוע:', error);
        alert('שגיאה במחיקת האירוע: ' + error.message);
      }
    }
  };

  const handleAddAnnouncement = async (announcementData) => {
    try {
      const savedAnnouncement = await addAnnouncement(announcementData);
      console.log('הודעה נוספה:', savedAnnouncement);
    } catch (error) {
      console.error('שגיאה בהוספת הודעה:', error);
      alert('שגיאה בהוספת ההודעה: ' + error.message);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      await deleteAnnouncement(announcementId);
      console.log('הודעה נמחקה:', announcementId);
    } catch (error) {
      console.error('שגיאה במחיקת הודעה:', error);
      alert('שגיאה במחיקת ההודעה: ' + error.message);
    }
  };

  const weekdays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 text-stone-900">
      {/* סרגל ניווט עליון */}
      <Navigation />

      {/* הודעות מערכת מסתובבות */}
      <SystemAnnouncements
        user={user}
        announcements={announcements}
        onAddAnnouncement={handleAddAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
      />

      {/* Header עם כלי הניהול */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-stone-500">
                {user.role === 'admin' ? 'פנל ניהול' : 'לוח שנה עברי ואירועי הספרייה'}
              </p>
              {!isFirebaseEnabled && (
                <p className="text-xs text-amber-600">רץ במצב מקומי</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* תפריט ניווט */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('calendar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'calendar'
                  ? 'bg-emerald-700 text-white'
                  : 'border border-stone-300 hover:bg-stone-100'
                  }`}
              >
                <Calendar className="w-4 h-4" />
                לוח שנה
              </button>

              <button
                onClick={() => setCurrentView('catalog')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'catalog'
                  ? 'bg-emerald-700 text-white'
                  : 'border border-stone-300 hover:bg-stone-100'
                  }`}
              >
                <Book className="w-4 h-4" />
                קטלוג ספרים
              </button>

              {user.role !== 'admin' && (
                <button
                  onClick={() => setCurrentView('borrowed')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'borrowed'
                    ? 'bg-emerald-700 text-white'
                    : 'border border-stone-300 hover:bg-stone-100'
                    }`}
                >
                  <BookOpen className="w-4 h-4" />
                  הספרים שלי
                </button>
              )}

              {user.role === 'admin' && (
                <button
                  onClick={() => setCurrentView('returns')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'returns'
                    ? 'bg-emerald-700 text-white'
                    : 'border border-stone-300 hover:bg-stone-100'
                    }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  בקשות החזרה
                </button>
              )}

              {user.role === 'admin' && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'admin'
                    ? 'bg-emerald-700 text-white'
                    : 'border border-stone-300 hover:bg-stone-100'
                    }`}
                >
                  <Settings className="w-4 h-4" />
                  ניהול
                </button>
              )}

            </div>
            <input
              placeholder="חיפוש בקטלוג..."
              className="hidden md:block w-60 rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{user.name}</span>
              {user.role === 'admin' && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">מנהל</span>
              )}
            </div>

            <NotificationCenter user={user} /> {/* ← השורה החדשה */}

            <button
              onClick={() => setUser(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-sm"
            >
              <LogOut className="w-4 h-4" />
              יציאה
            </button>
          </div>
        </div>
      </header>

     // בתוך הקומפוננט App.jsx, החלף את החלק של main עם הקוד הבא:

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* תצוגת לוח שנה */}
        {currentView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* עמודת תוכן/בוקריים */}
            <section className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-stone-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
                <h2 className="text-2xl font-semibold mb-2">
                  ברוך הבא {user.name}
                </h2>
                <p className="text-stone-700 mb-4">
                  {user.role === 'admin'
                    ? 'כאן תוכל לנהל אוספים, אירועים ולוח השנה היהודי. יש לך גישה מלאה לכלל הפונקציות.'
                    : 'כאן תוכל לראות את לוח השנה היהודי עם חגים, אירועים ותאריכים עבריים.'
                  }
                </p>
                <div className="flex flex-wrap gap-3">
                  {user.role === 'admin' && (
                    <button
                      className="rounded-2xl px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
                      onClick={() => setPanelOpen(true)}
                    >
                      הוספת אירוע חדש
                    </button>
                  )}
                  <button
                    className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
                    onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  >
                    חודש קודם
                  </button>
                  <button
                    className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
                    onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  >
                    חודש הבא
                  </button>
                  <button
                    className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
                    onClick={() => setCursor(startOfDay(new Date()))}
                    title="קפיצה להיום"
                  >
                    היום
                  </button>
                </div>
              </div>

              {/* לוח שנה יהודי עם תצוגה עברית פשוטה */}
              <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden mx-4 md:mx-8 shadow-lg">
                <div className="flex items-baseline justify-between px-4 sm:px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div>
                    <div className="text-lg font-semibold">{monthLabelHeb}</div>
                    <div className="text-sm text-stone-500">{monthLabelGreg}</div>
                  </div>
                  <div className="text-sm text-stone-500">
                    {fmtHebFull.format(today)}
                    <div className="text-xs text-blue-600">
                      {getHebrewDate(today)}
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  {/* ימות השבוע */}
                  <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-lg overflow-hidden">
                    {weekdays.map((d) => (
                      <div key={d} className="bg-stone-50 text-center text-xs font-medium py-3">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* לוח הימים - פשוט ועברי */}
                  <div className="grid grid-cols-7 gap-px bg-stone-200 mt-2 rounded-lg overflow-hidden">
                    {grid.map(({ date, inCurrent }, idx) => {
                      const isToday = toISODateKey(date) === toISODateKey(today);
                      const isSelected = toISODateKey(date) === toISODateKey(selected);
                      const key = toISODateKey(date);
                      const dayGreg = fmtGregShort.format(date);
                      const dayHebrewLetter = getHebrewDayLetter(date);
                      const dayEvents = eventsByKey.get(key) || [];
                      const holidays = holidaysByKey.get(key) || [];
                      const shabbatTimes = getShabbatTimes(date);
                      const isShabbatDay = isShabbat(date);
                      const isFridayDay = isErevShabbat(date);

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelected(startOfDay(date))}
                          className={[
                            "relative min-h-[120px] bg-white p-2 text-right transition-all hover:bg-stone-50",
                            inCurrent ? "" : "bg-stone-50 text-stone-400",
                            isSelected ? "ring-2 ring-emerald-600 z-10 bg-emerald-50" : "",
                            isToday ? "outline outline-2 outline-emerald-500" : "",
                            isShabbatDay ? "bg-blue-50 border-r-2 border-blue-300" : "",
                            isFridayDay ? "bg-yellow-50 border-r-2 border-yellow-300" : "",
                          ].join(" ")}
                        >
                          {/* תאריך פשוט - מספר לועזי + אות עברית */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-stone-800">{dayGreg}</span>
                              <span className="text-sm text-blue-600 font-medium">{dayHebrewLetter}</span>
                            </div>
                            {isToday && <span className="text-xs text-emerald-600 font-bold">היום</span>}
                          </div>

                          {/* זמני שבת בעברית */}
                          {shabbatTimes && (
                            <div className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded mb-1">
                              {shabbatTimes.name} {shabbatTimes.time}
                            </div>
                          )}

                          {/* חגים יהודיים - רק בעברית */}
                          <div className="space-y-0.5 mb-1">
                            {holidays.slice(0, 2).map((holiday) => {
                              const hebrewName = getHebrewHolidayName(holiday.fullEvent);
                              return (
                                <div
                                  key={holiday.name}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border truncate ${holidayTypesHebrew[holiday.type].color}`}
                                  title={hebrewName}
                                >
                                  <span className="ml-0.5">{holidayTypesHebrew[holiday.type].icon}</span>
                                  {hebrewName}
                                </div>
                              );
                            })}
                            {holidays.length > 2 && (
                              <div className="text-[8px] text-stone-500 text-center">
                                +{holidays.length - 2} נוספים
                              </div>
                            )}
                          </div>

                          {/* אירועים רגילים */}
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, holidays.length > 0 ? 1 : 2).map((ev) => (
                              <div key={ev.id} className="truncate rounded-md px-1.5 py-0.5 text-[9px] bg-emerald-100 border border-emerald-200 text-emerald-800">
                                {ev.time ? `${ev.time} ` : ""}
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > (holidays.length > 0 ? 1 : 2) && (
                              <div className="text-[8px] text-stone-500 text-center">
                                +{dayEvents.length - (holidays.length > 0 ? 1 : 2)} נוספים
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* סיידבר */}
            <aside className="space-y-6">
              <div className="rounded-3xl border border-stone-200 bg-white p-5">
                <div className="text-sm text-stone-500">תאריך נבחר</div>
                <div className="text-lg font-semibold">{fmtHebFull.format(selected)}</div>
                <div className="text-sm text-stone-600">{selected.toLocaleDateString("he-IL", { dateStyle: "full" })}</div>

                <div className="mt-4 flex gap-2">
                  {user.role === 'admin' && (
                    <button
                      onClick={() => setPanelOpen(true)}
                      className="rounded-2xl px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      אירוע חדש בתאריך זה
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(startOfDay(new Date()))}
                    className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
                  >
                    בחר היום
                  </button>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">אירועים וחגים בתאריך זה</h3>

                  {/* תאריך עברי וזמני שבת */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 font-medium mb-1">
                      {getHebrewDate(selected)}
                    </div>
                    {getShabbatTimes(selected) && (
                      <div className="text-xs text-blue-600">
                        {getShabbatTimes(selected).name} - {getShabbatTimes(selected).time}
                      </div>
                    )}
                    {getParsha(selected) && isShabbat(selected) && (
                      <div className="text-xs text-purple-600 mt-1">
                        {getParsha(selected)}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {/* חגים יהודיים */}
                    {(holidaysByKey.get(toISODateKey(selected)) || []).map((holiday) => (
                      <li key={holiday.name} className={`rounded-xl border p-3 ${holidayTypesHebrew[holiday.type].color}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{holidayTypesHebrew[holiday.type].icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{getHebrewHolidayName(holiday.fullEvent)}</div>
                            <div className="text-xs opacity-80">{holidayTypesHebrew[holiday.type].name}</div>
                          </div>
                        </div>
                      </li>
                    ))}

                    {/* אירועים רגילים */}
                    {(eventsByKey.get(toISODateKey(selected)) || []).map((ev) => (
                      <li key={ev.id} className="rounded-xl border border-stone-200 p-3 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{ev.title}</div>
                            {ev.time && <div className="text-xs text-stone-500">{ev.time}</div>}
                            {ev.description && <div className="text-sm mt-1 text-stone-700 whitespace-pre-wrap">{ev.description}</div>}
                          </div>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="מחק אירוע"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}

                    {/* הודעה אם אין כלום */}
                    {(holidaysByKey.get(toISODateKey(selected)) || []).length === 0 &&
                      !(eventsByKey.get(toISODateKey(selected)) || []).length && (
                        <div className="text-sm text-stone-500 text-center py-4">
                          אין אירועים או חגים ביום זה
                        </div>
                      )}
                  </ul>
                </div>
              </div>

              {/* סטטיסטיקות החודש */}
              <div className="rounded-3xl border border-stone-200 bg-white p-5">
                <h3 className="font-medium mb-3">סטטיסטיקות החודש</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>חגים יהודיים:</span>
                    <span className="font-medium">{monthlyHolidays.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>אירועים שלי:</span>
                    <span className="font-medium">{events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ספרים בקטלוג:</span>
                    <span className="font-medium">{books.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>שבתות:</span>
                    <span className="font-medium">{
                      grid.filter(({ date }) => isShabbat(date) &&
                        date.getMonth() === cursor.getMonth()).length
                    }</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* תצוגת קטלוג ספרים */}
        {currentView === 'catalog' && (
          <BookCatalog
            books={books}
            setBooks={setBooks}
            user={user}
            categories={categories}
            onBooksChange={(newBooks) => setBooks(newBooks)}
          />
        )}

        {/* תצוגת הספרים שלי - רק למשתמשים רגילים */}
        {currentView === 'borrowed' && user.role !== 'admin' && (
          <BorrowedBooks
            user={user}
            onBookReturned={(bookId) => {
              console.log('ספר הוחזר:', bookId);
            }}
          />
        )}

        {/* תצוגת בקשות החזרה - רק למנהלים */}
        {currentView === 'returns' && user.role === 'admin' && (
          <ReturnRequestsManagement currentUser={user} />
        )}

        {/* תצוגת פנל אדמין - רק למנהלים */}
        {currentView === 'admin' && user.role === 'admin' && (
          <AdminPanel
            events={events}
            announcements={announcements}
            onDeleteEvent={handleDeleteEvent}
            currentUser={user}
          />
        )}

        {/* תצוגת ניהול בקשות הלואה - למנהלים */}
        {currentView === 'loan-requests' && user.role === 'admin' && (
          <LoanRequestsManagement currentUser={user} />
        )}
      </main>
      {/* פנל הוספת אירוע - רק למנהלים */}
      {panelOpen && user.role === 'admin' && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 p-4" aria-modal="true" role="dialog">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">אירוע חדש</div>
                <div className="text-sm text-stone-500">
                  {fmtHebFull.format(selected)} • {selected.toLocaleDateString("he-IL")}
                </div>
                <div className="text-xs text-blue-600">
                  {getHebrewDate(selected)}
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-xl px-3 py-1.5 border border-stone-300 text-sm hover:bg-stone-100"
              >
                סגור
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-sm">
                כותרת
                <input
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((s) => ({ ...s, title: e.target.value }))}
                  placeholder="שם האירוע (למשל: השקת ספר)"
                />
              </label>
              <label className="block text-sm">
                שעה (אופציונלי)
                <input
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent((s) => ({ ...s, time: e.target.value }))}
                  placeholder="למשל 18:30"
                />
              </label>
              <label className="block text-sm">
                תיאור
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((s) => ({ ...s, description: e.target.value }))}
                  placeholder={"פרטים נוספים, כתובת, קישור להרשמה וכו'"}
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
              >
                ביטול
              </button>
              <button
                onClick={handleAddEvent}
                disabled={loading || !newEvent.title.trim()}
                className="rounded-2xl px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "שומר..." : 'שמור אירוע'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-stone-500">
        מערכת ספרייתֿ שילה • נבנה ב-React + Firebase • לוח שנה יהודי אוטומטי עם @hebcal/core • ניהול הרשאות מתקדם
      </footer>
    </div>
  );
}
