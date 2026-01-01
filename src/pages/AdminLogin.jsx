// src/pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../services/api";

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  // A dónde lo mandamos después de loguearse
  const from = location.state?.from?.pathname || "/admin/noticias";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      // Hace POST /admin/login, guarda token admin en localStorage
      await login(email, password);

      // Redirige a la ruta protegida que quería entrar, o noticias
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="admin-login-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f6fa",
      }}
    >
      <div
        className="admin-login-card"
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "2rem",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        }}
      >
        <h1 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          Panel administrativo UNIDET
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{ display: "block", marginBottom: "0.25rem" }}
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="password"
              style={{ display: "block", marginBottom: "0.25rem" }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "red", marginBottom: "0.75rem" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#003366",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
