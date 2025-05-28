import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';


 
// אירועים לדוגמה
const events = [
    { date: "2025-05-10", title: "🕯️ ערב לימוד לעילוי נשמת ר' יהושע" },
];

// חדשות לדוגמה
const newsHeadlines = [
    "📢 נפתחה ההרשמה לזמן קיץ",
    "📚 נוספו ספרים חדשים למדף 'עיון'",
    "🚌 סיור לימודי לירושלים יתקיים ב-22.5",
];

// ספרים לדוגמה
const books = [
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d",
    "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6",
    "https://images.unsplash.com/photo-1523475496153-3fdf1f1cf3dc"
];

function Home() {
    const navigate = useNavigate();
    const scrollRef = useRef();

    const handleLoginClick = () => navigate("/login");

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -200 : 200;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    return (
        <div style={{ direction: "rtl", fontFamily: "Arial, sans-serif", padding: "20px", color: "#000" }}>
            <h1 style={{ textAlign: "center", marginBottom: "10px" }}>ברוכים הבאים לישיבת שילה 📚</h1>
            <p style={{ textAlign: "center" }}>מקום של תורה, השראה וחיבור</p>
            <Link to="/admin" className="text-blue-600 underline">
        Go to User Admin Panel
</Link> 

            {/* סטריפ חדשות */}
            <div style={{
                backgroundColor: "#f8f9fa",
                padding: "10px",
                border: "1px solid #ddd",
                overflow: "hidden",
                whiteSpace: "nowrap",
                margin: "30px 0"
            }}>
                <marquee direction="right" scrollamount="5">
                    {newsHeadlines.map((headline, i) => (
                        <span key={i} style={{ margin: "0 30px", fontWeight: "bold" }}>
                            {headline}
                        </span>
                    ))}
                </marquee>
            </div>

            {/* לוח שנה מרובע */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "30px",
                flexWrap: "wrap",
                gap: "40px"
            }}>
                <div style={{
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    padding: "20px",
                    width: "300px",
                    textAlign: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                }}>
                    <h3>אירועים קרובים</h3>
                    {events.length === 0 ? (
                        <p>לא נמצאו אירועים</p>
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {events.map((e, i) => (
                                <li key={i} style={{ margin: "10px 0" }}>
                                    <strong>{e.date}:</strong> {e.title}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    padding: "20px",
                    width: "300px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    textAlign: "center"
                }}>
                    <h3>מאי 2025</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                {["שבת", "שישי", "חמישי", "רביעי", "שלישי", "שני", "ראשון"].map((d, i) => (
                                    <th key={i} style={{ padding: "5px", borderBottom: "1px solid #ddd" }}>{d}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                [null, null, null, null, null, 28, 27],
                                [3, 2, 1, 30, 29, 28, 4],
                                [10, 9, 8, 7, 6, 5, 11],
                                [17, 16, 15, 14, 13, 12, 18],
                                [24, 23, 22, 21, 20, 19, 25],
                                [31, 30, 29, 28, 27, 26, 1]
                            ].map((week, i) => (
                                <tr key={i}>
                                    {week.map((day, j) => (
                                        <td key={j} style={{
                                            padding: "6px",
                                            backgroundColor: day === 5 ? "#e6f0ff" : "transparent",
                                            borderRadius: "6px"
                                        }}>
                                            {day || ""}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* גלריית ספרים עם חיצים */}
            <div style={{ marginBottom: "30px" }}>
                <h2 style={{ textAlign: "center" }}>📘 ספרים חדשים</h2>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                    <button onClick={() => scroll("right")} style={arrowButtonStyle}>◀</button>
                    <div
                        ref={scrollRef}
                        style={{
                            display: "flex",
                            overflowX: "auto",
                            scrollBehavior: "smooth",
                            gap: "20px",
                            maxWidth: "600px",
                            padding: "10px"
                        }}
                    >
                        {books.map((src, index) => (
                            <img
                                key={index}
                                src={src}
                                alt={`book-${index}`}
                                style={{
                                    width: "150px",
                                    height: "200px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    flexShrink: 0
                                }}
                            />
                        ))}
                    </div>
                    <button onClick={() => scroll("left")} style={arrowButtonStyle}>▶</button>
                </div>
            </div>

            {/* כפתור התחברות */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                    onClick={handleLoginClick}
                    style={{
                        padding: "10px 20px",
                        fontSize: "18px",
                        borderRadius: "8px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        cursor: "pointer"
                    }}
                >
                    התחבר
                </button>
            </div>
        </div>
    );
}

// עיצוב לחיצים
const arrowButtonStyle = {
    padding: "10px",
    fontSize: "20px",
    border: "none",
    backgroundColor: "#ddd",
    borderRadius: "50%",
    cursor: "pointer"
};

export default Home;
