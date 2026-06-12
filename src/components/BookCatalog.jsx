// src/components/BookCatalog.jsx
import React, { useState, useEffect } from 'react';
import { Book, Search, Filter, Heart, Plus, RefreshCw, Bell } from 'lucide-react';
import BookCard from './BookCard';
import BookDetail from './BookDetail';
import { filterBooks } from '../utils/bookHelpers';
import BookEditor from './BookEditor';

import {
    updateBook,
    deleteBook,
    addBook,
    getLoanRequests,
    updateLoanRequestStatus
} from '../utils/dbHelpers';


const BookCatalog = ({ books, setBooks, user, categories, onBooksChange }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBook, setSelectedBook] = useState(null);
    const [favorites, setFavorites] = useState(new Set());
    const [showFavorites, setShowFavorites] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [showBookEditor, setShowBookEditor] = useState(false);
    const [loanRequests, setLoanRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

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

    const filteredBooks = filterBooks(books, searchQuery, selectedCategory, showFavorites, favorites);

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

            // סגירה אוטומטית של החלונית
            setShowBookEditor(false);
            setEditingBook(null);

            const action = editingBook ? 'עודכן' : 'נוסף';
            alert(`הספר "${bookData.title}" ${action} בהצלחה!`);
        } catch (error) {
            alert('שגיאה בשמירת הספר: ' + error.message);
            throw error;
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredBooks.map(book => (
                            <BookCard
                                key={book.id}
                                book={book}
                                favorites={favorites}
                                toggleFavorite={toggleFavorite}
                                setSelectedBook={setSelectedBook}
                                // user={user}
                                onEditBook={handleEditBook}
                                onDeleteBook={handleDeleteBook}
                                categories={categories}
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

export default BookCatalog;