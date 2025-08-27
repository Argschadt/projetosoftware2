import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkStyle: React.CSSProperties = {
    marginRight: 16,
    textDecoration: "none",
    color: "#ffffff",
    fontWeight: 500,
  };

  const activeStyle: React.CSSProperties = {
    textDecoration: "underline",
    color: "#ffffff",
  };

  return (
    <nav
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid #3a3a3a",
        position: "sticky",
        top: 0,
        background: "var(--bg, #242424)",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontWeight: 700 }}>Acervo 3D</span>
      </div>
      <div>
        <NavLink
          to="/"
          style={({ isActive }: { isActive: boolean }) => ({
            ...linkStyle,
            ...(isActive ? activeStyle : {}),
          })}
          end
        >
          Início
        </NavLink>
        <NavLink
          to="/galeria"
          style={({ isActive }: { isActive: boolean }) => ({
            ...linkStyle,
            ...(isActive ? activeStyle : {}),
          })}
        >
          Galeria
        </NavLink>
        <NavLink
          to="/unity"
          style={({ isActive }: { isActive: boolean }) => ({
            ...linkStyle,
            ...(isActive ? activeStyle : {}),
          })}
        >
          Visualização 3D
        </NavLink>
      </div>
    </nav>
  );
}
