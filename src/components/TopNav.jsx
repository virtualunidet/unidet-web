import { NavLink } from "react-router-dom";

const links = [
  { to: "/admisiones", label: "Admisiones" },
  { to: "/oferta", label: "Oferta" },
  { to: "/servicios", label: "Servicios" },
  { to: "/noticias", label: "Noticias" },
  { to: "/calendario", label: "Calendario" },
  { to: "/reglamento", label: "Reglamento" },
  { to: "/contacto", label: "Contacto" },
  { to: "/faq", label: "FAQ" },
];

export default function TopNav() {
  return (
    <nav className="topnav">
      <div className="container nav-row">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `toplink ${isActive ? "active" : ""}`}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
