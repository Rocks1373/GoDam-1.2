import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/authContext";

type MovementDto = {
  id: number;
  createdAt: string | null;
  partNumber: string | null;
  description: string | null;
  movementType: string | null;
  movementTypeDescription: string | null;
  qty: number | null;
  reference: string | null;
  user: string | null;
};

type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
  order: number;
};

const sensitiveTypes = new Set(["I201", "I202", "O105", "O108", "O109"]);

const defaultColumns: ColumnConfig[] = [
  { id: "id", label: "Movement ID", visible: true, order: 1 },
  { id: "date", label: "Date", visible: true, order: 2 },
  { id: "partNumber", label: "Part Number", visible: true, order: 3 },
  { id: "description", label: "Description", visible: true, order: 4 },
  { id: "movementType", label: "Movement Type", visible: true, order: 5 },
  { id: "movementTypeDescription", label: "Movement Type Description", visible: true, order: 6 },
  { id: "qty", label: "Qty", visible: true, order: 7 },
  { id: "reference", label: "Reference", visible: true, order: 8 },
  { id: "user", label: "User", visible: true, order: 9 },
];

const movementTypeDescriptions: Record<string, string> = {
  O101: "Order Uploaded",
  O102: "Pick Requested",
  O103: "Picked",
  O104: "Checked",
  O105: "Confirmed",
  O106: "Loaded",
  O107: "On The Way",
  O108: "Delivered",
  O109: "Closed",
  A101: "Stock Adjustment - Increase",
  A102: "Stock Adjustment - Decrease",
  I201: "Inbound Received",
  I202: "Putaway",
};

