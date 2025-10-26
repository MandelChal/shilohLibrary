import React, { useEffect, useMemo, useState } from "react";
import { User, Settings, Calendar, LogOut, Book, BookOpen, RotateCcw } from "lucide-react";

// ייבוא כל הקומפוננטות מקבצים נפרדים
import LoginScreen from './components/LoginScreen';
import Navigation from './components/Navigation';
import SystemAnnouncements from './components/SystemAnnouncements';
import AdminPanel from './components/AdminPanel';
import NotificationCenter from './components/NotificationCenter';
import BorrowedBooks from './components/BorrowedBooks';
import ReturnRequestsManagement from './components/ReturnRequestsManagement';
import BookCatalog from './components/BookCatalog';

// Utils - תאריכים עבריים
import {
  fmtHebDay,
  fmtHebMonthYear,
  fmtHebFull,
  fmtGregShort,
  toISODateKey,
  startOfDay,
  monthMatrix,
  getHolidaysForDate,
  getHebrewDate,
  holidayTypesHebrew,
  getShabbatTimes,
  isShabbat,
  isErevShabbat,
  getCachedJewishEventsForMonth,
  getParsha,
  getHebrewDayLetter,
  getHebrewHolidayName
} from './utils/dateHelpers';

// Firebase DB helpers
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
  getEvents,
  addEvent,
  deleteEvent,
  subscribeToCollection,
  initializeDefaultData
} from './utils/dbHelpers';

// Firebase config
import { db, isFirebaseEnabled } from './utils/firebase';
import { initialCategories } from './constants';

// קטגוריות ספרים - fallback
const weekdays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

