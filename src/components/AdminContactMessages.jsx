import React, { useEffect, useState } from 'react';
import { db } from '../utils/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'; // שינוי ל-Firestore
import './AdminContactMessages.css';

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // משיכת ההודעות מ-Firestore ומיונם לפי זמן
    const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const messageRef = doc(db, 'contact_messages', id);
      const newStatus = currentStatus === 'treated' ? 'new' : 'treated';
      await updateDoc(messageRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק פנייה זו?')) {
      try {
        await deleteDoc(doc(db, 'contact_messages', id));
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  if (loading) return <div className="admin-loading">טוען פניות משתמשים...</div>;

  return (
    <div className="admin-messages-container">
      <div className="admin-messages-header">
        <h2>ניהול פניות משתמשים ({messages.length})</h2>
        <p>כאן ניתן לעקוב אחר הודעות שנשלחו מהאתר, לסמן כטופל או למחוק.</p>
      </div>

      {messages.length === 0 ? (
        <div className="no-messages">אין פניות משתמשים במערכת.</div>
      ) : (
        <div className="messages-grid">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-card ${msg.status === 'treated' ? 'status-treated' : 'status-new'}`}>
              <div className="message-badge">
                {msg.status === 'treated' ? '✅ טופל' : '🔔 חדש'}
              </div>
              
              <div className="message-info">
                <h3>{msg.name}</h3>
                <a href={`mailto:${msg.email}`} className="message-email">{msg.email}</a>
                <span className="message-date">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString('he-IL') : ''}
                </span>
              </div>

              <div className="message-body">
                <p>{msg.message}</p>
              </div>

              <div className="message-actions">
                <button 
                  onClick={() => handleToggleStatus(msg.id, msg.status)}
                  className={`btn-action btn-status ${msg.status === 'treated' ? 'btn-untreat' : 'btn-treat'}`}
                >
                  {msg.status === 'treated' ? 'סמן כלא טופל' : 'סמן כטופל'}
                </button>
                <button 
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="btn-action btn-delete"
                >
                  מחק פנייה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}