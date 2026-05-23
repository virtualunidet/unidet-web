// src/pages/AdminContacto.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { API_BASE_URL, adminFetch } from "../services/api.js";

function buildFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeUrl(url) {
  const clean = String(url || "").trim();
  if (!clean) return "";

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  return `https://${clean}`;
}

function isValidUrl(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function AdminContacto() {
  const [phones, setPhones] = useState([""]);
  const [emails, setEmails] = useState([""]);
  const [address, setAddress] = useState("");
  const [schedule, setSchedule] = useState("");

  const [socialText, setSocialText] = useState("");
  const [socials, setSocials] = useState([{ label: "", url: "" }]);

  const [heroPreview, setHeroPreview] = useState(null);
  const [heroFile, setHeroFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    loadContacto();
  }, []);

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto });
  }

  function cerrarAviso() {
    setAviso(null);
  }

  async function loadContacto() {
    try {
      setLoading(true);
      cerrarAviso();

      const res = await adminFetch("/admin/contact", {
        method: "GET",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudieron cargar los datos de contacto.");
      }

      setPhones(data.phones && data.phones.length ? data.phones : [""]);
      setEmails(data.emails && data.emails.length ? data.emails : [""]);
      setAddress(data.address || "");
      setSchedule(data.schedule || "");
      setSocialText(data.social_text || "");
      setSocials(
        data.socials && data.socials.length
          ? data.socials
          : [{ label: "", url: "" }]
      );
      setHeroPreview(data.hero_image || null);
      setHeroFile(null);
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", err.message || "No se pudieron cargar los datos de contacto.");
    } finally {
      setLoading(false);
    }
  }

  function updatePhone(idx, value) {
    setPhones((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  function addPhone() {
    setPhones((prev) => [...prev, ""]);
  }

  function removePhone(idx) {
    setPhones((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [""];
    });
  }

  function updateEmail(idx, value) {
    setEmails((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  function addEmail() {
    setEmails((prev) => [...prev, ""]);
  }

  function removeEmail(idx) {
    setEmails((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [""];
    });
  }

  function updateSocial(idx, field, value) {
    setSocials((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addSocial() {
    setSocials((prev) => [...prev, { label: "", url: "" }]);
  }

  function removeSocial(idx) {
    setSocials((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [{ label: "", url: "" }];
    });
  }

  function validarFormulario(cleanEmails, cleanSocials) {
    for (const email of cleanEmails) {
      if (!isValidEmail(email)) {
        mostrarAviso("error", `El correo "${email}" no tiene un formato válido.`);
        return false;
      }
    }

    for (const social of cleanSocials) {
      if (!social.label || !social.url) {
        mostrarAviso("error", "Cada red social debe tener nombre y URL.");
        return false;
      }

      if (!isValidUrl(social.url)) {
        mostrarAviso("error", `La URL de "${social.label}" no es válida.`);
        return false;
      }
    }

    return true;
  }

  async function handleSave(e) {
    e.preventDefault();
    cerrarAviso();

    const cleanPhones = phones.map((p) => p.trim()).filter(Boolean);
    const cleanEmails = emails.map((c) => c.trim()).filter(Boolean);

    const cleanSocials = socials
      .map((s) => ({
        label: (s.label || "").trim(),
        url: normalizeUrl(s.url),
      }))
      .filter((s) => s.label || s.url);

    if (!validarFormulario(cleanEmails, cleanSocials)) return;

    const payload = {
      phones: cleanPhones,
      emails: cleanEmails,
      address: address.trim(),
      schedule: schedule.trim(),
      social_text: socialText.trim(),
      socials: cleanSocials,
    };

    try {
      setSaving(true);
      mostrarAviso("info", "Guardando datos de contacto...");

      const res = await adminFetch("/admin/contact", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar los datos de contacto.");
      }

      setPhones(cleanPhones.length ? cleanPhones : [""]);
      setEmails(cleanEmails.length ? cleanEmails : [""]);
      setSocials(cleanSocials.length ? cleanSocials : [{ label: "", url: "" }]);

      mostrarAviso("success", "Datos de contacto actualizados correctamente.");
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", err.message || "Error al guardar. Revisa los campos.");
    } finally {
      setSaving(false);
    }
  }

  function handleHeroChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      setHeroFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const lowerName = file.name.toLowerCase();

    const validType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!validType) {
      setHeroFile(null);
      mostrarAviso("error", "La imagen debe ser JPG, PNG o WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setHeroFile(null);
      mostrarAviso("error", "La imagen es demasiado grande. Máximo 5 MB.");
      e.target.value = "";
      return;
    }

    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
    mostrarAviso("info", `Imagen seleccionada: ${file.name}`);
  }

  async function handleUploadImage() {
    cerrarAviso();

    if (!heroFile) {
      mostrarAviso("error", "Selecciona una imagen antes de subirla.");
      return;
    }

    try {
      setUploadingImage(true);
      mostrarAviso("info", "Subiendo imagen principal...");

      const formData = new FormData();
      formData.append("image", heroFile);

      const res = await adminFetch("/admin/contact/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al subir imagen.");
      }

      const newPath =
        data.image_url || data.hero_image || data.url || heroPreview;

      setHeroPreview(newPath);
      setHeroFile(null);

      mostrarAviso("success", "Imagen de contacto actualizada correctamente.");
    } catch (err) {
      console.error(err);
      if (err.message === "NO_ADMIN_AUTH") return;
      mostrarAviso("error", err.message || "Error al subir imagen.");
    } finally {
      setUploadingImage(false);
    }
  }

  const heroUrl = heroPreview ? buildFileUrl(heroPreview) : "";

  return (
    <div className="admin-page">
      <header className="section-header">
        <span className="section-badge">Panel administrador</span>
        <AdminNav />

        <h1 className="section-title">Contacto</h1>
        <p className="section-subtitle">
          Actualiza los datos institucionales de contacto, redes sociales e imagen principal.
        </p>
      </header>

      {aviso && (
        <div className={`admin-alert admin-alert-${aviso.tipo}`}>
          <span>{aviso.texto}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={cerrarAviso}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <p>Cargando información de contacto...</p>
      ) : (
        <>
          <div className="admin-grid">
            <section className="card admin-form-card admin-form">
              <h2>Datos generales</h2>

              <form onSubmit={handleSave}>
                <div className="field">
                  <label>Teléfonos</label>
                  {phones.map((phone, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => updatePhone(idx, e.target.value)}
                        placeholder="(477) 000 00 00"
                        disabled={saving}
                      />

                      {phones.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-xs"
                          onClick={() => removePhone(idx)}
                          disabled={saving}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={addPhone}
                    disabled={saving}
                  >
                    + Agregar teléfono
                  </button>
                </div>

                <div className="field">
                  <label>Correos electrónicos</label>
                  {emails.map((email, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmail(idx, e.target.value)}
                        placeholder="info@unidet.edu.mx"
                        disabled={saving}
                      />

                      {emails.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-xs"
                          onClick={() => removeEmail(idx)}
                          disabled={saving}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={addEmail}
                    disabled={saving}
                  >
                    + Agregar correo
                  </button>
                </div>

                <div className="field">
                  <label>Domicilio</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Principal #123, León, Gto."
                    disabled={saving}
                  />
                </div>

                <div className="field">
                  <label>Horario de atención</label>
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Lunes a viernes · 9:00 a 19:00 h"
                    disabled={saving}
                  />
                </div>

                <div className="field">
                  <label>Texto general de redes sociales</label>
                  <textarea
                    rows={3}
                    value={socialText}
                    onChange={(e) => setSocialText(e.target.value)}
                    placeholder="Síguenos en nuestras redes sociales para conocer novedades y avisos."
                    disabled={saving}
                  />
                </div>

                <div className="field">
                  <label>Redes sociales</label>

                  {socials.map((social, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 2fr auto",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        type="text"
                        value={social.label}
                        onChange={(e) =>
                          updateSocial(idx, "label", e.target.value)
                        }
                        placeholder="Facebook"
                        disabled={saving}
                      />

                      <input
                        type="text"
                        value={social.url}
                        onChange={(e) =>
                          updateSocial(idx, "url", e.target.value)
                        }
                        placeholder="https://facebook.com/..."
                        disabled={saving}
                      />

                      {socials.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-xs"
                          onClick={() => removeSocial(idx)}
                          disabled={saving}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={addSocial}
                    disabled={saving}
                  >
                    + Agregar red social
                  </button>
                </div>

                <div
                  className="admin-form-actions"
                  style={{ display: "flex", gap: "0.75rem" }}
                >
                  <button type="submit" className="btn" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar datos"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={loadContacto}
                    disabled={saving}
                  >
                    Restaurar datos actuales
                  </button>
                </div>
              </form>
            </section>

            <section className="card admin-form-card admin-form">
              <h2>Imagen principal</h2>
              <p className="muted">
                Esta imagen se muestra en la página pública de contacto.
                Formatos permitidos: JPG, PNG o WEBP. Máximo 5 MB.
              </p>

              {heroUrl ? (
                <div
                  style={{
                    margin: "1rem 0",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <img
                    src={heroUrl}
                    alt="Imagen de contacto"
                    style={{
                      width: "100%",
                      maxHeight: "260px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ) : (
                <p className="muted">No hay imagen principal cargada.</p>
              )}

              <div className="field">
                <label>Seleccionar imagen</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handleHeroChange}
                  disabled={uploadingImage}
                />
              </div>

              <button
                type="button"
                className="btn"
                onClick={handleUploadImage}
                disabled={uploadingImage || !heroFile}
              >
                {uploadingImage ? "Subiendo..." : "Subir nueva imagen"}
              </button>
            </section>
          </div>

          <section style={{ marginTop: "2rem" }}>
            <div className="section-header" style={{ marginBottom: "1rem" }}>
              <h2 className="section-title" style={{ fontSize: "1.3rem" }}>
                Vista previa pública
              </h2>
              <p className="section-subtitle">
                Así se visualizarán los datos principales en la página de contacto.
              </p>
            </div>

            <div className="cards-grid two">
              <article className="card">
                <h3 className="card-title">Datos de contacto</h3>

                {phones.filter((p) => p.trim()).length > 0 && (
                  <p className="card-text">
                    Teléfono: {phones.filter((p) => p.trim()).join(", ")}
                  </p>
                )}

                {emails.filter((e) => e.trim()).length > 0 && (
                  <p className="card-text">
                    Correo: {emails.filter((e) => e.trim()).join(", ")}
                  </p>
                )}

                {address.trim() && (
                  <p className="card-text">Domicilio: {address}</p>
                )}

                {schedule.trim() && (
                  <p className="card-text">Horario: {schedule}</p>
                )}
              </article>

              <article className="card">
                <h3 className="card-title">Redes sociales</h3>

                {socialText.trim() && (
                  <p className="card-text">{socialText}</p>
                )}

                {socials.filter((s) => s.label.trim() || s.url.trim()).length > 0 ? (
                  <ul>
                    {socials
                      .filter((s) => s.label.trim() || s.url.trim())
                      .map((s, idx) => (
                        <li key={idx}>
                          {s.label || "Red social"} — {s.url || "Sin URL"}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="muted">Sin redes sociales configuradas.</p>
                )}
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminContacto;