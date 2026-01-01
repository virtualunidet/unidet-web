// src/components/AdminNav.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAdminAuth, getAdminUser } from "../services/api";

function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const adminUser = getAdminUser();
  const isSuperadmin = adminUser?.role === "superadmin";

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    clearAdminAuth();
    navigate("/admin", { replace: true });
  };

  return (
    <header
      className="admin-nav"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
        padding: "0.75rem 1.5rem",
        marginBottom: "1.25rem",
        backgroundColor: "#003366",
        color: "#fff",
        borderRadius: "999px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          type="button"
          onClick={() => navigate("/admin/noticias")}
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          UNIDET Admin
        </button>

        <nav style={{ display: "flex", gap: "0.75rem" }}>
          <Link
            to="/admin/admisiones"
            style={{
              color: isActive("/admin/admisiones") ? "#ffcc00" : "#fff",
              textDecoration: "none",
              fontWeight: isActive("/admin/admisiones") ? "bold" : "normal",
            }}
          >
            Admisiones
          </Link>

          <Link
            to="/admin/cursos"
            style={{
              color: isActive("/admin/cursos") ? "#ffcc00" : "#fff",
              textDecoration: "none",
              fontWeight: isActive("/admin/cursos") ? "bold" : "normal",
            }}
          >
            Oferta
          </Link>

          <Link
            to="/admin/servicios"
            style={{
              color: isActive("/admin/servicios") ? "#ffcc00" : "#fff",
              textDecoration: "none",
              fontWeight: isActive("/admin/servicios") ? "bold" : "normal",
            }}
          >
            Servicios
          </Link>

          <Link
            to="/admin/noticias"
            style={{
              color: isActive("/admin/noticias") ? "#ffcc00" : "#fff",
              textDecoration: "none",
              fontWeight: isActive("/admin/noticias") ? "bold" : "normal",
            }}
          >
            Noticias
          </Link>

          <Link
            to="/admin/eventos"
            style={{
              color: isActive("/admin/eventos") ? "#ffcc00" : "#fff",
              textDecoration: "none",
              fontWeight: isActive("/admin/eventos") ? "bold" : "normal",
            }}
          >
            Calendario
          </Link>

          <Link
            to="/admin/reglamento"
            style={{
              color: isActive("/admin/reglamento") ? "#ffcc00" : "#fff",
              textDecoration: "none",
              fontWeight: isActive("/admin/reglamento") ? "bold" : "normal",
            }}
          >
            Reglamento
          </Link>

          <Link
            to="/admin/contacto"
            style={{
              color: isActive("/admin/contacto") ? "#ffcc00" : "#fff",
              textDecoration: "none",
              fontWeight: isActive("/admin/contacto") ? "bold" : "normal",
            }}
          >
            Contacto
          </Link>

          <Link
            to="/admin/faq"
            style={{
              color: isActive("/admin/faq") ? "#ffcc00" : "#fff",
              textDecoration: "none",
              fontWeight: isActive("/admin/faq") ? "bold" : "normal",
            }}
          >
            FAQ
          </Link>

          {isSuperadmin && (
            <Link
              to="/admin/usuarios"
              style={{
                color: isActive("/admin/usuarios") ? "#ffcc00" : "#fff",
                textDecoration: "none",
                fontWeight: isActive("/admin/usuarios") ? "bold" : "normal",
              }}
            >
              Admins
            </Link>
          )}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {adminUser && (
          <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
            Bienvenido,&nbsp;
            <strong>{adminUser.name}</strong>{" "}
            {adminUser.role === "superadmin" && "(superadmin)"}
          </span>
        )}

        <button
          type="button"
          onClick={handleLogout}
          style={{
            borderRadius: "999px",
            border: "1px solid #fff",
            padding: "0.3rem 0.9rem",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}

export default AdminNav;
