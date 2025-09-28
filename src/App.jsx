// src/App.jsx - גרסה מלאה ומתוקנת
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
import TimePicker from './components/TimePicker';

// Utils
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
  sendLoanRequestNotification,
  notifyAdminNewRequest,
  createReturnEvent,
  createAdminReturnEvent,
  checkOverdueBooks,
  notifyAdminsAboutOverdueBooks,
  createAutomaticReturnEvents,
  validatePhoneNumber,
  formatPhoneNumber,
  validateUserPhoneNumber,
  addLoanRequestWithPhoneValidation,
  EVENT_TYPES,
  getEventColor,
  getEventIcon,
  isEventVisibleToUser,
  filterEventsByVisibility,
  createEventWithType
} from './utils/dbHelpers';

// Firebase config
import { db, isFirebaseEnabled } from './utils/firebase';

// קטגוריות ספרים
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
    case 'processing': return 'text-blue-600 bg-blue-100';
    case 'maintenance': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'available': return 'זמין';
    case 'borrowed': return 'מושאל';
    case 'processing': return 'בעיבוד';
    case 'maintenance': return 'תחזוקה';
    default: return 'לא ידוע';
  }
};

const getCategoryColor = (category, categories) => {
  const cat = categories.find(c => c.id === category);
  return cat ? cat.color : 'gray';
};

// BookEditor Component
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

      // הצגת הודעת הצלחה
      const action = isNew ? 'נוסף' : 'עודכן';
      alert(`הספר "${formData.title}" ${action} בהצלחה!`);

      // סגירה אוטומטית של החלונית
      onCancel();
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

