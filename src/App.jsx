import React, { useEffect, useMemo, useState } from "react";
import { User, Settings, Calendar, LogOut, Trash2 } from "lucide-react";

// Components
import LoginScreen from './components/LoginScreen';
import Navigation from './components/Navigation';
import SystemAnnouncements from './components/SystemAnnouncements';
import AdminPanel from './components/AdminPanel';

// Utils - עם תצוגה עברית בלבד
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

// Firebase (optional - מוגדר לעבוד גם בלי)
import { db, isFirebaseEnabled } from './utils/firebase';

// Firebase imports (conditional)
let collection, addDoc, onSnapshot, query, where, serverTimestamp, Timestamp;

if (isFirebaseEnabled) {
  try {
    const firestore = await import('firebase/firestore');
    collection = firestore.collection;
    addDoc = firestore.addDoc;
    onSnapshot = firestore.onSnapshot;
    query = firestore.query;
    where = firestore.where;
    serverTimestamp = firestore.serverTimestamp;
    Timestamp = firestore.Timestamp;
  } catch (error) {
    console.warn('Firebase imports failed:', error);
  }
}

// ------------------------------------------------------
// קומפוננטה ראשית עם לוח יהודי עברי בלבד
// ------------------------------------------------------
export default function LibrarySystem() {
  const [user, setUser] = useState(null);
  const [today] = useState(new Date());
  const [cursor, setCursor] = useState(startOfDay(new Date()));
  const [selected, setSelected] = useState(startOfDay(new Date()));
  const [events, setEvents] = useState([]);
  const [monthlyHolidays, setMonthlyHolidays] = useState([]);
  const [announcements, setAnnouncements] = useState([
    {
      id: "1",
      title: "ברוכים הבאים למערכת החדשה!",
      message: "המערכת הושדרגה עם לוח שנה עברי מלא וחגים יהודיים אוטומטיים",
      type: "success",
      createdAt: new Date().toISOString(),
      createdBy: "מנהל המערכת"
    },
    {
      id: "2",
      title: "לוח שנה יהודי מעודכן",
      message: "כעת הלוח מציג חגים יהודיים, זמני שבת והדלקת נרות באופן אוטומטי",
      type: "info",
      createdAt: new Date().toISOString(),
      createdBy: "מנהל המערכת"
    }
  ]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", time: "" });
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState("calendar");

  const grid = useMemo(() => monthMatrix(cursor), [cursor]);

  // טעינת חגים יהודיים לחודש הנוכחי
  useEffect(() => {
    try {
      const holidays = getCachedJewishEventsForMonth(cursor.getFullYear(), cursor.getMonth());
      setMonthlyHolidays(holidays);
      console.log(`נטענו ${holidays.length} אירועים יהודיים לחודש ${cursor.getMonth() + 1}/${cursor.getFullYear()}`);
    } catch (error) {
      console.error('שגיאה בטעינת חגים יהודיים:', error);
      setMonthlyHolidays([]);
    }
  }, [cursor]);

  // קריאת אירועים מ-Firebase (אם מוגדר)
  useEffect(() => {
    if (!isFirebaseEnabled || !db) {
      console.log('רץ במצב מקומי - Firebase לא מוגדר');
      return;
    }

    const startWindow = startOfDay(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    const endWindow = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    endWindow.setHours(23, 59, 59, 999);

    try {
      const q = query(
        collection(db, "events"),
        where("date", ">=", Timestamp.fromDate(startWindow)),
        where("date", "<=", Timestamp.fromDate(endWindow))
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const eventList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventList);
        console.log('אירועים נטענו מ-Firebase:', eventList.length);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('שגיאה בטעינת אירועים:', error);
    }
  }, [cursor.getFullYear(), cursor.getMonth()]);

  const eventsByKey = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      let jsDate;
      if (ev.date?.toDate) {
        jsDate = ev.date.toDate(); // Firebase Timestamp
      } else {
        jsDate = new Date(ev.date); // ISO string
      }
      const key = toISODateKey(jsDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [events]);

  // מיפוי חגים יהודיים לפי תאריך
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

  async function handleAddEvent() {
    if (!newEvent.title.trim()) return;
    setLoading(true);

    try {
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        time: newEvent.time.trim(),
        date: isFirebaseEnabled ? Timestamp.fromDate(selected) : selected.toISOString(),
        createdAt: isFirebaseEnabled ? serverTimestamp() : new Date().toISOString(),
        createdBy: user.name
      };

      if (isFirebaseEnabled && db) {
        await addDoc(collection(db, "events"), eventData);
        console.log('אירוע נשמר ב-Firebase');
      } else {
        const newEventObj = {
          id: Date.now().toString(),
          ...eventData,
          date: selected.toISOString()
        };
        setEvents(prev => [...prev, newEventObj]);
        console.log('אירוע נשמר מקומית');
      }

      setNewEvent({ title: "", description: "", time: "" });
      setPanelOpen(false);
    } catch (error) {
      console.error('שגיאה בשמירת האירוע:', error);
      alert("שגיאה בשמירת האירוע: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteEvent = (eventId) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את האירוע?")) {
      if (isFirebaseEnabled && db) {
        console.log('מחיקה מ-Firebase:', eventId);
      } else {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        console.log('אירוע נמחק מקומית:', eventId);
      }
    }
  };

  const handleAddAnnouncement = (announcement) => {
    setAnnouncements(prev => [announcement, ...prev]);
  };

  const handleDeleteAnnouncement = (announcementId) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  const weekdays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 text-stone-900">
      {/* סרגל ניווט עליון */}
      <Navigation />

      {/* הודעות מערכת מסתובבות */}
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
                {user.role === 'admin' ? 'פאנל ניהול' : 'לוח שנה עברי ואירועי הספרייה'}
              </p>
              {!isFirebaseEnabled && (
                <p className="text-xs text-amber-600">רץ במצב מקומי</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
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
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${currentView === 'admin'
                      ? 'bg-emerald-700 text-white'
                      : 'border border-stone-300 hover:bg-stone-100'
                    }`}
                >
                  <Settings className="w-4 h-4" />
                  ניהול
                </button>
              </div>
            )}

            <input
              placeholder="חיפוש בקטלוג..."
              className="hidden md:block w-60 rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{user.name}</span>
              {user.role === 'admin' && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">מנהל</span>
              )}
            </div>

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
        {currentView === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* עמודת תוכן/גיבורים */}
            <section className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-stone-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
                <h2 className="text-2xl font-semibold mb-2">
                  ברוך הבא {user.name}
                </h2>
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
                    title="קפיצה להיום"
                  >
                    היום
                  </button>
                </div>
              </div>

              {/* לוח שנה יהודי עם תצוגה עברית פשוטה */}
              <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden mx-4 md:mx-8 shadow-lg">
                <div className="flex items-baseline justify-between px-4 sm:px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div>
                    <div className="text-lg font-semibold">{monthLabelHeb}</div>
                    <div className="text-sm text-stone-500">{monthLabelGreg}</div>
                  </div>
                  <div className="text-sm text-stone-500">
                    {fmtHebFull.format(today)}
                    <div className="text-xs text-blue-600">
                      {getHebrewDate(today)}
                    </div>
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

                  {/* לוח הימים - פשוט ועברי */}
                  <div className="grid grid-cols-7 gap-px bg-stone-200 mt-2 rounded-lg overflow-hidden">
                    {grid.map(({ date, inCurrent }, idx) => {
                      const isToday = toISODateKey(date) === toISODateKey(today);
                      const isSelected = toISODateKey(date) === toISODateKey(selected);
                      const key = toISODateKey(date);
                      const dayGreg = fmtGregShort.format(date); // מספר לועזי
                      const dayHebrewLetter = getHebrewDayLetter(date); // אות עברית
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
                          {/* תאריך פשוט - מספר לועזי + אות עברית */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-stone-800">{dayGreg}</span>
                              <span className="text-sm text-blue-600 font-medium">{dayHebrewLetter}</span>
                            </div>
                            {isToday && <span className="text-xs text-emerald-600 font-bold">היום</span>}
                          </div>

                          {/* זמני שבת בעברית */}
                          {shabbatTimes && (
                            <div className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded mb-1">
                              {shabbatTimes.name} {shabbatTimes.time}
                            </div>
                          )}

                          {/* חגים יהודיים - רק בעברית */}
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
                            {holidays.length > 2 && (
                              <div className="text-[8px] text-stone-500 text-center">
                                +{holidays.length - 2} נוספים
                              </div>
                            )}
                          </div>

                          {/* אירועים רגילים */}
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, holidays.length > 0 ? 1 : 2).map((ev) => (
                              <div key={ev.id} className="truncate rounded-md px-1.5 py-0.5 text-[9px] bg-emerald-100 border border-emerald-200 text-emerald-800">
                                {ev.time ? `${ev.time} ` : ""}
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > (holidays.length > 0 ? 1 : 2) && (
                              <div className="text-[8px] text-stone-500 text-center">
                                +{dayEvents.length - (holidays.length > 0 ? 1 : 2)} נוספים
                              </div>
                            )}
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
                      אירוע חדש בתאריך זה
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(startOfDay(new Date()))}
                    className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
                  >
                    בחר היום
                  </button>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">אירועים וחגים בתאריך זה</h3>

                  {/* תאריך עברי וזמני שבת */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 font-medium mb-1">
                      {getHebrewDate(selected)}
                    </div>
                    {getShabbatTimes(selected) && (
                      <div className="text-xs text-blue-600">
                        {getShabbatTimes(selected).name} - {getShabbatTimes(selected).time}
                      </div>
                    )}
                    {getParsha(selected) && isShabbat(selected) && (
                      <div className="text-xs text-purple-600 mt-1">
                        {getParsha(selected)}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {/* חגים יהודיים */}
                    {(holidaysByKey.get(toISODateKey(selected)) || []).map((holiday) => (
                      <li key={holiday.name} className={`rounded-xl border p-3 ${holidayTypesHebrew[holiday.type].color}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{holidayTypesHebrew[holiday.type].icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{getHebrewHolidayName(holiday.fullEvent)}</div>
                            <div className="text-xs opacity-80">{holidayTypesHebrew[holiday.type].name}</div>
                          </div>
                        </div>
                      </li>
                    ))}

                    {/* אירועים רגילים */}
                    {(eventsByKey.get(toISODateKey(selected)) || []).map((ev) => (
                      <li key={ev.id} className="rounded-xl border border-stone-200 p-3 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{ev.title}</div>
                            {ev.time && <div className="text-xs text-stone-500">{ev.time}</div>}
                            {ev.description && <div className="text-sm mt-1 text-stone-700 whitespace-pre-wrap">{ev.description}</div>}
                          </div>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="מחק אירוע"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}

                    {/* הודעה אם אין כלום */}
                    {(holidaysByKey.get(toISODateKey(selected)) || []).length === 0 &&
                      !(eventsByKey.get(toISODateKey(selected)) || []).length && (
                        <div className="text-sm text-stone-500 text-center py-4">
                          אין אירועים או חגים ביום זה
                        </div>
                      )}
                  </ul>
                </div>
              </div>

              {/* פאנל ניהול למנהלים */}
              {user.role === 'admin' && (
                <AdminPanel
                  events={events}
                  announcements={announcements}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}

              {/* סטטיסטיקות חגים */}
              <div className="rounded-3xl border border-stone-200 bg-white p-5">
                <h3 className="font-medium mb-3">סטטיסטיקות החודש</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>חגים יהודיים:</span>
                    <span className="font-medium">{monthlyHolidays.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>אירועים שלי:</span>
                    <span className="font-medium">{events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>שבתות:</span>
                    <span className="font-medium">{
                      grid.filter(({ date }) => isShabbat(date) &&
                        date.getMonth() === cursor.getMonth()).length
                    }</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {currentView === 'admin' && user.role === 'admin' && (
          <AdminPanel
            events={events}
            announcements={announcements}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </main>

      {/* פאנל הוספת אירוע - רק למנהלים */}
      {panelOpen && user.role === 'admin' && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 p-4" aria-modal="true" role="dialog">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">אירוע חדש</div>
                <div className="text-sm text-stone-500">
                  {fmtHebFull.format(selected)} · {selected.toLocaleDateString("he-IL")}
                </div>
                <div className="text-xs text-blue-600">
                  {getHebrewDate(selected)}
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-xl px-3 py-1.5 border border-stone-300 text-sm hover:bg-stone-100"
              >
                סגור
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-sm">
                כותרת
                <input
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((s) => ({ ...s, title: e.target.value }))}
                  placeholder="שם האירוע (למשל: השקת ספר)"
                />
              </label>
              <label className="block text-sm">
                שעה (אופציונלי)
                <input
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent((s) => ({ ...s, time: e.target.value }))}
                  placeholder="למשל 18:30"
                />
              </label>
              <label className="block text-sm">
                תיאור
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((s) => ({ ...s, description: e.target.value }))}
                  placeholder={"פרטים נוספים, כתובת, קישור להרשמה וכו'"}
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-2xl px-4 py-2 border border-stone-300 hover:bg-stone-100"
              >
                ביטול
              </button>
              <button
                onClick={handleAddEvent}
                disabled={loading || !newEvent.title.trim()}
                className="rounded-2xl px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "שומר..." : 'שמור אירוע'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-stone-500">
        מערכת ספריית שילה · נבנה ב-React + Firebase · לוח שנה יהודי אוטומטי עם @hebcal/core · ניהול הרשאות מתקדם
      </footer>
    </div>
  );
}