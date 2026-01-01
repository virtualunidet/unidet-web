// src/components/ProtectedAdmin.jsx
import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";

export default function ProtectedAdmin({ children }) {
  const token = getToken();

  // Si no hay token -> mandar a login admin
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si hay token -> mostrar el contenido administrador
  return children;
}
