import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type CourierDto = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  vatNo?: string | null;
  crNo?: string | null;
  active: boolean;
};

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  vatNo: "",
  crNo: "",
  active: true,
};

const Couriers = () => {
  const [rows, setRows] = useState<CourierDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CourierDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourierDto | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadCouriers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<CourierDto[]>("/couriers");
      setRows(response.data ?? []);
    } catch {
      setError("Unable to load couriers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => row.name?.toLowerCase().includes(term));
  }, [rows, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (row: CourierDto) => {
    setEditing(row);
    setForm({
      name: row.name ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      vatNo: row.vatNo ?? "",
      crNo: row.crNo ?? "",
      active: row.active ?? true,
    });
    setShowModal(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      setError("Courier name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const response = await api.put<CourierDto>(`/couriers/${editing.id}`, {
          name: form.name,
          phone: form.phone || null,
          email: form.email || null,
          vatNo: form.vatNo || null,
          crNo: form.crNo || null,
          active: form.active,
        });
        setRows((prev) =>
          prev.map((row) => (row.id === editing.id ? response.data : row))
        );
        setActionMessage("Courier updated.");
      } else {
        const response = await api.post<CourierDto>("/couriers", {
          name: form.name,
          phone: form.phone || null,
          email: form.email || null,
          vatNo: form.vatNo || null,
          crNo: form.crNo || null,
          active: form.active,
        });
        setRows((prev) => [response.data, ...prev]);
        setActionMessage("Courier added.");
      }
      setShowModal(false);
    } catch {
      setError("Save failed. Check backend logs.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row: CourierDto) => {
    setDeleteTarget(row);
    setShowDelete(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/couriers/${deleteTarget.id}`);
      setRows((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      setShowDelete(false);
      setActionMessage("Courier deleted.");
    } catch {
      setError("Delete failed. Check backend logs.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h1>Courier Management</h1>
          <p>Manage courier partners and tracking workflows.</p>
        </div>
        <div className="stock-actions">
          <button className="btn primary" onClick={openAdd}>
            + Add Courier
          </button>
        </div>
      </div>

      {actionMessage ? <div className="banner">{actionMessage}</div> : null}
      {error ? <div className="banner">{error}</div> : null}

      <div className="stock-toolbar">
        <div className="toolbar-left">
          <input
            className="search-input"
            placeholder="Search courier name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="toolbar-note">
          {loading ? "Loading..." : `Showing ${filtered.length} couriers`}
        </div>
      </div>

      <div className="order-items-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Courier Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>VAT / CR</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty">
                  No couriers found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.phone || "-"}</td>
                  <td>{row.email || "-"}</td>
                  <td>{[row.vatNo, row.crNo].filter(Boolean).join(" / ") || "-"}</td>
                  <td>
                    <button className="btn tiny" onClick={() => openEdit(row)}>
                      Edit
                    </button>
                    <button className="btn tiny warn" onClick={() => confirmDelete(row)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? "Edit Courier" : "Add Courier"}</h3>
              <button className="btn tiny" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Courier Name
                  <input
                    className="search-input"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Phone
                  <input
                    className="search-input"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    className="search-input"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>
                <label>
                  VAT Number
                  <input
                    className="search-input"
                    value={form.vatNo}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, vatNo: event.target.value }))
                    }
                  />
                </label>
                <label>
                  CR Number
                  <input
                    className="search-input"
                    value={form.crNo}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, crNo: event.target.value }))
                    }
                  />
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, active: event.target.checked }))
                    }
                  />
                  Is Active
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowModal(false)}>
                Close
              </button>
              <button className="btn primary" onClick={submitForm} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Courier</h3>
              <button className="btn tiny" onClick={() => setShowDelete(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>Confirm deleting {deleteTarget?.name}?</p>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowDelete(false)}>
                Cancel
              </button>
              <button className="btn warn" onClick={performDelete} disabled={saving}>
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Couriers;
