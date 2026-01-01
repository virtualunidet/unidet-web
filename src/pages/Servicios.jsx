// src/pages/Servicios.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../services/api";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadServicios();
  }, []);

  async function loadServicios() {
    try {
      setCargando(true);
      setError("");

      const data = await getJson("/services"); // público, sin auth
      // Soporta { items: [...] } o directamente [...]
      const lista = Array.isArray(data) ? data : data.items || [];

      setServicios(lista);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los servicios.");
    } finally {
      setCargando(false);
    }
  }

  const visibleSorted = [...servicios]
    .filter(
      (s) =>
        s.visible === true ||
        s.visible === 1 ||
        s.visible === "1" ||
        s.visible === undefined // por compatibilidad, por si algún registro no trae visible
    )
    .sort((a, b) => {
      const ordA =
        typeof a.orden === "number"
          ? a.orden
          : a.orden
          ? parseInt(a.orden, 10) || 999
          : 999;
      const ordB =
        typeof b.orden === "number"
          ? b.orden
          : b.orden
          ? parseInt(b.orden, 10) || 999
          : 999;
      return ordA - ordB;
    });

  return (
    <section>
      <header className="section-header">
        <p className="section-badge">Servicios UNIDET</p>
        <h1 className="section-title">Acompañamiento durante tu formación</h1>
        <p className="section-subtitle">
          Más que clases: impulso laboral, bienestar integral y espacios para
          que desarrolles tu talento.
        </p>

        {cargando && (
          <p className="section-subtitle" style={{ marginTop: "0.5rem" }}>
            Cargando servicios...
          </p>
        )}

        {error && (
          <p
            className="section-subtitle"
            style={{ marginTop: "0.5rem", color: "red" }}
          >
            {error}
          </p>
        )}
      </header>

      {visibleSorted.length === 0 && !cargando && !error && (
        <p
          className="section-subtitle"
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          Aún no hay servicios configurados. Vuelve pronto.
        </p>
      )}

      {visibleSorted.length > 0 && (
        <div className="cards-grid four" style={{ marginBottom: "2rem" }}>
          {visibleSorted.map((svc) => (
            <article key={svc.id || svc.titulo} className="card">
              <h3 className="card-title">{svc.titulo}</h3>
              <p className="card-text">{svc.descripcion}</p>
            </article>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <Link to="/admisiones" className="btn">
          ¡Inscríbete hoy!
        </Link>
      </div>
    </section>
  );
}
