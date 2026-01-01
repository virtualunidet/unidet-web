// src/pages/AdminUsers.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import {
  adminGetJson,
  adminPostJson,
  adminPutJson,
  adminDeleteJson,
} from "../services/api";

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");

  async function loadUsers() {
    try {
      setError("");
      setLoading(true);
      const data = await adminGetJson("/admin/users");
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de admins.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("admin");
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Nombre, correo y contraseña son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await adminPostJson("/admin/users", {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      resetForm();
      await loadUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo crear el admin.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    if (user.id === 1 && user.is_active) {
      alert("No puedes desactivar al superadmin principal.");
      return;
    }

    try {
      setError("");
      setSaving(true);
      await adminPutJson(`/admin/users/${user.id}`, {
        is_active: user.is_active ? 0 : 1,
      });
      await loadUsers();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el estado del usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRole(user, newRole) {
    if (user.id === 1 && newRole !== "superadmin") {
      alert("El usuario 1 debe permanecer como superadmin.");
      return;
    }

    try {
      setError("");
      setSaving(true);
      await adminPutJson(`/admin/users/${user.id}`, {
        role: newRole,
      });
      await loadUsers();
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el rol.");
    } finally {
      setSaving(false);
    }
  }

  // Cambiar contraseña (usa POST /admin/users/{id}/reset-password)
  async function handleResetPassword(user) {
    const newPassword = window.prompt(
      `Nueva contraseña para ${user.name} (${user.email}):`
    );

    if (!newPassword) {
      return; // canceló o vacío
    }

    try {
      setSaving(true);
      setError("");

      const data = await adminPostJson(
        `/admin/users/${user.id}/reset-password`,
        { new_password: newPassword }
      );

      alert(
        `Contraseña actualizada correctamente para ${data.user_email}.\n` +
          `Nueva contraseña: ${data.temp_password}`
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  // Eliminar admin (DELETE /admin/users/{id})
  async function handleDelete(user) {
    if (user.id === 1) {
      alert("No puedes eliminar al superadmin principal.");
      return;
    }

    const ok = window.confirm(
      `¿Seguro que quieres eliminar a ${user.name} (${user.email})?\n` +
        "Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      await adminDeleteJson(`/admin/users/${user.id}`);
      await loadUsers();
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo eliminar el admin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content">
      <section className="container admin-page">
        <AdminNav />

        <h1>Administradores</h1>
        <p className="muted">
          Crea y administra las cuentas con acceso al panel UNIDET.
        </p>

        {error && (
          <p style={{ color: "crimson", marginTop: "0.5rem" }}>{error}</p>
        )}

        {/* Formulario crear admin */}
        <div className="panel admin-form-card">
          <h2 style={{ marginTop: 0 }}>Crear nuevo admin</h2>

          <form className="admin-form" onSubmit={handleCreate}>
            <div className="field">
              <label>Nombre completo*</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Correo*</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Contraseña inicial*</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className="muted">
                El usuario podrá cambiarla después mediante la opción
                &quot;¿Olvidaste tu contraseña?&quot;.
              </small>
            </div>

            <div className="field">
              <label>Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ maxWidth: "200px" }}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>

            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Crear admin"}
            </button>
          </form>
        </div>

        {/* Listado admins */}
        <div style={{ marginTop: "2rem" }}>
          <h2>Usuarios con acceso al panel</h2>

          {loading && <p>Cargando...</p>}

          {!loading && items.length === 0 && (
            <p>No hay usuarios registrados.</p>
          )}

          {!loading && items.length > 0 && (
            <table
              style={{
                width: "100%",
                marginTop: "1rem",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.4rem" }}>
                    Nombre
                  </th>
                  <th style={{ textAlign: "left", padding: "0.4rem" }}>
                    Correo
                  </th>
                  <th style={{ textAlign: "center", padding: "0.4rem" }}>
                    Rol
                  </th>
                  <th style={{ textAlign: "center", padding: "0.4rem" }}>
                    Estado
                  </th>
                  <th style={{ textAlign: "center", padding: "0.4rem" }}>
                    Verificado
                  </th>
                  <th style={{ textAlign: "right", padding: "0.4rem" }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const isActive =
                    u.is_active === 1 || u.is_active === true || u.is_active === "1";
                  const isPrincipal = u.id === 1;

                  return (
                    <tr key={u.id}>
                      <td style={{ padding: "0.35rem" }}>{u.name}</td>
                      <td style={{ padding: "0.35rem" }}>{u.email}</td>
                      <td style={{ padding: "0.35rem", textAlign: "center" }}>
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleChangeRole(u, e.target.value)
                          }
                          disabled={isPrincipal || saving}
                        >
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      </td>
                      <td style={{ padding: "0.35rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.1rem 0.6rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            marginBottom: "0.25rem",
                            backgroundColor: isActive ? "#e6ffed" : "#f2f2f2",
                            color: isActive ? "#0f5132" : "#555",
                            border: `1px solid ${
                              isActive ? "#0f5132" : "#aaa"
                            }`,
                          }}
                        >
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                        <br />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            padding: "0.2rem 0.6rem",
                            fontSize: "0.8rem",
                            marginTop: "0.15rem",
                          }}
                          onClick={() => handleToggleActive(u)}
                          disabled={saving}
                        >
                          {isActive ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                      <td style={{ padding: "0.35rem", textAlign: "center" }}>
                        {u.verified ? "Sí" : "No"}
                      </td>
                      <td
                        style={{
                          padding: "0.35rem",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            padding: "0.2rem 0.6rem",
                            fontSize: "0.8rem",
                          }}
                          onClick={() => handleResetPassword(u)}
                          disabled={saving}
                        >
                          Cambiar contraseña
                        </button>

                        {!isPrincipal && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{
                              padding: "0.2rem 0.6rem",
                              fontSize: "0.8rem",
                              marginLeft: "0.4rem",
                            }}
                            onClick={() => handleDelete(u)}
                            disabled={saving}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
