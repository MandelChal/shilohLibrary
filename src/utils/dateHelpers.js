import { HDate, HebrewCalendar, Event, greg, months } from '@hebcal/core';

export const fmtHebDay = new Intl.DateTimeFormat("he-u-ca-hebrew", { day: "numeric" });
export const fmtHebMonthYear = new Intl.DateTimeFormat("he-u-ca-hebrew", {
    month: "long",
    year: "numeric",
});
export const fmtHebFull = new Intl.DateTimeFormat("he-u-ca-hebrew", { dateStyle: "full" });
export const fmtGregShort = new Intl.DateTimeFormat("he-IL", { day: "numeric" });

export function toISODateKey(d) {
    const y = d.getFullYear().HebrewCalendar;
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export function monthMatrix(anchor) {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startIndex = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < 42; i++) {
        const dayNum = i - startIndex + 1;
        let date;
        let inCurrent = true;
        if (dayNum <= 0) {
            date = new Date(year, month - 1, prevMonthDays + dayNum);
            inCurrent = false;
        } else if (dayNum > daysInMonth) {
            date = new Date(year, month + 1, dayNum - daysInMonth);
            inCurrent = false;
        } else {
            date = new Date(year, month, dayNum);
            inCurrent = true;
        }
        cells.push({ date, inCurrent });
    }
    return cells;
}

// ------------------------------------------------------
// 🕯️ פונקציות חישוב זמנים יהודיים אוטומטיים - מתוקנות
// ------------------------------------------------------

const defaultLocation = {
    latitude: 31.7683,
    longitude: 35.2137,
    timezone: 'Asia/Jerusalem',
    name: 'ירושלים'
};

// מפת סוגי חגים לצבעים ואיקונים
export const holidayTypesHebrew = {
    major: {
        color: 'bg-purple-100 border-purple-300 text-purple-800',
        icon: '🕯',
        name: 'חג עיקרי'
    },
    minor: {
        color: 'bg-blue-100 border-blue-300 text-blue-800',
        icon: '✨',
        name: 'זמן מיוחד'
    },
    fast: {
        color: 'bg-gray-100 border-gray-300 text-gray-800',
        icon: '🕯️',
        name: 'יום צום'
    },
    modern: {
        color: 'bg-green-100 border-green-300 text-green-800',
        icon: '🇮🇱',
        name: 'יום לאומי'
    },
    roshchodesh: {
        color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
        icon: '🌙',
        name: 'ראש חודש'
    },
    shabbat: {
        color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
        icon: '🕯️',
        name: 'שבת'
    }
};

function getHolidayType(event) {
    const desc = event.getDesc();
    const categories = event.getCategories();

    if (categories.includes('major') ||
        desc.includes('ראש השנה') ||
        desc.includes('יום כפור') ||
        desc.includes('פסח') ||
        desc.includes('שבועות') ||
        desc.includes('סוכות') ||
        desc.includes('שמיני עצרת') ||
        desc.includes('שמחת תורה')) {
        return 'major';
    }

    if (categories.includes('fast') ||
        desc.includes('צום') ||
        desc.includes('תענית')) {
        return 'fast';
    }

    if (categories.includes('modern') ||
        desc.includes('יום העצמאות') ||
        desc.includes('יום ירושלים') ||
        desc.includes('יום הזכרון')) {
        return 'modern';
    }

    if (categories.includes('roshchodesh') ||
        desc.includes('ראש חודש')) {
        return 'roshchodesh';
    }

    if (categories.includes('shabbat') ||
        desc.includes('שבת')) {
        return 'shabbat';
    }

    return 'minor';
}

export function getJewishEventsForMonth(year, month) {
    try {
        const options = {
            start: new Date(year, month, 1),
            end: new Date(year, month + 1, 0),
            location: defaultLocation,
            il: true,
            sedrot: false,
            candlelighting: true,
            havdalah: true,
            modern: true,
            ashkenazi: true,
            locale: 'he'
        };

        const events = HebrewCalendar.calendar(options);

        return events.map(event => {
            const date = event.getDate().greg();
            return {
                date: toISODateKey(date),
                name: event.getDesc(),
                nameHebrew: event.getDesc('he'),
                type: getHolidayType(event),
                description: event.getDesc(),
                fullEvent: event,
                isHoliday: event.isEvent(),
                isCandleLighting: event.getDesc().includes('נרות') || event.getDesc().includes('Candles'),
                isHavdalah: event.getDesc().includes('הבדלה') || event.getDesc().includes('Havdalah')
            };
        });
    } catch (error) {
        console.warn('שגיאה בחישוב אירועי החודש:', error);
        return [];
    }
}

export function getHolidaysForDate(date) {
    try {
        const hdate = new HDate(date);
        const events = HebrewCalendar.calendar({
            start: date,
            end: date,
            location: defaultLocation,
            il: true,
            candlelighting: true,
            havdalah: true,
            modern: true,
            ashkenazi: true,
            locale: 'he'
        });

        return events.map(event => ({
            date: toISODateKey(date),
            name: event.getDesc(),
            nameHebrew: event.getDesc('he'),
            type: getHolidayType(event),
            description: event.getDesc(),
            fullEvent: event,
            isHoliday: event.isEvent(),
            isCandleLighting: event.getDesc().includes('נרות') || event.getDesc().includes('Candles'),
            isHavdalah: event.getDesc().includes('הבדלה') || event.getDesc().includes('Havdalah')
        }));
    } catch (error) {
        console.warn('שגיאה בחישוב אירועי היום:', error);
        return [];
    }
}

