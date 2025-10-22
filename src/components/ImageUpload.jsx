// src/components/ImageUpload.jsx - עם הודעות שגיאה משופרות
import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle, Check, AlertTriangle } from 'lucide-react';
import { validateImageFile } from '../utils/imageUtils';

const ImageUpload = ({
    onImagesSelected,
    maxFiles = 5,
    className = "",
    disabled = false
}) => {
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [errors, setErrors] = useState([]);
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    const handleFiles = (files) => {
        const filesArray = Array.from(files);
        const validFiles = [];
        const newErrors = [];

        // בדיקת מגבלת מספר קבצים
        if (filesArray.length > maxFiles) {
            const errorMsg = `ניתן להעלות מקסימום ${maxFiles} תמונות בבת אחת`;
            newErrors.push(errorMsg);
            setShowErrorAlert(true);
            setTimeout(() => setShowErrorAlert(false), 5000);
            return;
        }

        // בדיקת תקינות כל קובץ
        filesArray.forEach((file, index) => {
            const validation = validateImageFile(file);
            if (validation.isValid) {
                validFiles.push(file);
            } else {
                newErrors.push(`${file.name}: ${validation.error}`);
                setShowErrorAlert(true);
                setTimeout(() => setShowErrorAlert(false), 5000);
            }
        });

        setErrors(newErrors);
        setSelectedFiles(validFiles);

        if (validFiles.length > 0) {
            onImagesSelected(validFiles);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };

    const openFileDialog = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const clearSelection = () => {
        setSelectedFiles([]);
        setErrors([]);
        setShowErrorAlert(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (indexToRemove) => {
        const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
        setSelectedFiles(updatedFiles);
        onImagesSelected(updatedFiles);
    };

    return (
        <div className={className}>
            {/* התראת שגיאה קבועה */}
            {showErrorAlert && (
                <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg animate-pulse">
                    <div className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-3" size={24} />
                        <div>
                            <h4 className="text-red-800 font-bold text-lg">שגיאה בהעלאת קבצים!</h4>
                            <p className="text-red-700">רק קבצי JPG, PNG ו-WEBP מותרים (עד 5MB כל אחד)</p>
                        </div>
                        <button
                            onClick={() => setShowErrorAlert(false)}
                            className="mr-auto text-red-500 hover:text-red-700"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* אזור העלאה */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : errors.length > 0
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 hover:border-gray-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={disabled}
                />

                <div className="space-y-4">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${errors.length > 0 ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                        {errors.length > 0 ? (
                            <AlertTriangle size={24} className="text-red-500" />
                        ) : (
                            <Upload size={24} className="text-gray-400" />
                        )}
                    </div>

                    <div>
                        <p className={`text-lg font-medium ${errors.length > 0 ? 'text-red-700' : 'text-gray-700'
                            }`}>
                            {dragActive ? 'שחרר כדי להעלות' :
                                errors.length > 0 ? 'קבצים לא תקינים - נסה שוב' :
                                    'לחץ או גרור תמונות לכאן'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            <strong>רק PNG, JPG, WEBP</strong> עד 5MB | מקסימום {maxFiles} תמונות
                        </p>
                    </div>
                </div>
            </div>

            {/* הצגת שגיאות מפורטות */}
            {errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-700">
                            <p className="font-medium mb-1">קבצים שלא ניתן להעלות:</p>
                            <ul className="space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* הצגת קבצים שנבחרו */}
            {selectedFiles.length > 0 && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                            תמונות תקינות ({selectedFiles.length})
                        </h4>
                        <button
                            onClick={clearSelection}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            נקה הכל
                        </button>
                    </div>

                    <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                        <Check size={14} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;