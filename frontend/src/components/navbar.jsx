import { Link, NavLink } from "react-router-dom";
import { Trophy } from "lucide-react";

const links = [
  { name: "Home", path: "/" },
  { name: "Athletes", path: "/athletes" },
  { name: "Events", path: "/events" },
  { name: "Sports Meets", path: "/sports-meets" },
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

      <div className="navbar-actions">
        <a
          className="instagram-link"
          href="https://www.instagram.com/athletics_iitbhu/?hl=en"
          target="_blank"
          rel="noreferrer"
          aria-label="Follow IIT BHU Athletics on Instagram"
          title="Follow IIT BHU Athletics on Instagram"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" className="instagram-dot" />
          </svg>
        </a>

        <Link to="/admin/login" className="admin-link">
          Admin Login
        </Link>
      </div>
    </header>
  );
}
