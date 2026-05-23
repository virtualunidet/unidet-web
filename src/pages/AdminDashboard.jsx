// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import { adminGetJson, getAdminUser } from "../services/api";

function toList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function isVisible(item) {
  return item.visible === 1 || item.visible === "1" || item.visible === true;
}

function buildStats(label, items, path) {
  const total = items.length;
  const visibles = items.filter(isVisible).length;
  const ocultos = total - visibles;

  return {
    label,
    total,
    visibles,
    ocultos,
    path,
  };
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [aviso, setAviso] = useState(null);

  const [stats, setStats] = useState([]);
  const [reglamento, setReglamento] = useState(null);
  const [contacto, setContacto] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  const adminUser = getAdminUser();
  const isSuperadmin = adminUser?.role === "superadmin";

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setAviso(null);

      const requests = [
        adminGetJson("/admin/news"),
        adminGetJson("/admin/courses"),
        adminGetJson("/admin/services"),
        adminGetJson("/admin/events"),
        adminGetJson("/admin/admissions"),
        adminGetJson("/admin/faq"),
        adminGetJson("/admin/regulation"),
        adminGetJson("/admin/contact"),
      ];

      if (isSuperadmin) {
        requests.push(adminGetJson("/admin/users"));
      }

      const results = await Promise.allSettled(requests);

      const news =
        results[0].status === "fulfilled" ? toList(results[0].value) : [];
      const courses =
        results[1].status === "fulfilled" ? toList(results[1].value) : [];
      const services =
        results[2].status === "fulfilled" ? toList(results[2].value) : [];
      const events =
        results[3].status === "fulfilled" ? toList(results[3].value) : [];
      const admissions =
        results[4].status === "fulfilled" ? toList(results[4].value) : [];
      const faq =
        results[5].status === "fulfilled" ? toList(results[5].value) : [];

      const regulationData =
        results[6].status === "fulfilled" ? results[6].value : null;

      const contactData =
        results[7].status === "fulfilled" ? results[7].value : null;

      const usersData =
        isSuperadmin && results[8]?.status === "fulfilled"
          ? toList(results[8].value)
          : [];

      setStats([
        buildStats("Noticias", news, "/admin/noticias"),
        buildStats("Oferta educativa", courses, "/admin/cursos"),
        buildStats("Servicios", services, "/admin/servicios"),
        buildStats("Eventos", events, "/admin/eventos"),
        buildStats("Admisiones", admissions, "/admin/admisiones"),
        buildStats("FAQ", faq, "/admin/faq"),
      ]);

      setReglamento(regulationData);
      setContacto(contactData);
      setUsuarios(usersData);

      const rejected = results.filter((r) => r.status === "rejected").length;

      if (rejected > 0) {
        setAviso({
          tipo: "info",
          texto:
            "El dashboard cargó parcialmente. Algunos módulos no respondieron, pero el panel sigue disponible.",
        });
      }
    } catch (err) {
      console.error(err);
      setAviso({
        tipo: "error",
        texto: "No se pudo cargar el resumen del panel administrativo.",
      });
    } finally {
      setLoading(false);
    }
  }

  const pdfCargado = Boolean(reglamento?.pdf_path);

  const contactoConfigurado =
    Boolean(contacto?.address) ||
    Boolean(contacto?.schedule) ||
    Boolean(contacto?.phones?.length) ||
    Boolean(contacto?.emails?.length) ||
    Boolean(contacto?.socials?.length);

  const adminsActivos = usuarios.filter(
    (u) => u.is_active === 1 || u.is_active === true || u.is_active === "1"
  ).length;

  return (
    <div className="admin-page">
      <header className="section-header">
        <span className="section-badge">Panel administrador</span>
        <AdminNav />

        <h1 className="section-title">Dashboard administrativo</h1>
        <p className="section-subtitle">
          Resumen general del contenido publicado y accesos rápidos para la
          gestión del portal UNIDET.
        </p>
      </header>

      {aviso && (
        <div className={`admin-alert admin-alert-${aviso.tipo}`}>
          <span>{aviso.texto}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setAviso(null)}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <p>Cargando resumen del sistema...</p>
      ) : (
        <>
          <section className="admin-grid">
            {stats.map((item) => (
              <article key={item.label} className="card">
                <h3 className="card-title">{item.label}</h3>

                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    margin: "0.2rem 0",
                    color: "#111827",
                  }}
                >
                  {item.total}
                </p>

                <div className="admin-meta">
                  <span className="admin-status-badge admin-status-visible">
                    {item.visibles} visibles
                  </span>

                  <span className="admin-status-badge admin-status-hidden">
                    {item.ocultos} ocultos
                  </span>
                </div>

                <Link
                  to={item.path}
                  className="btn btn-secondary"
                  style={{ marginTop: "0.75rem" }}
                >
                  Administrar
                </Link>
              </article>
            ))}
          </section>

          <section style={{ marginTop: "2rem" }}>
            <div className="section-header" style={{ marginBottom: "1rem" }}>
              <h2 className="section-title" style={{ fontSize: "1.3rem" }}>
                Estado de configuración
              </h2>
              <p className="section-subtitle">
                Revisión rápida de elementos importantes del portal.
              </p>
            </div>

            <div className="cards-grid">
              <article className="card">
                <h3 className="card-title">Reglamento</h3>

                <span
                  className={`admin-status-badge ${
                    pdfCargado ? "admin-status-visible" : "admin-status-hidden"
                  }`}
                  style={{ width: "fit-content" }}
                >
                  {pdfCargado ? "PDF cargado" : "Sin PDF"}
                </span>

                <p className="card-text">
                  {pdfCargado
                    ? "El reglamento oficial ya está disponible para consulta pública."
                    : "Aún falta cargar el PDF oficial del reglamento."}
                </p>

                <Link to="/admin/reglamento" className="btn btn-secondary">
                  Revisar reglamento
                </Link>
              </article>

              <article className="card">
                <h3 className="card-title">Contacto</h3>

                <span
                  className={`admin-status-badge ${
                    contactoConfigurado
                      ? "admin-status-visible"
                      : "admin-status-hidden"
                  }`}
                  style={{ width: "fit-content" }}
                >
                  {contactoConfigurado ? "Configurado" : "Pendiente"}
                </span>

                <p className="card-text">
                  {contactoConfigurado
                    ? "La información institucional de contacto está configurada."
                    : "Aún falta configurar datos de contacto."}
                </p>

                <Link to="/admin/contacto" className="btn btn-secondary">
                  Editar contacto
                </Link>
              </article>

              {isSuperadmin && (
                <article className="card">
                  <h3 className="card-title">Administradores</h3>

                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: 900,
                      margin: "0.2rem 0",
                      color: "#111827",
                    }}
                  >
                    {usuarios.length}
                  </p>

                  <div className="admin-meta">
                    <span className="admin-status-badge admin-status-visible">
                      {adminsActivos} activos
                    </span>

                    <span className="admin-status-badge admin-status-hidden">
                      {usuarios.length - adminsActivos} inactivos
                    </span>
                  </div>

                  <Link to="/admin/usuarios" className="btn btn-secondary">
                    Gestionar admins
                  </Link>
                </article>
              )}
            </div>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <div className="section-header" style={{ marginBottom: "1rem" }}>
              <h2 className="section-title" style={{ fontSize: "1.3rem" }}>
                Accesos rápidos
              </h2>
              <p className="section-subtitle">
                Acciones comunes para administrar el contenido del portal.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <Link to="/admin/noticias" className="btn">
                Crear noticia
              </Link>

              <Link to="/admin/cursos" className="btn">
                Crear curso
              </Link>

              <Link to="/admin/eventos" className="btn">
                Crear evento
              </Link>

              <Link to="/admin/reglamento" className="btn btn-secondary">
                Subir reglamento
              </Link>

              <Link to="/admin/contacto" className="btn btn-secondary">
                Editar contacto
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}