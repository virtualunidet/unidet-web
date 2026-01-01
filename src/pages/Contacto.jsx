// src/pages/Contacto.jsx
import { useEffect, useState } from "react";
import { getJson, API_BASE_URL } from "../services/api.js";

function Contacto() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const result = await getJson("/contact");
        if (isMounted) setData(result);
      } catch (err) {
        console.error(err);
        if (isMounted) setError("No se pudieron cargar los datos de contacto.");
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const heroUrl =
    data && data.hero_image
      ? `${API_BASE_URL}${data.hero_image}`
      : null;

  return (
    <main className="page">
      <section className="section">
        <header className="section-header">
          <p className="section-kicker">Contacto UNIDET</p>
          <h1>Hablemos</h1>
          <p>
            Resolvemos tus dudas sobre inscripciones, horarios y programas
            disponibles.
          </p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="contact-layout">
          <div className="contact-main">
            <div className="card contact-card">
              <h2>Datos de contacto</h2>

              {data && data.phones && data.phones.length > 0 && (
                <div className="contact-block">
                  <h3>Teléfono</h3>
                  {data.phones.map((phone, idx) => (
                    <p key={idx}>{phone}</p>
                  ))}
                </div>
              )}

              {data && data.emails && data.emails.length > 0 && (
                <div className="contact-block">
                  <h3>Correo</h3>
                  {data.emails.map((email, idx) => (
                    <p key={idx}>
                      <a href={`mailto:${email}`}>{email}</a>
                    </p>
                  ))}
                </div>
              )}

              {data && data.address && (
                <div className="contact-block">
                  <h3>Domicilio</h3>
                  <p>{data.address}</p>
                </div>
              )}

              {data && data.schedule && (
                <div className="contact-block">
                  <h3>Horario de atención</h3>
                  <p>{data.schedule}</p>
                </div>
              )}
            </div>

            <div className="card contact-card">
              <h2>Redes sociales</h2>
              {data && data.social_text && (
                <p className="contact-social-text">{data.social_text}</p>
              )}

              {data && data.socials && data.socials.length > 0 && (
                <ul className="contact-social-list">
                  {data.socials.map((s, idx) => (
                    <li key={idx}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {heroUrl && (
            <aside className="contact-aside">
              <div className="contact-hero">
                <img src={heroUrl} alt="UNIDET contacto" />
              </div>
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}

export default Contacto;
