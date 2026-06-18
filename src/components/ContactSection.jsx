import React, { useState } from 'react';
import { db } from '../utils/firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import './ContactSection.css';

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus({ type: 'error', text: 'נא למלא את כל השדות' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await addDoc(collection(db, 'contact_messages'), {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        status: 'new',
        createdAt: new Date().toISOString()
      });

      setSubmitStatus({ type: 'success', text: 'ההודעה נשלחה בהצלחה! נחזור אליך בהקדם.' });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error("Error saving message:", error);
      setSubmitStatus({ type: 'error', text: 'שגיאה בשליחת ההודעה, נסה שוב מאוחר יותר.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-section">
      <div className="contact-container">
        
        {/* עמודה 1: פרטי ישיבת וספריית שילה */}
        <div className="contact-info-card">
          <div className="info-header">
            <h2>ספריית שילה</h2>
            <p>לכל שאלה, הארכת ספר או בירור מנוי – אתם מוזמנים ליצור איתנו קשר ישיר.</p>
          </div>
          
          <div className="info-details">
            <div className="info-item">
              <span className="info-icon">📞</span>
              <div>
                <h3>משרד הישיבה</h3>
                <p className="phone-link">02-9942130</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">✉️</span>
              <div>
                <h3>כתובת אימייל</h3>
                <a href="mailto:Office@yshilo.co.il" className="info-email-link">Office@yshilo.co.il</a>
              </div>
            </div>

            <div className="info-divider"></div>

            <div className="info-item">
              <span className="info-icon">👤</span>
              <div>
                <h3>אחראי שבו"שים</h3>
                <p>מאור: 052-2800521</p>
                <p>איתמר: 054-8648850</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">💼</span>
              <div>
                <h3>מנהל הישיבה</h3>
                <p>052-5758155</p>
              </div>
            </div>
          </div>
        </div>

        {/* עמודה 2: טופס השארת פרטים */}
        <div className="contact-form-card">
          <div className="form-header">
            <h2>השארת פנייה</h2>
            <p>מלאו את הפרטים ונחזור אליכם בהקדם האפשרי</p>
          </div>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">שם מלא</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="הקלידו שם מלא"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">כתובת אימייל</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">תוכן ההודעה</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="איך אנחנו יכולים לעזור לך?"
                rows="4"
                required
              ></textarea>
            </div>

            {submitStatus && (
              <div className={`submit-message ${submitStatus.type}`}>
                {submitStatus.text}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-submit">
              {isSubmitting ? 'שולח...' : 'שליחת הודעה'}
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}