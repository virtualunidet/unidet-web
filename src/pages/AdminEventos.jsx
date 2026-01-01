// src/pages/AdminEventos.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { adminFetch } from "../services/api";

export default function AdminEventos() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // formulario
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

  async function loadEvents() {
    setCargando(true);
    setError("");

    try {
      const res = await adminFetch("/admin/events", {
        method: "GET",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar los eventos");
      }

      // Soportar respuesta tipo { items: [...] } o directamente [ ... ]
      const lista = Array.isArray(data) ? data : data.items || [];
      setItems(lista);
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al cargar eventos");
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!titulo.trim()) {
      setError("Título es obligatorio.");
      return;
    }

    const values = {
      titulo,
      descripcion,
      lugar,
      visible: visible ? "1" : "0",
    };

    if (fechaInicio) values.fecha_inicio = fechaInicio;
    if (fechaFin) values.fecha_fin = fechaFin;

    const body = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => body.append(k, v));

    const url = editandoId
      ? `/admin/events/${editandoId}`
      : `/admin/events`;

    const method = editandoId ? "PUT" : "POST";

    try {
      const res = await adminFetch(url, {
        method,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el evento");
      }

      await loadEvents();
      limpiarFormulario();
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al guardar el evento");
    }
  }

  function handleEditar(ev) {
    setEditandoId(ev.id);
    setTitulo(ev.titulo || "");
    setDescripcion(ev.descripcion || "");
    setFechaInicio(ev.fecha_inicio ? ev.fecha_inicio.substring(0, 10) : "");
    setFechaFin(ev.fecha_fin ? ev.fecha_fin.substring(0, 10) : "");
    setLugar(ev.lugar || "");
    setVisible(ev.visible === 1 || ev.visible === true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEliminar(id) {
    const seguro = window.confirm("¿Seguro que quieres eliminar este evento?");
    if (!seguro) return;

    try {
      const res = await adminFetch(`/admin/events/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el evento");
      }

      setItems((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al eliminar el evento");
    }
  }

  return (
    <div className="admin-page">
      <header className="section-header">
        <span className="section-badge">Panel administrador</span>
        {/* menú Noticias / Eventos / Cursos */}
        <AdminNav />
        <h1 className="section-title">Calendario de eventos</h1>
        <p className="section-subtitle">
          Administra fechas importantes para aspirantes y estudiantes:
          inscripciones, exámenes, cierres de curso, etc.
        </p>
      </header>

      <section className="card admin-form-card admin-form">
        <h2>{editandoId ? "Editar evento" : "Crear nuevo evento"}</h2>

        {error && (
          <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Fecha fin (opcional)</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Lugar (opcional)</label>
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
            />
          </div>

          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
              />{" "}
              Visible para el público
            </label>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="submit" className="btn">
              {editandoId ? "Guardar cambios" : "Crear evento"}
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

      <section style={{ marginTop: "2rem" }}>
        <div className="section-header" style={{ marginBottom: "1rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.3rem" }}>
            Eventos registrados
          </h2>
          <p className="section-subtitle">
            {cargando
              ? "Cargando eventos..."
              : items.length === 0
              ? "No hay eventos registrados."
              : `Tienes ${items.length} evento(s) en el calendario.`}
          </p>
        </div>

        {!cargando && items.length > 0 && (
          <div className="admin-grid">
            {items.map((ev) => (
              <article key={ev.id} className="card">
                <h3 className="card-title">{ev.titulo}</h3>
                {ev.descripcion && (
                  <p className="card-text">{ev.descripcion}</p>
                )}

                <div className="admin-meta" style={{ marginTop: "0.7rem" }}>
                  <span className="badge">
                    {ev.visible === 1 || ev.visible === true
                      ? "Visible"
                      : "Oculto"}
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
                  }}
                >
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => handleEditar(ev)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => handleEliminar(ev.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
