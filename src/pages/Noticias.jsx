// src/pages/Noticias.jsx
import { useEffect, useState } from "react";
import NewsCard from "../components/NewsCard.jsx";
import { API_BASE_URL } from "../services/api";

export default function Noticias() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setCargando(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE_URL}/news`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "No se pudieron cargar las noticias.");
        }

        setItems(data.items || []);
      } catch (e) {
        console.error(e);
        setError(e.message || "Error al cargar noticias.");
      } finally {
        setCargando(false);
      }
    }

    load();
  }, []);

  return (
    <section>
      <header className="section-header">
        <p className="section-badge">Noticias UNIDET</p>
        <h1 className="section-title">Eventos, logros y avisos importantes</h1>
        <p className="section-subtitle">
          Aquí encontrarás los comunicados oficiales y las actividades más
          recientes del plantel.
        </p>
      </header>

      {cargando && <p>Cargando noticias…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!cargando && items.length === 0 && !error && (
        <p>No hay noticias públicas registradas por el momento.</p>
      )}

      <div className="grid">
        {items.map((n) => (
          <NewsCard
            key={n.id}
            title={n.titulo}
            excerpt={n.resumen || n.contenido?.slice(0, 120) + "…"}
            date={n.fecha_publicacion}
            tag="UNIDET"
          />
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button className="btn-outline">Ver todas las noticias</button>
      </div>
    </section>
  );
}