// פונקציה לקבלת תאריך עברי נקי - רק יום ללא שם חודש מלא
export function getHebrewDate(date) {
    try {
        const hdate = new HDate(date);
        // החזר רק את היום העברי ללא פרטים מיותרים
        const dayNum = hdate.getDate();
        const monthName = hdate.getMonthName('he');

        // אם זה התחלת החודש, הראה גם את שם החודש
        if (dayNum === 1) {
            return `א׳ ${monthName}`;
        }

        return getHebrewDayLetter(date);
    } catch (error) {
        console.warn('שגיאה בהמרת תאריך עברי:', error);
        return '';
    }
}

// פונקציה לקבלת רק האות העברית של היום - נקיה
export function getHebrewDayLetter(date) {
    try {
        const hdate = new HDate(date);
        const dayNum = hdate.getDate();

        const hebrewNumbers = {
            1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
            11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו', 16: 'ט״ז', 17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳',
            21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג', 24: 'כ״ד', 25: 'כ״ה', 26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳'
        };

        return hebrewNumbers[dayNum] || dayNum.toString();
    } catch (error) {
        console.warn('שגיאה בהמרת יום עברי:', error);
        return '';
    }
}

// פונקציה לקבלת שם חג בעברית נקי
export function getHebrewHolidayName(event) {
    const desc = event.getDesc();

    const hebrewNames = {
        'Rosh Hashana': 'ראש השנה',
        'Yom Kippur': 'יום כפור',
        'Sukkot': 'סוכות',
        'Shmini Atzeret': 'שמיני עצרת',
        'Simchat Torah': 'שמחת תורה',
        'Chanukah': 'חנוכה',
        'Tu BiShvat': 'ט״ו בשבט',
        'Purim': 'פורים',
        'Pesach': 'פסח',
        'Lag BaOmer': 'ל״ג בעומר',
        'Shavuot': 'שבועות',
        'Rosh Chodesh': 'ראש חודש',
        'Candle lighting': 'הדלקת נרות',
        'Havdalah': 'הבדלה'
    };

    for (const [english, hebrew] of Object.entries(hebrewNames)) {
        if (desc.includes(english)) {
            return hebrew;
        }
    }

    // נסה לנקות מהמחרוזת דברים מיותרים
    return desc.replace(/\d{4}/g, '').replace(/\s+/g, ' ').trim();
}

export function getHebrewWeekday(date) {
    try {
        return fmtHebFull.format(date).split(',')[0];
    } catch (error) {
        console.warn('שגיאה בהמרת יום השבוע:', error);
        return '';
    }
}

export function getShabbatTimes(date) {
    try {
        const events = HebrewCalendar.calendar({
            start: date,
            end: date,
            location: defaultLocation,
            candlelighting: true,
            havdalah: true,
            locale: 'he'
        });

        const candleLighting = events.find(e =>
            e.getDesc().includes('נרות') || e.getDesc().includes('Candles')
        );

        const havdalah = events.find(e =>
            e.getDesc().includes('הבדלה') || e.getDesc().includes('Havdalah')
        );

        if (candleLighting) {
            const time = candleLighting.eventTime;
            return {
                type: 'candles',
                time: time ? time.toTimeString().slice(0, 5) : '18:00',
                name: 'הדלקת נרות',
                fullDesc: candleLighting.getDesc()
            };
        }

        if (havdalah) {
            const time = havdalah.eventTime;
            return {
                type: 'havdalah',
                time: time ? time.toTimeString().slice(0, 5) : '19:30',
                name: 'הבדלה',
                fullDesc: havdalah.getDesc()
            };
        }

        return null;
    } catch (error) {
        console.warn('שגיאה בחישוב זמני שבת:', error);
        return null;
    }
}

export function isShabbat(date) {
    return date.getDay() === 6;
}

export function isErevShabbat(date) {
    return date.getDay() === 5;
}

export function getParsha(date) {
    try {
        const events = HebrewCalendar.calendar({
            start: date,
            end: date,
            sedrot: true,
            il: true,
            locale: 'he'
        });

        const parsha = events.find(e => e.getCategories().includes('parashat'));
        return parsha ? parsha.getDesc() : null;
    } catch (error) {
        console.warn('שגיאה בקבלת פרשת השבוע:', error);
        return null;
    }
}

const monthEventsCache = new Map();

export function getCachedJewishEventsForMonth(year, month) {
    const key = `${year}-${month}`;
    if (monthEventsCache.has(key)) {
        return monthEventsCache.get(key);
    }

    const events = getJewishEventsForMonth(year, month);
    monthEventsCache.set(key, events);

    if (monthEventsCache.size > 12) {
        const firstKey = monthEventsCache.keys().next().value;
        monthEventsCache.delete(firstKey);
    }

    return events;
}