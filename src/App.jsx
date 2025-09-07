import React, { useEffect, useMemo, useState } from "react";
import { User, Settings, Calendar, LogOut, Trash2, Book, Search, Heart, MapPin, Filter, ArrowRight, Star, FileText, X, Plus, Edit2, Save, AlertCircle } from "lucide-react";

// Components
import LoginScreen from './components/LoginScreen';
import Navigation from './components/Navigation';
import SystemAnnouncements from './components/SystemAnnouncements';
import AdminPanel from './components/AdminPanel';

// Utils - עם תצוגה עברית בלבד
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

// Firebase (optional - מוגדר לעבוד גם בלי)
import { db, isFirebaseEnabled } from './utils/firebase';

// Firebase imports (conditional)
let collection, addDoc, onSnapshot, query, where, serverTimestamp, Timestamp;

if (isFirebaseEnabled) {
  try {
    const firestore = await import('firebase/firestore');
    collection = firestore.collection;
    addDoc = firestore.addDoc;
    onSnapshot = firestore.onSnapshot;
    query = firestore.query;
    where = firestore.where;
    serverTimestamp = firestore.serverTimestamp;
    Timestamp = firestore.Timestamp;
  } catch (error) {
    console.warn('Firebase imports failed:', error);
  }
}

// נתוני ספרים לדוגמה
const initialBooks = [
  {
    id: '1',
    title: 'חומש רש"י',
    author: 'רש"י',
    category: 'torah',
    location: { color: 'כחול', letter: 'א', number: '15' },
    description: 'פירוש רש"י המפורסם על התורה עם הערות והסברים מקיפים',
    image: '/api/placeholder/200/250',
    rating: 4.8,
    status: 'available'
  },
  {
    id: '2',
    title: 'משנה ברורה',
    author: 'החפץ חיים',
    category: 'halacha',
    location: { color: 'אדום', letter: 'ב', number: '23' },
    description: 'פירוש מקיף על שולחן ערוך אורח חיים',
    image: '/api/placeholder/200/250',
    rating: 4.9,
    status: 'borrowed'
  },
  {
    id: '3',
    title: 'תהילים מפורש',
    author: 'מלבי"ם',
    category: 'nevi',
    location: { color: 'ירוק', letter: 'ג', number: '7' },
    description: 'פירוש המלבי"ם על ספר תהילים',
    image: '/api/placeholder/200/250',
    rating: 4.7,
    status: 'available'
  },
  {
    id: '4',
    title: 'בראשית רבה',
    author: 'חכמי התלמוד',
    category: 'midrash',
    location: { color: 'סגול', letter: 'ד', number: '12' },
    description: 'מדרש רבה על ספר בראשית',
    image: '/api/placeholder/200/250',
    rating: 4.6,
    status: 'maintenance'
  },
  {
    id: '5',
    title: 'משנה סדר מועד',
    author: 'תנאים',
    category: 'talmud',
    location: { color: 'כתום', letter: 'ה', number: '31' },
    description: 'משניות סדר מועד עם פירושים',
    image: '/api/placeholder/200/250',
    rating: 4.5,
    status: 'available'
  },
  {
    id: '6',
    title: 'שו"ת חתם סופר',
    author: 'החתם סופר',
    category: 'responsa',
    location: { color: 'חום', letter: 'ו', number: '45' },
    description: 'שאלות ותשובות מהחתם סופר',
    image: '/api/placeholder/200/250',
    rating: 4.8,
    status: 'available'
  }
];

// קטגוריות ספרים
const categories = [
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
    case 'maintenance': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'available': return 'זמין';
    case 'borrowed': return 'מושאל';
    case 'maintenance': return 'תחזוקה';
    default: return 'לא ידוע';
  }
};

const getCategoryColor = (category) => {
  const cat = categories.find(c => c.id === category);
  return cat ? cat.color : 'gray';
};

