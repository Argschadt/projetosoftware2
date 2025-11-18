import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import UnityPage from "./pages/UnityPage";
import Gallery from "./pages/Gallery";
import Exposicoes from "./pages/Exposicoes";
import ExposicaoVisor from "./pages/ExposicaoVisor";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/exposicoes" element={<Exposicoes />} />
              <Route path="/exposicoes/:id" element={<ExposicaoVisor />} />
              <Route path="/unity" element={<UnityPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
