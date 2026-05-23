// src/pages/AdminServicios.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import AdminFilters from "../components/AdminFilters.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { adminFetch } from "../services/api";

export default function AdminServicios() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [aviso, setAviso] = useState(null);

  // Modal de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState(1);
  const [visible, setVisible] = useState(true);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    loadServicios();
  }, []);

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto });
  }

  function cerrarAviso() {
    setAviso(null);
  }

  async function loadServicios() {
    try {
      setCargando(true);

      const res = await adminFetch("/admin/services", { method: "GET" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar los servicios.");
      }

      const lista = Array.isArray(data) ? data : data.items || [];
      setItems(lista);
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso(
        "error",
        e.message || "No se pudieron cargar los servicios."
      );
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

  function validarFormulario() {
    if (!titulo.trim()) {
      mostrarAviso("error", "El título del servicio es obligatorio.");
      return false;
    }

    const ordenNumerico = parseInt(orden, 10);

    if (!ordenNumerico || ordenNumerico < 1) {
      mostrarAviso("error", "El orden debe ser un número mayor o igual a 1.");
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    cerrarAviso();

    if (!validarFormulario()) return;

    const body = new URLSearchParams();
    body.append("titulo", titulo.trim());
    body.append("descripcion", descripcion.trim());
    body.append("orden", String(parseInt(orden, 10) || 1));
    body.append("visible", visible ? "1" : "0");

    const path = editandoId
      ? `/admin/services/${editandoId}`
      : "/admin/services";

    const method = editandoId ? "PUT" : "POST";
    const accion = editandoId ? "actualizado" : "guardado";

    try {
      setGuardando(true);
      mostrarAviso(
        "info",
        editandoId ? "Actualizando servicio..." : "Guardando servicio..."
      );

      const res = await adminFetch(path, {
        method,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el servicio.");
      }

      await loadServicios();
      limpiarFormulario();
      mostrarAviso("success", `Servicio ${accion} correctamente.`);
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso(
        "error",
        e.message || "Error al guardar. Revisa los campos."
      );
    } finally {
      setGuardando(false);
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

    mostrarAviso("info", `Editando servicio #${svc.id}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEliminar(svc) {
    setConfirmDelete({
      id: svc.id,
      title: svc.titulo || `Servicio #${svc.id}`,
    });
  }

  async function confirmarEliminacion() {
    if (!confirmDelete?.id) return;

    const id = confirmDelete.id;

    try {
      setEliminandoId(id);
      mostrarAviso("info", "Eliminando servicio...");

      const res = await adminFetch(`/admin/services/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el servicio.");
      }

      setItems((prev) => prev.filter((s) => s.id !== id));

      if (editandoId === id) {
        limpiarFormulario();
      }

      setConfirmDelete(null);
      mostrarAviso("success", "Servicio eliminado correctamente.");
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", e.message || "Error al eliminar el servicio.");
    } finally {
      setEliminandoId(null);
    }
  }

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

  const filteredItems = sortedItems.filter((svc) => {
    const textoBusqueda = search.trim().toLowerCase();

    const esVisible =
      svc.visible === 1 || svc.visible === "1" || svc.visible === true;

    const matchesSearch =
      !textoBusqueda ||
      String(svc.titulo || "").toLowerCase().includes(textoBusqueda) ||
      String(svc.descripcion || "").toLowerCase().includes(textoBusqueda) ||
      String(svc.orden || "").toLowerCase().includes(textoBusqueda);

    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "visibles" && esVisible) ||
      (statusFilter === "ocultos" && !esVisible);

    return matchesSearch && matchesStatus;
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

      {aviso && (
        <div className={`admin-alert admin-alert-${aviso.tipo}`}>
          <span>{aviso.texto}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={cerrarAviso}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      <div className="admin-grid">
        {/* LISTA */}
        <section className="admin-list">
          <div className="admin-list-header">
            <h2>Servicios configurados</h2>

            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => {
                limpiarFormulario();
                mostrarAviso(
                  "info",
                  "Formulario listo para crear un nuevo servicio."
                );
              }}
              disabled={guardando}
            >
              Nuevo servicio
            </button>
          </div>

          {cargando ? (
            <p>Cargando servicios...</p>
          ) : sortedItems.length === 0 ? (
            <p>No hay servicios configurados.</p>
          ) : (
            <>
              <AdminFilters
                search={search}
                onSearchChange={setSearch}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                placeholder="Buscar servicio por título, descripción u orden..."
              />

              <p className="admin-results-note">
                Mostrando {filteredItems.length} de {sortedItems.length}{" "}
                servicio(s).
              </p>

              {filteredItems.length === 0 ? (
                <div className="card">
                  <h3 className="card-title">Sin resultados</h3>
                  <p className="card-text">
                    No se encontraron servicios con los filtros seleccionados.
                  </p>
                </div>
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
                    {filteredItems.map((svc) => {
                      const esVisible =
                        svc.visible === 1 ||
                        svc.visible === "1" ||
                        svc.visible === true;

                      return (
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
                              className={`admin-status-badge ${
                                esVisible
                                  ? "admin-status-visible"
                                  : "admin-status-hidden"
                              }`}
                            >
                              {esVisible ? "Visible" : "Oculto"}
                            </span>
                          </td>

                          <td className="col-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleEditar(svc)}
                              disabled={guardando || eliminandoId === svc.id}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              onClick={() => handleEliminar(svc)}
                              disabled={guardando || eliminandoId === svc.id}
                            >
                              {eliminandoId === svc.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </section>

        {/* FORMULARIO */}
        <section className="admin-form-section">
          <h2>
            {editandoId
              ? `Editar servicio #${editandoId}`
              : "Nuevo servicio"}
          </h2>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="field">
              <label>Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                disabled={guardando}
              />
            </div>

            <div className="field">
              <label>Descripción</label>
              <textarea
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={guardando}
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
                disabled={guardando}
              />
            </div>

            <div className="field">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                  disabled={guardando}
                />

                <span className="admin-toggle-label">
                  Visible en la página pública
                </span>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <button type="submit" className="btn" disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : editandoId
                  ? "Guardar cambios"
                  : "Crear servicio"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    limpiarFormulario();
                    mostrarAviso("info", "Edición cancelada.");
                  }}
                  disabled={guardando}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </section>
      </div>

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Eliminar servicio"
        message={
          confirmDelete
            ? `¿Seguro que deseas eliminar el servicio "${confirmDelete.title}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar servicio"
        cancelText="Cancelar"
        loading={Boolean(eliminandoId)}
        onCancel={() => {
          if (!eliminandoId) setConfirmDelete(null);
        }}
        onConfirm={confirmarEliminacion}
      />
    </div>
  );
}