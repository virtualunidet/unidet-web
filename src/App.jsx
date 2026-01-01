// src/App.jsx
import { Routes, Route, useLocation, Link, Navigate } from "react-router-dom";

import Header from "./components/Header.jsx";
import TopNav from "./components/TopNav.jsx";

import AdminReglamento from "./pages/AdminReglamento.jsx";
import Home from "./pages/Home.jsx";
import Admisiones from "./pages/Admisiones.jsx";
import Oferta from "./pages/Oferta.jsx";
import Servicios from "./pages/Servicios.jsx";
import Noticias from "./pages/Noticias.jsx";
import Calendario from "./pages/Calendario.jsx";
import Reglamento from "./pages/Reglamento.jsx";
import Contacto from "./pages/Contacto.jsx";
import Faq from "./pages/Faq.jsx";

import AdminContacto from "./pages/AdminContacto";
import AdminFaq from "./pages/AdminFaq.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminNoticias from "./pages/AdminNoticias.jsx";
import AdminServicios from "./pages/AdminServicios.jsx";
import AdminEventos from "./pages/AdminEventos.jsx";
import AdminCursos from "./pages/AdminCursos.jsx";
import AdminAdmisiones from "./pages/AdminAdmisiones.jsx";
import AdminUsers from "./pages/AdminUsers.jsx"; // 👈 NUEVO

import { getAdminToken, getAdminUser } from "./services/api";

// ================================================
//  Botón flotante admin
//  - Si NO hay token admin -> /admin (login)
//  - Si SÍ hay token admin -> /admin/noticias
// ================================================
function AdminShortcut() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) return null;

  const hasAdminToken = !!getAdminToken();
  const target = hasAdminToken ? "/admin/noticias" : "/admin";

  return (
    <Link to={target} className="admin-fab">
      Acceso administrador
    </Link>
  );
}

// ================================================
//  Guard para rutas de administrador
//  - Si no hay token -> login
//  - Si onlySuperadmin = true, solo role === 'superadmin'
// ================================================
function RequireAdmin({ children, onlySuperadmin = false }) {
  const token = getAdminToken();
  const user = getAdminUser();
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/admin"
        state={{ from: location }}
        replace
      />
    );
  }

  if (onlySuperadmin && (!user || user.role !== "superadmin")) {
    // No es superadmin -> lo mandamos a la página principal del panel
    return <Navigate to="/admin/noticias" replace />;
  }

  return children;
}

// ================================================
//  App
// ================================================
export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <TopNav />

      <main className="content">
        <Routes>
          {/* Público */}
          <Route path="/" element={<Home />} />
          <Route path="/admisiones" element={<Admisiones />} />
          <Route path="/oferta" element={<Oferta />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/reglamento" element={<Reglamento />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/faq" element={<Faq />} />

          {/* Login admin principal en /admin */}
          <Route
            path="/admin"
            element={
              getAdminToken() ? (
                <Navigate to="/admin/noticias" replace />
              ) : (
                <AdminLogin />
              )
            }
          />

          {/* Alias /admin/login -> redirige a /admin */}
          <Route
            path="/admin/login"
            element={<Navigate to="/admin" replace />}
          />

          {/* Panel admin (protegido con token admin / superadmin) */}
          <Route
            path="/admin/noticias"
            element={
              <RequireAdmin>
                <AdminNoticias />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/servicios"
            element={
              <RequireAdmin>
                <AdminServicios />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/eventos"
            element={
              <RequireAdmin>
                <AdminEventos />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/cursos"
            element={
              <RequireAdmin>
                <AdminCursos />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/admisiones"
            element={
              <RequireAdmin>
                <AdminAdmisiones />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/reglamento"
            element={
              <RequireAdmin>
                <AdminReglamento />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/contacto"
            element={
              <RequireAdmin>
                <AdminContacto />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/faq"
            element={
              <RequireAdmin>
                <AdminFaq />
              </RequireAdmin>
            }
          />

          {/* Solo superadmin: gestión de usuarios admin */}
          <Route
            path="/admin/usuarios"
            element={
              <RequireAdmin onlySuperadmin>
                <AdminUsers />
              </RequireAdmin>
            }
          />

          {/* Cualquier otra ruta -> Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <AdminShortcut />
    </div>
  );
}
