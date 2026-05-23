// src/pages/Contacto.jsx
import { useEffect, useState } from "react";
import { getJson, API_BASE_URL } from "../services/api.js";

function buildFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

function normalizeUrl(url) {
  const clean = String(url || "").trim();
  if (!clean) return "#";

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  return `https://${clean}`;
}

function phoneHref(phone) {
  const clean = String(phone || "").replace(/[^\d+]/g, "");
  return clean ? `tel:${clean}` : "#";
}

function Contacto() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const result = await getJson("/contact");
        if (isMounted) setData(result);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No se pudieron cargar los datos de contacto.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const heroUrl = data?.hero_image ? buildFileUrl(data.hero_image) : null;

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

        {loading && <p>Cargando datos de contacto...</p>}

        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        {!loading && !error && !data && (
          <div className="card">
            <h2>Información no disponible</h2>
            <p className="muted">
              Por el momento no hay datos de contacto configurados.
            </p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="contact-layout">
            <div className="contact-main">
              <div className="card contact-card">
                <h2>Datos de contacto</h2>

                {data.phones && data.phones.length > 0 && (
                  <div className="contact-block">
                    <h3>Teléfono</h3>

                    {data.phones.map((phone, idx) => (
                      <p key={idx}>
                        <a href={phoneHref(phone)}>{phone}</a>
                      </p>
                    ))}
                  </div>
                )}

                {data.emails && data.emails.length > 0 && (
                  <div className="contact-block">
                    <h3>Correo</h3>

                    {data.emails.map((email, idx) => (
                      <p key={idx}>
                        <a href={`mailto:${email}`}>{email}</a>
                      </p>
                    ))}
                  </div>
                )}

                {data.address && (
                  <div className="contact-block">
                    <h3>Domicilio</h3>
                    <p>{data.address}</p>
                  </div>
                )}

                {data.schedule && (
                  <div className="contact-block">
                    <h3>Horario de atención</h3>
                    <p>{data.schedule}</p>
                  </div>
                )}

                {!data.phones?.length &&
                  !data.emails?.length &&
                  !data.address &&
                  !data.schedule && (
                    <p className="muted">
                      Aún no se han configurado datos de contacto.
                    </p>
                  )}
              </div>

              <div className="card contact-card">
                <h2>Redes sociales</h2>

                {data.social_text && (
                  <p className="contact-social-text">{data.social_text}</p>
                )}

                {data.socials && data.socials.length > 0 ? (
                  <ul className="contact-social-list">
                    {data.socials.map((s, idx) => (
                      <li key={idx}>
                        <a
                          href={normalizeUrl(s.url)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {s.label || "Red social"}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    Aún no se han configurado redes sociales.
                  </p>
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
        )}
      </section>
    </main>
  );
}

export default Contacto;