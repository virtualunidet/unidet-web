// src/pages/AdminCursos.jsx
import { useEffect, useState, useRef } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { API_BASE_URL, adminFetch } from "../services/api";

// --- constantes para el formulario ---
const CATEGORIAS = [
  { value: "especializacion", label: "Área de especialización" },
  { value: "corto", label: "Curso corto" },
];

const EMPTY_FORM = {
  id: null,
  titulo: "",
  descripcion: "",
  categoria: "especializacion",
  imagen_url: "",
  visible: true,
  orden: 0,
};

export default function AdminCursos() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // ref para poder limpiar el input file
  const fileInputRef = useRef(null);

  // Cargar lista de cursos
  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const resp = await adminFetch("/admin/courses");
      const data = await resp.json().catch(() => ({}));

      // Soporta respuesta tipo { items: [...] } o directamente [...]
      const lista = Array.isArray(data) ? data : data.items || [];
      setCourses(lista);
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") {
        // ya redirigimos en adminFetch
        return;
      }
      setError("No se pudieron cargar los cursos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  // Cambios en el formulario
  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "orden"
          ? Math.max(0, parseInt(value, 10) || 0) // nunca menor a 0
          : value,
    }));
  }

  // Subir / cambiar imagen
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("image", file);

      const resp = await adminFetch("/admin/courses/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) throw new Error("Error al subir imagen");

      const data = await resp.json().catch(() => ({}));

      setForm((prev) => ({
        ...prev,
        imagen_url: data.url || "",
      }));
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      setError("No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  // Quitar imagen actual
  function handleClearImage() {
    setForm((prev) => ({
      ...prev,
      imagen_url: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Nuevo curso
  function handleNew() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Editar curso
  function handleEdit(curso) {
    setSelectedId(curso.id);
    setForm({
      id: curso.id,
      titulo: curso.titulo || "",
      descripcion: curso.descripcion || "",
      categoria: curso.categoria || "especializacion",
      imagen_url: curso.imagen_url || "",
      visible:
        curso.visible === 1 ||
        curso.visible === "1" ||
        curso.visible === true,
      orden: curso.orden ?? 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Eliminar curso
  async function handleDelete(curso) {
    if (!window.confirm(`¿Eliminar el curso "${curso.titulo}"?`)) return;

    try {
      const resp = await adminFetch(`/admin/courses/${curso.id}`, {
        method: "DELETE",
      });

      if (!resp.ok) throw new Error("Error al eliminar");

      await loadCourses();
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      alert("No se pudo eliminar el curso.");
    }
  }

  // Guardar (crear / actualizar)
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.titulo.trim()) {
      alert("El título es obligatorio.");
      return;
    }
    if (!form.categoria) {
      alert("La categoría es obligatoria.");
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      categoria: form.categoria,
      imagen_url: form.imagen_url.trim() || null,
      visible: form.visible ? 1 : 0,
      orden: form.orden || 0,
    };

    const isEdit = Boolean(selectedId);

    try {
      setSaving(true);
      setError("");

      const resp = await adminFetch(
        isEdit ? `/admin/courses/${selectedId}` : "/admin/courses",
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!resp.ok) throw new Error("Error al guardar");

      await loadCourses();
      if (!isEdit) {
        setForm(EMPTY_FORM);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      setError("No se pudo guardar el curso.");
    } finally {
      setSaving(false);
    }
  }

  // Para vista previa de imagen (acepta relativa o absoluta)
  const imagePreviewSrc =
    form.imagen_url && form.imagen_url.startsWith("http")
      ? form.imagen_url
      : form.imagen_url
      ? `${API_BASE_URL}${form.imagen_url}`
      : "";

  // ordenar cursos: primero por categoría, luego por orden, luego por id
  const sortedCourses = [...courses].sort((a, b) => {
    const catA = a.categoria || "";
    const catB = b.categoria || "";
    const byCat = catA.localeCompare(catB);
    if (byCat !== 0) return byCat;

    const ordA = typeof a.orden === "number" ? a.orden : 9999;
    const ordB = typeof b.orden === "number" ? b.orden : 9999;
    if (ordA !== ordB) return ordA - ordB;

    return (a.id ?? 0) - (b.id ?? 0);
  });

  function labelCategoria(value) {
    const found = CATEGORIAS.find((c) => c.value === value);
    return found ? found.label : value;
  }

  return (
    <div className="admin-page">
      <header className="section-header">
        <span className="section-badge">Panel administrador</span>
        {/* menú Noticias / Eventos / Cursos */}
        <AdminNav />
        <h1 className="section-title">Administrar cursos</h1>
        <p className="section-subtitle">
          Crea y organiza las áreas de especialización y cursos cortos que se
          muestran en la oferta pública.
        </p>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-grid">
        {/* LISTA */}
        <section className="admin-list">
          <div className="admin-list-header">
            <h2>Listado de cursos</h2>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={handleNew}
            >
              Nuevo curso
            </button>
          </div>

          {loading ? (
            <p>Cargando cursos...</p>
          ) : sortedCourses.length === 0 ? (
            <p>No hay cursos registrados.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Título</th>
                  <th className="col-small">Categoría</th>
                  <th className="col-small">Visible</th>
                  <th className="col-small">Orden</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedCourses.map((c) => (
                  <tr key={c.id}>
                    <td className="col-id">{c.id}</td>
                    <td>
                      <div className="course-title-cell">
                        <strong>{c.titulo}</strong>
                        {c.descripcion && (
                          <p className="muted small-text">
                            {c.descripcion.length > 80
                              ? c.descripcion.slice(0, 80) + "…"
                              : c.descripcion}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="col-small">
                      <span className="pill pill-light">
                        {labelCategoria(c.categoria)}
                      </span>
                    </td>
                    <td className="col-small">
                      <span
                        className={
                          "pill " + (c.visible ? "pill-success" : "pill-muted")
                        }
                      >
                        {c.visible ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="col-small">{c.orden}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleEdit(c)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => handleDelete(c)}
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
          <h2>{selectedId ? "Editar curso" : "Nuevo curso"}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Título *
              <input
                name="titulo"
                type="text"
                value={form.titulo}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Descripción
              <textarea
                name="descripcion"
                rows={4}
                value={form.descripcion}
                onChange={handleChange}
              />
            </label>

            <label>
              Categoría *
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>

            {/* SUBIR / CAMBIAR IMAGEN */}
            <label>
              Imagen (subir archivo)
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
            {uploading && <p>Subiendo imagen...</p>}

            {imagePreviewSrc && (
              <div className="image-preview">
                <p>Vista previa:</p>
                <img
                  src={imagePreviewSrc}
                  alt={form.titulo || "Imagen del curso"}
                  style={{ maxWidth: "100%", maxHeight: "150px" }}
                />
                <p className="small-text">{form.imagen_url}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={handleClearImage}
                >
                  Quitar imagen
                </button>
              </div>
            )}

            <label className="checkbox">
              <input
                name="visible"
                type="checkbox"
                checked={form.visible}
                onChange={handleChange}
              />
              Visible en la página pública
            </label>

            <label>
              Orden (0 = primero, números mayores = más abajo)
              <input
                name="orden"
                type="number"
                min={0}
                value={form.orden}
                onChange={handleChange}
              />
            </label>

            <button type="submit" className="btn" disabled={saving}>
              {saving
                ? "Guardando..."
                : selectedId
                ? "Actualizar curso"
                : "Crear curso"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
