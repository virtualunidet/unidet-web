// src/components/AdminNav.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAdminAuth, getAdminUser } from "../services/api";

const MODULE_LABELS = {
  "/admin/dashboard": "Dashboard",
  "/admin/admisiones": "Admisiones",
  "/admin/cursos": "Oferta educativa",
  "/admin/servicios": "Servicios",
  "/admin/noticias": "Noticias",
  "/admin/eventos": "Calendario",
  "/admin/reglamento": "Reglamento",
  "/admin/contacto": "Contacto",
  "/admin/faq": "FAQ",
  "/admin/usuarios": "Administradores",
};

function getCurrentModule(pathname) {
  const found = Object.entries(MODULE_LABELS).find(([path]) =>
    pathname.startsWith(path)
  );

  return found ? found[1] : "Panel administrador";
}

function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const adminUser = getAdminUser();
  const isDashboard = location.pathname.startsWith("/admin/dashboard");
  const currentModule = getCurrentModule(location.pathname);

  const handleLogout = () => {
    clearAdminAuth();
    navigate("/admin", { replace: true });
  };

  return (
    <div
      className="admin-nav admin-nav-clean"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.85rem 1.15rem",
        marginBottom: "1.5rem",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        {!isDashboard && (
          <Link
            to="/admin/dashboard"
            className="btn btn-secondary"
            style={{
              padding: "0.55rem 1rem",
              boxShadow: "none",
              textDecoration: "none",
            }}
          >
            ← Volver al dashboard
          </Link>
        )}

        {isDashboard && (
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            style={{
              border: "none",
              background: "transparent",
              color: "#111827",
              fontWeight: "900",
              fontSize: "1rem",
              cursor: "pointer",
              padding: 0,
            }}
          >
            UNIDET Admin
          </button>
        )}

        <div>
          <p
            style={{
              margin: 0,
              fontSize: "0.78rem",
              color: "#6b7280",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Módulo actual
          </p>

          <strong
            style={{
              display: "block",
              color: "#111827",
              fontSize: "1rem",
              lineHeight: 1.2,
            }}
          >
            {currentModule}
          </strong>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {adminUser && (
          <span
            style={{
              fontSize: "0.85rem",
              color: "#374151",
              textAlign: "right",
            }}
          >
            Bienvenido,&nbsp;
            <strong>{adminUser.name || adminUser.nombre || "Admin"}</strong>
            {adminUser.role === "superadmin" && (
              <span style={{ color: "#6b4df5", fontWeight: 700 }}>
                {" "}
                · superadmin
              </span>
            )}
          </span>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-danger"
          style={{
            padding: "0.55rem 1rem",
            boxShadow: "none",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default AdminNav;