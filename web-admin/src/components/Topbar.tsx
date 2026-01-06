import AdminBadge from "./AdminBadge";
import ApiStatusBadge from "./ApiStatusBadge";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/stock": "Stock Management",
  "/orders": "Order Management",
  "/movements": "Movement Tracking",
  "/masters": "Masters",
  "/reports": "Reports",
};

const Topbar = ({ path }: { path: string }) => {
  const title = pageTitles[path] ?? "GoDam";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">{title}</div>
        <div className="page-meta">Admin workspace</div>
      </div>
      <div className="topbar-right">
        <ApiStatusBadge />
        <AdminBadge />
      </div>
    </header>
  );
};

export default Topbar;
