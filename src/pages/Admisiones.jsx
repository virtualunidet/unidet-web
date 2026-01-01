// src/pages/Admisiones.jsx
import { useEffect, useState } from "react";
import { getJson } from "../services/api";

export default function Admisiones() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getJson("/admissions");
        setSteps(data.items || []);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el proceso de admisión.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="page">
      <header className="section-header">
        <span className="section-badge">Admisiones UNIDET</span>
        <h1 className="section-title">Ingreso a UNIDET León A.C.</h1>
        <p className="section-subtitle">
          Requisitos, convocatorias y proceso de registro para nuevos aspirantes.
        </p>
      </header>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>Cargando proceso de admisión...</p>}

      {!loading && !error && (
        <section className="admisiones-section">
          {steps.length === 0 ? (
            <p>Por el momento no hay pasos configurados.</p>
          ) : (
            <div className="admisiones-grid">
              {steps.map((step, index) => (
                <article key={step.id} className="card admision-card">
                  <div className="admision-card-header">
                    <span className="admision-step-number">
                      {index + 1}
                    </span>
                    <h3 className="admision-card-title">
                      {step.titulo}
                    </h3>
                  </div>
                  {step.descripcion && (
                    <p className="admision-card-text">
                      {step.descripcion}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
