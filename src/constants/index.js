// src/constants/index.js

// קטגוריות ספרים - יעמסו מ-Firebase או יישארו כ-fallback
export const initialCategories = [
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

// ימות השבוע בעברית
export const weekdays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

// הודעות ברירת מחדל
export const defaultAnnouncements = [
    {
        id: "1",
        title: "ברוכים הבאים למערכת החדשה!",
        message: "המערכת מושדרה עם לוח שנה עברי מלא וחגים יהודיים אוטומטיים + קטלוג ספרים דיגיטלי",
        type: "success",
        createdAt: new Date().toISOString(),
        createdBy: "מנהל המערכת"
    }
];

// הודעת מצב מקומי
export const localModeAnnouncement = {
    id: "local-mode",
    title: "מצב מקומי",
    message: "המערכת רצה במצב מקומי ללא חיבור ל-Firebase",
    type: "warning",
    createdAt: new Date().toISOString(),
    createdBy: "מערכת"
};