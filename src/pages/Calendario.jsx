// src/pages/Calendario.jsx
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api";

export default function Calendario() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setCargando(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE_URL}/events`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "No se pudieron cargar los eventos.");
        }

        setItems(data.items || []);
      } catch (e) {
        console.error(e);
        setError(e.message || "Error al cargar el calendario.");
      } finally {
        setCargando(false);
      }
    }

    load();
  }, []);

  return (
    <section>
      <header className="section-header">
        <p className="section-badge">Calendario UNIDET</p>
        <h1 className="section-title">Eventos académicos y administrativos</h1>
        <p className="section-subtitle">
          Fechas de inicio de clases, evaluaciones, recesos y actividades
          especiales.
        </p>
      </header>

      {cargando && <p>Cargando eventos…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!cargando && items.length === 0 && !error && (
        <p>No hay eventos registrados por el momento.</p>
      )}

      <div className="cards-grid two">
        {items.map((e) => (
          <article key={e.id} className="card">
            <h3 className="card-title">{e.titulo}</h3>
            {e.descripcion && <p className="card-text">{e.descripcion}</p>}
            <p className="muted">
              Inicio:{" "}
              {e.fecha_inicio
                ? new Date(e.fecha_inicio).toLocaleString()
                : "-"}
              {e.fecha_fin && (
                <>
                  <br />
                  Fin: {new Date(e.fecha_fin).toLocaleString()}
                </>
              )}
            </p>
            {e.lugar && (
              <p className="muted" style={{ marginTop: "0.3rem" }}>
                Lugar: {e.lugar}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
