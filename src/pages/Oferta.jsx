// src/pages/Oferta.jsx
import { useEffect, useState } from "react";
import { API_BASE_URL, getJson } from "../services/api";

function buildImageUrl(imagenUrl) {
  if (!imagenUrl) return "";
  const clean = String(imagenUrl).replaceAll("\\", "/");
  if (clean.startsWith("http")) return clean;

  const base = String(API_BASE_URL || "").replace(/\/$/, "");
  const path = clean.startsWith("/") ? clean : `/${clean}`;
  return `${base}${path}`;
}

function normCat(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function CourseCard({ course, variant }) {
  const imgSrc = buildImageUrl(course.imagen_url);
  const hasImage = Boolean(imgSrc);

  const label =
    variant === "especializacion" ? "Área de especialización" : "Curso corto";

  return (
    <article className={`card oferta-card oferta-card--${variant}`}>
      <span className={`oferta-chip oferta-chip--${variant}`}>{label}</span>

      {hasImage && (
        <div className="oferta-card-image">
          <img src={imgSrc} alt={course.titulo} loading="lazy" />
        </div>
      )}

      <h3 className="oferta-card-title">{course.titulo}</h3>
      {course.descripcion && (
        <p className="oferta-card-text">{course.descripcion}</p>
      )}
    </article>
  );
}

export default function Oferta() {
  const [esp, setEsp] = useState([]);
  const [cortos, setCortos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getJson("/courses?page=1&limit=200");
        const items = data?.items || [];

        const esps = [];
        const shorts = [];

        for (const c of items) {
          const cat = normCat(c.categoria);

          if (cat.includes("especializacion") || cat.includes("area de especializacion")) {
            esps.push(c);
          } else if (cat.includes("curso corto") || cat.includes("corto")) {
            shorts.push(c);
          }
        }

        setEsp(esps);
        setCortos(shorts);
      } catch (e) {
        console.error(e);
        setError(e.message || "No se pudo cargar la oferta educativa.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="page">
      <header className="section-header">
        <h1 className="section-title">Oferta educativa</h1>
        <p className="section-subtitle">
          Programas diseñados para que adquieras habilidades prácticas y
          certificables.
        </p>
      </header>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>Cargando oferta...</p>}

      {!loading && !error && (
        <>
          {esp.length > 0 && (
            <section className="oferta-section">
              <h2 className="section-subtitle-title">Áreas de especialización</h2>
              <div className="oferta-grid">
                {esp.map((c) => (
                  <CourseCard key={c.id} course={c} variant="especializacion" />
                ))}
              </div>
            </section>
          )}

          {cortos.length > 0 && (
            <section className="oferta-section">
              <h2 className="section-subtitle-title">Cursos cortos</h2>
              <div className="oferta-grid">
                {cortos.map((c) => (
                  <CourseCard key={c.id} course={c} variant="corto" />
                ))}
              </div>
            </section>
          )}

          {esp.length === 0 && cortos.length === 0 && (
            <p>No hay cursos disponibles por ahora.</p>
          )}
        </>
      )}
    </div>
  );
}
