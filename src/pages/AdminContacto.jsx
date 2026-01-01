// src/pages/AdminContacto.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import { adminFetch } from "../services/api.js";

function AdminContacto() {
  const [phones, setPhones] = useState([""]);
  const [emails, setEmails] = useState([""]);
  const [address, setAddress] = useState("");
  const [schedule, setSchedule] = useState("");

  const [socialText, setSocialText] = useState("");
  const [socials, setSocials] = useState([{ label: "", url: "" }]);

  const [heroPreview, setHeroPreview] = useState(null);
  const [heroFile, setHeroFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Cargar datos actuales
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await adminFetch("/admin/contact");
        const data = await res.json();

        if (!isMounted) return;

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
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No se pudieron cargar los datos de contacto.");
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helpers para arrays
  const updatePhone = (idx, value) => {
    setPhones((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addPhone = () => setPhones((prev) => [...prev, ""]);

  const removePhone = (idx) =>
    setPhones((prev) => prev.filter((_, i) => i !== idx));

  const updateEmail = (idx, value) => {
    setEmails((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addEmail = () => setEmails((prev) => [...prev, ""]);

  const removeEmail = (idx) =>
    setEmails((prev) => prev.filter((_, i) => i !== idx));

  const updateSocial = (idx, field, value) => {
    setSocials((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addSocial = () =>
    setSocials((prev) => [...prev, { label: "", url: "" }]);

  const removeSocial = (idx) =>
    setSocials((prev) => prev.filter((_, i) => i !== idx));

  // Guardar texto
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    // Limpiar vacíos en el front también
    const cleanPhones = phones.map((p) => p.trim()).filter((p) => p !== "");
    const cleanEmails = emails.map((c) => c.trim()).filter((c) => c !== "");
    const cleanSocials = socials
      .map((s) => ({
        label: (s.label || "").trim(),
        url: (s.url || "").trim(),
      }))
      .filter((s) => s.label !== "" && s.url !== "");

    const payload = {
      phones: cleanPhones,
      emails: cleanEmails,
      address: address.trim(),
      schedule: schedule.trim(),
      social_text: socialText.trim(),
      socials: cleanSocials,
    };

    try {
      const res = await adminFetch("/admin/contact", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar datos");
      }

      setMessage("Datos guardados correctamente.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al guardar datos.");
    } finally {
      setSaving(false);
    }
  };

  // Subir imagen
  const handleHeroChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadImage = async () => {
    if (!heroFile) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", heroFile);

      const res = await adminFetch("/admin/contact/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error al subir imagen");
      }

      setMessage("Imagen actualizada correctamente.");
      setHeroPreview(data.image_url || heroPreview);
      setHeroFile(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al subir imagen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminNav active="contacto" />

      <main className="page page-admin">
        <section className="section section-admin">
          <header className="section-header">
            <h1>Contacto</h1>
            <p>
              Actualiza los datos de contacto que se muestran en la página
              pública y la imagen principal.
            </p>
          </header>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="admin-grid-2">
            {/* Datos generales */}
            <div className="card card-admin">
              <h2>Datos generales</h2>

              {/* Teléfonos */}
              <label className="form-label">Teléfonos</label>
              {phones.map((phone, idx) => (
                <div key={idx} className="form-row-inline">
                  <input
                    type="text"
                    className="input"
                    value={phone}
                    onChange={(e) => updatePhone(idx, e.target.value)}
                    placeholder="(477) 000 00 00"
                  />
                  {phones.length > 1 && (
                    <button
                      type="button"
                      className="btn-ghost-small"
                      onClick={() => removePhone(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-tag"
                onClick={addPhone}
              >
                + Agregar teléfono
              </button>

              {/* Correos */}
              <label className="form-label" style={{ marginTop: "1.5rem" }}>
                Correos electrónicos
              </label>
              {emails.map((email, idx) => (
                <div key={idx} className="form-row-inline">
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => updateEmail(idx, e.target.value)}
                    placeholder="info@unidet.edu.mx"
                  />
                  {emails.length > 1 && (
                    <button
                      type="button"
                      className="btn-ghost-small"
                      onClick={() => removeEmail(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-tag"
                onClick={addEmail}
              >
                + Agregar correo
              </button>

              {/* Domicilio */}
              <label className="form-label" style={{ marginTop: "1.5rem" }}>
                Domicilio
              </label>
              <input
                type="text"
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Principal #123, León, Gto."
              />

              {/* Horario */}
              <label className="form-label" style={{ marginTop: "1.5rem" }}>
                Horario de atención
              </label>
              <input
                type="text"
                className="input"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Lunes a viernes · 9:00 a 19:00 h"
              />

              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ marginTop: "1.5rem" }}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>

            {/* Imagen principal */}
            <div className="card card-admin">
              <h2>Imagen principal</h2>
              <p className="help-text">
                Esta imagen se muestra en la parte derecha de la página de
                contacto. Formatos permitidos: JPG, PNG, WEBP. Máx. 5 MB.
              </p>

              {heroPreview && (
                <div className="hero-contact-preview">
                  <img src={heroPreview} alt="Imagen de contacto" />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleHeroChange}
              />

              <button
                type="button"
                className="btn-secondary"
                onClick={handleUploadImage}
                disabled={saving || !heroFile}
                style={{ marginTop: "1rem" }}
              >
                Subir nueva imagen
              </button>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="card card-admin" style={{ marginTop: "2rem" }}>
            <h2>Redes sociales</h2>

            <label className="form-label">Texto general</label>
            <textarea
              className="textarea"
              value={socialText}
              onChange={(e) => setSocialText(e.target.value)}
              placeholder="Síguenos para conocer convocatorias, eventos y avisos importantes."
              rows={3}
            />

            <label className="form-label" style={{ marginTop: "1.5rem" }}>
              Enlaces (Facebook, Instagram, etc.)
            </label>

            {socials.map((item, idx) => (
              <div key={idx} className="form-row-social">
                <input
                  type="text"
                  className="input"
                  placeholder="Nombre de la red (Facebook, Instagram...)"
                  value={item.label}
                  onChange={(e) =>
                    updateSocial(idx, "label", e.target.value)
                  }
                />
                <input
                  type="text"
                  className="input"
                  placeholder="https://..."
                  value={item.url}
                  onChange={(e) => updateSocial(idx, "url", e.target.value)}
                />
                {socials.length > 1 && (
                  <button
                    type="button"
                    className="btn-ghost-small"
                    onClick={() => removeSocial(idx)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="btn-tag"
              onClick={addSocial}
              style={{ marginTop: "0.75rem" }}
            >
              + Agregar enlace
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ marginTop: "1.5rem" }}
            >
              {saving ? "Guardando..." : "Guardar todo"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default AdminContacto;
