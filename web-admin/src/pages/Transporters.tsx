import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/authContext";

type TransporterDto = {
  id: number;
  companyName: string;
  contactName: string;
  phone?: string | null;
  email?: string | null;
  vatNumber?: string | null;
  crNumber?: string | null;
  active: boolean;
};

const emptyForm = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  vatNumber: "",
  crNumber: "",
  active: true,
};

const Transporters = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role ?? "").toUpperCase() === "ADMIN";
  const [rows, setRows] = useState<TransporterDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TransporterDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TransporterDto | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadTransporters = async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TransporterDto[]>("/masters/transporters", {
        params: query ? { q: query } : undefined,
      });
      setRows(response.data ?? []);
    } catch {
      setError("Unable to load transporters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransporters();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      return (
        row.companyName?.toLowerCase().includes(term) ||
        row.contactName?.toLowerCase().includes(term) ||
        row.phone?.toLowerCase().includes(term) ||
        row.email?.toLowerCase().includes(term)
      );
    });
  }, [rows, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (row: TransporterDto) => {
    setEditing(row);
    setForm({
      companyName: row.companyName ?? "",
      contactName: row.contactName ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      vatNumber: row.vatNumber ?? "",
      crNumber: row.crNumber ?? "",
      active: row.active ?? true,
    });
    setShowModal(true);
  };

  const submitForm = async () => {
    if (!form.companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const response = await api.put<TransporterDto>(
          `/masters/transporters/${editing.id}`,
          {
            companyName: form.companyName,
            contactName: form.contactName,
            phone: form.phone || null,
            email: form.email || null,
            vatNumber: form.vatNumber || null,
            crNumber: form.crNumber || null,
            active: form.active,
          }
        );
        setRows((prev) =>
          prev.map((row) => (row.id === editing.id ? response.data : row))
        );
        setActionMessage("Transporter updated.");
      } else {
        const response = await api.post<TransporterDto>("/masters/transporters", {
          companyName: form.companyName,
          contactName: form.contactName,
          phone: form.phone || null,
          email: form.email || null,
          vatNumber: form.vatNumber || null,
          crNumber: form.crNumber || null,
          active: form.active,
        });
        setRows((prev) => [response.data, ...prev]);
        setActionMessage("Transporter added.");
      }
      setShowModal(false);
    } catch {
      setError("Save failed. Check backend logs.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row: TransporterDto) => {
    setDeleteTarget(row);
    setDeleteReason("");
    setDeletePassword("");
    setShowDelete(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    if (!deletePassword.trim() || !deleteReason.trim()) {
      setError("Admin password and reason are required.");
      return;
    }
    setSaving(true);
    try {
      await api.delete(`/masters/transporters/${deleteTarget.id}`, {
        data: {
          adminPassword: deletePassword,
          reason: deleteReason,
          performedBy: user?.username ?? "",
        },
      });
      setRows((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      setShowDelete(false);
      setActionMessage("Transporter deleted.");
    } catch {
      setError("Delete failed. Check password and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h1>Transport Management</h1>
          <p>Manage transporter companies and contacts.</p>
        </div>
        <div className="stock-actions">
          {isAdmin && (
            <button className="btn primary" onClick={openAdd}>
              + Add Transporter
            </button>
          )}
        </div>
      </div>

      {actionMessage ? <div className="banner">{actionMessage}</div> : null}
      {error ? <div className="banner">{error}</div> : null}

      <div className="stock-toolbar">
        <div className="toolbar-left">
          <input
            className="search-input"
            placeholder="Search transporter, contact, phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="toolbar-note">
          {loading ? "Loading..." : `Showing ${filtered.length} transporters`}
        </div>
      </div>

      <div className="order-items-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transporter Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>VAT / CR No</th>
              <th>Is Active</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="empty">
                  No transporters found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.companyName}</td>
                  <td>{row.contactName}</td>
                  <td>{row.phone || "-"}</td>
                  <td>{row.email || "-"}</td>
                  <td>
                    {[row.vatNumber, row.crNumber].filter(Boolean).join(" / ") || "-"}
                  </td>
                  <td>{row.active ? "Yes" : "No"}</td>
                  {isAdmin && (
                    <td>
                      <button className="btn tiny" onClick={() => openEdit(row)}>
                        Edit
                      </button>
                      <button className="btn tiny warn" onClick={() => confirmDelete(row)}>
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

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? "Edit Transporter" : "Add Transporter"}</h3>
              <button className="btn tiny" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Company Name
                  <input
                    className="search-input"
                    value={form.companyName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, companyName: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Contact Person
                  <input
                    className="search-input"
                    value={form.contactName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, contactName: event.target.value }))
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
                    value={form.vatNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, vatNumber: event.target.value }))
                    }
                  />
                </label>
                <label>
                  CR Number
                  <input
                    className="search-input"
                    value={form.crNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, crNumber: event.target.value }))
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
              <h3>Delete Transporter</h3>
              <button className="btn tiny" onClick={() => setShowDelete(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>Provide admin password and reason to delete.</p>
              <label>
                Admin password
                <input
                  type="password"
                  className="search-input"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                />
              </label>
              <label>
                Reason
                <input
                  className="search-input"
                  value={deleteReason}
                  onChange={(event) => setDeleteReason(event.target.value)}
                />
              </label>
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

export default Transporters;
