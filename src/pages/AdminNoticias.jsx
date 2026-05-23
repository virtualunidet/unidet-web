// src/pages/AdminNoticias.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import AdminFilters from "../components/AdminFilters.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { adminFetch } from "../services/api";

export default function AdminNoticias() {
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
  const [resumen, setResumen] = useState("");
  const [contenido, setContenido] = useState("");
  const [visible, setVisible] = useState(true);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    loadNews();
  }, []);

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto });
  }

  function cerrarAviso() {
    setAviso(null);
  }

  async function loadNews() {
    setCargando(true);

    try {
      const res = await adminFetch("/admin/news", {
        method: "GET",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar las noticias.");
      }

      const lista = Array.isArray(data) ? data : data.items || [];
      setItems(lista);
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", e.message || "Error al cargar noticias.");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormulario() {
    setTitulo("");
    setResumen("");
    setContenido("");
    setVisible(true);
    setEditandoId(null);
  }

  function validarFormulario() {
    if (!titulo.trim()) {
      mostrarAviso("error", "El título de la noticia es obligatorio.");
      return false;
    }

    if (!contenido.trim()) {
      mostrarAviso("error", "El contenido de la noticia es obligatorio.");
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
    body.append("resumen", resumen.trim());
    body.append("contenido", contenido.trim());
    body.append("visible", visible ? "1" : "0");

    const path = editandoId ? `/admin/news/${editandoId}` : "/admin/news";
    const method = editandoId ? "PUT" : "POST";
    const accion = editandoId ? "actualizada" : "guardada";

    try {
      setGuardando(true);
      mostrarAviso(
        "info",
        editandoId ? "Actualizando noticia..." : "Guardando noticia..."
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
        throw new Error(data.error || "Error al guardar la noticia.");
      }

      await loadNews();
      limpiarFormulario();
      mostrarAviso("success", `Noticia ${accion} correctamente.`);
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

  function handleEditar(noticia) {
    setEditandoId(noticia.id);
    setTitulo(noticia.titulo || "");
    setResumen(noticia.resumen || "");
    setContenido(noticia.contenido || "");
    setVisible(
      noticia.visible === 1 ||
        noticia.visible === "1" ||
        noticia.visible === true
    );

    mostrarAviso("info", `Editando noticia #${noticia.id}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEliminar(noticia) {
    setConfirmDelete({
      id: noticia.id,
      title: noticia.titulo || `Noticia #${noticia.id}`,
    });
  }

  async function confirmarEliminacion() {
    if (!confirmDelete?.id) return;

    const id = confirmDelete.id;

    try {
      setEliminandoId(id);
      mostrarAviso("info", "Eliminando noticia...");

      const res = await adminFetch(`/admin/news/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar la noticia.");
      }

      setItems((prev) => prev.filter((n) => n.id !== id));

      if (editandoId === id) {
        limpiarFormulario();
      }

      setConfirmDelete(null);
      mostrarAviso("success", "Noticia eliminada correctamente.");
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", e.message || "Error al eliminar la noticia.");
    } finally {
      setEliminandoId(null);
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    const fechaA = a.fecha_publicacion || a.created_at || "";
    const fechaB = b.fecha_publicacion || b.created_at || "";

    if (fechaA && fechaB && fechaA !== fechaB) {
      return String(fechaB).localeCompare(String(fechaA));
    }

    return (b.id ?? 0) - (a.id ?? 0);
  });

  const filteredItems = sortedItems.filter((item) => {
    const textoBusqueda = search.trim().toLowerCase();

    const esVisible =
      item.visible === 1 || item.visible === "1" || item.visible === true;

    const matchesSearch =
      !textoBusqueda ||
      String(item.titulo || "").toLowerCase().includes(textoBusqueda) ||
      String(item.resumen || "").toLowerCase().includes(textoBusqueda) ||
      String(item.descripcion || "").toLowerCase().includes(textoBusqueda) ||
      String(item.contenido || "").toLowerCase().includes(textoBusqueda);

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

        <h1 className="section-title">Noticias del portal</h1>
        <p className="section-subtitle">
          Crea, edita y controla qué publicaciones son visibles para aspirantes
          y estudiantes.
        </p>
      </header>

      <section className="card admin-form-card admin-form">
        <h2>
          {editandoId
            ? `Editar noticia #${editandoId}`
            : "Crear nueva noticia"}
        </h2>

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

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="field">
            <label>Resumen opcional</label>
            <input
              type="text"
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="field">
            <label>Contenido *</label>
            <textarea
              rows={4}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
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
                Visible para el público
              </span>
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn" disabled={guardando}>
              {guardando
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Crear noticia"}
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
                style={{ marginLeft: "0.75rem" }}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <div className="section-header" style={{ marginBottom: "1rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.3rem" }}>
            Noticias existentes
          </h2>

          <p className="section-subtitle">
            {cargando
              ? "Cargando noticias..."
              : items.length === 0
              ? "No hay noticias registradas."
              : `Tienes ${items.length} noticia(s) en el sistema.`}
          </p>
        </div>

        {!cargando && items.length > 0 && (
          <>
            <AdminFilters
              search={search}
              onSearchChange={setSearch}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              placeholder="Buscar noticia por título, resumen o contenido..."
            />

            <p className="admin-results-note">
              Mostrando {filteredItems.length} de {sortedItems.length}{" "}
              noticia(s).
            </p>
          </>
        )}

        {!cargando && items.length > 0 && filteredItems.length === 0 && (
          <div className="card">
            <h3 className="card-title">Sin resultados</h3>
            <p className="card-text">
              No se encontraron noticias con los filtros seleccionados.
            </p>
          </div>
        )}

        {!cargando && filteredItems.length > 0 && (
          <div className="admin-grid">
            {filteredItems.map((n) => {
              const esVisible =
                n.visible === 1 || n.visible === "1" || n.visible === true;

              return (
                <article key={n.id} className="card">
                  <h3 className="card-title">{n.titulo}</h3>

                  {n.resumen && <p className="card-text">{n.resumen}</p>}

                  <p
                    className="card-text"
                    style={{ whiteSpace: "pre-wrap", marginTop: "0.4rem" }}
                  >
                    {n.contenido}
                  </p>

                  <div className="admin-meta" style={{ marginTop: "0.7rem" }}>
                    <span
                      className={`admin-status-badge ${
                        esVisible
                          ? "admin-status-visible"
                          : "admin-status-hidden"
                      }`}
                    >
                      {esVisible ? "Visible" : "Oculta"}
                    </span>

                    <span className="muted">
                      Publicada:{" "}
                      {n.fecha_publicacion
                        ? new Date(n.fecha_publicacion).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "0.8rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => handleEditar(n)}
                      disabled={guardando || eliminandoId === n.id}
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => handleEliminar(n)}
                      disabled={guardando || eliminandoId === n.id}
                    >
                      {eliminandoId === n.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Eliminar noticia"
        message={
          confirmDelete
            ? `¿Seguro que deseas eliminar la noticia "${confirmDelete.title}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar noticia"
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