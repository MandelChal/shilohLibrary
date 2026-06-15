import React, { useEffect, useState } from 'react';
import { db } from '../utils/firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import './AdminContactMessages.css';

// 🌟 נתוני דמה שיופיעו רק כשה-Firebase ריק או לא נגיש במחשב שלך
const fallbackMessages = [
  {
    id: "dummy1",
    name: "אלעד כהן",
    email: "elad@gmail.com",
    message: "שלום, אשמח לדעת האם הספר 'חומש רש\"י' פנוי להשאלה מחר בבוקר?",
    createdAt: new Date().toISOString(),
    status: "new"
  },
  {
    id: "dummy2",
    name: "מיכל אברהם",
    email: "michal@outlook.com",
    message: "היי, יש לי שאלה לגבי שעות הפתיחה של הספרייה בערבי חגים. תודה!",
    createdAt: new Date().toISOString(),
    status: "resolved"
  }
];

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // הגנה: אם ה-Database לא זמין או לא קיים, נציג ישר נתוני דמה
    if (!db) {
      setMessages(fallbackMessages);
      setLoading(false);
      return;
    }

    const messagesRef = ref(db, 'contact_messages');
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const mrtList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        }));
        mrtList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMessages(mrtList);
      } else {
        // 🌟 אם התיקייה ב-Firebase ריקה (המצב אצלך), נטען את נתוני הדמה כדי שתוכלי לראות את העיצוב
        setMessages(fallbackMessages);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read error, using fallback:", error);
      setMessages(fallbackMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'resolved' ? 'new' : 'resolved';
    
    // אם מדובר בנתוני דמה, נעדכן רק מקומית ב-State
    if (id.startsWith('dummy')) {
      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg));
      return;
    }

    try {
      const messageRef = ref(db, `contact_messages/${id}`);
      await update(messageRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("האם את בטוחה שברצונך למחוק את הפנייה הזו?")) return;

    // אם מדובר בנתוני דמה, נמחק רק מקומית מה-State
    if (id.startsWith('dummy')) {
      setMessages(prev => prev.filter(msg => msg.id !== id));
      return;
    }

    try {
      const messageRef = ref(db, `contact_messages/${id}`);
      await remove(messageRef);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  if (loading) return <div className="admin-messages-loading">טוען פניות...</div>;

  return (
    <div className="admin-messages-container">
      <div className="admin-messages-header">
        <h3 className="text-xl font-semibold text-stone-900">פניות ותמיכת משתמשים</h3>
        <p className="text-sm text-stone-500 mt-1">סה"כ פניות במערכת: {messages.length}</p>
      </div>

      {messages.length === 0 ? (
        <div className="no-messages">אין פניות חדשות בתיבה המרכזית.</div>
      ) : (
        <div className="messages-grid mt-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message-card ${msg.status === 'resolved' ? 'resolved' : 'new'}`}
            >
              <div className="card-badge">
                {msg.status === 'resolved' ? 'טופל' : 'פנייה חדשה'}
              </div>
              
              <div className="card-field">
                <strong>שם:</strong> <span>{msg.name}</span>
              </div>
              
              <div className="card-field">
                <strong>אימייל:</strong> <span className="msg-email">{msg.email}</span>
              </div>
              
              <div className="card-field">
                <strong>תאריך:</strong> <span>{new Date(msg.createdAt).toLocaleString('he-IL')}</span>
              </div>

              <div className="card-body">
                <strong>תוכן הפנייה:</strong>
                <p>{msg.message}</p>
              </div>

              <div className="card-actions">
                <button 
                  onClick={() => toggleStatus(msg.id, msg.status)}
                  className={`status-btn ${msg.status === 'resolved' ? 'reopen' : 'resolve'}`}
                >
                  {msg.status === 'resolved' ? 'פתח מחדש' : 'סמן כטופל'}
                </button>
                
                <button 
                  onClick={() => deleteMessage(msg.id)}
                  className="delete-msg-btn"
                  title="מחק פנייה"
                >
                  🗑️ מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}