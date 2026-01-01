export default function Footer(){
  return (
    <footer className="footer">
      <div className="container footer-row">
        <small>© {new Date().getFullYear()} UNIDET León A.C. — Todos los derechos reservados.</small>
        <a className="footer-link" href="#/contacto">Contacto</a>
      </div>
    </footer>
  );
}
