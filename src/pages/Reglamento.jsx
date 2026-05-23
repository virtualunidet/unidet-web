// src/pages/Reglamento.jsx
import { useEffect, useState } from "react";
import { API_BASE_URL, getJson } from "../services/api";

function buildFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

function Reglamento() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const json = await getJson("/regulation");
        setData(json);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el reglamento.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const pdfUrl = data?.pdf_path ? buildFileUrl(data.pdf_path) : "";

  return (
    <main className="page reglamento-page">
      <section className="page-header">
        <p className="page-kicker">Reglamento UNIDET</p>
        <h1 className="page-title">Reglamento oficial</h1>
        <p className="page-subtitle">
          Consulta el documento oficial del reglamento institucional de UNIDET.
        </p>
      </section>

      {loading && <p>Cargando reglamento...</p>}

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && !pdfUrl && (
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "1.5rem 1.75rem",
            boxShadow: "0 18px 40px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Reglamento no disponible</h2>
          <p className="muted">
            Aún no se ha cargado el PDF oficial del reglamento. Intenta nuevamente más tarde.
          </p>
        </section>
      )}

      {!loading && !error && pdfUrl && (
        <>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
            }}
          >
            <a
              className="btn"
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir PDF oficial
            </a>

            <a
              className="btn btn-secondary"
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              Descargar / imprimir
            </a>
          </div>

          <section
            style={{
              marginBottom: "2rem",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
              backgroundColor: "#fff",
            }}
          >
            <iframe
              title="Reglamento UNIDET"
              src={pdfUrl}
              style={{
                width: "100%",
                height: "80vh",
                border: "none",
              }}
            />
          </section>
        </>
      )}
    </main>
  );
}

export default Reglamento;