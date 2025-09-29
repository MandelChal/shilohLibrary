// src/components/BookCard.jsx
import React from 'react';
import { User, Star, MapPin, Bell, Edit2, Trash2, Heart, ArrowRight } from 'lucide-react';
import { getStatusColor, getStatusText, getCategoryColor, formatBookLocation } from '../utils/bookHelpers';
const BookCard = ({
    book,
    favorites,
    toggleFavorite,
    setSelectedBook,
    user,
    onEditBook,
    onDeleteBook,
    categories,
    pendingRequests = [],
    onUpdateRequestStatus
}) => {
    const hasRequests = pendingRequests.length > 0;

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        toggleFavorite(book.id);
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEditBook(book);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDeleteBook(book.id);
    };

    const handleCardClick = () => {
        setSelectedBook(book);
    };

    const handleBellClick = (e) => {
        e.stopPropagation();
        setSelectedBook(book);
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer">
            <div className="relative">
                <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-48 object-cover"
                    onClick={handleCardClick}
                />

                {/* אינדיקטור בקשות השאלה לאדמין */}
                {user?.role === 'admin' && hasRequests && (
                    <div className="absolute top-2 right-12 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold animate-pulse">
                        {pendingRequests.length}
                    </div>
                )}

                {/* כפתור מועדפים */}
                <button
                    onClick={handleFavoriteClick}
                    className={`absolute top-2 right-2 p-2 rounded-full ${favorites.has(book.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
                        } hover:scale-110 transition-transform`}
                    title={favorites.has(book.id) ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
                >
                    <Heart size={16} fill={favorites.has(book.id) ? 'white' : 'none'} />
                </button>

                {/* תג קטגוריה */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs text-white bg-${getCategoryColor(book.category, categories)}-500`}>
                    {categories.find(c => c.id === book.category)?.name}
                </div>

                {/* סטטוס הספר */}
                <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs ${getStatusColor(book.status)}`}>
                    {getStatusText(book.status)}
                </div>

                {/* כפתורי אדמין */}
                {user?.role === 'admin' && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        {hasRequests && (
                            <button
                                onClick={handleBellClick}
                                className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                                title={`יש ${pendingRequests.length} בקשות השאלה`}
                            >
                                <Bell size={14} />
                            </button>
                        )}
                        <button
                            onClick={handleEditClick}
                            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            title="ערוך ספר"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="מחק ספר"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* תוכן הכרטיס */}
            <div className="p-4" onClick={handleCardClick}>
                <h3 className="font-bold text-lg mb-1 text-right line-clamp-2">{book.title}</h3>
                <p className="text-gray-600 mb-2 text-right flex items-center justify-end">
                    <User size={14} className="ml-1" />
                    {book.author}
                </p>

                {/* דירוג ומיקום */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <Star className="text-yellow-400 fill-current" size={14} />
                        <span className="text-sm text-gray-600 ml-1">{book.rating}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={14} className="ml-1" />
                        <span>{formatBookLocation(book.location)}</span>
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

                {/* תיאור הספר */}
                <p className="text-gray-700 text-sm mb-3 text-right line-clamp-2">
                    {book.description}
                </p>

                {/* כפתור צפייה בפרטים */}
                <button
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                    onClick={handleCardClick}
                >
                    {user?.role === 'admin' && hasRequests ? 'צפה בפרטים ובקשות' : 'צפה בפרטים'}
                    <ArrowRight size={16} className="mr-2" />
                </button>
            </div>
        </div>
    );
};

export default BookCard;