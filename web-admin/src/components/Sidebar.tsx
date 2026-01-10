import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: "DS" },
  { label: "Stock", to: "/stock", icon: "ST" },
  { label: "Item Management", to: "/item-management", icon: "IM" },
  { label: "Orders", to: "/orders", icon: "OR" },
  { label: "Delivery Notes", to: "/delivery-notes", icon: "DN" },
  { label: "Create DN", to: "/delivery-notes/create", icon: "CD" },
  { label: "Drivers", to: "/drivers", icon: "DR" },
  { label: "Customers", to: "/customers", icon: "CU" },
  { label: "Transporters", to: "/transporters", icon: "TP" },
  { label: "Couriers", to: "/couriers", icon: "CO" },
  { label: "Movements", to: "/movements", icon: "MV" },
  { label: "Masters", to: "/masters", icon: "MA" },
  { label: "Reports", to: "/reports", icon: "RP" },
];

const Sidebar = ({
  expanded,
  onCollapseToggle,
}: {
  expanded: boolean;
  onCollapseToggle?: () => void;
}) => {
  return (
    <aside
      className={`sidebar ${expanded ? "sidebar-expanded" : "sidebar-collapsed"}`}
      data-sidebar-state={expanded ? "expanded" : "collapsed"}
      aria-label="Primary"
      aria-expanded={expanded}
    >
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          Go
        </div>
        <div className="brand-text">
          <div className="brand-title">GoDam 1.2</div>
          <div className="brand-subtitle">Warehouse Admin</div>
        </div>
        {onCollapseToggle && (
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={onCollapseToggle}
            aria-pressed={!expanded}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? "◢" : "◤"}
          </button>
        )}
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
            title={item.label}
            aria-label={item.label}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="nav-label" aria-hidden={!expanded}>
              {item.label}
            </span>
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
