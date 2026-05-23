// src/pages/AdminCursos.jsx
import { useEffect, useState, useRef } from "react";
import AdminNav from "../components/AdminNav.jsx";
import AdminFilters from "../components/AdminFilters.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { API_BASE_URL, adminFetch } from "../services/api";

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
  const [eliminandoId, setEliminandoId] = useState(null);
  const [aviso, setAviso] = useState(null);

  // Modal de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCourses();
  }, []);

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto });
  }

  function cerrarAviso() {
    setAviso(null);
  }

  async function loadCourses() {
    try {
      setLoading(true);

      const resp = await adminFetch("/admin/courses", {
        method: "GET",
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data.error || "No se pudieron cargar los cursos.");
      }

      const lista = Array.isArray(data) ? data : data.items || [];
      setCourses(lista);
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", err.message || "No se pudieron cargar los cursos.");
    } finally {
      setLoading(false);
    }
  }

  function limpiarFormulario() {
    setSelectedId(null);
    setForm(EMPTY_FORM);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "orden"
          ? Math.max(0, parseInt(value, 10) || 0)
          : value,
    }));
  }

  function validarFormulario() {
    if (!form.titulo.trim()) {
      mostrarAviso("error", "El título del curso es obligatorio.");
      return false;
    }

    if (!form.categoria) {
      mostrarAviso("error", "La categoría del curso es obligatoria.");
      return false;
    }

    if (Number.isNaN(Number(form.orden)) || Number(form.orden) < 0) {
      mostrarAviso("error", "El orden debe ser un número mayor o igual a 0.");
      return false;
    }

    return true;
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      mostrarAviso("error", "El archivo seleccionado debe ser una imagen.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);
      mostrarAviso("info", "Subiendo imagen del curso...");

      const formData = new FormData();
      formData.append("image", file);

      const resp = await adminFetch("/admin/courses/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data.error || "Error al subir imagen.");
      }

      setForm((prev) => ({
        ...prev,
        imagen_url: data.url || "",
      }));

      mostrarAviso("success", "Imagen subida correctamente.");
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", err.message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  function handleClearImage() {
    setForm((prev) => ({
      ...prev,
      imagen_url: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    mostrarAviso("info", "Imagen removida del formulario.");
  }

  function handleNew() {
    limpiarFormulario();
    mostrarAviso("info", "Formulario listo para crear un nuevo curso.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      orden:
        typeof curso.orden === "number"
          ? curso.orden
          : parseInt(curso.orden, 10) || 0,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    mostrarAviso("info", `Editando curso #${curso.id}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(curso) {
    setConfirmDelete({
      id: curso.id,
      title: curso.titulo || `Curso #${curso.id}`,
    });
  }

  async function confirmarEliminacion() {
    if (!confirmDelete?.id) return;

    const id = confirmDelete.id;

    try {
      setEliminandoId(id);
      mostrarAviso("info", "Eliminando curso...");

      const resp = await adminFetch(`/admin/courses/${id}`, {
        method: "DELETE",
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data.error || "No se pudo eliminar el curso.");
      }

      setCourses((prev) => prev.filter((c) => c.id !== id));

      if (selectedId === id) {
        limpiarFormulario();
      }

      setConfirmDelete(null);
      mostrarAviso("success", "Curso eliminado correctamente.");
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", err.message || "No se pudo eliminar el curso.");
    } finally {
      setEliminandoId(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    cerrarAviso();

    if (!validarFormulario()) return;

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      categoria: form.categoria,
      imagen_url: form.imagen_url.trim() || null,
      visible: form.visible ? 1 : 0,
      orden: parseInt(form.orden, 10) || 0,
    };

    const isEdit = Boolean(selectedId);

    try {
      setSaving(true);
      mostrarAviso(
        "info",
        isEdit ? "Actualizando curso..." : "Guardando curso..."
      );

      const resp = await adminFetch(
        isEdit ? `/admin/courses/${selectedId}` : "/admin/courses",
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data.error || "Error al guardar el curso.");
      }

      await loadCourses();
      limpiarFormulario();

      mostrarAviso(
        "success",
        isEdit
          ? "Curso actualizado correctamente."
          : "Curso guardado correctamente."
      );
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", err.message || "No se pudo guardar el curso.");
    } finally {
      setSaving(false);
    }
  }

  const imagePreviewSrc =
    form.imagen_url && form.imagen_url.startsWith("http")
      ? form.imagen_url
      : form.imagen_url
      ? `${API_BASE_URL}${form.imagen_url}`
      : "";

  const sortedCourses = [...courses].sort((a, b) => {
    const catA = a.categoria || "";
    const catB = b.categoria || "";
    const byCat = catA.localeCompare(catB);

    if (byCat !== 0) return byCat;

    const ordA =
      typeof a.orden === "number" ? a.orden : parseInt(a.orden, 10) || 9999;

    const ordB =
      typeof b.orden === "number" ? b.orden : parseInt(b.orden, 10) || 9999;

    if (ordA !== ordB) return ordA - ordB;

    return (a.id ?? 0) - (b.id ?? 0);
  });

  const filteredCourses = sortedCourses.filter((curso) => {
    const textoBusqueda = search.trim().toLowerCase();

    const esVisible =
      curso.visible === 1 ||
      curso.visible === "1" ||
      curso.visible === true;

    const categoriaLabel = labelCategoria(curso.categoria);

    const matchesSearch =
      !textoBusqueda ||
      String(curso.titulo || "").toLowerCase().includes(textoBusqueda) ||
      String(curso.descripcion || "").toLowerCase().includes(textoBusqueda) ||
      String(curso.categoria || "").toLowerCase().includes(textoBusqueda) ||
      String(categoriaLabel || "").toLowerCase().includes(textoBusqueda);

    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "visibles" && esVisible) ||
      (statusFilter === "ocultos" && !esVisible);

    return matchesSearch && matchesStatus;
  });

  function labelCategoria(value) {
    const found = CATEGORIAS.find((c) => c.value === value);
    return found ? found.label : value;
  }

  return (
    <div className="admin-page">
      <header className="section-header">
        <span className="section-badge">Panel administrador</span>
        <AdminNav />

        <h1 className="section-title">Administrar cursos</h1>

        <p className="section-subtitle">
          Crea y organiza las áreas de especialización y cursos cortos que se
          muestran en la oferta pública.
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
        <section className="admin-list">
          <div className="admin-list-header">
            <h2>Listado de cursos</h2>

            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={handleNew}
              disabled={saving || uploading}
            >
              Nuevo curso
            </button>
          </div>

          {loading ? (
            <p>Cargando cursos...</p>
          ) : sortedCourses.length === 0 ? (
            <p>No hay cursos registrados.</p>
          ) : (
            <>
              <AdminFilters
                search={search}
                onSearchChange={setSearch}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                placeholder="Buscar curso por título, descripción o categoría..."
              />

              <p className="admin-results-note">
                Mostrando {filteredCourses.length} de {sortedCourses.length}{" "}
                curso(s).
              </p>

              {filteredCourses.length === 0 ? (
                <div className="card">
                  <h3 className="card-title">Sin resultados</h3>
                  <p className="card-text">
                    No se encontraron cursos con los filtros seleccionados.
                  </p>
                </div>
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
                    {filteredCourses.map((c) => {
                      const esVisible =
                        c.visible === 1 ||
                        c.visible === "1" ||
                        c.visible === true;

                      return (
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
                              className={`admin-status-badge ${
                                esVisible
                                  ? "admin-status-visible"
                                  : "admin-status-hidden"
                              }`}
                            >
                              {esVisible ? "Visible" : "Oculto"}
                            </span>
                          </td>

                          <td className="col-small">{c.orden}</td>

                          <td className="col-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleEdit(c)}
                              disabled={
                                saving || uploading || eliminandoId === c.id
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              onClick={() => handleDelete(c)}
                              disabled={
                                saving || uploading || eliminandoId === c.id
                              }
                            >
                              {eliminandoId === c.id
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

        <section className="admin-form-section">
          <h2>{selectedId ? `Editar curso #${selectedId}` : "Nuevo curso"}</h2>

          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Título *
              <input
                name="titulo"
                type="text"
                value={form.titulo}
                onChange={handleChange}
                required
                disabled={saving || uploading}
              />
            </label>

            <label>
              Descripción
              <textarea
                name="descripcion"
                rows={4}
                value={form.descripcion}
                onChange={handleChange}
                disabled={saving || uploading}
              />
            </label>

            <label>
              Categoría *
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                disabled={saving || uploading}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Imagen (subir archivo)
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={saving || uploading}
              />
            </label>

            {uploading && <p className="muted">Subiendo imagen...</p>}

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
                  disabled={saving || uploading}
                >
                  Quitar imagen
                </button>
              </div>
            )}

            <label className="admin-checkbox">
              <input
                name="visible"
                type="checkbox"
                checked={form.visible}
                onChange={handleChange}
                disabled={saving || uploading}
              />
              <span className="admin-toggle-label">
                Visible en la página pública
              </span>
            </label>

            <label>
              Orden (0 = primero, números mayores = más abajo)
              <input
                name="orden"
                type="number"
                min={0}
                value={form.orden}
                onChange={handleChange}
                disabled={saving || uploading}
              />
            </label>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="btn"
                disabled={saving || uploading}
              >
                {saving
                  ? "Guardando..."
                  : selectedId
                  ? "Guardar cambios"
                  : "Crear curso"}
              </button>

              {selectedId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    limpiarFormulario();
                    mostrarAviso("info", "Edición cancelada.");
                  }}
                  disabled={saving || uploading}
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
        title="Eliminar curso"
        message={
          confirmDelete
            ? `¿Seguro que deseas eliminar el curso "${confirmDelete.title}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar curso"
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