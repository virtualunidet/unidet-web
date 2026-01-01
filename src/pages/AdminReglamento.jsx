// src/pages/AdminReglamento.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { adminFetch, API_BASE_URL } from "../services/api";

function AdminReglamento() {
  const [loading, setLoading] = useState(true);
  const [savingText, setSavingText] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState("");

  const [contentHtml, setContentHtml] = useState("");
  const [pdfPath, setPdfPath] = useState(null);
  const [sections, setSections] = useState([]);

  // Para input de PDF
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/admin/regulation");
      const data = await res.json();
      setContentHtml(data.content_html || "");
      setPdfPath(data.pdf_path || null);
      setSections(Array.isArray(data.sections) ? data.sections : []);
    } catch (e) {
      console.error(e);
      setError("Error al cargar el reglamento");
    } finally {
      setLoading(false);
    }
  }

  // ========= Texto grande =========
  async function handleSaveText(e) {
    e.preventDefault();
    setSavingText(true);
    setError("");
    try {
      const res = await adminFetch("/admin/regulation", {
        method: "PUT",
        body: JSON.stringify({ content_html: contentHtml }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar el texto");
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al guardar el texto");
    } finally {
      setSavingText(false);
    }
  }

  // ========= PDF =========
  async function handleUploadPdf(e) {
    e.preventDefault();
    if (!pdfFile) return;
    setUploadingPdf(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("pdf", pdfFile);

      const res = await adminFetch("/admin/regulation/upload-pdf", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error || "Error al subir el PDF");

      setPdfPath(data.pdf_path || data.pdf_url || null);
      setPdfFile(null);
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al subir el PDF");
    } finally {
      setUploadingPdf(false);
    }
  }

  // ========= Helpers de UI para secciones / items =========
  function updateSectionLocal(id, patch) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, _dirty: true } : s))
    );
  }

  function updateItemLocal(sectionId, itemId, patch) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const items = (s.items || []).map((it) =>
          it.id === itemId ? { ...it, ...patch, _dirty: true } : it
        );
        return { ...s, items };
      })
    );
  }

  // ========= CRUD Secciones =========
  async function handleCreateSection() {
    setError("");
    try {
      const res = await adminFetch("/admin/regulation/sections", {
        method: "POST",
        body: JSON.stringify({
          titulo: "Nueva sección",
          descripcion: "",
          orden: sections.length + 1,
          visible: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al crear la sección");
      // recargamos para tener items/orden al día
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al crear la sección");
    }
  }

  async function handleSaveSection(section) {
    setError("");
    try {
      const payload = {
        titulo: section.titulo || "",
        descripcion: section.descripcion || "",
        orden: Number(section.orden) || 1,
        visible: section.visible ? 1 : 0,
      };

      const res = await adminFetch(`/admin/regulation/sections/${section.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar la sección");
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al guardar la sección");
    }
  }

  async function handleDeleteSection(sectionId) {
    if (!window.confirm("¿Eliminar esta sección y todos sus puntos?")) return;
    setError("");
    try {
      const res = await adminFetch(`/admin/regulation/sections/${sectionId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al eliminar la sección");
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al eliminar la sección");
    }
  }

  // ========= CRUD Items =========
  async function handleCreateItem(section) {
    setError("");
    try {
      const res = await adminFetch("/admin/regulation/items", {
        method: "POST",
        body: JSON.stringify({
          section_id: section.id,
          titulo: "Nuevo punto",
          contenido: "",
          orden: (section.items?.length || 0) + 1,
          visible: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al crear el punto");
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al crear el punto");
    }
  }

  async function handleSaveItem(section, item) {
    setError("");
    try {
      const payload = {
        section_id: section.id,
        titulo: item.titulo || "",
        contenido: item.contenido || "",
        orden: Number(item.orden) || 1,
        visible: item.visible ? 1 : 0,
      };

      const res = await adminFetch(`/admin/regulation/items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar el punto");
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al guardar el punto");
    }
  }

  async function handleDeleteItem(itemId) {
    if (!window.confirm("¿Eliminar este punto?")) return;
    setError("");
    try {
      const res = await adminFetch(`/admin/regulation/items/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al eliminar el punto");
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al eliminar el punto");
    }
  }

  // ========= Render =========
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f7fb" }}>
      <AdminNav />

      <main style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          Reglamento
        </h1>
        <p style={{ color: "#555", marginBottom: "1.5rem" }}>
          Edita el texto general, sube el PDF oficial y administra secciones y
          puntos del reglamento.
        </p>

        {error && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              backgroundColor: "#fdecea",
              color: "#b00020",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            {/* Texto general */}
            <section
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: "1.5rem",
                marginBottom: "1.5rem",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                Texto general del reglamento
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: 8 }}>
                Aquí puedes escribir el reglamento completo. Puedes pegar texto
                con formato; el navegador lo guardará como HTML.
              </p>
              <form onSubmit={handleSaveText}>
                <textarea
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  rows={10}
                  style={{
                    width: "100%",
                    display: "block",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: "1px solid #d0d7e2",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    resize: "vertical",
                    marginBottom: "0.75rem",
                  }}
                />
                <button
                  type="submit"
                  disabled={savingText}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: "#003366",
                    color: "#fff",
                    padding: "0.4rem 1.1rem",
                    fontSize: "0.9rem",
                    cursor: savingText ? "default" : "pointer",
                    opacity: savingText ? 0.7 : 1,
                  }}
                >
                  {savingText ? "Guardando..." : "Guardar texto"}
                </button>
              </form>
            </section>

            {/* PDF oficial */}
            <section
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: "1.5rem",
                marginBottom: "1.5rem",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                PDF oficial
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#555" }}>
                Puedes subir el reglamento completo en PDF para descarga.
              </p>

              {pdfPath ? (
                <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  PDF actual:{" "}
                  <a
                    href={`${API_BASE_URL}${pdfPath}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver / descargar
                  </a>
                </p>
              ) : (
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#777",
                    marginBottom: "0.5rem",
                  }}
                >
                  Aún no hay PDF cargado.
                </p>
              )}

              <form
                onSubmit={handleUploadPdf}
                style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <button
                  type="submit"
                  disabled={!pdfFile || uploadingPdf}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: "#003366",
                    color: "#fff",
                    padding: "0.4rem 1.1rem",
                    fontSize: "0.9rem",
                    cursor:
                      !pdfFile || uploadingPdf ? "default" : "pointer",
                    opacity: !pdfFile || uploadingPdf ? 0.6 : 1,
                  }}
                >
                  {uploadingPdf ? "Subiendo..." : "Subir nuevo PDF"}
                </button>
              </form>
            </section>

            {/* Secciones y puntos */}
            <section
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: "1.5rem",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>
                  Secciones y puntos
                </h2>
                <button
                  type="button"
                  onClick={handleCreateSection}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: "#0b7285",
                    color: "#fff",
                    padding: "0.4rem 1.1rem",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  + Nueva sección
                </button>
              </div>

              {sections.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "#777" }}>
                  Aún no hay secciones configuradas.
                </p>
              ) : (
                sections
                  .slice()
                  .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                  .map((section) => (
                    <div
                      key={section.id}
                      style={{
                        marginTop: "1rem",
                        borderRadius: 12,
                        border: "1px solid #e0e4ef",
                        padding: "1rem 1rem 0.75rem",
                        backgroundColor: "#f8fafc",
                      }}
                    >
                      {/* Encabezado de sección */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.75rem",
                          alignItems: "center",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <div style={{ flex: "1 1 240px" }}>
                          <label
                            style={{
                              fontSize: "0.8rem",
                              color: "#555",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Título de la sección
                          </label>
                          <input
                            type="text"
                            value={section.titulo || ""}
                            onChange={(e) =>
                              updateSectionLocal(section.id, {
                                titulo: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "0.4rem 0.6rem",
                              borderRadius: 8,
                              border: "1px solid #cbd2e3",
                              fontSize: "0.9rem",
                            }}
                          />
                        </div>

                        <div style={{ width: 80 }}>
                          <label
                            style={{
                              fontSize: "0.8rem",
                              color: "#555",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Orden
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={section.orden ?? 1}
                            onChange={(e) =>
                              updateSectionLocal(section.id, {
                                orden: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "0.35rem 0.4rem",
                              borderRadius: 8,
                              border: "1px solid #cbd2e3",
                              fontSize: "0.9rem",
                            }}
                          />
                        </div>

                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.85rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!section.visible}
                            onChange={(e) =>
                              updateSectionLocal(section.id, {
                                visible: e.target.checked ? 1 : 0,
                              })
                            }
                          />
                          Visible
                        </label>

                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginLeft: "auto",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleSaveSection(section)}
                            style={{
                              borderRadius: 999,
                              border: "none",
                              backgroundColor: "#003366",
                              color: "#fff",
                              padding: "0.35rem 0.9rem",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Guardar sección
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSection(section.id)}
                            style={{
                              borderRadius: 999,
                              border: "1px solid #ffccd5",
                              backgroundColor: "#fff5f5",
                              color: "#b00020",
                              padding: "0.35rem 0.9rem",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Descripción sección */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label
                          style={{
                            fontSize: "0.8rem",
                            color: "#555",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Descripción (opcional)
                        </label>
                        <textarea
                          rows={2}
                          value={section.descripcion || ""}
                          onChange={(e) =>
                            updateSectionLocal(section.id, {
                              descripcion: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "0.5rem 0.6rem",
                            borderRadius: 8,
                            border: "1px solid #cbd2e3",
                            fontSize: "0.9rem",
                            resize: "vertical",
                            backgroundColor: "#ffffff",
                          }}
                        />
                      </div>

                      {/* Items */}
                      <div
                        style={{
                          borderTop: "1px solid #e2e8f0",
                          paddingTop: "0.75rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "#334155",
                            }}
                          >
                            Puntos de la sección
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCreateItem(section)}
                            style={{
                              borderRadius: 999,
                              border: "none",
                              backgroundColor: "#0b7285",
                              color: "#fff",
                              padding: "0.25rem 0.8rem",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            + Nuevo punto
                          </button>
                        </div>

                        {!(section.items && section.items.length) ? (
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "#777",
                              marginBottom: "0.5rem",
                            }}
                          >
                            Esta sección aún no tiene puntos.
                          </p>
                        ) : (
                          section.items
                            .slice()
                            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                            .map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  marginBottom: "0.6rem",
                                  borderRadius: 10,
                                  border: "1px solid #dfe7f3",
                                  padding: "0.6rem 0.7rem",
                                  backgroundColor: "#ffffff",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                    alignItems: "center",
                                    marginBottom: "0.4rem",
                                  }}
                                >
                                  <div style={{ flex: "1 1 220px" }}>
                                    <input
                                      type="text"
                                      placeholder="Título del punto (opcional)"
                                      value={item.titulo || ""}
                                      onChange={(e) =>
                                        updateItemLocal(section.id, item.id, {
                                          titulo: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "0.35rem 0.5rem",
                                        borderRadius: 8,
                                        border: "1px solid #cbd2e3",
                                        fontSize: "0.85rem",
                                      }}
                                    />
                                  </div>
                                  <div style={{ width: 70 }}>
                                    <input
                                      type="number"
                                      min={1}
                                      value={item.orden ?? 1}
                                      onChange={(e) =>
                                        updateItemLocal(section.id, item.id, {
                                          orden: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "0.3rem 0.4rem",
                                        borderRadius: 8,
                                        border: "1px solid #cbd2e3",
                                        fontSize: "0.85rem",
                                      }}
                                    />
                                  </div>
                                  <label
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                      fontSize: "0.8rem",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!item.visible}
                                      onChange={(e) =>
                                        updateItemLocal(section.id, item.id, {
                                          visible: e.target.checked ? 1 : 0,
                                        })
                                      }
                                    />
                                    Visible
                                  </label>

                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "0.4rem",
                                      marginLeft: "auto",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSaveItem(section, item)
                                      }
                                      style={{
                                        borderRadius: 999,
                                        border: "none",
                                        backgroundColor: "#003366",
                                        color: "#fff",
                                        padding: "0.3rem 0.75rem",
                                        fontSize: "0.75rem",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteItem(item.id)
                                      }
                                      style={{
                                        borderRadius: 999,
                                        border: "1px solid #ffccd5",
                                        backgroundColor: "#fff5f5",
                                        color: "#b00020",
                                        padding: "0.3rem 0.75rem",
                                        fontSize: "0.75rem",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>

                                <textarea
                                  rows={2}
                                  placeholder="Contenido del punto..."
                                  value={item.contenido || ""}
                                  onChange={(e) =>
                                    updateItemLocal(section.id, item.id, {
                                      contenido: e.target.value,
                                    })
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "0.4rem 0.5rem",
                                    borderRadius: 8,
                                    border: "1px solid #cbd2e3",
                                    fontSize: "0.85rem",
                                    resize: "vertical",
                                  }}
                                />
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminReglamento;
