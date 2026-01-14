import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/authContext";

type DriverDto = {
  id: number;
  driverName: string;
  driverNumber: string;
  idNumber: string;
  truckNo?: string | null;
  nationality?: string | null;
  iqamaExpiryDate?: string | null;
  licenseExpiryDate?: string | null;
  iqamaImage?: string | null;
  licenseImage?: string | null;
  istimaraImage?: string | null;
  insuranceImage?: string | null;
  truckFrontImage?: string | null;
  truckBackImage?: string | null;
  active: boolean;
};

const emptyForm = {
  driverName: "",
  driverNumber: "",
  idNumber: "",
  truckNo: "",
  nationality: "",
  iqamaExpiryDate: "",
  licenseExpiryDate: "",
  active: true,
};

type DriverFiles = {
  iqama?: File | null;
  license?: File | null;
  istimara?: File | null;
  insurance?: File | null;
  truckFront?: File | null;
  truckBack?: File | null;
};

const Drivers = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role ?? "").toUpperCase() === "ADMIN";
  const [rows, setRows] = useState<DriverDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");
  const [searchIqama, setSearchIqama] = useState("");
  const [searchTruck, setSearchTruck] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DriverDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<DriverFiles>({});
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DriverDto | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportSearch, setExportSearch] = useState("");
  const [exportSelection, setExportSelection] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);

  const loadDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<DriverDto[]>("/masters/drivers");
      setRows(response.data ?? []);
    } catch {
      setError("Unable to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const nameOk = !searchName.trim()
        ? true
        : row.driverName?.toLowerCase().includes(searchName.trim().toLowerCase());
      const iqamaOk = !searchIqama.trim()
        ? true
        : row.idNumber?.toLowerCase().includes(searchIqama.trim().toLowerCase());
      const truckOk = !searchTruck.trim()
        ? true
        : row.truckNo?.toLowerCase().includes(searchTruck.trim().toLowerCase());
      return nameOk && iqamaOk && truckOk;
    });
  }, [rows, searchName, searchIqama, searchTruck]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFiles({});
    setShowModal(true);
  };

  const openEdit = (row: DriverDto) => {
    setEditing(row);
    setForm({
      driverName: row.driverName ?? "",
      driverNumber: row.driverNumber ?? "",
      idNumber: row.idNumber ?? "",
      truckNo: row.truckNo ?? "",
      nationality: row.nationality ?? "",
      iqamaExpiryDate: row.iqamaExpiryDate ?? "",
      licenseExpiryDate: row.licenseExpiryDate ?? "",
      active: row.active ?? true,
    });
    setFiles({});
    setShowModal(true);
  };

  const uploadDocuments = async (driverId: number) => {
    const formData = new FormData();
    if (files.iqama) formData.append("iqama", files.iqama);
    if (files.license) formData.append("license", files.license);
    if (files.istimara) formData.append("istimara", files.istimara);
    if (files.insurance) formData.append("insurance", files.insurance);
    if (files.truckFront) formData.append("truckFront", files.truckFront);
    if (files.truckBack) formData.append("truckBack", files.truckBack);
    if ([...formData.keys()].length === 0) {
      return;
    }
    await api.post(`/masters/drivers/${driverId}/documents`, formData);
  };

  const submitForm = async () => {
    if (!form.driverName.trim()) {
      setError("Driver name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const response = await api.put<DriverDto>(`/masters/drivers/${editing.id}`, {
          driverName: form.driverName,
          driverNumber: form.driverNumber,
          idNumber: form.idNumber,
          truckNo: form.truckNo || null,
          nationality: form.nationality || null,
          iqamaExpiryDate: form.iqamaExpiryDate || null,
          licenseExpiryDate: form.licenseExpiryDate || null,
          active: form.active,
        });
        await uploadDocuments(editing.id);
        setRows((prev) =>
          prev.map((row) => (row.id === editing.id ? response.data : row))
        );
        setActionMessage("Driver updated.");
      } else {
        const response = await api.post<DriverDto>("/masters/drivers", {
          driverName: form.driverName,
          driverNumber: form.driverNumber,
          idNumber: form.idNumber,
          truckNo: form.truckNo || null,
          nationality: form.nationality || null,
          iqamaExpiryDate: form.iqamaExpiryDate || null,
          licenseExpiryDate: form.licenseExpiryDate || null,
          active: form.active,
        });
        await uploadDocuments(response.data.id);
        setRows((prev) => [response.data, ...prev]);
        setActionMessage("Driver added.");
      }
      setShowModal(false);
    } catch {
      setError("Save failed. Check backend logs.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row: DriverDto) => {
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
      await api.delete(`/masters/drivers/${deleteTarget.id}`, {
        data: {
          adminPassword: deletePassword,
          reason: deleteReason,
          performedBy: user?.username ?? "",
        },
      });
      setRows((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      setShowDelete(false);
      setActionMessage("Driver deleted.");
    } catch {
      setError("Delete failed. Check password and try again.");
    } finally {
      setSaving(false);
    }
  };

  const openExport = () => {
    setExportSelection(new Set());
    setExportSearch("");
    setShowExport(true);
  };

  const toggleExportSelect = (id: number) => {
    setExportSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportDrivers = async () => {
    if (exportSelection.size === 0) {
      setError("Select at least one driver for export.");
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const response = await api.post(
        "/masters/drivers/export",
        { driverIds: Array.from(exportSelection) },
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "drivers-export.zip";
      link.click();
      window.URL.revokeObjectURL(url);
      setShowExport(false);
    } catch {
      setError("Export failed. Check backend logs.");
    } finally {
      setExporting(false);
    }
  };

  const exportFiltered = useMemo(() => {
    const term = exportSearch.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      return (
        row.driverName?.toLowerCase().includes(term) ||
        row.idNumber?.toLowerCase().includes(term) ||
        row.truckNo?.toLowerCase().includes(term)
      );
    });
  }, [rows, exportSearch]);

  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h1>Driver Management</h1>
          <p>Manage drivers and compliance documents.</p>
        </div>
        <div className="stock-actions">
          {isAdmin && (
            <>
              <button className="btn ghost" onClick={openExport}>
                Export Drivers
              </button>
              <button className="btn primary" onClick={openAdd}>
                + Add Driver
              </button>
            </>
          )}
        </div>
      </div>

      {actionMessage ? <div className="banner">{actionMessage}</div> : null}
      {error ? <div className="banner">{error}</div> : null}

      <div className="stock-toolbar">
        <div className="toolbar-left">
          <input
            className="search-input"
            placeholder="Driver name"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
          />
          <input
            className="search-input"
            placeholder="Iqama no"
            value={searchIqama}
            onChange={(event) => setSearchIqama(event.target.value)}
          />
          <input
            className="search-input"
            placeholder="Truck number"
            value={searchTruck}
            onChange={(event) => setSearchTruck(event.target.value)}
          />
        </div>
        <div className="toolbar-note">
          {loading ? "Loading..." : `Showing ${filtered.length} drivers`}
        </div>
      </div>

      <div className="order-items-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>Driver Number</th>
              <th>Iqama No</th>
              <th>Truck Number</th>
              <th>Nationality</th>
              <th>Iqama Expiry</th>
              <th>License Expiry</th>
              <th>Is Active</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="empty">
                  No drivers found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.driverName}</td>
                  <td>{row.driverNumber}</td>
                  <td>{row.idNumber}</td>
                  <td>{row.truckNo || "-"}</td>
                  <td>{row.nationality || "-"}</td>
                  <td>{row.iqamaExpiryDate || "-"}</td>
                  <td>{row.licenseExpiryDate || "-"}</td>
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
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3>{editing ? "Edit Driver" : "Add Driver"}</h3>
              <button className="btn tiny" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Driver Name
                  <input
                    className="search-input"
                    value={form.driverName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, driverName: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Driver Number
                  <input
                    className="search-input"
                    value={form.driverNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, driverNumber: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Iqama No
                  <input
                    className="search-input"
                    value={form.idNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, idNumber: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Nationality
                  <input
                    className="search-input"
                    value={form.nationality}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, nationality: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Truck Number
                  <input
                    className="search-input"
                    value={form.truckNo}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, truckNo: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Iqama Expiry Date
                  <input
                    type="date"
                    className="search-input"
                    value={form.iqamaExpiryDate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, iqamaExpiryDate: event.target.value }))
                    }
                  />
                </label>
                <label>
                  License Expiry Date
                  <input
                    type="date"
                    className="search-input"
                    value={form.licenseExpiryDate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, licenseExpiryDate: event.target.value }))
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
              <div className="form-grid">
                <label>
                  Iqama Image
                  <input
                    type="file"
                    onChange={(event) =>
                      setFiles((prev) => ({ ...prev, iqama: event.target.files?.[0] }))
                    }
                  />
                </label>
                <label>
                  License Image
                  <input
                    type="file"
                    onChange={(event) =>
                      setFiles((prev) => ({ ...prev, license: event.target.files?.[0] }))
                    }
                  />
                </label>
                <label>
                  Vehicle Registration (Istimara)
                  <input
                    type="file"
                    onChange={(event) =>
                      setFiles((prev) => ({ ...prev, istimara: event.target.files?.[0] }))
                    }
                  />
                </label>
                <label>
                  Insurance Paper
                  <input
                    type="file"
                    onChange={(event) =>
                      setFiles((prev) => ({ ...prev, insurance: event.target.files?.[0] }))
                    }
                  />
                </label>
                <label>
                  Truck Front Image
                  <input
                    type="file"
                    onChange={(event) =>
                      setFiles((prev) => ({ ...prev, truckFront: event.target.files?.[0] }))
                    }
                  />
                </label>
                <label>
                  Truck Back Image
                  <input
                    type="file"
                    onChange={(event) =>
                      setFiles((prev) => ({ ...prev, truckBack: event.target.files?.[0] }))
                    }
                  />
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
              <h3>Delete Driver</h3>
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

      {showExport && (
        <div className="modal-backdrop">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3>Export Drivers</h3>
              <button className="btn tiny" onClick={() => setShowExport(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <input
                className="search-input"
                placeholder="Search by name, iqama, truck..."
                value={exportSearch}
                onChange={(event) => setExportSearch(event.target.value)}
              />
              <div className="export-list">
                {exportFiltered.map((row) => (
                  <label key={row.id} className="export-row">
                    <input
                      type="checkbox"
                      checked={exportSelection.has(row.id)}
                      onChange={() => toggleExportSelect(row.id)}
                    />
                    <span>
                      {row.driverName} · {row.idNumber} · {row.truckNo || "-"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowExport(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={exportDrivers} disabled={exporting}>
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Drivers;
