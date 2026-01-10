import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render child routes
  return <Outlet />;
};

export default ProtectedRoute;
