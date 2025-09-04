import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Preferences from "./pages/Preferences.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Journal from "./pages/Journal.jsx";
import "./App.css";

function App() {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/preferences" element={<Preferences />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/journal" element={<Journal />} />
            </Routes>
        </Router>
    );
}

export default App;
