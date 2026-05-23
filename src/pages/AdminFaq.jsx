// src/pages/AdminFaq.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import AdminFilters from "../components/AdminFilters.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { adminFetch } from "../services/api";

export default function AdminFaq() {
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [aviso, setAviso] = useState(null);

  // Modal de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [editingId, setEditingId] = useState(null);

  const [pregunta, setPregunta] = useState("");
  const [respuestaCorta, setRespuestaCorta] = useState("");
  const [respuestaLarga, setRespuestaLarga] = useState("");
  const [visible, setVisible] = useState(true);
  const [orden, setOrden] = useState(0);

  useEffect(() => {
    loadFaq();
  }, []);

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto });
  }

  function cerrarAviso() {
    setAviso(null);
  }

  async function loadFaq() {
    try {
      setLoadingList(true);

      const res = await adminFetch("/admin/faq", {
        method: "GET",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar las preguntas.");
      }

      const lista = Array.isArray(data) ? data : data.items || [];
      setItems(lista);
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso(
        "error",
        err.message || "Error al cargar preguntas frecuentes."
      );
    } finally {
      setLoadingList(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setPregunta("");
    setRespuestaCorta("");
    setRespuestaLarga("");
    setVisible(true);
    setOrden(0);
  }

  function validarFormulario() {
    if (!pregunta.trim()) {
      mostrarAviso("error", "La pregunta es obligatoria.");
      return false;
    }

    if (Number.isNaN(Number(orden)) || Number(orden) < 0) {
      mostrarAviso("error", "El orden debe ser un número mayor o igual a 0.");
      return false;
    }

    return true;
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setPregunta(item.pregunta || "");
    setRespuestaCorta(item.respuesta_corta || "");
    setRespuestaLarga(item.respuesta_larga || "");
    setVisible(
      item.visible === 1 || item.visible === "1" || item.visible === true
    );
    setOrden(
      typeof item.orden === "number"
        ? item.orden
        : parseInt(item.orden, 10) || 0
    );

    mostrarAviso("info", `Editando pregunta #${item.id}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(item) {
    setConfirmDelete({
      id: item.id,
      title: item.pregunta || `Pregunta #${item.id}`,
    });
  }

  async function confirmarEliminacion() {
    if (!confirmDelete?.id) return;

    const id = confirmDelete.id;

    try {
      setEliminandoId(id);
      mostrarAviso("info", "Eliminando pregunta frecuente...");

      const res = await adminFetch(`/admin/faq/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar la pregunta.");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));

      if (editingId === id) {
        resetForm();
      }

      setConfirmDelete(null);
      mostrarAviso("success", "Pregunta frecuente eliminada correctamente.");
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", err.message || "No se pudo eliminar la pregunta.");
    } finally {
      setEliminandoId(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    cerrarAviso();

    if (!validarFormulario()) return;

    const payload = {
      pregunta: pregunta.trim(),
      respuesta_corta: respuestaCorta.trim() || null,
      respuesta_larga: respuestaLarga.trim() || null,
      visible: visible ? 1 : 0,
      orden: Number.isNaN(Number(orden)) ? 0 : Number(orden),
    };

    const isEdit = Boolean(editingId);

    try {
      setSaving(true);
      mostrarAviso(
        "info",
        isEdit ? "Actualizando pregunta..." : "Guardando pregunta..."
      );

      const res = await adminFetch(
        isEdit ? `/admin/faq/${editingId}` : "/admin/faq",
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar la pregunta.");
      }

      resetForm();
      await loadFaq();

      mostrarAviso(
        "success",
        isEdit
          ? "Pregunta frecuente actualizada correctamente."
          : "Pregunta frecuente guardada correctamente."
      );
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso(
        "error",
        err.message || "Error al guardar. Revisa los campos."
      );
    } finally {
      setSaving(false);
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    const ordA =
      typeof a.orden === "number"
        ? a.orden
        : parseInt(a.orden, 10) || 9999;

    const ordB =
      typeof b.orden === "number"
        ? b.orden
        : parseInt(b.orden, 10) || 9999;

    if (ordA !== ordB) return ordA - ordB;

    return (a.id ?? 0) - (b.id ?? 0);
  });

  const filteredItems = sortedItems.filter((item) => {
    const textoBusqueda = search.trim().toLowerCase();

    const esVisible =
      item.visible === 1 || item.visible === "1" || item.visible === true;

    const matchesSearch =
      !textoBusqueda ||
      String(item.pregunta || "").toLowerCase().includes(textoBusqueda) ||
      String(item.respuesta_corta || "")
        .toLowerCase()
        .includes(textoBusqueda) ||
      String(item.respuesta_larga || "")
        .toLowerCase()
        .includes(textoBusqueda) ||
      String(item.orden || "").toLowerCase().includes(textoBusqueda);

    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "visibles" && esVisible) ||
      (statusFilter === "ocultos" && !esVisible);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="content">
      <section className="container admin-page">
        <header className="section-header">
          <span className="section-badge">Panel administrador</span>
          <AdminNav />

          <h1 className="section-title">FAQ</h1>
          <p className="section-subtitle">
            Administra las preguntas frecuentes que se muestran en la página
            pública.
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

        {/* Formulario */}
        <div className="panel admin-form-card">
          <h2 style={{ marginTop: 0 }}>
            {editingId ? `Editar pregunta #${editingId}` : "Nueva pregunta"}
          </h2>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Pregunta *</label>
              <input
                type="text"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="field">
              <label>Respuesta corta</label>
              <textarea
                rows={3}
                value={respuestaCorta}
                onChange={(e) => setRespuestaCorta(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="field">
              <label>Respuesta detallada</label>
              <textarea
                rows={5}
                value={respuestaLarga}
                onChange={(e) => setRespuestaLarga(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="field-inline">
              <div className="field field-small">
                <label>Orden</label>
                <input
                  type="number"
                  min={0}
                  className="admin-number-input"
                  value={orden}
                  onChange={(e) =>
                    setOrden(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  disabled={saving}
                />
              </div>

              <div className="field admin-checkbox">
                <input
                  id="faq-visible"
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                  disabled={saving}
                />
                <label htmlFor="faq-visible" className="admin-toggle-label">
                  Mostrar en la página pública
                </label>
              </div>
            </div>

            <div
              className="admin-form-actions"
              style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
            >
              <button className="btn" type="submit" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingId
                  ? "Guardar cambios"
                  : "Crear pregunta"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    resetForm();
                    mostrarAviso("info", "Edición cancelada.");
                  }}
                  disabled={saving}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Listado */}
        <div style={{ marginTop: "2rem" }}>
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <h2 className="section-title" style={{ fontSize: "1.3rem" }}>
              Preguntas registradas
            </h2>

            <p className="section-subtitle">
              {loadingList
                ? "Cargando preguntas..."
                : sortedItems.length === 0
                ? "No hay preguntas registradas por el momento."
                : `Tienes ${sortedItems.length} pregunta(s) frecuente(s).`}
            </p>
          </div>

          {!loadingList && sortedItems.length > 0 && (
            <>
              <AdminFilters
                search={search}
                onSearchChange={setSearch}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                placeholder="Buscar pregunta, respuesta u orden..."
              />

              <p className="admin-results-note">
                Mostrando {filteredItems.length} de {sortedItems.length}{" "}
                pregunta(s) frecuente(s).
              </p>
            </>
          )}

          {!loadingList && sortedItems.length > 0 && filteredItems.length === 0 && (
            <div className="card">
              <h3 className="card-title">Sin resultados</h3>
              <p className="card-text">
                No se encontraron preguntas frecuentes con los filtros
                seleccionados.
              </p>
            </div>
          )}

          {!loadingList && filteredItems.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="col-small">Orden</th>
                  <th>Pregunta</th>
                  <th>Respuesta corta</th>
                  <th className="col-small">Visible</th>
                  <th className="col-actions">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const esVisible =
                    item.visible === 1 ||
                    item.visible === "1" ||
                    item.visible === true;

                  return (
                    <tr key={item.id}>
                      <td className="col-small">
                        <span className="pill pill-light">{item.orden}</span>
                      </td>

                      <td>
                        <strong>{item.pregunta}</strong>
                      </td>

                      <td>
                        {item.respuesta_corta ? (
                          <span>{item.respuesta_corta}</span>
                        ) : (
                          <span className="muted">Sin respuesta corta</span>
                        )}
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
                          onClick={() => handleEdit(item)}
                          disabled={saving || eliminandoId === item.id}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-xs"
                          onClick={() => handleDelete(item)}
                          disabled={saving || eliminandoId === item.id}
                        >
                          {eliminandoId === item.id
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
        </div>

        <ConfirmModal
          open={Boolean(confirmDelete)}
          title="Eliminar pregunta frecuente"
          message={
            confirmDelete
              ? `¿Seguro que deseas eliminar la pregunta "${confirmDelete.title}"? Esta acción no se puede deshacer.`
              : ""
          }
          confirmText="Eliminar pregunta"
          cancelText="Cancelar"
          loading={Boolean(eliminandoId)}
          onCancel={() => {
            if (!eliminandoId) setConfirmDelete(null);
          }}
          onConfirm={confirmarEliminacion}
        />
      </section>
    </div>
  );
}