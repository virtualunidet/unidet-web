// src/components/AdminAccessButton.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { getToken } from "../services/api";

export default function AdminAccessButton({
  label = "Acceso administrador",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasToken = !!getToken();

  const handleClick = () => {
    if (hasToken) {
      // Ya está logueado -> directo al panel
      navigate("/admin/noticias");
    } else {
      // No está logueado -> pantalla de login
      navigate("/admin/login", {
        state: { from: location.pathname },
      });
    }
  };

  return (
    <button
      type="button"
      className="admin-fab"
      onClick={handleClick}
    >
      {label}
    </button>
  );
}
