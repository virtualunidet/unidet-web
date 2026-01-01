// src/pages/AdminServicios.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { adminFetch } from "../services/api";

export default function AdminServicios() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState(1);
  const [visible, setVisible] = useState(true);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    loadServicios();
  }, []);

  async function loadServicios() {
    try {
      setCargando(true);
      setError("");

      const res = await adminFetch("/admin/services", { method: "GET" });
      const data = await res.json().catch(() => ({}));

      // Soporta { items: [...] } o directamente [...]
      const lista = Array.isArray(data) ? data : data.items || [];
      setItems(lista);
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      setError("No se pudieron cargar los servicios.");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormulario() {
    setTitulo("");
    setDescripcion("");
    setOrden(1);
    setVisible(true);
    setEditandoId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    const body = new URLSearchParams();
    body.append("titulo", titulo.trim());
    if (descripcion.trim()) body.append("descripcion", descripcion.trim());
    body.append("orden", String(orden || 1));
    body.append("visible", visible ? "1" : "0");

    const path = editandoId
      ? `/admin/services/${editandoId}`
      : "/admin/services";
    const method = editandoId ? "PUT" : "POST";

    try {
      const res = await adminFetch(path, {
        method,
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el servicio");
      }

      await loadServicios();
      limpiarFormulario();
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      setError(e.message || "Error al guardar el servicio");
    }
  }

  function handleEditar(svc) {
    setEditandoId(svc.id);
    setTitulo(svc.titulo || "");
    setDescripcion(svc.descripcion || "");
    setOrden(
      typeof svc.orden === "number"
        ? svc.orden
        : svc.orden
        ? parseInt(svc.orden, 10) || 1
        : 1
    );
    setVisible(
      svc.visible === 1 || svc.visible === "1" || svc.visible === true
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEliminar(id) {
    const seguro = window.confirm(
      "¿Seguro que quieres eliminar este servicio?"
    );
    if (!seguro) return;

    try {
      const res = await adminFetch(`/admin/services/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || "No se pudo eliminar el servicio"
        );
      }

      setItems((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      setError(e.message || "Error al eliminar el servicio");
    }
  }

  // Ordenar por orden asc y luego por id
  const sortedItems = [...items].sort((a, b) => {
    const ordA =
      typeof a.orden === "number"
        ? a.orden
        : a.orden
        ? parseInt(a.orden, 10) || 999
        : 999;
    const ordB =
      typeof b.orden === "number"
        ? b.orden
        : b.orden
        ? parseInt(b.orden, 10) || 999
        : 999;

    if (ordA !== ordB) return ordA - ordB;
    return (a.id ?? 0) - (b.id ?? 0);
  });

  return (
    <div className="admin-page">
      <header className="section-header">
        <span className="section-badge">Panel administrador</span>
        <AdminNav />
        <h1 className="section-title">Servicios UNIDET</h1>
        <p className="section-subtitle">
          Configura los servicios y apoyos que se muestran en la página de
          Servicios.
        </p>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-grid">
        {/* LISTA */}
        <section className="admin-list">
          <div className="admin-list-header">
            <h2>Servicios configurados</h2>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={limpiarFormulario}
            >
              Nuevo servicio
            </button>
          </div>

          {cargando ? (
            <p>Cargando servicios...</p>
          ) : sortedItems.length === 0 ? (
            <p>No hay servicios configurados.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Título</th>
                  <th className="col-small">Orden</th>
                  <th className="col-small">Visible</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((svc) => (
                  <tr key={svc.id}>
                    <td className="col-id">{svc.id}</td>
                    <td>
                      <div className="course-title-cell">
                        <strong>{svc.titulo}</strong>
                        {svc.descripcion && (
                          <p className="muted small-text">
                            {svc.descripcion.length > 80
                              ? svc.descripcion.slice(0, 80) + "…"
                              : svc.descripcion}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="col-small">
                      <span className="pill pill-light">
                        {svc.orden ?? "-"}
                      </span>
                    </td>
                    <td className="col-small">
                      <span
                        className={
                          "pill " +
                          (svc.visible === 1 ||
                          svc.visible === "1" ||
                          svc.visible === true
                            ? "pill-success"
                            : "pill-muted")
                        }
                      >
                        {svc.visible === 1 ||
                        svc.visible === "1" ||
                        svc.visible === true
                          ? "Sí"
                          : "No"}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleEditar(svc)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => handleEliminar(svc.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* FORMULARIO */}
        <section className="admin-form-section">
          <h2>{editandoId ? "Editar servicio" : "Nuevo servicio"}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="field">
              <label>Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Descripción</label>
              <textarea
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Orden (1, 2, 3...)</label>
              <input
                type="number"
                min={1}
                value={orden}
                onChange={(e) =>
                  setOrden(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
              />
            </div>

            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                />{" "}
                Visible en la página pública
              </label>
            </div>

            <div
              style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
            >
              <button type="submit" className="btn">
                {editandoId ? "Guardar cambios" : "Crear servicio"}
              </button>
              {editandoId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={limpiarFormulario}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