const Movements = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role ?? "").toUpperCase() === "ADMIN";
  const layoutKey = `movementLayout:${user?.username ?? "guest"}`;

  const [movements, setMovements] = useState<MovementDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partFilter, setPartFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MovementDto | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmSensitive, setConfirmSensitive] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(layoutKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ColumnConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setColumns(parsed);
        }
      } catch {
        // ignore corrupted layouts
      }
    }
  }, [layoutKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchMovements();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [partFilter, descriptionFilter, typeFilter]);

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<MovementDto[]>("/movements", {
        params: {
          partNumber: partFilter || undefined,
          description: descriptionFilter || undefined,
          movementType: typeFilter || undefined,
        },
      });
      setMovements(response.data ?? []);
    } catch {
      setError("Unable to load movements.");
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = () => {
    localStorage.setItem(layoutKey, JSON.stringify(columns));
    setShowSettings(false);
  };

  const orderedColumns = useMemo(() => {
    return columns
      .filter((col) => col.visible)
      .slice()
      .sort((a, b) => a.order - b.order);
  }, [columns]);

  const partOptions = useMemo(() => {
    const values = new Set<string>();
    movements.forEach((movement) => {
      if (movement.partNumber) {
        values.add(movement.partNumber);
      }
    });
    return Array.from(values).sort();
  }, [movements]);

  const descriptionOptions = useMemo(() => {
    const values = new Set<string>();
    movements.forEach((movement) => {
      if (movement.description) {
        values.add(movement.description);
      }
    });
    return Array.from(values).sort();
  }, [movements]);

  const typeOptions = useMemo(() => {
    const values = new Set<string>();
    movements.forEach((movement) => {
      if (movement.movementType) {
        values.add(movement.movementType);
      }
    });
    Object.keys(movementTypeDescriptions).forEach((code) => values.add(code));
    return Array.from(values).sort();
  }, [movements]);

  const formatDate = (value: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const resolveTypeDescription = (movement: MovementDto) => {
    if (movement.movementTypeDescription) return movement.movementTypeDescription;
    if (!movement.movementType) return "-";
    return movementTypeDescriptions[movement.movementType] ?? movement.movementType;
  };

  const startDelete = (movement: MovementDto) => {
    setDeleteTarget(movement);
    setDeleteReason("");
    setAdminPassword("");
    setConfirmSensitive(false);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    if (!deleteReason.trim()) {
      setDeleteError("Reason is required.");
      return;
    }
    if (!adminPassword.trim()) {
      setDeleteError("Admin password is required.");
      return;
    }
    const code = deleteTarget.movementType ?? "";
    if (sensitiveTypes.has(code) && !confirmSensitive) {
      setDeleteError("Confirm deletion for DN/GR movement types.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete(`/movements/${deleteTarget.id}`, {
        data: {
          performedBy: user?.username ?? "",
          password: adminPassword,
          reason: deleteReason.trim(),
          confirmSensitive,
        },
      });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchMovements();
    } catch {
      setDeleteError("Delete failed. Check backend logs.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <section className="panel movements-panel">
      <div className="panel-header">
        <div>
          <h1>Movement Management</h1>
          <p>Audit and manage stock movements across the warehouse.</p>
        </div>
        <div className="stock-actions">
          <button className="btn ghost" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button className="btn ghost" onClick={fetchMovements} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? <div className="banner">{error}</div> : null}

      <div className="movements-toolbar">
        <label>
          Part Number
          <input
            className="search-input"
            value={partFilter}
            onChange={(event) => setPartFilter(event.target.value)}
            list="movement-part-options"
            placeholder="Search part number"
          />
          <datalist id="movement-part-options">
            {partOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
        <label>
          Description
          <input
            className="search-input"
            value={descriptionFilter}
            onChange={(event) => setDescriptionFilter(event.target.value)}
            list="movement-description-options"
            placeholder="Search description"
          />
          <datalist id="movement-description-options">
            {descriptionOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
        <label>
          Movement Type
          <input
            className="search-input"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            list="movement-type-options"
            placeholder="Search movement type"
          />
          <datalist id="movement-type-options">
            {typeOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="movements-table">
        <table className="data-table">
          <thead>
            <tr>
              {orderedColumns.map((col) => (
                <th key={col.id}>{col.label}</th>
              ))}
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={orderedColumns.length + (isAdmin ? 1 : 0)}>
                  {loading ? "Loading movements..." : "No movements found."}
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
                  {orderedColumns.map((col) => {
                    if (col.id === "id") return <td key={col.id}>{movement.id}</td>;
                    if (col.id === "date") return <td key={col.id}>{formatDate(movement.createdAt)}</td>;
                    if (col.id === "partNumber") return <td key={col.id}>{movement.partNumber ?? "-"}</td>;
                    if (col.id === "description") return <td key={col.id}>{movement.description ?? "-"}</td>;
                    if (col.id === "movementType") return <td key={col.id}>{movement.movementType ?? "-"}</td>;
                    if (col.id === "movementTypeDescription") {
                      return <td key={col.id}>{resolveTypeDescription(movement)}</td>;
                    }
                    if (col.id === "qty") return <td key={col.id}>{movement.qty ?? "-"}</td>;
                    if (col.id === "reference") return <td key={col.id}>{movement.reference ?? "-"}</td>;
                    if (col.id === "user") return <td key={col.id}>{movement.user ?? "-"}</td>;
                    return <td key={col.id}>-</td>;
                  })}
                  {isAdmin && (
                    <td>
                      <button className="btn warn tiny" onClick={() => startDelete(movement)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showSettings && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Column Settings</h3>
              <button className="btn tiny" onClick={() => setShowSettings(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p className="muted">Choose which columns to show and set their order.</p>
              <div className="column-settings">
                {columns
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((col) => (
                    <div key={col.id} className="column-setting-row">
                      <label className="column-toggle">
                        <input
                          type="checkbox"
                          checked={col.visible}
                          onChange={(event) => {
                            setColumns((prev) =>
                              prev.map((item) =>
                                item.id === col.id ? { ...item, visible: event.target.checked } : item
                              )
                            );
                          }}
                        />
                        {col.label}
                      </label>
                      <input
                        className="order-input"
                        type="number"
                        min={1}
                        value={col.order}
                        onChange={(event) => {
                          const value = Number(event.target.value || 1);
                          setColumns((prev) =>
                            prev.map((item) =>
                              item.id === col.id ? { ...item, order: value } : item
                            )
                          );
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={saveLayout}>
                Save layout
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Movement</h3>
              <button className="btn tiny" onClick={() => setShowDeleteModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p className="muted">
                Movement {deleteTarget.id} · {deleteTarget.partNumber ?? "-"} ·{" "}
                {deleteTarget.movementType ?? "-"}
              </p>
              <label>
                Reason
                <input
                  className="search-input"
                  value={deleteReason}
                  onChange={(event) => setDeleteReason(event.target.value)}
                />
              </label>
              <label>
                Admin password
                <input
                  className="search-input"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                />
              </label>
              {sensitiveTypes.has(deleteTarget.movementType ?? "") && (
                <label className="confirm-sensitive">
                  <input
                    type="checkbox"
                    checked={confirmSensitive}
                    onChange={(event) => setConfirmSensitive(event.target.checked)}
                  />
                  Confirm deletion for DN/GR movement types.
                </label>
              )}
              {deleteError ? <div className="banner">{deleteError}</div> : null}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn warn" onClick={submitDelete} disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Movements;
