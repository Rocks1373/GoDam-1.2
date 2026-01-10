import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import Orders from "./pages/Orders";
import DeliveryNotes from "./pages/DeliveryNotes";
import PrintDN from "./pages/PrintDN";
import Drivers from "./pages/Drivers";
import Customers from "./pages/Customers";
import Transporters from "./pages/Transporters";
import Couriers from "./pages/Couriers";
import ItemManagement from "./pages/ItemManagement";
import Movements from "./pages/Movements";
import Masters from "./pages/Masters";
import Reports from "./pages/Reports";
import "./App.css";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/print-dn" element={<PrintDN />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/item-management" element={<ItemManagement />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/delivery-notes" element={<DeliveryNotes />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/transporters" element={<Transporters />} />
              <Route path="/couriers" element={<Couriers />} />
              <Route path="/movements" element={<Movements />} />
              <Route path="/masters" element={<Masters />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
