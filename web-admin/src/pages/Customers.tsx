import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/authContext";
import "./CustomerTableSection.css";

type CustomerLookupDto = {
  id: number;
  name: string | null;
  city: string | null;
  locationText: string | null;
  googleLocation: string | null;
  receiver1Contact: string | null;
  requirements: string | null;
  sapCustomerId: string | null;
  receiver1Name: string | null;
  receiver1Email: string | null;
  receiver1Designation: string | null;
  receiver2Name: string | null;
  receiver2Contact: string | null;
  receiver2Email: string | null;
  receiver2Designation: string | null;
  notes: string | null;
  active: boolean | null;
};

type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
  order: number;
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

type ModalType = "add" | "edit" | "delete" | "import" | "export" | "duplicate-confirm" | null;

type CustomerLookupResult = {
  exists: boolean;
  sapCustomerId: string;
  customerName: string | null;
  customers: CustomerLookupDto[];
};

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
  const { user } = useAuth();
  const layoutKey = `customerLayout:${user?.username ?? "guest"}`;
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
  const [showSettings, setShowSettings] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchDebounce = useRef<number | null>(null);
  const [lookupResult, setLookupResult] = useState<CustomerLookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [allowDuplicateSapId, setAllowDuplicateSapId] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCityCustomer, setSelectedCityCustomer] = useState<CustomerLookupDto | null>(null);
  const [isAddingNewCity, setIsAddingNewCity] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "sapCustomerId", label: "SAP Customer ID", visible: true, order: 1 },
    { id: "name", label: "Customer Name", visible: true, order: 2 },
    { id: "city", label: "City", visible: true, order: 3 },
    { id: "locationText", label: "Location Text", visible: true, order: 4 },
    { id: "googleLocation", label: "Google Location", visible: true, order: 5 },
    { id: "receiver1Name", label: "Receiver1 Name", visible: true, order: 6 },
    { id: "receiver1Contact", label: "Receiver1 Contact", visible: true, order: 7 },
    { id: "receiver1Email", label: "Receiver1 Email", visible: true, order: 8 },
    { id: "receiver1Designation", label: "Receiver1 Designation", visible: true, order: 9 },
    { id: "receiver2Name", label: "Receiver2 Name", visible: true, order: 10 },
    { id: "receiver2Contact", label: "Receiver2 Contact", visible: true, order: 11 },
    { id: "receiver2Email", label: "Receiver2 Email", visible: true, order: 12 },
    { id: "receiver2Designation", label: "Receiver2 Designation", visible: true, order: 13 },
    { id: "requirements", label: "Requirements", visible: true, order: 14 },
    { id: "notes", label: "Notes / Remarks", visible: true, order: 15 },
    { id: "active", label: "Is Active", visible: true, order: 16 },
  ]);

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

  const loadCustomerMaster = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const url = searchQuery && searchQuery.trim()
        ? `/customer/search?q=${encodeURIComponent(searchQuery.trim())}`
        : "/customer/search";
      const response = await api.get<CustomerLookupDto[]>(url);
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

  // Check for sapCustomerId query parameter and auto-open Add Customer modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sapCustomerIdParam = urlParams.get("sapCustomerId");
    if (sapCustomerIdParam) {
      // Pre-fill form with SAP Customer ID and open Add Customer modal
      setFormState((prev) => ({
        ...prev,
        sapCustomerId: sapCustomerIdParam,
      }));
      setModalType("add");
      setModalCustomer(null);
      setFormError(null);
      // Clean up URL to remove query parameter after reading it
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount

  // Debounced backend search
  useEffect(() => {
    if (searchDebounce.current) {
      window.clearTimeout(searchDebounce.current);
    }
    searchDebounce.current = window.setTimeout(() => {
      loadCustomerMaster(customerTableQuery);
    }, 300);
    return () => {
      if (searchDebounce.current) {
        window.clearTimeout(searchDebounce.current);
      }
    };
  }, [customerTableQuery]);

  const normalizeText = (value?: string | null) => {
    if (!value) return "";
    return value
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const updateTableSuggestions = useCallback(
    (term = "") => {
      const normalizedTerm = normalizeText(term);
      const candidates = new Set<string>();
      if (normalizedTerm) {
        customerList.forEach((customer) => {
          if (!customer.name) return;
          const name = customer.name.trim();
          if (normalizeText(name).includes(normalizedTerm)) {
            candidates.add(name.trim());
          }
        });
      } else {
        customerList.forEach((customer) => {
          if (customer.name?.trim()) {
            candidates.add(customer.name.trim());
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
    const term = normalizeText(customerTableQuery);
    if (!term) {
      return customerList;
    }
    // Filter by multiple fields: name, sapCustomerId, locationText, city, receiver names, contacts
    return customerList.filter((customer) => {
      const nameMatch = normalizeText(customer.name).includes(term);
      const sapIdMatch = normalizeText(customer.sapCustomerId).includes(term);
      const locationMatch = normalizeText(customer.locationText).includes(term);
      const cityMatch = normalizeText(customer.city).includes(term);
      const receiver1NameMatch = normalizeText(customer.receiver1Name).includes(term);
      const receiver2NameMatch = normalizeText(customer.receiver2Name).includes(term);
      const receiver1ContactMatch = normalizeText(customer.receiver1Contact).includes(term);
      const receiver2ContactMatch = normalizeText(customer.receiver2Contact).includes(term);
      const receiver1EmailMatch = normalizeText(customer.receiver1Email).includes(term);
      const receiver2EmailMatch = normalizeText(customer.receiver2Email).includes(term);
      
      return nameMatch || sapIdMatch || locationMatch || cityMatch || 
             receiver1NameMatch || receiver2NameMatch || 
             receiver1ContactMatch || receiver2ContactMatch ||
             receiver1EmailMatch || receiver2EmailMatch;
    });
  }, [customerList, customerTableQuery]);

  const orderedColumns = useMemo(() => {
    return columns
      .filter((column) => column.visible)
      .slice()
      .sort((a, b) => a.order - b.order);
  }, [columns]);

  const saveLayout = () => {
    localStorage.setItem(layoutKey, JSON.stringify(columns));
    setShowSettings(false);
  };

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
    setLookupResult(null);
    setAvailableCities([]);
    setSelectedCityCustomer(null);
    setIsAddingNewCity(false);
    setAllowDuplicateSapId(false);
  };

  const openAddModal = () => {
    setFormState(initialFormState);
    setModalCustomer(null);
    setModalType("add");
    setFormError(null);
    setLookupResult(null);
    setAvailableCities([]);
    setSelectedCityCustomer(null);
    setIsAddingNewCity(false);
    setAllowDuplicateSapId(false);
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
    // Reset duplicate flag when SAP ID changes
    if (field === "sapCustomerId") {
      setAllowDuplicateSapId(false);
      setLookupResult(null);
    }
  };

  const handleSapIdKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const sapIdValue = formState.sapCustomerId.trim();
    if (!sapIdValue) {
      return;
    }
    setIsLookingUp(true);
    setFormError(null);
    try {
      const response = await api.get<CustomerLookupResult>(
        `/customer/lookup-sap-id/${encodeURIComponent(sapIdValue)}`
      );
      const result = response.data;
      setLookupResult(result);
      if (result.exists && result.customers.length > 0) {
        // Customer exists - populate name and extract available cities
        const customerName = result.customerName || result.customers[0].name || "";
        const cities = result.customers
          .map((c) => c.city?.trim())
          .filter((city): city is string => !!city);
        const uniqueCities = Array.from(new Set(cities));

        setFormState((prev) => ({
          ...prev,
          name: customerName,
        }));
        setAvailableCities(uniqueCities);
        setAllowDuplicateSapId(true); // Auto-enable duplicate since customer exists
      } else {
        // Customer doesn't exist - clear cities
        setAvailableCities([]);
      }
    } catch (lookupError) {
      console.error(lookupError);
      // If 404, customer doesn't exist - that's fine for new entry
      setLookupResult({ exists: false, sapCustomerId: sapIdValue, customerName: null, customers: [] });
      setAvailableCities([]);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleConfirmNewLocation = () => {
    // User confirmed they want to add a new location for existing customer
    setAllowDuplicateSapId(true);
    if (lookupResult?.customerName) {
      // Pre-fill the customer name from existing record
      setFormState((prev) => ({ ...prev, name: lookupResult.customerName || prev.name }));
    }
    setModalType("add");
  };

  const handleCitySelection = (cityValue: string) => {
    // Check if user wants to add a new city
    if (cityValue === "__new__") {
      setIsAddingNewCity(true);
      setFormState((prev) => ({ ...prev, city: "" }));
      setSelectedCityCustomer(null);
      return;
    }

    setIsAddingNewCity(false);
    setFormState((prev) => ({ ...prev, city: cityValue }));

    // Find matching customer location for this city and auto-populate fields
    if (lookupResult?.customers && cityValue) {
      const matchingCustomer = lookupResult.customers.find(
        (c) => c.city?.trim().toLowerCase() === cityValue.toLowerCase()
      );
      if (matchingCustomer) {
        setSelectedCityCustomer(matchingCustomer);
        // Auto-populate remaining fields from the matched location
        setFormState((prev) => ({
          ...prev,
          city: cityValue,
          locationText: matchingCustomer.locationText ?? "",
          googleLocation: matchingCustomer.googleLocation ?? "",
          receiver1Name: matchingCustomer.receiver1Name ?? "",
          receiver1Contact: matchingCustomer.receiver1Contact ?? "",
          receiver1Email: matchingCustomer.receiver1Email ?? "",
          requirements: matchingCustomer.requirements ?? "",
          notes: matchingCustomer.notes ?? "",
        }));
      } else {
        // No exact match found - user is adding new city, clear auto-populated fields
        setSelectedCityCustomer(null);
      }
    } else {
      setSelectedCityCustomer(null);
    }
  };

  const handleCancelDuplicate = () => {
    // User cancelled - clear the form and go back to add modal
    setLookupResult(null);
    setAllowDuplicateSapId(false);
    setModalType("add");
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sapIdValue = formState.sapCustomerId.trim();
    const customerNameValue = formState.name.trim();
    if (!sapIdValue || !customerNameValue) {
      setFormError("SAP Customer ID and customer name are required.");
      return;
    }

    // Only check for duplicates if not explicitly allowed
    if (!allowDuplicateSapId && modalType === "add") {
      const normalizedSapId = sapIdValue.toLowerCase();
      const duplicateCustomer = customerList.find((customer) => {
        const existing = customer.sapCustomerId?.trim().toLowerCase();
        if (!existing) {
          return false;
        }
        return existing === normalizedSapId;
      });
      if (duplicateCustomer) {
        // Show confirmation dialog instead of error
        setLookupResult({
          exists: true,
          sapCustomerId: sapIdValue,
          customerName: duplicateCustomer.name,
          customers: [duplicateCustomer],
        });
        setModalType("duplicate-confirm");
        return;
      }
    }

    // For edit mode, check uniqueness excluding current customer
    if (modalType === "edit" && modalCustomer) {
      const normalizedSapId = sapIdValue.toLowerCase();
      const duplicateCustomer = customerList.find((customer) => {
        const existing = customer.sapCustomerId?.trim().toLowerCase();
        if (!existing) {
          return false;
        }
        if (modalCustomer.id === customer.id) {
          return false;
        }
        return existing === normalizedSapId;
      });
      if (duplicateCustomer) {
        setFormError("SAP Customer ID already exists for another customer.");
        return;
      }
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
        // Use different endpoint if adding duplicate SAP ID (new location)
        if (allowDuplicateSapId) {
          await api.post("/customer/add-location", payload);
        } else {
          await api.post("/customer", payload);
        }
      } else if (modalType === "edit" && modalCustomer) {
        await api.put(`/customer/${modalCustomer.id}`, payload);
      }
      await loadCustomerMaster();
      closeModal();
      // Reset duplicate flag after successful save
      setAllowDuplicateSapId(false);
      setLookupResult(null);
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
      await api.delete(`/customer/${modalCustomer.id}`);
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
      const response = await api.post("/customers/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const result = response.data;
      const errors =
        result.errors?.map(
          (error: { row: number; reason: string }) => `Row ${error.row}: ${error.reason}`
        ) ?? [];
      if (errors.length > 0) {
        setImportFeedback("Upload blocked. Fix the highlighted errors and try again.");
        setImportErrors(errors);
        return;
      }
      const imported = result.importedRows ?? 0;
      setImportFeedback(`Upload successful – ${imported} customers updated/inserted.`);
      setImportErrors([]);
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
      const response = await api.get("/customers/template", {
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
      <button
        type="button"
        className="customer-action-button"
        onClick={() => setShowSettings(true)}
      >
        Column Settings
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
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search customer name"
                />
              {isSearchFocused && tableSuggestions.length > 0 && (
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
                {orderedColumns.map((column) => (
                  <th key={column.id}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomerList.length ? (
                filteredCustomerList.map((customer) => (
                  <tr key={customer.id}>
                    {orderedColumns.map((column) => {
                      const value = (() => {
                        switch (column.id) {
                          case "sapCustomerId":
                            return customer.sapCustomerId ?? "-";
                          case "name":
                            return customer.name ?? "-";
                          case "city":
                            return customer.city ?? "-";
                          case "locationText":
                            return customer.locationText ?? "-";
                          case "googleLocation":
                            return customer.googleLocation ?? "-";
                          case "receiver1Name":
                            return customer.receiver1Name ?? "-";
                          case "receiver1Contact":
                            return customer.receiver1Contact ?? "-";
                          case "receiver1Email":
                            return customer.receiver1Email ?? "-";
                          case "receiver1Designation":
                            return customer.receiver1Designation ?? "-";
                          case "receiver2Name":
                            return customer.receiver2Name ?? "-";
                          case "receiver2Contact":
                            return customer.receiver2Contact ?? "-";
                          case "receiver2Email":
                            return customer.receiver2Email ?? "-";
                          case "receiver2Designation":
                            return customer.receiver2Designation ?? "-";
                          case "requirements":
                            return customer.requirements ?? "-";
                          case "notes":
                            return customer.notes ?? "-";
                          case "active":
                            return customer.active == null ? "-" : customer.active ? "Yes" : "No";
                          default:
                            return "-";
                        }
                      })();
                      return <td key={column.id}>{value}</td>;
                    })}
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
                  <td colSpan={orderedColumns.length + 1} className="muted">
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
                {modalType === "duplicate-confirm" && "Customer Exists"}
              </h4>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </header>
            <div className="customer-modal-body">
              {(modalType === "add" || modalType === "edit") && (
                <form className="customer-modal-form" onSubmit={handleFormSubmit}>
                  <div className="customer-modal-field">
                    <label htmlFor="sapCustomerId">
                      SAP Customer ID *
                      {modalType === "add" && !lookupResult?.exists && (
                        <span style={{ fontSize: "11px", color: "#666", marginLeft: "8px" }}>
                          (Press Enter to lookup)
                        </span>
                      )}
                    </label>
                    <input
                      id="sapCustomerId"
                      type="text"
                      value={formState.sapCustomerId}
                      onChange={(event) =>
                        handleFormChange("sapCustomerId", event.target.value)
                      }
                      onKeyDown={modalType === "add" ? handleSapIdKeyDown : undefined}
                      required
                      disabled={isLookingUp}
                      placeholder={isLookingUp ? "Checking..." : "Enter SAP Customer ID"}
                    />
                    {lookupResult?.exists && (
                      <span style={{ fontSize: "11px", color: "#2563eb", marginTop: "4px", display: "block" }}>
                        ✓ Customer found - Name and cities loaded. Select a city to auto-fill details.
                      </span>
                    )}
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="customerName">
                      Customer Name *
                      {lookupResult?.exists && (
                        <span style={{ fontSize: "11px", color: "#16a34a", marginLeft: "8px" }}>
                          (Auto-filled)
                        </span>
                      )}
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      value={formState.name}
                      onChange={(event) => handleFormChange("name", event.target.value)}
                      list="customerNameSuggestions"
                      autoComplete="off"
                      required
                      readOnly={lookupResult?.exists ?? false}
                      style={lookupResult?.exists ? { backgroundColor: "#f1f5f9" } : undefined}
                    />
                    <datalist id="customerNameSuggestions">
                      {nameSuggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="city">
                      City
                      {availableCities.length > 0 && !isAddingNewCity && (
                        <span style={{ fontSize: "11px", color: "#2563eb", marginLeft: "8px" }}>
                          (Select existing or add new)
                        </span>
                      )}
                      {isAddingNewCity && (
                        <span style={{ fontSize: "11px", color: "#16a34a", marginLeft: "8px" }}>
                          (Adding new city)
                        </span>
                      )}
                    </label>
                    {availableCities.length > 0 && !isAddingNewCity ? (
                      <select
                        id="city"
                        value={formState.city}
                        onChange={(event) => handleCitySelection(event.target.value)}
                      >
                        <option value="">-- Select City --</option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                        <option value="__new__">+ Add New City</option>
                      </select>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          id="city"
                          type="text"
                          value={formState.city}
                          onChange={(event) => handleFormChange("city", event.target.value)}
                          placeholder={isAddingNewCity ? "Enter new city name" : "City"}
                          style={{ flex: 1 }}
                        />
                        {isAddingNewCity && availableCities.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsAddingNewCity(false)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              background: "#e2e8f0",
                              border: "1px solid #cbd5e1",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Back to list
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="customer-modal-field">
                    <label htmlFor="locationText">
                      Location Details
                      {selectedCityCustomer && (
                        <span style={{ fontSize: "11px", color: "#16a34a", marginLeft: "8px" }}>
                          (Auto-filled from city)
                        </span>
                      )}
                    </label>
                    <input
                      id="locationText"
                      type="text"
                      value={formState.locationText}
                      onChange={(event) =>
                        handleFormChange("locationText", event.target.value)
                      }
                      style={selectedCityCustomer ? { backgroundColor: "#f0fdf4" } : undefined}
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
              {modalType === "duplicate-confirm" && lookupResult && (
                <div className="customer-modal-confirm">
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ fontWeight: 600, marginBottom: "8px" }}>
                      Customer Already Exists
                    </p>
                    <p>
                      SAP Customer ID <strong>{lookupResult.sapCustomerId}</strong> is already registered
                      {lookupResult.customerName && (
                        <> for <strong>{lookupResult.customerName}</strong></>
                      )}.
                    </p>
                  </div>
                  {lookupResult.customers.length > 0 && (
                    <div style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "12px",
                      marginBottom: "16px",
                      maxHeight: "200px",
                      overflowY: "auto"
                    }}>
                      <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                        Existing locations ({lookupResult.customers.length}):
                      </p>
                      {lookupResult.customers.map((customer) => (
                        <div key={customer.id} style={{
                          fontSize: "13px",
                          padding: "6px 0",
                          borderBottom: "1px solid #e2e8f0"
                        }}>
                          <div><strong>{customer.name}</strong></div>
                          {customer.locationText && (
                            <div style={{ color: "#64748b" }}>{customer.locationText}</div>
                          )}
                          {customer.city && (
                            <div style={{ color: "#64748b" }}>{customer.city}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ color: "#2563eb", fontWeight: 500 }}>
                    Do you want to add a new location entry for this customer?
                  </p>
                  <div className="customer-modal-footer">
                    <button type="button" onClick={handleCancelDuplicate}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={handleConfirmNewLocation}
                    >
                      Yes, Add New Location
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <div className="modal-backdrop">
          <div className="customer-modal settings-modal">
            <header className="customer-modal-header">
              <h4>Customer Table Settings</h4>
              <button type="button" className="modal-close" onClick={() => setShowSettings(false)}>
                ×
              </button>
            </header>
            <div className="customer-modal-body">
              <p className="muted">Choose which columns to show and set their order.</p>
              <div className="column-settings">
                {columns
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((column) => (
                    <div key={column.id} className="column-setting-row">
                      <label className="column-toggle">
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={(event) => {
                            setColumns((prev) =>
                              prev.map((item) =>
                                item.id === column.id
                                  ? { ...item, visible: event.target.checked }
                                  : item
                              )
                            );
                          }}
                        />
                        {column.label}
                      </label>
                      <input
                        className="order-input"
                        type="number"
                        min={1}
                        value={column.order}
                        onChange={(event) => {
                          const value = Number(event.target.value || 1);
                          setColumns((prev) =>
                            prev.map((item) =>
                              item.id === column.id ? { ...item, order: value } : item
                            )
                          );
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="customer-modal-footer">
              <button type="button" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={saveLayout}>
                Save layout
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Customers;