// קומפוננט עריכת ספר
const BookEditor = ({ book, onSave, onCancel, isNew = false }) => {
  const [formData, setFormData] = useState(book || {
    title: '',
    author: '',
    category: '',
    location: { color: '', letter: '', number: '' },
    description: '',
    image: '/api/placeholder/200/250',
    rating: 4.0,
    status: 'available'
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = 'שם הספר נדרש';
    if (!formData.author?.trim()) newErrors.author = 'שם המחבר נדרש';
    if (!formData.category) newErrors.category = 'קטגוריה נדרשת';
    if (!formData.location?.color?.trim()) newErrors.locationColor = 'צבע נדרש';
    if (!formData.location?.letter?.trim()) newErrors.locationLetter = 'אות נדרשת';
    if (!formData.location?.number?.trim()) newErrors.locationNumber = 'מספר נדרש';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
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
                />
                {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-right">קטגוריה</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={`w-full p-2 border rounded text-right ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">בחר קטגוריה</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-right">סטטוס</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded text-right"
                >
                  <option value="available">זמין</option>
                  <option value="borrowed">מושאל</option>
                  <option value="maintenance">תחזוקה</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-right">מיקום בספריה</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    value={formData.location?.color || ''}
                    onChange={(e) => updateLocation('color', e.target.value)}
                    className={`w-full p-2 border rounded text-right ${errors.locationColor ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="צבע"
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
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Save size={16} className="inline mr-2" />
                שמור
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// קומפוננט כרטיס ספר
const BookCard = ({ book, favorites, toggleFavorite, setSelectedBook, user, onEditBook, onDeleteBook }) => (
  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
    <div className="relative">
      <img
        src={book.image}
        alt={book.title}
        className="w-full h-48 object-cover"
      />
      <button
        onClick={() => toggleFavorite(book.id)}
        className={`absolute top-2 right-2 p-2 rounded-full ${favorites.has(book.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
          } hover:scale-110 transition-transform`}
      >
        <Heart size={16} fill={favorites.has(book.id) ? 'white' : 'none'} />
      </button>
      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs text-white bg-${getCategoryColor(book.category)}-500`}>
        {categories.find(c => c.id === book.category)?.name}
      </div>
      <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs ${getStatusColor(book.status)}`}>
        {getStatusText(book.status)}
      </div>
      {user?.role === 'admin' && (
        <div className="absolute bottom-2 right-2 flex gap-1">
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

      <p className="text-gray-700 text-sm mb-3 text-right line-clamp-2">
        {book.description}
      </p>

      <button
        onClick={() => setSelectedBook(book)}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
      >
        צפה בפרטים
        <ArrowRight size={16} className="mr-2" />
      </button>
    </div>
  </div>
);

// קומפוננט פרטי ספר (חלון קופץ)
const BookDetail = ({ book, favorites, toggleFavorite, onClose, user, onEditBook, onDeleteBook }) => (
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

        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-right">
              <h4 className="font-semibold mb-2 flex items-center justify-end">
                <FileText size={16} className="ml-2" />
                קטגוריה
              </h4>
              <span className={`px-3 py-1 rounded-full text-sm text-white bg-${getCategoryColor(book.category)}-500`}>
                {categories.find(c => c.id === book.category)?.name}
              </span>
            </div>

            <div className="text-right">
              <h4 className="font-semibold mb-2 flex items-center justify-end">
                <MapPin size={16} className="ml-2" />
                מיקום בספריה
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
  </div>
);

// קומפוננט קטלוג ספרים
const BookCatalog = ({ books, setBooks, user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [showBookEditor, setShowBookEditor] = useState(false);

  // Initialize favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('libraryFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

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
  const handleSaveBook = (bookData) => {
    if (editingBook) {
      // עדכון ספר קיים
      setBooks(prev => prev.map(book =>
        book.id === editingBook.id ? { ...bookData, id: editingBook.id } : book
      ));
    } else {
      // הוספת ספר חדש
      const newBook = {
        ...bookData,
        id: Date.now().toString()
      };
      setBooks(prev => [...prev, newBook]);
    }
    setShowBookEditor(false);
    setEditingBook(null);
  };

  // מחיקת ספר
  const handleDeleteBook = (bookId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הספר? פעולה זו לא ניתנת לביטול.')) {
      setBooks(prev => prev.filter(book => book.id !== bookId));
      setSelectedBook(null);
      // הסרה מהמועדפים אם קיים
      const newFavorites = new Set(favorites);
      newFavorites.delete(bookId);
      setFavorites(newFavorites);
    }
  };

  return (
    <div className="space-y-6">
      {/* כותרת וכפתורים */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">קטלוג ספרים</h2>
          <p className="text-gray-600 mt-1">חפש וגלה ספרים בספריית שִׁלֹה</p>
        </div>
        <div className="flex items-center gap-4">
          {user.role === 'admin' && (
            <button
              onClick={handleAddBook}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Plus size={16} />
              הוסף ספר חדש
            </button>
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
        />
      )}
    </div>
  );
};

// ------------------------------------------------------
// קומפוננטה ראשית עם לוח יהודי עברי בלבד
// ------------------------------------------------------
export default function LibrarySystem() {
  const [user, setUser] = useState(null);
  const [today] = useState(new Date());
  const [cursor, setCursor] = useState(startOfDay(new Date()));
  const [selected, setSelected] = useState(startOfDay(new Date()));
  const [events, setEvents] = useState([]);
  const [monthlyHolidays, setMonthlyHolidays] = useState([]);
  const [books, setBooks] = useState(initialBooks);
  const [announcements, setAnnouncements] = useState([
    {
      id: "1",
      title: "ברוכים הבאים למערכת החדשה!",
      message: "המערכת הושדרגה עם לוח שנה עברי מלא וחגים יהודיים אוטומטיים + קטלוג ספרים דיגיטלי",
      type: "success",
      createdAt: new Date().toISOString(),
      createdBy: "מנהל המערכת"
    },
    {
      id: "2",
      title: "לוח שנה יהודי מעודכן",
      message: "כעת הלוח מציג חגים יהודיים, זמני שבת והדלקת נרות באופן אוטומטי",
      type: "info",
      createdAt: new Date().toISOString(),
      createdBy: "מנהל המערכת"
    }
  ]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", time: "" });
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState("calendar");

  const grid = useMemo(() => monthMatrix(cursor), [cursor]);

  // שמירת ספרים ב-localStorage
  useEffect(() => {
    const savedBooks = localStorage.getItem('libraryBooks');
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('libraryBooks', JSON.stringify(books));
  }, [books]);

  // טעינת חגים יהודיים לחודש הנוכחי
  useEffect(() => {
    try {
      const holidays = getCachedJewishEventsForMonth(cursor.getFullYear(), cursor.getMonth());
      setMonthlyHolidays(holidays);
      console.log(`נטענו ${holidays.length} אירועים יהודיים לחודש ${cursor.getMonth() + 1}/${cursor.getFullYear()}`);
    } catch (error) {
      console.error('שגיאה בטעינת חגים יהודיים:', error);
      setMonthlyHolidays([]);
    }
  }, [cursor]);

  // קריאת אירועים מ-Firebase (אם מוגדר)
  useEffect(() => {
    if (!isFirebaseEnabled || !db) {
      console.log('רץ במצב מקומי - Firebase לא מוגדר');
      return;
    }

    const startWindow = startOfDay(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    const endWindow = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    endWindow.setHours(23, 59, 59, 999);

    try {
      const q = query(
        collection(db, "events"),
        where("date", ">=", Timestamp.fromDate(startWindow)),
        where("date", "<=", Timestamp.fromDate(endWindow))
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const eventList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventList);
        console.log('אירועים נטענו מ-Firebase:', eventList.length);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('שגיאה בטעינת אירועים:', error);
    }
  }, [cursor.getFullYear(), cursor.getMonth()]);

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

  async function handleAddEvent() {
    if (!newEvent.title.trim()) return;
    setLoading(true);

    try {
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        time: newEvent.time.trim(),
        date: isFirebaseEnabled ? Timestamp.fromDate(selected) : selected.toISOString(),
        createdAt: isFirebaseEnabled ? serverTimestamp() : new Date().toISOString(),
        createdBy: user.name
      };

      if (isFirebaseEnabled && db) {
        await addDoc(collection(db, "events"), eventData);
        console.log('אירוע נשמר ב-Firebase');
      } else {
        const newEventObj = {
          id: Date.now().toString(),
          ...eventData,
          date: selected.toISOString()
        };
        setEvents(prev => [...prev, newEventObj]);
        console.log('אירוע נשמר מקומית');
      }

      setNewEvent({ title: "", description: "", time: "" });
      setPanelOpen(false);
    } catch (error) {
      console.error('שגיאה בשמירת האירוע:', error);
      alert("שגיאה בשמירת האירוע: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteEvent = (eventId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את האירוע?")) {
      if (isFirebaseEnabled && db) {
        console.log('מחיקה מ-Firebase:', eventId);
      } else {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        console.log('אירוע נמחק מקומית:', eventId);
      }
    }
  };

  const handleAddAnnouncement = (announcement) => {
    setAnnouncements(prev => [announcement, ...prev]);
  };

  const handleDeleteAnnouncement = (announcementId) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  const weekdays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
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
                {user.role === 'admin' ? 'פאנל ניהול' : 'לוח שנה עברי ואירועי הספרייה'}
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
            {/* עמודת תוכן/בוקריים */}
            <section className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-stone-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
                <h2 className="text-2xl font-semibold mb-2">
                  ברוך הבא {user.name}
                </h2>
                <p className="text-stone-700 mb-4">
                  {user.role === 'admin'
                    ? 'כאן תוכל לנהל אוספים, אירועים ולוח השנה היהודי. יש לך גישה מלאה לכללל הפונקציות.'
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
                      const dayGreg = fmtGregShort.format(date); // מספר לועזי
                      const dayHebrewLetter = getHebrewDayLetter(date); // אות עברית
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
          <BookCatalog books={books} setBooks={setBooks} user={user} />
        )}

        {/* תצוגת פאנל אדמין */}
        {currentView === 'admin' && user.role === 'admin' && (
          <AdminPanel
            events={events}
            announcements={announcements}
            onDeleteEvent={handleDeleteEvent}
            currentUser={user}
          />
        )}
      </main>

      {/* פאנל הוספת אירוע - רק למנהלים */}
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
        מערכת ספריית שילה • נבנה ב-React + Firebase • לוח שנה יהודי אוטומטי עם @hebcal/core • ניהול הרשאות מתקדם
      </footer>
    </div>
  );
}