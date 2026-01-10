import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../services/api";
import "./CustomerTableSection.css";

type CustomerLookupDto = {
  id: number;
  name: string | null;
  city: string | null;
  locationText: string | null;
  googleLocation: string | null;
  receiver1Contact: string | null;
  receiver2Contact: string | null;
  requirements: string | null;
  sapCustomerId: string | null;
  receiver1Name: string | null;
  receiver1Email: string | null;
  notes: string | null;
};

type CustomerFormState = {
  sapCustomerId: string;
  name: string;
  city: string;
  locationText: string;
  googleLocation: string;
  receiver1Name: string;
  receiver1Contact: string;
  receiver1Email: string;
  requirements: string;
  notes: string;
};

type ModalType = "add" | "edit" | "delete" | "import" | "export" | null;

const initialFormState: CustomerFormState = {
  sapCustomerId: "",
  name: "",
  city: "",
  locationText: "",
  googleLocation: "",
  receiver1Name: "",
  receiver1Contact: "",
  receiver1Email: "",
  requirements: "",
  notes: "",
};

const Customers = () => {
  const [customerList, setCustomerList] = useState<CustomerLookupDto[]>([]);
  const [customerTableQuery, setCustomerTableQuery] = useState("");
  const [tableSuggestions, setTableSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalCustomer, setModalCustomer] = useState<CustomerLookupDto | null>(null);
  const [formState, setFormState] = useState<CustomerFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const loadCustomerMaster = async () => {
    setLoading(true);
    try {
      const response = await api.get<CustomerLookupDto[]>("/api/customer/search");
      setCustomerList(response.data ?? []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Unable to load customer master data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerMaster();
  }, []);

  const updateTableSuggestions = useCallback(
    (term = "") => {
      const normalizedTerm = term.trim().toLowerCase();
      const candidates = new Set<string>();
      if (normalizedTerm) {
        customerList.forEach((customer) => {
          if (customer.name) {
            const name = customer.name.trim();
            if (name.toLowerCase().includes(normalizedTerm)) {
              candidates.add(name);
            }
          }
          if (customer.sapCustomerId) {
            const sap = customer.sapCustomerId.trim();
            if (sap.toLowerCase().includes(normalizedTerm)) {
              candidates.add(sap);
            }
          }
        });
      } else {
        customerList.forEach((customer) => {
          if (customer.name?.trim()) {
            candidates.add(customer.name.trim());
          }
          if (customer.sapCustomerId?.trim()) {
            candidates.add(customer.sapCustomerId.trim());
          }
        });
      }
      setTableSuggestions(Array.from(candidates).slice(0, 6));
    },
    [customerList]
  );

  useEffect(() => {
    updateTableSuggestions(customerTableQuery);
  }, [customerTableQuery, updateTableSuggestions]);

  const filteredCustomerList = useMemo(() => {
    const term = customerTableQuery.trim().toLowerCase();
    if (!term) {
      return customerList;
    }
    return customerList.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(term) ||
        customer.sapCustomerId?.toLowerCase().includes(term)
    );
  }, [customerList, customerTableQuery]);

  const nameSuggestions = useMemo(() => {
    const seen = new Set<string>();
    customerList.forEach((customer) => {
      const name = customer.name?.trim();
      if (name) {
        seen.add(name);
      }
    });
    return Array.from(seen).slice(0, 200);
  }, [customerList]);

  const handleCustomerTableSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomerTableQuery(value);
    updateTableSuggestions(value);
  };

  const closeModal = () => {
    setModalType(null);
    setModalCustomer(null);
    setSelectedFile(null);
    setFormError(null);
  };

  const openAddModal = () => {
    setFormState(initialFormState);
    setModalCustomer(null);
    setModalType("add");
    setFormError(null);
  };

  const openEditModal = (customer: CustomerLookupDto) => {
    setFormState({
      sapCustomerId: customer.sapCustomerId ?? "",
      name: customer.name ?? "",
      city: customer.city ?? "",
      locationText: customer.locationText ?? "",
      googleLocation: customer.googleLocation ?? "",
      receiver1Name: customer.receiver1Name ?? "",
      receiver1Contact: customer.receiver1Contact ?? "",
      receiver1Email: customer.receiver1Email ?? "",
      requirements: customer.requirements ?? "",
      notes: customer.notes ?? "",
    });
    setModalCustomer(customer);
    setModalType("edit");
    setFormError(null);
  };

  const openDeleteModal = (customer: CustomerLookupDto) => {
    setModalCustomer(customer);
    setModalType("delete");
  };

  const openImportModal = () => {
    setSelectedFile(null);
    setModalType("import");
  };

  const openExportModal = () => {
    setModalType("export");
  };

  const handleFormChange = (field: keyof CustomerFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sapIdValue = formState.sapCustomerId.trim();
    const customerNameValue = formState.name.trim();
    if (!sapIdValue || !customerNameValue) {
      setFormError("SAP Customer ID and customer name are required.");
      return;
    }
    const normalizedSapId = sapIdValue.toLowerCase();
    const duplicateCustomer = customerList.find((customer) => {
      const existing = customer.sapCustomerId?.trim().toLowerCase();
      if (!existing) {
        return false;
      }
      if (modalType === "edit" && modalCustomer?.id === customer.id) {
        return false;
      }
      return existing === normalizedSapId;
    });
    if (duplicateCustomer) {
      setFormError("SAP Customer ID already exists.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload = {
      ...formState,
      sapCustomerId: sapIdValue,
      name: customerNameValue,
    };
    try {
      if (modalType === "add") {
        await api.post("/api/customer", payload);
      } else if (modalType === "edit" && modalCustomer) {
        await api.put(`/api/customer/${modalCustomer.id}`, payload);
      }
      await loadCustomerMaster();
      closeModal();
    } catch (formErrorResponse) {
      console.error(formErrorResponse);
      setFormError("Unable to save customer information.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!modalCustomer) return;
    try {
      await api.delete(`/api/customer/${modalCustomer.id}`);
      await loadCustomerMaster();
      closeModal();
    } catch (deleteError) {
      console.error(deleteError);
      setFormError("Unable to delete the customer.");
    }
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) {
      setImportFeedback("Please choose an Excel file to upload.");
      return;
    }
    setImportFeedback("Uploading customer file...");
    setImportErrors([]);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await api.post("/api/customers/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const result = response.data;
      setImportFeedback(
        `Imported ${result.importedRows ?? 0} of ${result.totalRows ?? 0} rows.`
      );
      setImportErrors(
        result.errors?.map(
          (error: { row: number; reason: string }) => `Row ${error.row}: ${error.reason}`
        ) ?? []
      );
      setSelectedFile(null);
      await loadCustomerMaster();
      closeModal();
    } catch (importError) {
      console.error(importError);
      setImportFeedback("Upload failed. Please verify the template and try again.");
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/api/customers/template", {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute("download", "customer-upload-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error(downloadError);
      setImportFeedback("Unable to download the template.");
    }
  };

  const handleExportCustomers = () => {
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const headers = [
      "SAP Customer ID",
      "Customer Name",
      "City",
      "Location Details",
      "Phone 1",
      "Phone 2",
    ];
    const rows = customerList.map((customer) => [
      customer.sapCustomerId ?? "",
      customer.name ?? "",
      customer.city ?? "",
      customer.locationText ?? "",
      customer.receiver1Contact ?? "",
      customer.receiver2Contact ?? "",
    ]);
    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((value) => escapeCsv(value)).join(","))
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "customers-export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setModalType(null);
  };

  const tableActions = (
    <div className="customer-action-buttons">
      <button type="button" className="customer-action-button" onClick={downloadTemplate}>
        Download Template
      </button>
      <button type="button" className="customer-action-button" onClick={openImportModal}>
        Upload Excel
      </button>
      <button type="button" className="customer-action-button primary" onClick={openAddModal}>
        Add Customer
      </button>
      <button type="button" className="customer-action-button" onClick={openExportModal}>
        Export
      </button>
    </div>
  );

  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage customer master data.</p>
        </div>
      </div>
      <div className="customer-table-section">
        <div className="customer-table-header">
          <h3>Customer Details Table</h3>
          <div className="customer-table-actions">
            <label className="customer-search-box">
              <input
                type="text"
                value={customerTableQuery}
                onChange={handleCustomerTableSearch}
                placeholder="Search customer name or SAP ID"
              />
              {tableSuggestions.length > 0 && (
                <ul>
                  {tableSuggestions.map((name) => (
                    <li
                      key={name}
                      onMouseDown={() => {
                        setCustomerTableQuery(name);
                        setTableSuggestions([]);
                      }}
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </label>
            {tableActions}
          </div>
        </div>
        {importFeedback && (
          <div className="import-feedback">
            <p className="muted">{importFeedback}</p>
            {importErrors.length > 0 && (
              <ul>
                {importErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {loading && <p className="muted">Loading customer master...</p>}
        {error && <p className="muted">{error}</p>}
        <div className="customer-table-wrapper">
          <table className="customer-table">
            <thead>
              <tr>
                <th>SAP Customer ID</th>
                <th>Name</th>
                <th>City</th>
                <th>Location Details</th>
                <th>Phone 1</th>
                <th>Phone 2</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomerList.length ? (
                filteredCustomerList.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.sapCustomerId || "-"}</td>
                    <td>{customer.name || "-"}</td>
                    <td>{customer.city || "-"}</td>
                    <td>{customer.locationText || "-"}</td>
                    <td>{customer.receiver1Contact || "-"}</td>
                    <td>{customer.receiver2Contact || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action edit"
                        onClick={() => openEditModal(customer)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-action delete"
                        onClick={() => openDeleteModal(customer)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="muted">
                    No customer records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modalType && (
        <div className="modal-backdrop">
          <div className="customer-modal">
            <header className="customer-modal-header">
              <h4>
                {modalType === "add" && "Add customer"}
                {modalType === "edit" && "Edit customer"}
                {modalType === "delete" && "Delete customer"}
                {modalType === "import" && "Upload customers from Excel"}
                {modalType === "export" && "Export customers"}
              </h4>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </header>
            <div className="customer-modal-body">
              {(modalType === "add" || modalType === "edit") && (
                <form className="customer-modal-form" onSubmit={handleFormSubmit}>
                  <div className="customer-modal-field">
                    <label htmlFor="sapCustomerId">SAP Customer ID *</label>
                    <input
                      id="sapCustomerId"
                      type="text"
                      value={formState.sapCustomerId}
                      onChange={(event) =>
                        handleFormChange("sapCustomerId", event.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="customerName">Customer Name *</label>
                    <input
                      id="customerName"
                      type="text"
                      value={formState.name}
                      onChange={(event) => handleFormChange("name", event.target.value)}
                      list="customerNameSuggestions"
                      autoComplete="off"
                      required
                    />
                    <datalist id="customerNameSuggestions">
                      {nameSuggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      type="text"
                      value={formState.city}
                      onChange={(event) => handleFormChange("city", event.target.value)}
                    />
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="locationText">Location Details</label>
                    <input
                      id="locationText"
                      type="text"
                      value={formState.locationText}
                      onChange={(event) =>
                        handleFormChange("locationText", event.target.value)
                      }
                    />
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="googleLocation">Google location link</label>
                    <input
                      id="googleLocation"
                      type="text"
                      value={formState.googleLocation}
                      onChange={(event) =>
                        handleFormChange("googleLocation", event.target.value)
                      }
                    />
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="receiver1Name">Receiver 1 Name</label>
                    <input
                      id="receiver1Name"
                      type="text"
                      value={formState.receiver1Name}
                      onChange={(event) =>
                        handleFormChange("receiver1Name", event.target.value)
                      }
                    />
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="receiver1Contact">Receiver 1 Contact</label>
                    <input
                      id="receiver1Contact"
                      type="text"
                      value={formState.receiver1Contact}
                      onChange={(event) =>
                        handleFormChange("receiver1Contact", event.target.value)
                      }
                    />
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="receiver1Email">Receiver 1 Email</label>
                    <input
                      id="receiver1Email"
                      type="email"
                      value={formState.receiver1Email}
                      onChange={(event) =>
                        handleFormChange("receiver1Email", event.target.value)
                      }
                    />
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="requirements">Requirements</label>
                    <input
                      id="requirements"
                      type="text"
                      value={formState.requirements}
                      onChange={(event) =>
                        handleFormChange("requirements", event.target.value)
                      }
                    />
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="notes">Notes / Remarks</label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formState.notes}
                      onChange={(event) => handleFormChange("notes", event.target.value)}
                    />
                  </div>
                  {formError && <p className="muted">{formError}</p>}
                  <div className="customer-modal-footer">
                    <button type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}>
                      {submitting ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}
              {modalType === "delete" && modalCustomer && (
                <div className="customer-modal-confirm">
                  <p>
                    Confirm deleting <strong>{modalCustomer.name}</strong>?
                  </p>
                  {formError && <p className="muted">{formError}</p>}
                  <div className="customer-modal-footer">
                    <button type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="button" className="destructive" onClick={handleDeleteCustomer}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
              {modalType === "import" && (
                <div className="customer-modal-upload">
                  <p>Upload an Excel file that follows the provided template.</p>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportFileChange} />
                  <div className="customer-modal-footer">
                    <button type="button" onClick={closeModal}>
                      Close
                    </button>
                    <button type="button" onClick={handleImportSubmit} disabled={!selectedFile}>
                      Upload
                    </button>
                  </div>
                </div>
              )}
              {modalType === "export" && (
                <div className="customer-modal-export">
                  <p>Export the currently loaded customers as CSV.</p>
                  <div className="customer-modal-footer">
                    <button type="button" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="button" onClick={handleExportCustomers}>
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Customers;
