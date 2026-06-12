// src/components/BookCard.jsx - עם ניווט משופר בין תמונות
import React, { useState } from 'react';
import { User, Star, MapPin, Bell, Edit2, Trash2, Heart, ArrowRight, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const hasRequests = pendingRequests.length > 0;

    // קבלת מערך התמונות (תאימות לאחור)
    const images = book.images && book.images.length > 0 ? book.images :
        book.image ? [book.image] : ['/api/placeholder/200/250'];

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

    const handleImageNavigation = (e, direction) => {
        e.stopPropagation();
        e.preventDefault();

        if (direction === 'next') {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        } else {
            setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1);
        }
    };

    const goToImage = (index, e) => {
        e.stopPropagation();
        setCurrentImageIndex(index);
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer">
            <div className="relative">
                {/* תמונת הספר */}
                <div className="relative group">
                    <img
                        src={images[currentImageIndex]}
                        alt={book.title}
                        className="w-full h-50 object-cover transition-all duration-300"
                        style={{ height: '200px' }}
                        onClick={handleCardClick}
                    />

                    {/* אינדיקטור מספר תמונות */}
                    {images.length > 1 && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                            <Camera size={12} />
                            {currentImageIndex + 1}/{images.length}
                        </div>
                    )}

                    {/* כפתורי ניווט משופרים */}
                    {images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={(e) => handleImageNavigation(e, 'prev')}
                                className="bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all backdrop-blur-sm shadow-lg"
                                title="תמונה קודמת"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={(e) => handleImageNavigation(e, 'next')}
                                className="bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all backdrop-blur-sm shadow-lg"
                                title="תמונה הבאה"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    )}

                    {/* נקודות ניווט */}
                    {images.length > 1 && images.length <= 5 && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => goToImage(index, e)}
                                    className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                            ? 'bg-white scale-125'
                                            : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                        }`}
                                    title={`תמונה ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* רקע כהה בהרחף */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all pointer-events-none" />
                </div>

                {/* אינדיקטור בקשות השאלה למנהלים */}
                {user?.role === 'admin' && hasRequests && (
                    <div className="absolute top-2 right-12 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold animate-pulse z-10">
                        {pendingRequests.length}
                    </div>
                )}

                {/* כפתור מועדפים */}
                <button
                    onClick={handleFavoriteClick}
                    className={`absolute top-2 right-2 p-2 rounded-full z-10 ${favorites.has(book.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
                        } hover:scale-110 transition-transform shadow-lg backdrop-blur-sm`}
                    title={favorites.has(book.id) ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
                >
                    <Heart size={16} fill={favorites.has(book.id) ? 'white' : 'none'} />
                </button>

                {/* תג קטגוריה */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs text-white z-10 backdrop-blur-sm shadow-lg bg-${getCategoryColor(book.category, categories)}-500`}>
                    {categories.find(c => c.id === book.category)?.name}
                </div>

                {/* סטטוס הספר */}
                <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs z-10 backdrop-blur-sm shadow-lg ${getStatusColor(book.status)}`}>
                    {getStatusText(book.status)}
                </div>

                {/* כפתורי אדמין */}
                {user?.role === 'admin' && (
                    <div className="absolute bottom-2 right-16 flex gap-1 z-10">
                        {hasRequests && (
                            <button
                                onClick={handleBellClick}
                                className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors shadow-lg backdrop-blur-sm"
                                title={`יש ${pendingRequests.length} בקשות השאלה`}
                            >
                                <Bell size={14} />
                            </button>
                        )}
                        <button
                            onClick={handleEditClick}
                            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg backdrop-blur-sm"
                            title="עריכת ספר"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg backdrop-blur-sm"
                            title="מחיקת ספר"
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

                {/* הצגת בקשות השאלה למנהלים */}
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

                {/* כפתור צפייה בפרטים */}
                <button
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                    onClick={handleCardClick}
                >
                    {user?.role === 'admin' && hasRequests ?
                        'צפה בפרטים ובקשות' : 'צפה בפרטים'}
                    <ArrowRight size={16} className="mr-2" />
                </button>
            </div>
        </div>
    );
};

export default BookCard;