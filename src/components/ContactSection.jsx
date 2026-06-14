import React, { useState } from 'react';
import './ContactSection.css';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // כאן תוכל להוסיף לוגיקה לשליחת הטופס
    console.log('Form submitted:', formData);
    alert('ההודעה נשלחה בהצלחה!');
    // איפוס הטופס
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  return (
    <section className="contact-section">
      <div className="container">
        <h2 className="contact-title">צור קשר</h2>
        
        <div className="contact-content">
          {/* פרטי קשר */}
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <a href="tel:0299942130" className="contact-link">02-9942130</a>
            </div>
            
            <div className="contact-item">
              <span className="contact-icon">✉️</span>
              <a href="mailto:yshilo@netvision.net.il" className="contact-link">
                yshilo@netvision.net.il
              </a>
            </div>
            
            <div className="contact-item">
              <span className="contact-icon whatsapp">💬</span>
              <a href="https://wa.me/972522800521" className="contact-link whatsapp-link">
                052-2800521 - מנהל עבודות - מאיר
              </a>
            </div>
            
            <div className="contact-item">
              <span className="contact-icon whatsapp">💬</span>
              <a href="https://wa.me/972523561433" className="contact-link whatsapp-link">
                052-3561433 - מנהל עבודות - גלעד
              </a>
            </div>
            
            <div className="contact-item">
              <span className="contact-icon whatsapp">💬</span>
              <a href="https://wa.me/972525758155" className="contact-link whatsapp-link">
                052-5758155 - מנהל הפרויקטים
              </a>
            </div>

            <div className="social-links">
              <a href="https://youtube.com" className="social-link youtube" target="_blank" rel="noopener noreferrer">
                <span>📺</span>
              </a>
              <a href="https://facebook.com" className="social-link facebook" target="_blank" rel="noopener noreferrer">
                <span>📘</span>
              </a>
            </div>
          </div>

          {/* מפה */}
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3381.8982091330097!2d34.88787831516122!3d32.08449398118936!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151d36a5c6b3b5d5%3A0x1234567890abcdef!2z15XXqNeZ16nXqNeUINep15nXnNeV!5e0!3m2!1siw!2sil!4v1234567890123"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="מיקום בגוגל מפות"
            ></iframe>
            <button className="directions-btn">
              🗺️ לנווט במפות
            </button>
          </div>
        </div>

        {/* טופס יצירת קשר */}
        <div className="contact-form-section">
          <h3 className="form-title">טופס יצירת קשר</h3>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="שם"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
              />
              <input
                type="email"
                name="email"
                placeholder="כתובת אימייל"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
              <input
                type="tel"
                name="phone"
                placeholder="מספר טלפון נייד"
                value={formData.phone}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            <textarea
              name="message"
              placeholder="תוכן הפנייה"
              value={formData.message}
              onChange={handleChange}
              required
              className="form-textarea"
              rows="5"
            ></textarea>
            <button type="submit" className="submit-btn">
              שליחה
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;