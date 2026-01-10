import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import AdminBadge from "./AdminBadge";
import ApiStatusBadge from "./ApiStatusBadge";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/stock": "Stock Management",
  "/item-management": "Item Management",
  "/orders": "Order Management",
  "/delivery-notes": "Delivery Notes",
  "/delivery-notes/create": "Create Delivery Note",
  "/drivers": "Driver Management",
  "/customers": "Customer Management",
  "/transporters": "Transport Management",
  "/couriers": "Courier Management",
  "/movements": "Movement Tracking",
  "/masters": "Masters",
  "/reports": "Reports",
};

const Topbar = ({
  path,
  sidebarVisible,
  toggleSidebarVisibility,
}: {
  path: string;
  sidebarVisible: boolean;
  toggleSidebarVisibility: () => void;
}) => {
  const title = pageTitles[path] ?? "GoDam";
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "night";
    return localStorage.getItem("godam-theme") || "night";
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleThemeChange = (value: string) => {
    setTheme(value);
    localStorage.setItem("godam-theme", value);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">{title}</div>
        <div className="page-meta">Admin workspace</div>
      </div>
      <div className="topbar-right">
        <label className="theme-switcher" aria-label="Theme selector">
          <span className="theme-label">Theme</span>
          <select
            value={theme}
            onChange={(event) => handleThemeChange(event.target.value)}
            className="theme-select"
          >
            <option value="night">Night</option>
            <option value="dusk">Dusk</option>
            <option value="day">Day</option>
          </select>
        </label>
        <ApiStatusBadge />
        <AdminBadge user={user} />
        <button
          className={`sidebar-toggle ${sidebarVisible ? "active" : ""}`}
          onClick={toggleSidebarVisibility}
          aria-pressed={sidebarVisible}
          title={sidebarVisible ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarVisible ? "Collapse" : "Expand"}
        </button>
        <button
          className="logout-button"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
