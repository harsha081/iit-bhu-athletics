import { Link, NavLink } from "react-router-dom";
import { Trophy } from "lucide-react";

const links = [
  { name: "Home", path: "/" },
  { name: "Athletes", path: "/athletes" },
  { name: "Events", path: "/events" },
  { name: "Alumni", path: "/alumni" },
  { name: "Alumni Captains", path: "/alumni-leadership" },
  { name: "Coaches", path: "/coaches" },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <Trophy size={28} />

        <span>
          IIT BHU
          <small>ATHLETICS</small>
        </span>
      </Link>

      <nav>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      <Link to="/admin/login" className="admin-link">
        Admin Login
      </Link>
    </header>
  );
}