// ------------------------------------------------------
// קומפוננטה ראשית - APP מקוצר
// ------------------------------------------------------
export default function LibrarySystem() {
  const [user, setUser] = useState(null);
  const [today] = useState(new Date());
  const [cursor, setCursor] = useState(startOfDay(new Date()));
  const [selected, setSelected] = useState(startOfDay(new Date()));
  const [events, setEvents] = useState([]);
  const [monthlyHolidays, setMonthlyHolidays] = useState([]);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", time: "" });
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState("calendar");

  const grid = useMemo(() => monthMatrix(cursor), [cursor]);

  // טעינה ראשונית של נתונים מ-Firebase
  useEffect(() => {
    const initializeData = async () => {
      try {
        await initializeDefaultData();

        const [booksData, categoriesData, announcementsData, eventsData] = await Promise.all([
          getBooks(),
          getCategories(),
          getAnnouncements(),
          getEvents()
        ]);

        setBooks(booksData.length > 0 ? booksData : []);
        setCategories(categoriesData.length > 0 ? categoriesData : initialCategories);
        setAnnouncements(announcementsData.length > 0 ? announcementsData : [
          {
            id: "1",
            title: "ברוכים הבאים למערכת החדשה!",
            message: "המערכת משודרה עם לוח שנה עברי מלא וחגים יהודיים אוטומטיים + קטלוג ספרים דיגיטלי",
            type: "success",
            createdAt: new Date().toISOString(),
            createdBy: "מנהל המערכת"
          }
        ]);
        setEvents(eventsData);

      } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
        setBooks([]);
        setCategories(initialCategories);
        setAnnouncements([
          {
            id: "1",
            title: "מצב מקומי",
            message: "המערכת רצה במצב מקומי ללא חיבור ל-Firebase",
            type: "warning",
            createdAt: new Date().toISOString(),
            createdBy: "מערכת"
          }
        ]);
      }
    };

    initializeData();
  }, []);

  // טעינת חגים יהודיים לחודש הנוכחי
  useEffect(() => {
    try {
      const holidays = getCachedJewishEventsForMonth(cursor.getFullYear(), cursor.getMonth());
      setMonthlyHolidays(holidays);
    } catch (error) {
      console.error('שגיאה בטעינת חגים יהודיים:', error);
      setMonthlyHolidays([]);
    }
  }, [cursor]);

  // מעקב אחר שינויים ב-Firebase בזמן אמת
  useEffect(() => {
    if (!isFirebaseEnabled || !db) {
      console.log('רץ במצב מקומי - Firebase לא מוגדר');
      return;
    }

    const unsubscribeEvents = subscribeToCollection('events', (eventsData) => {
      setEvents(eventsData);
    });

    const unsubscribeBooks = subscribeToCollection('books', (booksData) => {
      setBooks(booksData);
    });

    const unsubscribeCategories = subscribeToCollection('categories', (categoriesData) => {
      setCategories(categoriesData);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeBooks();
      unsubscribeCategories();
    };
  }, []);

  const eventsByKey = useMemo(() => {
    const map = new Map();
    if (!user) return map;

    for (const ev of events) {
      // סינון אירועים - הצג רק אירועים רלוונטיים
      if (ev.isPersonal && ev.userId !== (user.id || user.username)) {
        continue;
      }

      // אירועי מעקב אדמין - רק למנהלים
      if (ev.forAdminsOnly && user.role !== 'admin') {
        continue;
      }

      // אם יש userId ספציפי ולא null - בדוק התאמה
      if (ev.userId && ev.userId !== (user.id || user.username) && user.role !== 'admin') {
        continue;
      }

      let jsDate;
      if (ev.date?.toDate) {
        jsDate = ev.date.toDate();
      } else {
        jsDate = new Date(ev.date);
      }
      const key = toISODateKey(jsDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [events, user]);

  const holidaysByKey = useMemo(() => {
    const map = new Map();
    for (const holiday of monthlyHolidays) {
      const key = holiday.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(holiday);
    }
    return map;
  }, [monthlyHolidays]);

  const monthLabelHeb = fmtHebMonthYear.format(cursor);
  const monthLabelGreg = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(cursor);

  // התחברות משתמש
  const handleLogin = (userData) => {
    try {
      if (!userData || !userData.name) {
        console.error('נתוני משתמש לא תקינים:', userData);
        alert('שגיאה בנתוני המשתמש');
        return;
      }
      setUser(userData);
      console.log('התחברות מוצלחת למערכת:', userData.name);
    } catch (error) {
      console.error('שגיאה בטיפול בהתחברות:', error);
      alert('שגיאה בהתחברות למערכת: ' + error.message);
    }
  };

  async function handleAddEvent() {
    if (!newEvent.title.trim()) return;
    setLoading(true);

    try {
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        time: newEvent.time.trim(),
        date: selected.toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        userId: user.id || user.username,
        isPersonal: true,
        eventType: 'book_borrow'
      };

      await addEvent(eventData);
      setNewEvent({ title: "", description: "", time: "" });
      setPanelOpen(false);
    } catch (error) {
      console.error('שגיאה בשמירת האירוע:', error);
      alert("שגיאה בשמירת האירוע: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את האירוע?")) {
      try {
        await deleteEvent(eventId);
      } catch (error) {
        console.error('שגיאה במחיקת אירוע:', error);
        alert('שגיאה במחיקת האירוע: ' + error.message);
      }
    }
  };

  const handleAddAnnouncement = async (announcementData) => {
    try {
      await addAnnouncement(announcementData);
    } catch (error) {
      console.error('שגיאה בהוספת הודעה:', error);
      alert('שגיאה בהוספת ההודעה: ' + error.message);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      setAnnouncements(prev => {
        const filtered = prev.filter(announcement => announcement.id !== announcementId);
        return filtered;
      });
    } catch (error) {
      console.error('שגיאה בעדכון state של הודעות:', error);
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

// הוספת גרש/גרשיים במיקום הנכון
function addGershayim(str) {
  if (!str) return "";
  if (str.includes("״") || str.includes("׳")) return str;
  if (str.length === 1) return str + "׳";
  return str.slice(0, -1) + "״" + str.slice(-1);
}

// ממיר מספר לאותיות עבריות (כולל טיפול נכון ב-15/16 ובשנות עברית).
// אם isYear=true – מדלגים על אלפי השנים (5786 -> "תשפ"ו").
function toHebNumeral(n, { isYear = false } = {}) {
  if (n == null || isNaN(n)) return "";

  let num = Math.floor(n);
  if (isYear) num = num % 1000; // בשנים מציגים רק מאות/עשרות/יחידות

  const units = ["","א","ב","ג","ד","ה","ו","ז","ח","ט"];
  const tens  = ["","י","כ","ל","מ","נ","ס","ע","פ","צ"];
  const firstHundreds = ["","ק","ר","ש","ת"]; // 0..400

  let out = "";

  // מאות (כולל 500–900 כ"ת" + מאה)
  if (num >= 100) {
    const h = Math.floor(num / 100); // 1..9
    if (h <= 4) {
      out += firstHundreds[h];           // 100..400
    } else {
      out += "ת" + firstHundreds[h - 4]; // 500..900 -> תק/תר/תש/תת/תתק
    }
    num %= 100;
  }

  // עשרות+יחידות עם טיפול מיוחד ב-15/16
  if (num === 15) {
    out += "טו";
  } else if (num === 16) {
    out += "טז";
  } else {
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (t > 0) out += tens[t];
    if (u > 0) out += units[u];
  }

  return addGershayim(out);
}

// ממיר יום בחודש (1–30) לצורה עברית ("ד׳", "י״ז" וכו׳)
function dayToHeb(day) {
  return toHebNumeral(day);
}

// מחזיר מחרוזת עברית מלאה: "ד׳ חשוון תשפ״ו"
function formatHebrewDateFull(date) {
  const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).formatToParts(date);

  const dayNum   = Number(parts.find(p => p.type === "day")?.value || "1");
  const monthHeb = parts.find(p => p.type === "month")?.value || "";
  const yearNum  = Number(parts.find(p => p.type === "year")?.value || "5786");

  const dayHeb   = dayToHeb(dayNum);                    // למשל "ד׳"
  const yearHeb  = toHebNumeral(yearNum, { isYear: true }); // למשל "תשפ״ו"

  return `${dayHeb} ${monthHeb} ${yearHeb}`;
}

function formatTimeHeb(date) {
  const parts = new Intl.DateTimeFormat("he", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,        // כדי לקבל לפנה״צ/אחה״צ
  }).formatToParts(date);

  const hour = parts.find(p => p.type === "hour")?.value ?? "";
  const minute = parts.find(p => p.type === "minute")?.value ?? "";
  const dayPeriod = parts.find(p => p.type === "dayPeriod")?.value ?? ""; // "לפנה״צ"/"אחה״צ"

  // סידור כמו בתמונה שלך: "אחה״צ 12:42"
  return `${hour}:${minute} ${dayPeriod}`.trim();
}
  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 text-stone-900">
      <Navigation />

      <SystemAnnouncements
        user={user}
        announcements={announcements}
        onAddAnnouncement={handleAddAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
      />

      {/* Header עם כלי הניהול */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-stone-500">
                {user.role === 'admin' ? 'פאנל ניהול' : 'לוח שנה עברי ואירועי הספריה'}
              </p>
              {!isFirebaseEnabled && (
                <p className="text-xs text-amber-600">רץ במצב מקומי</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* תפריט ניווט */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('calendar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'calendar'
                  ? 'bg-emerald-700 text-white'
                  : 'border border-stone-300 hover:bg-stone-100'
                  }`}
              >
                <Calendar className="w-4 h-4" />
                לוח שנה
              </button>

              <button
                onClick={() => setCurrentView('catalog')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'catalog'
                  ? 'bg-emerald-700 text-white'
                  : 'border border-stone-300 hover:bg-stone-100'
                  }`}
              >
                <Book className="w-4 h-4" />
                קטלוג ספרים
              </button>

              {user.role !== 'admin' && (
                <button
                  onClick={() => setCurrentView('borrowed')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'borrowed'
                    ? 'bg-emerald-700 text-white'
                    : 'border border-stone-300 hover:bg-stone-100'
                    }`}
                >
                  <BookOpen className="w-4 h-4" />
                  הספרים שלי
                </button>
              )}

              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => setCurrentView('returns')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'returns'
                      ? 'bg-emerald-700 text-white'
                      : 'border border-stone-300 hover:bg-stone-100'
                      }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    בקשות החזרה
                  </button>

                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'admin'
                      ? 'bg-emerald-700 text-white'
                      : 'border border-stone-300 hover:bg-stone-100'
                      }`}
                  >
                    <Settings className="w-4 h-4" />
                    ניהול
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{user.name}</span>
              {user.role === 'admin' && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">מנהל</span>
              )}
            </div>

            <NotificationCenter user={user} />

            <button
              onClick={() => setUser(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-sm"
            >
              <LogOut className="w-4 h-4" />
              יציאה
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* תצוגת לוח שנה */}
        {currentView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* עמודת תוכן/בוקרים */}
            <section className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-stone-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
                <h2 className="text-2xl font-semibold mb-2">ברוך הבא {user.name}</h2>
                <p className="text-stone-700 mb-4">
                  {user.role === 'admin'
                    ? 'כאן תוכל לנהל אוספים, אירועים ולוח השנה היהודי. יש לך גישה מלאה לכלל הפונקציות.'
                    : 'כאן תוכל לראות את לוח השנה היהודי עם חגים, אירועים ותאריכים עבריים.'
                  }
                </p>
                <div className="flex flex-wrap gap-3">
                  {user.role === 'admin' && (
                    <button
                      className="rounded-2xl px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
                      onClick={() => setPanelOpen(true)}
                    >
                      הוספת אירוע חדש
                    </button>
                  )}
                  <button
                    className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
                    onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  >
                    חודש קודם
                  </button>
                  <button
                    className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
                    onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  >
                    חודש הבא
                  </button>
                  <button
                    className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
                    onClick={() => setCursor(startOfDay(new Date()))}
                  >
                    היום
                  </button>
                </div>
              </div>

              

              {/* לוח שנה יהודי */}
              <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden mx-4 md:mx-8 shadow-lg">
                <div className="flex items-baseline justify-between px-4 sm:px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div>
                    <div className="text-lg font-semibold">{formatHebrewDateFull(today)}</div>
                    <div className="text-sm text-stone-500">{monthLabelGreg}</div>
                  </div>
                  <div className="text-sm text-stone-500">
                  {formatTimeHeb(today)}
                    {/* <div className="text-xs text-blue-600">{getHebrewDate(today)}</div> */}
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  {/* ימות השבוע */}
                  <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-lg overflow-hidden">
                    {weekdays.map((d) => (
                      <div key={d} className="bg-stone-50 text-center text-xs font-medium py-3">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* לוח הימים */}
                  <div className="grid grid-cols-7 gap-px bg-stone-200 mt-2 rounded-lg overflow-hidden">
                    {grid.map(({ date, inCurrent }, idx) => {
                      const isToday = toISODateKey(date) === toISODateKey(today);
                      const isSelected = toISODateKey(date) === toISODateKey(selected);
                      const key = toISODateKey(date);
                      const dayGreg = fmtGregShort.format(date);
                      const dayHebrewLetter = getHebrewDayLetter(date);
                      const dayEvents = eventsByKey.get(key) || [];
                      const holidays = holidaysByKey.get(key) || [];
                      const shabbatTimes = getShabbatTimes(date);
                      const isShabbatDay = isShabbat(date);
                      const isFridayDay = isErevShabbat(date);

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelected(startOfDay(date))}
                          className={[
                            "relative min-h-[120px] bg-white p-2 text-right transition-all hover:bg-stone-50",
                            inCurrent ? "" : "bg-stone-50 text-stone-400",
                            isSelected ? "ring-2 ring-emerald-600 z-10 bg-emerald-50" : "",
                            isToday ? "outline outline-2 outline-emerald-500" : "",
                            isShabbatDay ? "bg-blue-50 border-r-2 border-blue-300" : "",
                            isFridayDay ? "bg-yellow-50 border-r-2 border-yellow-300" : "",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-stone-800">{dayGreg}</span>
                              <span className="text-sm text-blue-600 font-medium">{dayHebrewLetter}</span>
                            </div>
                            {isToday && <span className="text-xs text-emerald-600 font-bold">היום</span>}
                          </div>

                          {shabbatTimes && (
                            <div className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded mb-1">
                              {shabbatTimes.name} {shabbatTimes.time}
                            </div>
                          )}

                          <div className="space-y-0.5 mb-1">
                            {holidays.slice(0, 2).map((holiday) => {
                              const hebrewName = getHebrewHolidayName(holiday.fullEvent);
                              return (
                                <div
                                  key={holiday.name}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border truncate ${holidayTypesHebrew[holiday.type].color}`}
                                  title={hebrewName}
                                >
                                  <span className="ml-0.5">{holidayTypesHebrew[holiday.type].icon}</span>
                                  {hebrewName}
                                </div>
                              );
                            })}
                          </div>

                          <div className="space-y-0.5">
                            {dayEvents.slice(0, holidays.length > 0 ? 1 : 2).map((ev) => (
                              <div
                                key={ev.id}
                                className="truncate rounded-md px-1.5 py-0.5 text-[9px] border bg-emerald-100 border-emerald-200 text-emerald-800"
                              >
                                {ev.time ? `${ev.time} ` : ""}{ev.title}
                              </div>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* סיידבר */}
            <aside className="space-y-6">
              <div className="rounded-3xl border border-stone-200 bg-white p-5">
                <div className="text-sm text-stone-500">תאריך נבחר</div>
                <div className="text-lg font-semibold">{fmtHebFull.format(selected)}</div>
                <div className="text-sm text-stone-600">{selected.toLocaleDateString("he-IL", { dateStyle: "full" })}</div>

                <div className="mt-4 flex gap-2">
                  {user.role === 'admin' && (
                    <button
                      onClick={() => setPanelOpen(true)}
                      className="rounded-2xl px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      אירוע חדש
                    </button>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">אירועים וחגים בתאריך זה</h3>

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 font-medium mb-1">
                      {getHebrewDate(selected)}
                    </div>
                    {getShabbatTimes(selected) && (
                      <div className="text-xs text-blue-600">
                        {getShabbatTimes(selected).name} - {getShabbatTimes(selected).time}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {(holidaysByKey.get(toISODateKey(selected)) || []).map((holiday) => (
                      <li key={holiday.name} className={`rounded-xl border p-3 ${holidayTypesHebrew[holiday.type].color}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{holidayTypesHebrew[holiday.type].icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{getHebrewHolidayName(holiday.fullEvent)}</div>
                          </div>
                        </div>
                      </li>
                    ))}

                    {(eventsByKey.get(toISODateKey(selected)) || []).map((ev) => (
                      <li key={ev.id} className="rounded-xl border border-stone-200 p-3 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{ev.title}</div>
                            {ev.time && <div className="text-xs text-stone-500">{ev.time}</div>}
                          </div>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* תצוגת קטלוג ספרים */}
        {currentView === 'catalog' && (
          <BookCatalog
            books={books}
            setBooks={setBooks}
            user={user}
            categories={categories}
            onBooksChange={(newBooks) => setBooks(newBooks)}
          />
        )}

        {/* תצוגת הספרים שלי */}
        {currentView === 'borrowed' && user.role !== 'admin' && (
          <BorrowedBooks user={user} onBookReturned={(bookId) => console.log('ספר הוחזר:', bookId)} />
        )}

        {/* תצוגת בקשות החזרה */}
        {currentView === 'returns' && user.role === 'admin' && (
          <ReturnRequestsManagement currentUser={user} />
        )}

        {/* תצוגת פאנל אדמין */}
        {currentView === 'admin' && user.role === 'admin' && (
          <AdminPanel
            events={events}
            announcements={announcements}
            onDeleteEvent={handleDeleteEvent}
            currentUser={user}
          />
        )}
      </main>

      {/* פאנל הוספת אירוע */}
      {panelOpen && user.role === 'admin' && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">אירוע חדש</div>
                <div className="text-sm text-stone-500">{fmtHebFull.format(selected)}</div>
              </div>
              <button onClick={() => setPanelOpen(false)} className="rounded-xl px-3 py-1.5 border border-stone-300 text-sm hover:bg-stone-100">
                סגור
              </button>
            </div>
            <div className="p-5 space-y-3">
              <input
                className="w-full rounded-xl border border-stone-300 px-3 py-2"
                value={newEvent.title}
                onChange={(e) => setNewEvent((s) => ({ ...s, title: e.target.value }))}
                placeholder="שם האירוע"
              />
              <input
                className="w-full rounded-xl border border-stone-300 px-3 py-2"
                value={newEvent.time}
                onChange={(e) => setNewEvent((s) => ({ ...s, time: e.target.value }))}
                placeholder="שעה (אופציונלי)"
              />
              <textarea
                rows={4}
                className="w-full rounded-xl border border-stone-300 px-3 py-2"
                value={newEvent.description}
                onChange={(e) => setNewEvent((s) => ({ ...s, description: e.target.value }))}
                placeholder="תיאור"
              />
            </div>
            <div className="px-5 py-4 border-t border-stone-200 flex items-center justify-end gap-3">
              <button onClick={() => setPanelOpen(false)} className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100">
                ביטול
              </button>
              <button
                onClick={handleAddEvent}
                disabled={loading || !newEvent.title.trim()}
                className="rounded-2xl px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {loading ? "שומר..." : 'שמור אירוע'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-stone-500">
        מערכת ספריית שילה • נבנה ב-React + Firebase • לוח שנה יהודי אוטומטי עם @hebcal/core • ניהול הרשאות מתקדם
      </footer>
    </div>
  );
}