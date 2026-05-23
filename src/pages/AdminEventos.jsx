// src/pages/AdminEventos.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import AdminFilters from "../components/AdminFilters.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { adminFetch } from "../services/api";

export default function AdminEventos() {
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
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [lugar, setLugar] = useState("");
  const [visible, setVisible] = useState(true);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto });
  }

  function cerrarAviso() {
    setAviso(null);
  }

  async function loadEvents() {
    try {
      setCargando(true);

      const res = await adminFetch("/admin/events", {
        method: "GET",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar los eventos.");
      }

      const lista = Array.isArray(data) ? data : data.items || [];
      setItems(lista);
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", e.message || "Error al cargar eventos.");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormulario() {
    setTitulo("");
    setDescripcion("");
    setFechaInicio("");
    setFechaFin("");
    setLugar("");
    setVisible(true);
    setEditandoId(null);
  }

  function validarFormulario() {
    if (!titulo.trim()) {
      mostrarAviso("error", "El título del evento es obligatorio.");
      return false;
    }

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      mostrarAviso(
        "error",
        "La fecha fin no puede ser anterior a la fecha de inicio."
      );
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    cerrarAviso();

    if (!validarFormulario()) return;

    const values = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      lugar: lugar.trim(),
      visible: visible ? "1" : "0",
    };

    if (fechaInicio) values.fecha_inicio = fechaInicio;
    if (fechaFin) values.fecha_fin = fechaFin;

    const body = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        body.append(k, String(v));
      }
    });

    const url = editandoId ? `/admin/events/${editandoId}` : "/admin/events";
    const method = editandoId ? "PUT" : "POST";
    const accion = editandoId ? "actualizado" : "guardado";

    try {
      setGuardando(true);
      mostrarAviso(
        "info",
        editandoId ? "Actualizando evento..." : "Guardando evento..."
      );

      const res = await adminFetch(url, {
        method,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el evento.");
      }

      await loadEvents();
      limpiarFormulario();
      mostrarAviso("success", `Evento ${accion} correctamente.`);
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

  function handleEditar(ev) {
    setEditandoId(ev.id);
    setTitulo(ev.titulo || "");
    setDescripcion(ev.descripcion || "");
    setFechaInicio(
      ev.fecha_inicio ? String(ev.fecha_inicio).substring(0, 10) : ""
    );
    setFechaFin(ev.fecha_fin ? String(ev.fecha_fin).substring(0, 10) : "");
    setLugar(ev.lugar || "");
    setVisible(
      ev.visible === 1 || ev.visible === "1" || ev.visible === true
    );

    mostrarAviso("info", `Editando evento #${ev.id}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEliminar(ev) {
    setConfirmDelete({
      id: ev.id,
      title: ev.titulo || `Evento #${ev.id}`,
    });
  }

  async function confirmarEliminacion() {
    if (!confirmDelete?.id) return;

    const id = confirmDelete.id;

    try {
      setEliminandoId(id);
      mostrarAviso("info", "Eliminando evento...");

      const res = await adminFetch(`/admin/events/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el evento.");
      }

      setItems((prev) => prev.filter((e) => e.id !== id));

      if (editandoId === id) {
        limpiarFormulario();
      }

      setConfirmDelete(null);
      mostrarAviso("success", "Evento eliminado correctamente.");
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", e.message || "Error al eliminar el evento.");
    } finally {
      setEliminandoId(null);
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    const fechaA = a.fecha_inicio || "";
    const fechaB = b.fecha_inicio || "";

    if (fechaA && fechaB && fechaA !== fechaB) {
      return String(fechaA).localeCompare(String(fechaB));
    }

    if (fechaA && !fechaB) return -1;
    if (!fechaA && fechaB) return 1;

    return (a.id ?? 0) - (b.id ?? 0);
  });

  const filteredItems = sortedItems.filter((ev) => {
    const textoBusqueda = search.trim().toLowerCase();

    const esVisible =
      ev.visible === 1 || ev.visible === "1" || ev.visible === true;

    const fechaInicioTexto = ev.fecha_inicio
      ? String(ev.fecha_inicio).substring(0, 10)
      : "";

    const fechaFinTexto = ev.fecha_fin
      ? String(ev.fecha_fin).substring(0, 10)
      : "";

    const matchesSearch =
      !textoBusqueda ||
      String(ev.titulo || "").toLowerCase().includes(textoBusqueda) ||
      String(ev.descripcion || "").toLowerCase().includes(textoBusqueda) ||
      String(ev.lugar || "").toLowerCase().includes(textoBusqueda) ||
      fechaInicioTexto.toLowerCase().includes(textoBusqueda) ||
      fechaFinTexto.toLowerCase().includes(textoBusqueda);

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

        <h1 className="section-title">Calendario de eventos</h1>

        <p className="section-subtitle">
          Administra fechas importantes para aspirantes y estudiantes:
          inscripciones, exámenes, cierres de curso, etc.
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

      <section className="card admin-form-card admin-form">
        <h2>
          {editandoId ? `Editar evento #${editandoId}` : "Crear nuevo evento"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={guardando}
              required
            />
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="field">
            <label>Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="field">
            <label>Fecha fin opcional</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="field">
            <label>Lugar opcional</label>
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
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
                : "Crear evento"}
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

      <section style={{ marginTop: "2rem" }}>
        <div className="section-header" style={{ marginBottom: "1rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.3rem" }}>
            Eventos registrados
          </h2>

          <p className="section-subtitle">
            {cargando
              ? "Cargando eventos..."
              : sortedItems.length === 0
              ? "No hay eventos registrados."
              : `Tienes ${sortedItems.length} evento(s) en el calendario.`}
          </p>
        </div>

        {!cargando && sortedItems.length > 0 && (
          <>
            <AdminFilters
              search={search}
              onSearchChange={setSearch}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              placeholder="Buscar evento por título, descripción, lugar o fecha..."
            />

            <p className="admin-results-note">
              Mostrando {filteredItems.length} de {sortedItems.length}{" "}
              evento(s).
            </p>
          </>
        )}

        {!cargando && sortedItems.length > 0 && filteredItems.length === 0 && (
          <div className="card">
            <h3 className="card-title">Sin resultados</h3>
            <p className="card-text">
              No se encontraron eventos con los filtros seleccionados.
            </p>
          </div>
        )}

        {!cargando && filteredItems.length > 0 && (
          <div className="admin-grid">
            {filteredItems.map((ev) => {
              const esVisible =
                ev.visible === 1 || ev.visible === "1" || ev.visible === true;

              return (
                <article key={ev.id} className="card">
                  <h3 className="card-title">{ev.titulo}</h3>

                  {ev.descripcion && (
                    <p className="card-text">{ev.descripcion}</p>
                  )}

                  <div className="admin-meta" style={{ marginTop: "0.7rem" }}>
                    <span
                      className={`admin-status-badge ${
                        esVisible
                          ? "admin-status-visible"
                          : "admin-status-hidden"
                      }`}
                    >
                      {esVisible ? "Visible" : "Oculto"}
                    </span>

                    <span className="muted">
                      Inicio:{" "}
                      {ev.fecha_inicio
                        ? new Date(ev.fecha_inicio).toLocaleDateString()
                        : "-"}
                    </span>

                    <span className="muted">
                      Fin:{" "}
                      {ev.fecha_fin
                        ? new Date(ev.fecha_fin).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                  {ev.lugar && (
                    <p
                      className="muted"
                      style={{ marginTop: "0.4rem", fontSize: "0.9rem" }}
                    >
                      Lugar: {ev.lugar}
                    </p>
                  )}

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
                      onClick={() => handleEditar(ev)}
                      disabled={guardando || eliminandoId === ev.id}
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => handleEliminar(ev)}
                      disabled={guardando || eliminandoId === ev.id}
                    >
                      {eliminandoId === ev.id ? "Eliminando..." : "Eliminar"}
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
        title="Eliminar evento"
        message={
          confirmDelete
            ? `¿Seguro que deseas eliminar el evento "${confirmDelete.title}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar evento"
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