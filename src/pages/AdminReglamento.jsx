// src/pages/AdminReglamento.jsx
import { useEffect, useRef, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { adminFetch, API_BASE_URL } from "../services/api";

function buildFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

export default function AdminReglamento() {
  const [loading, setLoading] = useState(true);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [aviso, setAviso] = useState(null);

  const [pdfPath, setPdfPath] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto });
  }

  function cerrarAviso() {
    setAviso(null);
  }

  async function loadData() {
    setLoading(true);
    cerrarAviso();

    try {
      const res = await adminFetch("/admin/regulation", {
        method: "GET",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al cargar el reglamento.");
      }

      setPdfPath(data.pdf_path || null);
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", e.message || "Error al cargar el reglamento.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPdf(e) {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setPdfFile(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      mostrarAviso("error", "El archivo seleccionado debe ser un PDF.");
      return;
    }

    setPdfFile(file);
    mostrarAviso("info", `PDF seleccionado: ${file.name}`);
  }

  async function handleUploadPdf(e) {
    e.preventDefault();
    cerrarAviso();

    if (!pdfFile) {
      mostrarAviso("error", "Selecciona un archivo PDF antes de subirlo.");
      return;
    }

    try {
      setUploadingPdf(true);
      mostrarAviso("info", "Subiendo PDF oficial del reglamento...");

      const fd = new FormData();
      fd.append("pdf", pdfFile);

      const res = await adminFetch("/admin/regulation/upload-pdf", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al subir el PDF.");
      }

      const newPath = data.pdf_path || data.pdf_url || null;
      setPdfPath(newPath);
      setPdfFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      mostrarAviso("success", "PDF del reglamento actualizado correctamente.");
    } catch (e) {
      console.error(e);
      if (e.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", e.message || "Error al subir el PDF.");
    } finally {
      setUploadingPdf(false);
    }
  }

  const pdfUrl = buildFileUrl(pdfPath);

  return (
    <div className="admin-page">
      <header className="section-header">
        <span className="section-badge">Panel administrador</span>
        <AdminNav />

        <h1 className="section-title">Reglamento</h1>
        <p className="section-subtitle">
          Administra el PDF oficial del reglamento que se mostrará en la página pública.
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

      {loading ? (
        <p>Cargando reglamento...</p>
      ) : (
        <>
          <section className="card admin-form-card admin-form">
            <h2>PDF oficial</h2>

            <p className="section-subtitle">
              Sube o reemplaza el archivo PDF del reglamento. El archivo cargado será el que los usuarios podrán consultar desde la sección pública.
            </p>

            {pdfPath ? (
              <div style={{ margin: "1rem 0" }}>
                <span className="admin-status-badge admin-status-visible">
                  PDF cargado
                </span>

                <p className="muted" style={{ marginTop: "0.75rem" }}>
                  Ruta actual: {pdfPath}
                </p>

                <a
                  className="btn btn-secondary"
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginTop: "0.5rem" }}
                >
                  Abrir PDF actual
                </a>
              </div>
            ) : (
              <div style={{ margin: "1rem 0" }}>
                <span className="admin-status-badge admin-status-hidden">
                  Sin PDF cargado
                </span>

                <p className="muted" style={{ marginTop: "0.75rem" }}>
                  Aún no se ha configurado un PDF oficial para el reglamento.
                </p>
              </div>
            )}

            <form onSubmit={handleUploadPdf}>
              <div className="field">
                <label>Seleccionar PDF</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleSelectPdf}
                  disabled={uploadingPdf}
                />
              </div>

              {pdfFile && (
                <p className="muted">
                  Archivo seleccionado: <strong>{pdfFile.name}</strong>
                </p>
              )}

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="btn"
                  disabled={!pdfFile || uploadingPdf}
                >
                  {uploadingPdf ? "Subiendo..." : pdfPath ? "Reemplazar PDF" : "Subir PDF"}
                </button>
              </div>
            </form>
          </section>

          {pdfUrl && (
            <section style={{ marginTop: "2rem" }}>
              <div className="section-header" style={{ marginBottom: "1rem" }}>
                <h2 className="section-title" style={{ fontSize: "1.3rem" }}>
                  Vista previa del PDF
                </h2>
                <p className="section-subtitle">
                  Así se visualizará el reglamento en la página pública.
                </p>
              </div>

              <div
                style={{
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
                  backgroundColor: "#fff",
                }}
              >
                <iframe
                  title="Vista previa del reglamento"
                  src={pdfUrl}
                  style={{
                    width: "100%",
                    height: "80vh",
                    border: "none",
                  }}
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}