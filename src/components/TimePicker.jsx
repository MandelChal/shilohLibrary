// src/components/TimePicker.jsx
import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

const TimePicker = ({
    value = '',
    onChange,
    placeholder = 'בחר שעה',
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [isValid, setIsValid] = useState(true);

    // הצעות זמן נפוצות
    const commonTimes = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00'
    ];

    // אימות פורמט זמן (HH:MM)
    const validateTime = (time) => {
        if (!time) return true; // זמן ריק הוא תקין (אופציונלי)

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    };

    // עיצוב זמן לפורמט HH:MM
    const formatTime = (time) => {
        if (!time) return '';

        // אם יש רק ספרות, הוסף נקודתיים
        if (/^\d{3,4}$/.test(time)) {
            const digits = time.replace(/\D/g, '');
            if (digits.length === 3) {
                return `${digits.slice(0, 1)}:${digits.slice(1)}`;
            } else if (digits.length === 4) {
                return `${digits.slice(0, 2)}:${digits.slice(2)}`;
            }
        }

        return time;
    };

    // עדכון הערך הפנימי
    useEffect(() => {
        setInputValue(value);
        setIsValid(validateTime(value));
    }, [value]);

    // טיפול בשינוי קלט ידני
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        const formattedValue = formatTime(newValue);

        setInputValue(formattedValue);
        setIsValid(validateTime(formattedValue));

        if (onChange) {
            onChange(formattedValue);
        }
    };

    // טיפול בבחירת זמן מהרשימה
    const handleTimeSelect = (time) => {
        setInputValue(time);
        setIsValid(true);
        setIsOpen(false);

        if (onChange) {
            onChange(time);
        }
    };

    // טיפול בלחיצה מחוץ לקומפוננט
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.time-picker-container')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={`time-picker-container relative ${className}`}>
            <div className="relative">
                <div className="flex items-center">
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => setIsOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${isValid
                                ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                : 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        disabled={disabled}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* הודעת שגיאה */}
                {!isValid && inputValue && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <span>⚠️</span>
                        פורמט זמן לא תקין. השתמש בפורמט HH:MM (למשל 18:30)
                    </p>
                )}
            </div>

            {/* רשימת זמנים נפוצים */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="p-2">
                        <div className="text-xs text-gray-500 mb-2 px-2">זמנים נפוצים:</div>
                        <div className="grid grid-cols-3 gap-1">
                            {commonTimes.map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleTimeSelect(time)}
                                    className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors text-center"
                                >
                                    {time}
                                </button>
                            ))}
                        </div>

                        {/* אפשרות למחיקת זמן */}
                        <div className="border-t border-gray-200 mt-2 pt-2">
                            <button
                                type="button"
                                onClick={() => handleTimeSelect('')}
                                className="w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded transition-colors text-center"
                            >
                                נקה זמן
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimePicker;
