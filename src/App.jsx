import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";  // נכון: מתוך תיקיית components
import Login from "./components/Login"; // גם login מתיקיית components
import UserAdminPanel from "./components/UserAdminPanel"; // גם admin מתיקיית components

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<UserAdminPanel />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;