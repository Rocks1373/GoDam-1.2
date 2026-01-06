import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Stock", to: "/stock" },
  { label: "Orders", to: "/orders" },
  { label: "Movements", to: "/movements" },
  { label: "Masters", to: "/masters" },
  { label: "Reports", to: "/reports" },
];

const Sidebar = () => {
  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="sidebar-brand">
        <div className="brand-mark">Go</div>
        <div className="brand-text">
          <div className="brand-title">GoDam 1.2</div>
          <div className="brand-subtitle">Warehouse Admin</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="hint">Keyboard-first mode</div>
        <div className="hint">Admin placeholder</div>
      </div>
    </aside>
  );
};

export default Sidebar;
