import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

type OrderSummary = {
  orderId: number;
  invoiceNumber: string | null;
  outboundNumber: string;
  gappPo: string | null;
  customerPo: string | null;
  customerName: string | null;
  dnCreated: boolean;
  itemCount: number;
  totalQty: number;
};

type DashboardState = {
  totalOrders: number | null;
  dnPending: number | null;
  dnCreated: number | null;
  recentOrders: OrderSummary[];
  error: string | null;
};

const initialState: DashboardState = {
  totalOrders: null,
  dnPending: null,
  dnCreated: null,
  recentOrders: [],
  error: null,
};

const Dashboard = () => {
  const [state, setState] = useState<DashboardState>(initialState);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get<OrderSummary[]>("/orders");
        const orders = response.data ?? [];
        const dnPending = orders.filter((order) => !order.dnCreated).length;
        const dnCreated = orders.filter((order) => order.dnCreated).length;

        if (active) {
          setState({
            totalOrders: orders.length,
            dnPending,
            dnCreated,
            recentOrders: orders.slice(0, 6),
            error: null,
          });
        }
      } catch (error) {
        if (active) {
          setState({ ...initialState, error: "Dashboard data unavailable." });
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="dashboard">
      <section className="panel dashboard-panel">
        <div className="panel-header">
          <div>
            <h1>Dashboard</h1>
            <p>Warehouse snapshot with quick actions.</p>
          </div>
          {state.error ? <div className="banner">{state.error}</div> : null}
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Stock Items</div>
            <div className="kpi-value">—</div>
            <div className="kpi-meta">Awaiting stock list API</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Orders</div>
            <div className="kpi-value">
              {state.totalOrders ?? "—"}
            </div>
            <div className="kpi-meta">From /orders</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">DN Pending</div>
            <div className="kpi-value">
              {state.dnPending ?? "—"}
            </div>
            <div className="kpi-meta">dnCreated = false</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">DN Created</div>
            <div className="kpi-value">
              {state.dnCreated ?? "—"}
            </div>
            <div className="kpi-meta">dnCreated = true</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Low Stock Alerts</div>
            <div className="kpi-value">—</div>
            <div className="kpi-meta">Rule pending</div>
          </div>
        </div>
      </section>

      <section className="panel dashboard-panel">
        <h2>Quick Navigation</h2>
        <div className="tile-grid">
          <Link className="tile" to="/stock">
            <div className="tile-title">Stock</div>
            <div className="tile-meta">Inventory view</div>
          </Link>
          <Link className="tile" to="/orders">
            <div className="tile-title">Orders</div>
            <div className="tile-meta">Upload + validate</div>
          </Link>
          <Link className="tile" to="/movements">
            <div className="tile-title">Movements</div>
            <div className="tile-meta">Order timeline</div>
          </Link>
          <Link className="tile" to="/masters">
            <div className="tile-title">Masters</div>
            <div className="tile-meta">Drivers + transporters</div>
          </Link>
          <Link className="tile" to="/reports">
            <div className="tile-title">Reports</div>
            <div className="tile-meta">Queries + exports</div>
          </Link>
        </div>
      </section>

      <section className="panel dashboard-panel">
        <h2>Recent Orders</h2>
        {state.recentOrders.length === 0 ? (
          <div className="empty">No orders available.</div>
        ) : (
          <div className="recent-list">
            {state.recentOrders.map((order) => (
              <div className="recent-item" key={order.orderId}>
                <div>
                  <div className="recent-title">{order.outboundNumber}</div>
                  <div className="recent-meta">
                    {order.customerName ?? "Unknown customer"}
                  </div>
                </div>
                <div className="recent-right">
                  <div className="recent-qty">{order.itemCount} items</div>
                  <div
                    className={
                      order.dnCreated ? "pill pill-ok" : "pill pill-warn"
                    }
                  >
                    {order.dnCreated ? "DN Created" : "DN Pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
