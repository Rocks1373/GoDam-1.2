import { useState } from "react";
import type { CSSProperties } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AISupport from "./AISupport";
import SpotlightChat from "./SpotlightChat";

const AppShell = () => {
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showAISupport, setShowAISupport] = useState(false);

  const SIDEBAR_COLLAPSED_WIDTH = 72;
  const SIDEBAR_EXPANDED_WIDTH = 260;

  const sidebarWidth = sidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;
  const shellStyle = {
    "--sidebar-width": `${sidebarWidth}px`,
    "--sidebar-expanded-width": `${SIDEBAR_EXPANDED_WIDTH}px`,
    "--sidebar-collapsed-width": `${SIDEBAR_COLLAPSED_WIDTH}px`,
  } as CSSProperties;
  const appMainStyle = {
    marginLeft: `${sidebarWidth}px`,
    transition: "margin-left 0.3s ease",
  } as CSSProperties;

  const toggleSidebarVisibility = () => {
    setSidebarExpanded((prev) => !prev);
  };

  const handleManualCollapse = () => {
    setSidebarExpanded((prev) => !prev);
  };

  return (
    <div
      className={`app-shell ${sidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}
      style={shellStyle}
    >
      <Sidebar expanded={sidebarExpanded} onCollapseToggle={handleManualCollapse} />
      <div className="app-main" style={appMainStyle}>
        <Topbar
          path={location.pathname}
          sidebarVisible={sidebarExpanded}
          toggleSidebarVisibility={toggleSidebarVisibility}
        />
        <main className="app-content" role="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* AI Support Chat Button */}
      <button
        className="ai-chat-button"
        onClick={() => setShowAISupport(true)}
        title="GoDAM AI Assistant"
      >
        <span className="ai-button-icon">AI</span>
        <span className="ai-button-text">Assistant</span>
      </button>

      {/* AI Support Chat Widget */}
      <AISupport isOpen={showAISupport} onClose={() => setShowAISupport(false)} />

      <SpotlightChat />
    </div>
  );
};

export default AppShell;
