import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AppShell = () => {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar path={location.pathname} />
        <main className="app-content" role="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
