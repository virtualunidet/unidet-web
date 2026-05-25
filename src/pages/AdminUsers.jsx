// src/pages/AdminUsers.jsx
import { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import {
  adminGetJson,
  adminPostJson,
  adminPutJson,
  adminDeleteJson,
  getAdminUser,
} from "../services/api";

export default function AdminUsers() {
  const currentUser = getAdminUser();
  const currentUserId = Number(currentUser?.id || currentUser?.sub || 0);

  function isMainSuperadmin(user) {
    return Number(user.id) === 1;
  }

  function canManageMainSuperadmin(user) {
    return !isMainSuperadmin(user) || currentUserId === 1;
  }

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [createFormError, setCreateFormError] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const [pendingVerification, setPendingVerification] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [deleteUser, setDeleteUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function showError(message) {
    setError(message || "Ocurrió un error.");
    setSuccess("");
  }

  function showSuccess(message) {
    setSuccess(message || "Operación realizada correctamente.");
    setError("");
  }

  function clearVerificationFlow() {
    setPendingVerification(null);
    setVerificationCode("");
    setVerificationError("");
  }

  async function loadUsers() {
    try {
      setLoading(true);
      clearMessages();

      const data = await adminGetJson("/admin/users");
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      showError(err.message || "No se pudieron cargar los administradores.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("admin");
    setCreateFormError("");
    setShowCreatePassword(false);
    clearVerificationFlow();
  }

  function validateCreateForm() {
    setCreateFormError("");
    setVerificationError("");

    if (!name.trim()) {
      setCreateFormError("El nombre del administrador es obligatorio.");
      return false;
    }

    if (!email.trim()) {
      setCreateFormError("El correo del administrador es obligatorio.");
      return false;
    }

    if (!password.trim()) {
      setCreateFormError("La contraseña temporal es obligatoria.");
      return false;
    }

    if (password.length < 8) {
      setCreateFormError(
        "La contraseña temporal debe tener al menos 8 caracteres."
      );
      return false;
    }

    if (!["admin", "superadmin"].includes(role)) {
      setCreateFormError("El rol seleccionado no es válido.");
      return false;
    }

    return true;
  }

  async function handleRequestVerificationCode(e) {
    e.preventDefault();

    if (!validateCreateForm()) return;

    try {
      setSaving(true);
      clearMessages();
      setCreateFormError("");
      setVerificationError("");

const data = await adminPostJson("/admin/user-verification/request-code", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      setPendingVerification({
        requestId: data.request_id,
        email: data.email || email.trim().toLowerCase(),
        expiresAt: data.expires_at,
        devCode: data.dev_verification_code,
        role,
      });

      setVerificationCode("");

      showSuccess(
        "Código de verificación generado. Escríbelo para confirmar la creación del usuario."
      );
    } catch (err) {
      console.error(err);
      setCreateFormError(
        err.message || "No se pudo generar el código de verificación."
      );
      clearVerificationFlow();
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmVerificationCode() {
    if (!pendingVerification) {
      setVerificationError("Primero genera un código de verificación.");
      return;
    }

    const cleanCode = verificationCode.trim();

    setVerificationError("");

    if (!cleanCode) {
      setVerificationError("Escribe el código de verificación.");
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setVerificationError("El código debe tener exactamente 6 dígitos.");
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      const data = await adminPostJson("/admin/user-verification/confirm-code", {
        email: pendingVerification.email,
        code: cleanCode,
      });

      resetForm();
      await loadUsers();

      showSuccess(data.message || "Usuario verificado y creado correctamente.");
    } catch (err) {
      console.error(err);
      setVerificationError(
        err.message || "No se pudo confirmar el código de verificación."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(user, newRole) {
    if (!canManageMainSuperadmin(user)) {
      showError("No puedes modificar al superadmin principal.");
      return;
    }

    if (Number(user.id) === currentUserId && newRole !== "superadmin") {
      showError("No puedes quitarte tu propio rol superadmin.");
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      await adminPutJson(`/admin/users/${user.id}`, {
        role: newRole,
      });

      await loadUsers();
      showSuccess("Rol actualizado correctamente.");
    } catch (err) {
      console.error(err);
      showError(err.message || "No se pudo actualizar el rol.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    if (!canManageMainSuperadmin(user)) {
      showError("No puedes modificar al superadmin principal.");
      return;
    }

    if (Number(user.id) === currentUserId && Number(user.is_active) === 1) {
      showError("No puedes desactivar tu propia cuenta.");
      return;
    }

    const nextValue = Number(user.is_active) === 1 ? 0 : 1;

    try {
      setSaving(true);
      clearMessages();

      await adminPutJson(`/admin/users/${user.id}`, {
        is_active: nextValue,
      });

      await loadUsers();

      showSuccess(
        nextValue === 1
          ? "Usuario activado correctamente."
          : "Usuario desactivado correctamente."
      );
    } catch (err) {
      console.error(err);
      showError(err.message || "No se pudo cambiar el estado del usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVerified(user) {
    if (!canManageMainSuperadmin(user)) {
      showError("No puedes modificar al superadmin principal.");
      return;
    }

    const nextValue = !user.verified;

    try {
      setSaving(true);
      clearMessages();

      await adminPutJson(`/admin/users/${user.id}`, {
        verified: nextValue,
      });

      await loadUsers();

      showSuccess(
        nextValue
          ? "Usuario marcado como verificado."
          : "Verificación del usuario removida."
      );
    } catch (err) {
      console.error(err);
      showError(err.message || "No se pudo cambiar la verificación.");
    } finally {
      setSaving(false);
    }
  }

  function openResetPassword(user) {
    if (!canManageMainSuperadmin(user)) {
      showError("No puedes cambiar la contraseña del superadmin principal.");
      return;
    }

    setResetUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setResetPasswordError("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    clearMessages();
  }

  function closeResetPassword() {
    if (saving) return;

    setResetUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetPasswordError("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleConfirmResetPassword(e) {
    e.preventDefault();

    if (!resetUser) return;

    setResetPasswordError("");

    if (!newPassword.trim()) {
      setResetPasswordError("Escribe la nueva contraseña.");
      return;
    }

    if (newPassword.length < 8) {
      setResetPasswordError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!confirmPassword.trim()) {
      setResetPasswordError("Confirma la nueva contraseña.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetPasswordError(
        "Las contraseñas no coinciden. Revisa ambos campos."
      );
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      await adminPostJson(`/admin/users/${resetUser.id}/reset-password`, {
        new_password: newPassword,
      });

      setResetUser(null);
      setNewPassword("");
      setConfirmPassword("");
      setResetPasswordError("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      showSuccess("Contraseña actualizada correctamente.");
    } catch (err) {
      console.error(err);
      setResetPasswordError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteUser(user) {
    if (!canManageMainSuperadmin(user)) {
      showError("No puedes eliminar al superadmin principal.");
      return;
    }

    if (Number(user.id) === currentUserId) {
      showError("No puedes eliminar tu propia cuenta desde aquí.");
      return;
    }

    setDeleteUser(user);
  }

  async function confirmDeleteUser() {
    if (!deleteUser) return;

    try {
      setSaving(true);
      clearMessages();

      await adminDeleteJson(`/admin/users/${deleteUser.id}`);

      setDeleteUser(null);
      await loadUsers();
      showSuccess("Usuario eliminado correctamente.");
    } catch (err) {
      console.error(err);
      showError(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  const totalUsers = items.length;
  const totalSuperadmins = items.filter((u) => u.role === "superadmin").length;
  const totalAdmins = items.filter((u) => u.role === "admin").length;
  const totalActive = items.filter((u) => Number(u.is_active) === 1).length;

  return (
    <div className="admin-page admin-users-page">
      <header className="section-header">
        <span className="section-badge">Panel administrador</span>
        <AdminNav />

        <h1 className="section-title">Administradores</h1>

        <p className="section-subtitle">
          Gestiona las cuentas con acceso al panel administrativo de UNIDET.
        </p>
      </header>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setError("")}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <span>{success}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setSuccess("")}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      <section className="admin-users-summary">
        <article>
          <span>Total</span>
          <strong>{totalUsers}</strong>
        </article>

        <article>
          <span>Superadmins</span>
          <strong>{totalSuperadmins}</strong>
        </article>

        <article>
          <span>Admins</span>
          <strong>{totalAdmins}</strong>
        </article>

        <article>
          <span>Activos</span>
          <strong>{totalActive}</strong>
        </article>
      </section>

      <div className="admin-users-layout">
        <section className="admin-users-form-card">
          <h2>Crear administrador</h2>

          <p className="muted">
            Primero genera un código de verificación. Después confirma el código
            para crear el usuario.
          </p>

          <form
            className="admin-form"
            onSubmit={handleRequestVerificationCode}
            noValidate
          >
            {createFormError && (
              <div className="admin-password-error">{createFormError}</div>
            )}

            <div className="field">
              <label>Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setCreateFormError("");
                  clearVerificationFlow();
                }}
                disabled={saving}
              />
            </div>

            <div className="field">
              <label>Correo *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCreateFormError("");
                  clearVerificationFlow();
                }}
                disabled={saving}
              />
            </div>

            <div className="field">
              <label>Contraseña temporal *</label>

              <div className="admin-password-field">
                <input
                  type={showCreatePassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setCreateFormError("");
                    clearVerificationFlow();
                  }}
                  disabled={saving}
                  minLength={8}
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowCreatePassword((prev) => !prev)}
                  disabled={saving}
                >
                  {showCreatePassword ? "Ocultar" : "Ver"}
                </button>
              </div>

              <small className="muted">Debe tener mínimo 8 caracteres.</small>

              {password && password.length < 8 && (
                <p className="admin-inline-warning">
                  La contraseña temporal aún no cumple el mínimo de 8
                  caracteres.
                </p>
              )}
            </div>

            <div className="field">
              <label>Rol *</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setCreateFormError("");
                  clearVerificationFlow();
                }}
                disabled={saving}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>

            {role === "superadmin" && (
              <div className="admin-inline-warning-box">
                Estás creando un superadmin. Este usuario podrá crear otros
                administradores y gestionar cuentas del panel, excepto modificar
                al superadmin principal ID 1.
              </div>
            )}

            <div className="admin-form-actions">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Generando..." : "Enviar código"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Limpiar
              </button>
            </div>
          </form>

          {pendingVerification && (
            <div className="admin-verification-panel">
              <div className="admin-verification-header">
                <div>
                  <span className="section-badge">Verificación</span>
                  <h3>Confirmar código</h3>
                </div>
              </div>

              <p className="muted">
                Se generó un código para:
                <br />
                <strong>{pendingVerification.email}</strong>
              </p>

              {pendingVerification.expiresAt && (
                <p className="admin-inline-warning">
                  El código expira en aproximadamente 10 minutos.
                </p>
              )}

              {pendingVerification.devCode && (
                <div className="admin-dev-code">
                  <span>Código local de prueba</span>
                  <strong>{pendingVerification.devCode}</strong>
                </div>
              )}

              {verificationError && (
                <div className="admin-password-error">{verificationError}</div>
              )}

              <div className="field">
                <label>Código de 6 dígitos *</label>
                <input
                  className="admin-code-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, "");
                    setVerificationCode(onlyNumbers.slice(0, 6));
                    setVerificationError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmVerificationCode();
                    }
                  }}
                  disabled={saving}
                  placeholder="000000"
                />
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={handleConfirmVerificationCode}
                  disabled={saving}
                >
                  {saving ? "Confirmando..." : "Confirmar y crear usuario"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={clearVerificationFlow}
                  disabled={saving}
                >
                  Cancelar código
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="admin-users-list-card">
          <div className="admin-users-list-header">
            <div>
              <h2>Usuarios administrativos</h2>
              <p className="muted">
                Control de roles, estado, verificación y contraseña.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={loadUsers}
              disabled={loading || saving}
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <p>Cargando administradores...</p>
          ) : items.length === 0 ? (
            <p>No hay usuarios administrativos registrados.</p>
          ) : (
            <div className="admin-user-cards">
              {items.map((user) => {
                const active = Number(user.is_active) === 1;
                const verified = Boolean(user.verified);
                const mainProtected =
                  isMainSuperadmin(user) && currentUserId !== 1;
                const isSelf = Number(user.id) === currentUserId;

                return (
                  <article key={user.id} className="admin-user-card">
                    <div className="admin-user-main">
                      <div className="admin-user-avatar">
                        {String(user.name || user.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>

                        <div className="admin-user-badges">
                          <span className="pill pill-light">ID {user.id}</span>

                          {isMainSuperadmin(user) && (
                            <span className="admin-status-badge admin-status-visible">
                              Superadmin principal
                            </span>
                          )}

                          {mainProtected && (
                            <span className="admin-status-badge admin-status-hidden">
                              Protegido
                            </span>
                          )}

                          {isSelf && (
                            <span className="admin-status-badge admin-status-visible">
                              Tu cuenta
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="admin-user-info-grid">
                      <div>
                        <span>Rol</span>

                        {isMainSuperadmin(user) ? (
                          <strong>{user.role}</strong>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user, e.target.value)
                            }
                            disabled={
                              saving ||
                              mainProtected ||
                              (isSelf && user.role === "superadmin")
                            }
                          >
                            <option value="admin">admin</option>
                            <option value="superadmin">superadmin</option>
                          </select>
                        )}
                      </div>

                      <div>
                        <span>Estado</span>
                        <strong className={active ? "text-ok" : "text-muted"}>
                          {active ? "Activo" : "Inactivo"}
                        </strong>
                      </div>

                      <div>
                        <span>Verificado</span>
                        <strong className={verified ? "text-ok" : "text-muted"}>
                          {verified ? "Sí" : "No"}
                        </strong>
                      </div>
                    </div>

                    <div className="admin-user-actions">
                      {mainProtected ? (
                        <span className="admin-status-badge admin-status-hidden">
                          Sin acciones disponibles
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleToggleActive(user)}
                            disabled={
                              saving ||
                              isMainSuperadmin(user) ||
                              (isSelf && active)
                            }
                          >
                            {active ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleToggleVerified(user)}
                            disabled={saving}
                          >
                            {verified ? "Quitar verificación" : "Verificar"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => openResetPassword(user)}
                            disabled={saving}
                          >
                            Cambiar contraseña
                          </button>

                          {!isMainSuperadmin(user) && !isSelf && (
                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              onClick={() => requestDeleteUser(user)}
                              disabled={saving}
                            >
                              Eliminar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {resetUser && (
        <div className="admin-password-modal-overlay">
          <div className="admin-password-modal">
            <div className="admin-password-modal-header">
              <div>
                <span className="section-badge">Seguridad</span>
                <h2>Cambiar contraseña</h2>
              </div>

              <button
                type="button"
                className="admin-alert-close"
                onClick={closeResetPassword}
                disabled={saving}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <p className="muted">Asigna una nueva contraseña temporal para:</p>

            <div className="admin-password-target">
              <strong>{resetUser.name}</strong>
              <span>{resetUser.email}</span>
            </div>

            <form
              onSubmit={handleConfirmResetPassword}
              className="admin-form"
              noValidate
            >
              {resetPasswordError && (
                <div className="admin-password-error">
                  {resetPasswordError}
                </div>
              )}

              <div className="field">
                <label>Nueva contraseña *</label>

                <div className="admin-password-field">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setResetPasswordError("");
                    }}
                    disabled={saving}
                    minLength={8}
                    autoFocus
                  />

                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    disabled={saving}
                  >
                    {showNewPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>

                {newPassword && newPassword.length < 8 && (
                  <p className="admin-inline-warning">
                    La contraseña aún no cumple el mínimo de 8 caracteres.
                  </p>
                )}
              </div>

              <div className="field">
                <label>Confirmar contraseña *</label>

                <div className="admin-password-field">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setResetPasswordError("");
                    }}
                    disabled={saving}
                    minLength={8}
                  />

                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={saving}
                  >
                    {showConfirmPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>

                {newPassword &&
                  confirmPassword &&
                  newPassword !== confirmPassword && (
                    <p className="admin-inline-warning">
                      Las contraseñas todavía no coinciden.
                    </p>
                  )}
              </div>

              <p className="admin-password-hint">
                La contraseña debe tener mínimo 8 caracteres. Compártela con el
                usuario por un medio seguro.
              </p>

              <div className="admin-password-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeResetPassword}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn" disabled={saving}>
                  {saving ? "Actualizando..." : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteUser)}
        title="Eliminar usuario"
        message={
          deleteUser
            ? `¿Seguro que deseas eliminar al usuario "${deleteUser.email}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar usuario"
        cancelText="Cancelar"
        loading={saving}
        onCancel={() => {
          if (!saving) setDeleteUser(null);
        }}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}