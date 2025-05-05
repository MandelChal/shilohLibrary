import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate("/login");
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>ברוכים הבאים לספריית שילה 📚</h1>
            <p>כאן תוכלו להשאיל, להחזיר ולחפש ספרים.</p>
            <button
                onClick={handleLoginClick}
                style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    fontSize: "18px",
                    borderRadius: "8px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                התחבר
            </button>
        </div>
    );
}

export default Home;
