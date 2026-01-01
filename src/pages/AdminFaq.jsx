// src/pages/AdminFaq.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { API_BASE_URL, getAdminToken } from "../services/api";

const TOKEN_KEY = "unidet_admin_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || getAdminToken() || "";
}

function redirectToAdminLogin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("unidet_admin_user");
  window.location.href = "/admin";
}

// helper con token para JSON
async function adminFetch(path, options = {}) {
  const token = getToken();
  if (!token) {
    redirectToAdminLogin();
    throw new Error("NO_AUTH");
  }

  const isFormData =
    options.body &&
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const resp = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!resp.ok) {
    throw new Error(`Error ${resp.status}`);
  }

  return resp.json();
}

export default function AdminFaq() {
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [pregunta, setPregunta] = useState("");
  const [respuestaCorta, setRespuestaCorta] = useState("");
  const [respuestaLarga, setRespuestaLarga] = useState("");
  const [visible, setVisible] = useState(true);
  const [orden, setOrden] = useState(0);

  // Cargar lista
  async function loadFaq() {
    try {
      setError("");
      setLoadingList(true);
      const data = await adminFetch("/admin/faq", { method: "GET" });
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setError("Error 500");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadFaq();
  }, []);

  function resetForm() {
    setEditingId(null);
    setPregunta("");
    setRespuestaCorta("");
    setRespuestaLarga("");
    setVisible(true);
    setOrden(0);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setPregunta(item.pregunta || "");
    setRespuestaCorta(item.respuesta_corta || "");
    setRespuestaLarga(item.respuesta_larga || "");
    setVisible(item.visible ? true : false);
    setOrden(item.orden ?? 0);
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta pregunta?")) return;

    try {
      setError("");
      await adminFetch(`/admin/faq/${id}`, { method: "DELETE" });
      await loadFaq();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar la pregunta.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!pregunta.trim()) {
      alert("La pregunta es obligatoria.");
      return;
    }

    const payload = {
      pregunta: pregunta.trim(),
      respuesta_corta: respuestaCorta.trim() || null,
      respuesta_larga: respuestaLarga.trim() || null,
      visible: visible ? 1 : 0,
      orden: Number.isNaN(Number(orden)) ? 0 : Number(orden),
    };

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await adminFetch(`/admin/faq/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/admin/faq", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await loadFaq();
    } catch (err) {
      console.error(err);
      setError("Error 500");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content">
      <section className="container admin-page">
        <AdminNav />

        <h1>FAQ</h1>
        <p className="muted">
          Administra las preguntas frecuentes que se muestran en la página
          pública.
        </p>

        {error && (
          <p style={{ color: "crimson", marginTop: "0.5rem" }}>{error}</p>
        )}

        {/* Formulario */}
        <div className="panel admin-form-card">
          <h2 style={{ marginTop: 0 }}>
            {editingId ? "Editar pregunta" : "Nueva pregunta"}
          </h2>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Pregunta*</label>
              <input
                type="text"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Respuesta corta</label>
              <textarea
                rows={3}
                value={respuestaCorta}
                onChange={(e) => setRespuestaCorta(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Respuesta detallada</label>
              <textarea
                rows={5}
                value={respuestaLarga}
                onChange={(e) => setRespuestaLarga(e.target.value)}
              />
            </div>

            {/* Orden + Visible en la misma fila, con estilos bonitos */}
            <div className="field-inline">
              <div className="field field-small">
                <label>Orden</label>
                <input
                  type="number"
                  className="admin-number-input"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                />
              </div>

              <div className="field admin-checkbox">
                <input
                  id="faq-visible"
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                />
                <label
                  htmlFor="faq-visible"
                  className="admin-toggle-label"
                >
                  Mostrar en la página pública
                </label>
              </div>
            </div>

            <div
              className="admin-form-actions"
              style={{ display: "flex", gap: "0.75rem" }}
            >
              <button className="btn" type="submit" disabled={saving}>
                {saving
                  ? editingId
                    ? "Guardando..."
                    : "Creando..."
                  : editingId
                  ? "Guardar cambios"
                  : "Crear pregunta"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Listado */}
        <div style={{ marginTop: "2rem" }}>
          <h2>Preguntas registradas</h2>
          {loadingList && <p>Cargando...</p>}

          {!loadingList && items.length === 0 && (
            <p>No hay preguntas registradas por el momento.</p>
          )}

          {!loadingList && items.length > 0 && (
            <table
              style={{
                width: "100%",
                marginTop: "1rem",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.4rem" }}>
                    Orden
                  </th>
                  <th style={{ textAlign: "left", padding: "0.4rem" }}>
                    Pregunta
                  </th>
                  <th style={{ textAlign: "left", padding: "0.4rem" }}>
                    Respuesta corta
                  </th>
                  <th style={{ textAlign: "center", padding: "0.4rem" }}>
                    Visible
                  </th>
                  <th style={{ textAlign: "right", padding: "0.4rem" }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "0.35rem" }}>{item.orden}</td>
                    <td style={{ padding: "0.35rem" }}>{item.pregunta}</td>
                    <td style={{ padding: "0.35rem" }}>
                      {item.respuesta_corta}
                    </td>
                    <td
                      style={{
                        padding: "0.35rem",
                        textAlign: "center",
                      }}
                    >
                      {item.visible ? "Sí" : "No"}
                    </td>
                    <td
                      style={{
                        padding: "0.35rem",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.7rem", marginRight: 6 }}
                        onClick={() => handleEdit(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: "0.25rem 0.7rem" }}
                        onClick={() => handleDelete(item.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
