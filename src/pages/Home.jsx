// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="home-page">
      <div className="hero">
        {/* Columna izquierda: texto */}
        <div>
          <p className="hero-kicker">Portal Web Institucional UNIDET</p>
          <h1 className="hero-main-title">
            Saber, emprender y trabajar
            <br />
            con <span style={{ color: "var(--uni-primary-dark)" }}>UNIDET León A.C.</span>
          </h1>

          <p className="hero-text">
            Conoce nuestra oferta de áreas técnicas, cursos cortos y servicios
            para que puedas estudiar y al mismo tiempo desarrollarte en el mundo
            laboral.
          </p>

          <div className="hero-actions">
            <Link to="/admisiones" className="btn">
              Me interesa conocer más…
            </Link>
            <span className="hero-note">
              Convocatoria de ingreso abierta • Enero 2026
            </span>
          </div>

          <ul className="hero-tags">
            <li className="hero-tag-pill">Modista Profesional</li>
            <li className="hero-tag-pill">Cultura de Belleza</li>
            <li className="hero-tag-pill">Informática y Coding</li>
            <li className="hero-tag-pill">Auxiliar Contable</li>
          </ul>
        </div>

        {/* Columna derecha: “laptop” simplificada */}
        <div className="laptop-mock">
          <div className="laptop-screen">
            <div className="laptop-screen-header">
              <div className="laptop-logo">UNIDET León A.C.</div>
              <div className="laptop-pill">Portal UNIDET</div>
            </div>

            <p className="section-subtitle" style={{ marginBottom: "0.8rem" }}>
              Áreas de especialización y cursos cortos:
            </p>

            <div className="laptop-grid">
              <div className="laptop-item">Terapueta Spa</div>
              <div className="laptop-item">Barbería</div>
              <div className="laptop-item">Cultura de Belleza</div>
              <div className="laptop-item">Modista Profesional</div>
              <div className="laptop-item">Informática y Coding</div>
              <div className="laptop-item">Auxiliar Contable</div>
            </div>
          </div>

          <div className="laptop-base" />
        </div>
      </div>

      {/* franja de resumen rápido */}
      <div className="cards-grid three">
        <article className="card">
          <p className="section-badge">Admisiones</p>
          <h3 className="card-title">Proceso claro y acompañamiento</h3>
          <p className="card-text">
            Requisitos y convocatorias para que te inscribas sin complicaciones.
          </p>
        </article>
        <article className="card">
          <p className="section-badge">Oferta educativa</p>
          <h3 className="card-title">Programas con enfoque práctico</h3>
          <p className="card-text">
            Formación técnica pensada para que puedas incorporarte al trabajo
            rápidamente.
          </p>
        </article>
        <article className="card">
          <p className="section-badge">Servicios UNIDET</p>
          <h3 className="card-title">Bolsa de trabajo y bienestar</h3>
          <p className="card-text">
            Impulso laboral, acompañamiento y actividades para tu desarrollo
            integral.
          </p>
        </article>
      </div>
    </section>
  );
}
