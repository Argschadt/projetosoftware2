import "./Footer.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Acervo Artístico da UFSM. Todos os direitos reservados.</p>
        <p>Desenvolvido como parte de um projeto de software.</p>
        <Link to="/admin" className="admin-link">Admin</Link>
      </div>
    </footer>
  );
}
