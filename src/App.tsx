import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import UnityPage from "./pages/UnityPage";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/unity" element={<UnityPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
