// src/utils/bookHelpers.js
// פונקציות עזר לניהול ספרים

/**
 * מחזיר צבע סטטוס לפי מצב הספר
 */
export const getStatusColor = (status) => {
    switch (status) {
        case 'available': return 'text-green-600 bg-green-100';
        case 'borrowed': return 'text-orange-600 bg-orange-100';
        case 'processing': return 'text-blue-600 bg-blue-100';
        case 'processing_return': return 'text-purple-600 bg-purple-100';
        case 'maintenance': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

/**
 * מחזיר טקסט סטטוס בעברית
 */
export const getStatusText = (status) => {
    switch (status) {
        case 'available': return 'זמין';
        case 'borrowed': return 'מושאל';
        case 'processing': return 'בעיבוד';
        case 'processing_return': return 'ממתין לאישור החזרה';
        case 'maintenance': return 'תחזוקה';
        default: return 'לא ידוע';
    }
};

/**
 * מחזיר צבע קטגוריה לפי ID
 */
export const getCategoryColor = (categoryId, categories) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.color : 'gray';
};

/**
 * מחזיר שם קטגוריה לפי ID
 */
export const getCategoryName = (categoryId, categories) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'לא ידוע';
};

/**
 * עיצוב מיקום ספר לטקסט
 */
export const formatBookLocation = (location) => {
    if (!location) return '';
    return `${location.color} ${location.letter}${location.number}`;
};

/**
 * סינון ספרים לפי חיפוש, קטגוריה ומועדפים
 */
export const filterBooks = (books, searchQuery, selectedCategory, showFavorites, favorites) => {
    return books.filter(book => {
        const matchesSearch = !searchQuery ||
            book.title.includes(searchQuery) ||
            book.author.includes(searchQuery) ||
            book.description.includes(searchQuery);

        const matchesCategory = !selectedCategory || book.category === selectedCategory;
        const matchesFavorites = !showFavorites || favorites.has(book.id);

        return matchesSearch && matchesCategory && matchesFavorites;
    });
};

/**
 * מיון ספרים לפי פרמטר
 */
export const sortBooks = (books, sortBy = 'title') => {
    const sorted = [...books];

    switch (sortBy) {
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title, 'he'));
        case 'author':
            return sorted.sort((a, b) => a.author.localeCompare(b.author, 'he'));
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'newest':
            return sorted.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
        default:
            return sorted;
    }
};

/**
 * בדיקה אם ספר זמין להשאלה
 */
export const isBookAvailable = (book) => {
    return book && book.status === 'available';
};

/**
 * בדיקה אם ספר מושאל
 */
export const isBookBorrowed = (book) => {
    return book && book.status === 'borrowed';
};

/**
 * חישוב מספר ימים עד תאריך החזרה
 */
export const calculateDaysUntilReturn = (returnDate) => {
    if (!returnDate) return null;

    const today = new Date();
    const returnDay = new Date(returnDate);
    const diffTime = returnDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

/**
 * בדיקה אם ספר באיחור החזרה
 */
export const isBookOverdue = (book) => {
    if (!book || !book.expectedReturnDate) return false;

    const daysLeft = calculateDaysUntilReturn(book.expectedReturnDate);
    return daysLeft !== null && daysLeft < 0;
};

/**
 * קבלת טקסט מצב החזרה
 */
export const getReturnStatusText = (daysLeft) => {
    if (daysLeft === null) return 'לא ידוע';
    if (daysLeft < 0) return `איחור של ${Math.abs(daysLeft)} ימים`;
    if (daysLeft === 0) return 'יש להחזיר היום!';
    if (daysLeft === 1) return 'יש להחזיר מחר';
    return `נותרו ${daysLeft} ימים`;
};

/**
 * קבלת צבע סטטוס החזרה
 */
export const getReturnStatusColor = (daysLeft) => {
    if (daysLeft === null) return 'text-gray-600 bg-gray-100';
    if (daysLeft < 0) return 'text-red-600 bg-red-100 border-red-300';
    if (daysLeft <= 3) return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-green-600 bg-green-100 border-green-300';
};

/**
 * אימות נתוני ספר
 */
export const validateBookData = (bookData) => {
    const errors = {};

    if (!bookData.title?.trim()) {
        errors.title = 'שם הספר נדרש';
    }

    if (!bookData.author?.trim()) {
        errors.author = 'שם המחבר נדרש';
    }

    if (!bookData.category) {
        errors.category = 'קטגוריה נדרשת';
    }

    if (!bookData.location?.color?.trim()) {
        errors.locationColor = 'צבע נדרש';
    }

    if (!bookData.location?.letter?.trim()) {
        errors.locationLetter = 'אות נדרשת';
    }

    if (!bookData.location?.number?.trim()) {
        errors.locationNumber = 'מספר נדרש';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * יצירת אובייקט ספר ריק
 */
export const createEmptyBook = () => ({
    title: '',
    author: '',
    location: { color: '', letter: '', number: '' },
    description: '',
    image: '/api/placeholder/200/250',
    rating: 4.0,
    status: 'available',
    category: ''
});

/**
 * קבלת סטטיסטיקות ספרים
 */
export const getBookStatistics = (books) => {
    return {
        total: books.length,
        available: books.filter(b => b.status === 'available').length,
        borrowed: books.filter(b => b.status === 'borrowed').length,
        processing: books.filter(b => b.status === 'processing').length,
        maintenance: books.filter(b => b.status === 'maintenance').length,
        byCategory: books.reduce((acc, book) => {
            acc[book.category] = (acc[book.category] || 0) + 1;
            return acc;
        }, {})
    };
};