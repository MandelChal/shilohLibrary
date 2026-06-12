// src/components/ImageGallery.jsx - קומפוננט גלריית תמונות
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';

const ImageGallery = ({
    images = [],
    onImageDelete,
    onImageAdd,
    canEdit = false,
    className = ""
}) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openImageModal = (index) => {
        setCurrentIndex(index);
        setSelectedImage(images[index]);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    const goToNext = () => {
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(nextIndex);
        setSelectedImage(images[nextIndex]);
    };

    const goToPrevious = () => {
        const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(prevIndex);
        setSelectedImage(images[prevIndex]);
    };

    const handleImageDelete = (index, e) => {
        e.stopPropagation();
        if (window.confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
            onImageDelete(index);
            if (selectedImage && currentIndex === index) {
                closeModal();
            }
        }
    };

    if (!images || images.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <div className="text-gray-400 mb-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        📷
                    </div>
                    <p>אין תמונות להציג</p>
                </div>
                {canEdit && onImageAdd && (
                    <button
                        onClick={onImageAdd}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
                    >
                        <Plus size={16} />
                        הוסף תמונות
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            {/* גלריית התמונות */}
            <div className={`${className}`}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square"
                            onClick={() => openImageModal(index)}
                        >
                            <img
                                src={typeof image === 'string' ? image : image.url}
                                alt={`תמונה ${index + 1}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                loading="lazy"
                            />

                            {/* רקע כהה בהרחף */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />

                            {/* כפתור מחיקה */}
                            {canEdit && onImageDelete && (
                                <button
                                    onClick={(e) => handleImageDelete(index, e)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="מחק תמונה"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}

                            {/* מספר תמונה */}
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                            </div>
                        </div>
                    ))}

                    {/* כפתור הוספת תמונות */}
                    {canEdit && onImageAdd && (
                        <div
                            onClick={onImageAdd}
                            className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                            <div className="text-center text-gray-500">
                                <Plus size={24} className="mx-auto mb-2" />
                                <span className="text-sm">הוסף תמונות</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* חלון תצוגת תמונה מלאה */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-4xl max-h-full">
                        {/* כפתור סגירה */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 bg-white bg-opacity-20 text-white rounded-full p-2 hover:bg-opacity-30 z-10"
                        >
                            <X size={24} />
                        </button>

                        {/* כפתורי ניווט */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={goToPrevious}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 text-white rounded-full p-2 hover:bg-opacity-30"
                                >
                                    <ChevronRight size={24} />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 text-white rounded-full p-2 hover:bg-opacity-30"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            </>
                        )}

                        {/* התמונה */}
                        <img
                            src={typeof selectedImage === 'string' ? selectedImage : selectedImage.url}
                            alt={`תמונה ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain"
                        />

                        {/* מידע על התמונה */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                            תמונה {currentIndex + 1} מתוך {images.length}
                            {typeof selectedImage === 'object' && selectedImage.name && (
                                <span className="block text-sm opacity-75">{selectedImage.name}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageGallery;