import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import UnityPage from "./pages/UnityPage";
import Gallery from "./pages/Gallery";
import Selection from "./pages/Selection";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/galeria" element={<Gallery />} />
        <Route path="/selecao" element={<Selection />} />
        <Route path="/unity" element={<UnityPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
