// src/pages/AdminNoticias.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { API_BASE_URL, adminFetch } from "../services/api";

export default function AdminNoticias() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [titulo, setTitulo] = useState("");
  const [resumen, setResumen] = useState("");
  const [contenido, setContenido] = useState("");
  const [visible, setVisible] = useState(true);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setCargando(true);
    setError("");

    try {
      const res = await adminFetch("/admin/news", {
        method: "GET",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar las noticias");
      }

      // Soporta { items: [...] } o directamente [ ... ]
      const lista = Array.isArray(data) ? data : data.items || [];
      setItems(lista);
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      setError(e.message || "Error al cargar noticias");
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!titulo.trim() || !contenido.trim()) {
      setError("Título y contenido son obligatorios.");
      return;
    }

    const body = new URLSearchParams();
    body.append("titulo", titulo.trim());
    body.append("resumen", resumen.trim());
    body.append("contenido", contenido.trim());
    body.append("visible", visible ? "1" : "0");

    const path = editandoId ? `/admin/news/${editandoId}` : "/admin/news";
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
        throw new Error(data.error || "Error al guardar la noticia");
      }

      await loadNews();
      limpiarFormulario();
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      setError(e.message || "Error al guardar la noticia");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEliminar(id) {
    const seguro = window.confirm(
      "¿Seguro que quieres eliminar esta noticia?"
    );
    if (!seguro) return;

    try {
      const res = await adminFetch(`/admin/news/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar la noticia");
      }

      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      setError(e.message || "Error al eliminar la noticia");
    }
  }

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
        <h2>{editandoId ? "Editar noticia" : "Crear nueva noticia"}</h2>

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
            <label>Resumen (opcional)</label>
            <input
              type="text"
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Contenido</label>
            <textarea
              rows={4}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
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

          <div
            style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
          >
            <button type="submit" className="btn">
              {editandoId ? "Guardar cambios" : "Crear noticia"}
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
          <div className="admin-grid">
            {items.map((n) => (
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
                  <span className="badge">
                    {n.visible === 1 ||
                    n.visible === "1" ||
                    n.visible === true
                      ? "Visible"
                      : "Oculta"}
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
                  }}
                >
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => handleEditar(n)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => handleEliminar(n.id)}
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
