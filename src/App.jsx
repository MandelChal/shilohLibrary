import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";  // נכון: מתוך תיקיית components
import Login from "./components/Login"; // גם login מתיקיית components

function App() {
  return (
<<<<<<< HEAD
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
=======
    <>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <Login />
      <p>
        Edit <code>src/App.jsx</code> and save to test HMR
      </p>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
>>>>>>> 1242d5c (fix App.jsx)
}

export default App;
