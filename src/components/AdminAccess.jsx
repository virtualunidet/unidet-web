// src/components/AdminAccess.jsx
import { Link, useLocation } from "react-router-dom";
import { getToken } from "../services/api";

/**
 * Pequeño banner fijo que:
 * - En páginas públicas muestra "Iniciar sesión como admin".
 * - Si ya hay token, muestra "Ir al panel admin".
 * - Se oculta automáticamente en cualquier ruta que empiece con /admin.
 */
export default function AdminAccess() {
  const location = useLocation();
  const token = getToken(); // usa el mismo helper que AdminNoticias/AdminEventos

  // No mostrar dentro del área /admin
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const isLoggedIn = Boolean(token);

  return (
    <div className="admin-access">
      {isLoggedIn ? (
        <>
          <span className="admin-access-label">
            Sesión de administrador activa.
          </span>
          <Link to="/admin/noticias" className="admin-access-link">
            Regresar al panel administrador
          </Link>
        </>
      ) : (
        <>
          <span className="admin-access-label">¿Eres administrador?</span>
          <Link to="/admin/login" className="admin-access-link">
            Inicia sesión aquí
          </Link>
        </>
      )}
    </div>
  );
}
