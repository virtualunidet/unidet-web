import { useEffect, useState } from "react";
import { API_BASE_URL, getJson } from "../services/api";

function Reglamento() {
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState("texto"); // "texto" | "pdf"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const json = await getJson("/regulation");
        setData(json);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el reglamento");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pdfUrl =
    data && data.pdf_path ? `${API_BASE_URL}${data.pdf_path}` : null;

  return (
    <main className="page reglamento-page">
      <section className="page-header">
        <p className="page-kicker">Reglamento UNIDET</p>
        <h1 className="page-title">Lineamientos para tu formación</h1>
        <p className="page-subtitle">
          Consulta las reglas y lineamientos que ayudan a mantener un ambiente
          respetuoso y seguro dentro de UNIDET.
        </p>
      </section>

      {/* Botones de vista */}
      {pdfUrl && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("texto")}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border:
                viewMode === "texto"
                  ? "2px solid #003366"
                  : "1px solid #d0d0d0",
              backgroundColor: viewMode === "texto" ? "#003366" : "#fff",
              color: viewMode === "texto" ? "#fff" : "#003366",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Ver en texto
          </button>
          <button
            type="button"
            onClick={() => setViewMode("pdf")}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border:
                viewMode === "pdf"
                  ? "2px solid #003366"
                  : "1px solid #d0d0d0",
              backgroundColor: viewMode === "pdf" ? "#003366" : "#fff",
              color: viewMode === "pdf" ? "#fff" : "#003366",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Ver PDF oficial
          </button>
        </div>
      )}

      {loading && <p>Cargando reglamento...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && data && (
        <>
          {/* VISTA PDF GRANDE */}
          {viewMode === "pdf" && pdfUrl && (
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
          )}

          {/* VISTA TEXTO (GENERAL + SECCIONES) */}
          {viewMode === "texto" && (
            <>
              {/* Texto general */}
              <section
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "18px",
                  padding: "1.5rem 1.75rem",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.05)",
                  marginBottom: "2rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.15rem",
                    marginBottom: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Reglamento general
                </h2>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {data.content_html || "El reglamento será publicado próximamente."}
                </p>
              </section>

              {/* Secciones y puntos (si existen) */}
              {Array.isArray(data.sections) && data.sections.length > 0 && (
                <section>
                  <h2
                    style={{
                      fontSize: "1.15rem",
                      marginBottom: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    Secciones y puntos principales
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {data.sections.map((sec) => (
                      <article
                        key={sec.id}
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "16px",
                          padding: "1.25rem 1.5rem",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            marginBottom: "0.5rem",
                            fontSize: "1rem",
                            fontWeight: 600,
                          }}
                        >
                          {sec.titulo}
                        </h3>
                        {sec.descripcion && (
                          <p
                            style={{
                              marginTop: 0,
                              marginBottom: "0.75rem",
                              fontSize: "0.9rem",
                              color: "#555",
                            }}
                          >
                            {sec.descripcion}
                          </p>
                        )}

                        {Array.isArray(sec.items) && sec.items.length > 0 && (
                          <ol
                            style={{
                              margin: 0,
                              paddingLeft: "1.25rem",
                              fontSize: "0.92rem",
                              lineHeight: 1.6,
                            }}
                          >
                            {sec.items.map((item) => (
                              <li key={item.id} style={{ marginBottom: "0.4rem" }}>
                                {item.titulo && (
                                  <strong>{item.titulo}: </strong>
                                )}
                                {item.contenido}
                              </li>
                            ))}
                          </ol>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Si no hay PDF pero se intenta ver "pdf" */}
          {viewMode === "pdf" && !pdfUrl && (
            <p>No se ha configurado aún un PDF oficial del reglamento.</p>
          )}
        </>
      )}
    </main>
  );
}

export default Reglamento;
