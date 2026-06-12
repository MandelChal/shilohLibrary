// src/hooks/useBooks.js
import { useState, useEffect } from 'react';
import { getBooks, subscribeToCollection } from '../utils/dbHelpers';
import { isFirebaseEnabled } from '../utils/firebase';

export const useBooks = (initialBooks = []) => {
    const [books, setBooks] = useState(initialBooks);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        setLoading(true);
        setError(null);
        try {
            const booksData = await getBooks();
            setBooks(booksData);
            console.log('ספרים נטענו:', booksData.length);
        } catch (err) {
            console.error('שגיאה בטעינת ספרים:', err);
            setError(err.message);
            // fallback לספרים ראשוניים
            setBooks(initialBooks);
        } finally {
            setLoading(false);
        }
    };

    // מעקב אחר שינויים בזמן אמת
    useEffect(() => {
        if (!isFirebaseEnabled) {
            console.log('Firebase לא מוגדר - לא מחבר listener לספרים');
            return;
        }

        const unsubscribe = subscribeToCollection('books', (booksData) => {
            setBooks(booksData);
            console.log('ספרים עודכנו מ-Firebase:', booksData.length);
        });

        return unsubscribe;
    }, []);

    const addBookToState = (newBook) => {
        setBooks(prev => [...prev, newBook]);
    };

    const updateBookInState = (bookId, updatedData) => {
        setBooks(prev => prev.map(book =>
            book.id === bookId ? { ...book, ...updatedData } : book
        ));
    };

    const removeBookFromState = (bookId) => {
        setBooks(prev => prev.filter(book => book.id !== bookId));
    };

    return {
        books,
        setBooks,
        loading,
        error,
        loadBooks,
        addBookToState,
        updateBookInState,
        removeBookFromState
    };
};