import { Link } from "react-router-dom";
import logo from "../assets/logo.jpg";

export default function Header() {
  return (
    <header className="header">
      <div className="container header-row">
        <Link to="/" className="logo">
          <img src={logo} alt="UNIDET" />
        </Link>
        <div className="titulo">PORTAL UNIDET</div>
      </div>
    </header>
  );
}
