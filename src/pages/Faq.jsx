// src/pages/Faq.jsx
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api";

export default function Faq() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFaq() {
      try {
        setError("");
        const resp = await fetch(`${API_BASE_URL}/faq`);
        if (!resp.ok) {
          throw new Error(`Error ${resp.status}`);
        }
        const data = await resp.json();
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las preguntas frecuentes.");
      }
    }

    loadFaq();
  }, []);

  return (
    <section className="page faq-page">
      <div className="faq-hero">
        <h1>Encuentra tus dudas aquí</h1>
        <p>
          Respuestas rápidas a las preguntas más comunes de aspirantes y
          estudiantes.
        </p>
      </div>

      {error && (
        <p style={{ color: "crimson", marginBottom: "1rem" }}>{error}</p>
      )}

      <div className="faq-grid">
        {items.map((item) => (
          <article key={item.id} className="faq-card">
            <h2>{item.pregunta}</h2>
            <p>{item.respuesta_corta}</p>
            {/* Más adelante podemos hacer un "Ver más" con respuesta_larga */}
          </article>
        ))}

        {items.length === 0 && !error && (
          <p>No hay preguntas registradas todavía.</p>
        )}
      </div>
    </section>
  );
}