// BookCatalog Component
const BookCatalog = ({ books, setBooks, user, categories }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showBookEditor, setShowBookEditor] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.includes(searchQuery) ||
      book.author.includes(searchQuery) ||
      book.description.includes(searchQuery);
    const matchesCategory = !selectedCategory || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddBook = () => {
    setEditingBook(null);
    setShowBookEditor(true);
  };

  const handleSaveBook = async (bookData) => {
    try {
      if (editingBook) {
        await updateBook(editingBook.id, bookData);
        const updatedBooks = books.map(book =>
          book.id === editingBook.id ? { ...bookData, id: editingBook.id } : book
        );
        setBooks(updatedBooks);
      } else {
        const newBook = await addBook(bookData);
        setBooks(prev => [...prev, newBook]);
      }

      setShowBookEditor(false);
      setEditingBook(null);
    } catch (error) {
      alert('שגיאה בשמירת הספר: ' + error.message);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">קטלוג ספרים</h2>
          <p className="text-gray-600 mt-1">חפש וגלה ספרים בספריית שִׁלֹה</p>
        </div>
        {user.role === 'admin' && (
          <button
            onClick={handleAddBook}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Plus size={16} />
            הוסף ספר חדש
          </button>
        )}
      </div>

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

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Filter className="ml-2" size={20} />
          חיפוש לפי קטגוריות
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedCategory ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} border`}
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

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          נמצאו {filteredBooks.length} ספרים
          {selectedCategory && ` בקטגוריה: ${categories.find(c => c.id === selectedCategory)?.name}`}
        </h3>

        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="relative">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs text-white bg-${getCategoryColor(book.category, categories)}-500`}>
                    {categories.find(c => c.id === book.category)?.name}
                  </div>
                  <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs ${getStatusColor(book.status)}`}>
                    {getStatusText(book.status)}
                  </div>
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
                  <p className="text-gray-700 text-sm mb-3 text-right line-clamp-2">
                    {book.description}
                  </p>
                </div>
              </div>
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

      {showBookEditor && (
        <BookEditor
          book={editingBook}
          isNew={!editingBook}
          onSave={handleSaveBook}
          onCancel={() => {
            setShowBookEditor(false);
            setEditingBook(null);
          }}
        />
      )}
    </div>
  );
};

// קומפוננטה ראשית
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

  const grid = useMemo(() => monthMatrix(cursor), [cursor]);

  // טעינה ראשונית
  useEffect(() => {
    const initializeData = async () => {
      try {
        await initializeDefaultData();

        const [booksData, categoriesData, announcementsData, eventsData] = await Promise.all([
          getBooks(),
          getCategories(),
          getAnnouncements(),
          getEvents()
        ]);

        setBooks(booksData.length > 0 ? booksData : []);
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
        setBooks([]);
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

  // בדיקת ספרים שפג תוקפם - פעם ביום
  useEffect(() => {
    const checkOverdue = async () => {
      try {
        await checkOverdueBooks();
      } catch (error) {
        console.error('שגיאה בבדיקת ספרים שפג תוקפם:', error);
      }
    };

    // בדיקה ראשונית
    checkOverdue();

    // בדיקה יומית בשעה 9:00
    const now = new Date();
    const nextCheck = new Date();
    nextCheck.setHours(9, 0, 0, 0);
    if (nextCheck <= now) {
      nextCheck.setDate(nextCheck.getDate() + 1);
    }

    const timeUntilNextCheck = nextCheck.getTime() - now.getTime();
    const interval = setInterval(checkOverdue, 24 * 60 * 60 * 1000); // 24 שעות

    return () => clearInterval(interval);
  }, []);

  // טעינת חגים יהודיים
  useEffect(() => {
    try {
      const holidays = getCachedJewishEventsForMonth(cursor.getFullYear(), cursor.getMonth());
      setMonthlyHolidays(holidays);
    } catch (error) {
      console.error('שגיאה בטעינת חגים יהודיים:', error);
      setMonthlyHolidays([]);
    }
  }, [cursor]);

  // מעקב אחר שינויים ב-Firebase
  useEffect(() => {
    if (!isFirebaseEnabled || !db) {
      return;
    }

    const unsubscribeEvents = subscribeToCollection('events', (eventsData) => {
      setEvents(eventsData);
    });

    const unsubscribeBooks = subscribeToCollection('books', (booksData) => {
      setBooks(booksData);
    });

    const unsubscribeCategories = subscribeToCollection('categories', (categoriesData) => {
      setCategories(categoriesData);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeBooks();
      unsubscribeCategories();
    };
  }, []);

  const eventsByKey = useMemo(() => {
    const map = new Map();
    if (!user) return map;

    for (const ev of events) {
      if (ev.isPersonal) {
        if (user.role !== 'admin' && ev.userId !== (user.id || user.username)) {
          continue;
        }
      }

      let jsDate;
      if (ev.date?.toDate) {
        jsDate = ev.date.toDate();
      } else {
        jsDate = new Date(ev.date);
      }
      const key = toISODateKey(jsDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [events, user]);

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

  const handleLogin = (userData) => {
    try {
      if (!userData || !userData.name) {
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
        createdBy: user.name,
        userId: user.id || user.username,
        isPersonal: true
      };

      // יצירת אירוע עם סוג מתאים לפי תפקיד המשתמש
      const eventType = user.role === 'admin' ? 'admin_event' : 'personal';
      await createEventWithType(eventData, eventType);
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
      } catch (error) {
        console.error('שגיאה במחיקת אירוע:', error);
        alert('שגיאה במחיקת האירוע: ' + error.message);
      }
    }
  };

  const handleAddAnnouncement = async (announcementData) => {
    try {
      await addAnnouncement(announcementData);
    } catch (error) {
      console.error('שגיאה בהוספת הודעה:', error);
      alert('שגיאה בהוספת ההודעה: ' + error.message);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementId));
    } catch (error) {
      console.error('שגיאה בעדכון state של הודעות:', error);
    }
  };

  const weekdays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 text-stone-900">
      <Navigation />
      <SystemAnnouncements
        user={user}
        announcements={announcements}
        onAddAnnouncement={handleAddAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
      />

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

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{user.name}</span>
              {user.role === 'admin' && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">מנהל</span>
              )}
            </div>

            <NotificationCenter user={user} />

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

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* תצוגת לוח שנה */}
        {currentView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              {/* לוח שנה יהודי */}
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
                  <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-lg overflow-hidden">
                    {weekdays.map((d) => (
                      <div key={d} className="bg-stone-50 text-center text-xs font-medium py-3">
                        {d}
                      </div>
                    ))}
                  </div>

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
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-stone-800">{dayGreg}</span>
                              <span className="text-sm text-blue-600 font-medium">{dayHebrewLetter}</span>
                            </div>
                            {isToday && <span className="text-xs text-emerald-600 font-bold">היום</span>}
                          </div>

                          {shabbatTimes && (
                            <div className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded mb-1">
                              {shabbatTimes.name} {shabbatTimes.time}
                            </div>
                          )}

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
                          </div>

                          <div className="space-y-0.5">
                            {dayEvents.slice(0, holidays.length > 0 ? 1 : 2).map((ev) => {
                              // בדיקת נראות האירוע למשתמש הנוכחי
                              if (!isEventVisibleToUser(ev, user.id || user.username, user.role)) {
                                return null;
                              }

                              // קבלת צבע ואייקון לפי סוג האירוע
                              const eventColor = ev.color || getEventColor(ev.type || ev.eventType);
                              const eventIcon = ev.icon || getEventIcon(ev.type || ev.eventType);

                              return (
                                <div
                                  key={ev.id}
                                  className={`truncate rounded-md px-1.5 py-0.5 text-[9px] border ${eventColor}`}
                                  title={`${ev.description || ''}\nסוג: ${ev.type || ev.eventType || 'לא מוגדר'}`}
                                >
                                  <span className="mr-1">{eventIcon}</span>
                                  {ev.time ? `${ev.time} ` : ""}
                                  {ev.title}
                                </div>
                              );
                            })}
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

                <div className="mt-4 text-sm text-blue-600">
                  {getHebrewDate(selected)}
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">אירועים וחגים בתאריך זה</h3>

                  <ul className="space-y-2">
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

                    {(holidaysByKey.get(toISODateKey(selected)) || []).length === 0 &&
                      !(eventsByKey.get(toISODateKey(selected)) || []).length && (
                        <div className="text-sm text-stone-500 text-center py-4">
                          אין אירועים או חגים ביום זה
                        </div>
                      )}
                  </ul>
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
          />
        )}

        {/* תצוגת הספרים שלי */}
        {currentView === 'borrowed' && user.role !== 'admin' && (
          <BorrowedBooks
            user={user}
            onBookReturned={(bookId) => {
              console.log('ספר הוחזר:', bookId);
            }}
          />
        )}

        {/* תצוגת בקשות החזרה */}
        {currentView === 'returns' && user.role === 'admin' && (
          <ReturnRequestsManagement currentUser={user} />
        )}

        {/* תצוגת פנל אדמין */}
        {currentView === 'admin' && user.role === 'admin' && (
          <AdminPanel
            events={events}
            announcements={announcements}
            onDeleteEvent={handleDeleteEvent}
            currentUser={user}
          />
        )}
      </main>

      {/* פנל הוספת אירוע */}
      {panelOpen && user.role === 'admin' && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">אירוע חדש</div>
                <div className="text-sm text-stone-500">
                  {fmtHebFull.format(selected)}
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
                  placeholder="שם האירוע"
                />
              </label>
              <label className="block text-sm">
                שעה (אופציונלי)
                <TimePicker
                  value={newEvent.time}
                  onChange={(time) => setNewEvent((s) => ({ ...s, time }))}
                  placeholder="בחר שעה או הקלד (HH:MM)"
                  className="mt-1"
                />
              </label>
              <label className="block text-sm">
                תיאור
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((s) => ({ ...s, description: e.target.value }))}
                  placeholder="פרטים נוספים"
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
                className="rounded-2xl px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {loading ? "שומר..." : 'שמור אירוע'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-stone-500">
        מערכת ספרייתֿ שילה • נבנה ב-React + Firebase • לוח שנה יהודי אוטומטי
      </footer>
    </div>
  );
}