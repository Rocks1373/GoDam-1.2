import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import Orders from "./pages/Orders";
import Movements from "./pages/Movements";
import Masters from "./pages/Masters";
import Reports from "./pages/Reports";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/masters" element={<Masters />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
