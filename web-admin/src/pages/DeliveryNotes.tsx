import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import DNPreview from "../components/DNPreview";
import PrintPreviewModal from "../components/PrintPreviewModal";

type OrderSummaryDto = {
  orderId: number;
  invoiceNumber: string | null;
  outboundNumber: string;
  gappPo: string | null;
  customerPo: string | null;
  customerName: string | null;
  dnCreated: boolean;
};

type OutboundInfoDto = {
  orderId: number;
  outboundNumber: string;
  customerName: string;
  gappPo: string | null;
  customerPo: string | null;
  itemNumbers: string[];
};

type CustomerLookupDto = {
  id: number;
  name: string | null;
  city: string | null;
  locationText: string | null;
  googleLocation: string | null;
  receiver1Contact: string | null;
  receiver2Contact: string | null;
  receiver1Name: string | null;
  receiver2Name: string | null;
  email: string | null;
  requirements: string | null;
};

type TransporterDto = {
  id: number;
  companyName: string;
  contactName?: string;
  email?: string;
};

type DriverDto = {
  id: number;
  driverName: string;
  driverNumber: string;
  idNumber?: string;
  truckNo?: string;
  iqamaImage?: string;
  istimaraImage?: string;
  insuranceImage?: string;
};

type DeliveryNoteResponse = {
  id: number;
  dnNumber?: string;
  outboundNumber?: string;
  status?: string;
};

type QuantityRow = {
  description: string;
  quantity: string;
};

const truckTypes = ["Flatbed", "Covered", "Refrigerated", "Container", "Open Deck"];
const locationTypes = ["Warehouse", "Site", "House", "Office"] as const;
type LocationType = (typeof locationTypes)[number];

type DeliveryNoteFormState = {
  dnNumber: string;
  outboundNumber: string;
  customerId: string;
  customerName: string;
  customerLocationType: LocationType;
  customerLocationText: string;
  address: string;
  googleMapLink: string;
  customerEmail: string;
  phone1: string;
  phone2: string;
  receiver1Name: string;
  receiver2Name: string;
  requirements: string;
  transporterId: string;
  truckType: string;
  driverId: string;
  driverName: string;
  driverNumber: string;
  allowOutboundEdit: boolean;
  driverIdNumber: string;
};
const MAX_ROWS = 9;
const PRINT_PREVIEW_STORAGE_KEY = "godam-print-dn-preview";

const DeliveryNotes = () => {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [searchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [outboundInfo, setOutboundInfo] = useState<OutboundInfoDto | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerLookupDto[]>([]);
  const [customerFocus, setCustomerFocus] = useState(-1);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLookupDto | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [transporters, setTransporters] = useState<TransporterDto[]>([]);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [qtyRows, setQtyRows] = useState<QuantityRow[]>([{ description: "", quantity: "" }]);
  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<number | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipients: "",
    subject: "",
    message: "",
  });
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showTransporterModal, setShowTransporterModal] = useState(false);
  const [driverForm, setDriverForm] = useState({
    driverName: "",
    driverNumber: "",
    idNumber: "",
    truckNo: "",
  });
  const [transporterForm, setTransporterForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
  });
  const customerDebounce = useRef<number | null>(null);

  const [formState, setFormState] = useState<DeliveryNoteFormState>({
    dnNumber: "",
    outboundNumber: "",
    customerId: "",
    customerName: "",
    customerLocationType: locationTypes[0],
    customerLocationText: "",
    address: "",
    googleMapLink: "",
    customerEmail: "",
    phone1: "",
    phone2: "",
    receiver1Name: "",
    receiver2Name: "",
    requirements: "",
    transporterId: "",
    truckType: truckTypes[0],
    driverId: "",
    driverName: "",
    driverNumber: "",
    allowOutboundEdit: false,
    driverIdNumber: "",
  });

  const selectedDriver = useMemo(
    () => drivers.find((driver) => String(driver.id) === formState.driverId),
    [drivers, formState.driverId]
  );

  const selectedTransporter = useMemo(
    () => transporters.find((tran) => String(tran.id) === formState.transporterId),
    [transporters, formState.transporterId]
  );

  const previewQuantities = useMemo(
    () =>
      qtyRows
        .filter((row) => row.description.trim() && Number(row.quantity) > 0)
        .map((row) => ({
          description: row.description.trim(),
          quantity: Number(row.quantity),
        })),
    [qtyRows]
  );

  const previewProps = {
    dnNumber: formState.dnNumber,
    outboundNumber: formState.outboundNumber,
    customerName: formState.customerName,
    address: formState.address,
    requirements: formState.requirements,
    googleMapLink: formState.googleMapLink,
    phone1: formState.phone1,
    phone2: formState.phone2,
    receiver1Name: formState.receiver1Name,
    receiver2Name: formState.receiver2Name,
    customerEmail: formState.customerEmail,
    customerLocationType: formState.customerLocationType,
    customerLocationDetail: formState.customerLocationText,
    transporterName: selectedTransporter?.companyName,
    transporterContact: selectedTransporter?.contactName,
    driverName: formState.driverName,
    driverNumber: formState.driverNumber,
    truckType: formState.truckType,
    quantities: previewQuantities,
  };

  const buildPrintPreviewPayload = () => ({
    id: savedNoteId ?? undefined,
    dnNumber: formState.dnNumber || "DN-TBD",
    outboundNumber: formState.outboundNumber || "TBD",
    dateCreated: new Date().toISOString(),
    customer: {
      name: formState.customerName || "Customer name",
      address: formState.address || "Enter customer address",
      city: formState.customerLocationText || "",
      locationText: formState.customerLocationText || "",
      googleLocation: formState.googleMapLink || "",
      receiver1Contact: formState.phone1 || "",
      receiver2Contact: formState.phone2 || "",
      receiver1Name: formState.receiver1Name || "",
      receiver2Name: formState.receiver2Name || "",
      email: formState.customerEmail || "",
      requirements: formState.requirements || "",
    },
    transporter: {
      companyName: selectedTransporter?.companyName || "Select transporter",
      contactName: selectedTransporter?.contactName || "",
    },
    driver: {
      driverName: formState.driverName || "Driver name",
      driverNumber: formState.driverNumber || "Driver number",
    },
    truckType: formState.truckType,
    quantities: previewQuantities,
    status: savedNoteId ? "Saved" : "Preview",
  });

  const persistPrintPreview = () => {
    try {
      sessionStorage.setItem(
        PRINT_PREVIEW_STORAGE_KEY,
        JSON.stringify(buildPrintPreviewPayload())
      );
    } catch (storageError) {
      console.error("Unable to cache print preview data", storageError);
    }
  };

  const openPrintPreview = () => {
    setError(null);
    setMessage(null);
    persistPrintPreview();
    // Open the dedicated print page in a new window
    if (savedNoteId) {
      window.open(`/print-dn?id=${savedNoteId}`, "_blank");
    } else {
      window.open("/print-dn", "_blank");
    }
  };

  const handleModalPrint = () => {
    // Open the print page in a new window
    persistPrintPreview();
    if (savedNoteId) {
      window.open(`/print-dn?id=${savedNoteId}`, "_blank");
    } else {
      window.open("/print-dn", "_blank");
    }
    setIsPrintPreviewOpen(false);
  };

  const whatsappUrl = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : undefined;
  };

  const handleOrderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const orderId = Number(event.target.value);
    setSelectedCustomer(null);
    setSavedNoteId(null);
    setEmailStatus(null);
    setEmailError(null);
    setMessage(null);
    setError(null);
    setSelectedOrderId(orderId || null);
  };

  const loadOrders = async () => {
    try {
      const response = await api.get<OrderSummaryDto[]>("/orders?dnCreated=false");
      setOrders(response.data ?? []);
    } catch (e) {
      console.error(e);
      setError("Unable to load outbound orders.");
    }
  };

  const loadTransporters = async () => {
    try {
      const response = await api.get<TransporterDto[]>("/api/transporter");
      setTransporters(response.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await api.get<DriverDto[]>("/api/driver");
      setDrivers(response.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();
    loadTransporters();
    loadDrivers();
  }, []);

  useEffect(() => {
    if (selectedOrderId) return;
    const param = searchParams.get("orderId");
    if (!param) return;
    const parsed = Number(param);
    if (!Number.isNaN(parsed)) {
      setSelectedOrderId(parsed);
    }
  }, [searchParams, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId) {
      setOutboundInfo(null);
      setFormState((prev) => ({ ...prev, outboundNumber: "", dnNumber: "", allowOutboundEdit: false }));
      return;
    }
    const fetchOutbound = async () => {
      try {
        const response = await api.get<OutboundInfoDto>(`/api/outbound/${selectedOrderId}`);
        setOutboundInfo(response.data);
        setFormState((prev) => ({
          ...prev,
          outboundNumber: response.data.outboundNumber ?? prev.outboundNumber,
          customerName: response.data.customerName ?? prev.customerName,
        }));
        setCustomerQuery(response.data.customerName ?? "");
      } catch (e) {
        console.error(e);
        setError("Unable to resolve outbound details.");
      }
    };
    fetchOutbound();
  }, [selectedOrderId]);

  useEffect(() => {
    if (!customerQuery.trim()) {
      setCustomerSuggestions([]);
      setCustomerFocus(-1);
      return;
    }
    const term = customerQuery.trim();
    if (customerDebounce.current) {
      window.clearTimeout(customerDebounce.current);
    }
    customerDebounce.current = window.setTimeout(async () => {
      try {
        const response = await api.get<CustomerLookupDto[]>(`/api/customer/search?q=${encodeURIComponent(term)}`);
        setCustomerSuggestions(response.data ?? []);
      } catch (e) {
        console.error(e);
      }
    }, 260);
    return () => {
      if (customerDebounce.current) {
        window.clearTimeout(customerDebounce.current);
      }
    };
  }, [customerQuery]);

  useEffect(() => {
    if (
      outboundInfo &&
      outboundInfo.customerName &&
      !selectedCustomer &&
      customerSuggestions.length > 0
    ) {
      const match = customerSuggestions.find(
        (customer) =>
          customer.name && customer.name.toLowerCase() === outboundInfo.customerName.toLowerCase()
      );
      if (match) {
        applyCustomer(match);
      }
    }
  }, [customerSuggestions, outboundInfo, selectedCustomer]);

  const applyCustomer = (customer: CustomerLookupDto) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name ?? "");
    setCustomerSuggestions([]);
    setFormState((prev) => ({
      ...prev,
      customerId: customer.id ? String(customer.id) : prev.customerId,
      customerName: customer.name ?? prev.customerName,
      customerLocationText: customer.locationText ?? prev.customerLocationText,
      address: customer.city ?? prev.address,
      googleMapLink: customer.googleLocation ?? prev.googleMapLink,
      phone1: customer.receiver1Contact ?? prev.phone1,
      phone2: customer.receiver2Contact ?? prev.phone2,
      receiver1Name: customer.receiver1Name ?? prev.receiver1Name,
      receiver2Name: customer.receiver2Name ?? prev.receiver2Name,
      customerEmail: customer.email ?? prev.customerEmail,
      requirements: customer.requirements ?? prev.requirements,
    }));
  };

  const handleCustomerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!customerSuggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCustomerFocus((prev) =>
        prev >= customerSuggestions.length - 1 ? 0 : prev + 1
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCustomerFocus((prev) =>
        prev <= 0 ? customerSuggestions.length - 1 : prev - 1
      );
      return;
    }
    if (event.key === "Enter" && customerFocus >= 0) {
      event.preventDefault();
      applyCustomer(customerSuggestions[customerFocus]);
    }
  };

  const updateForm = (payload: Partial<DeliveryNoteFormState>) => {
    setFormState((prev) => ({ ...prev, ...payload }));
  };

  const handleSaveCustomer = async () => {
    if (savingCustomer) return;
    const name = formState.customerName.trim();
    if (!name) {
      setError("Enter a customer name before saving.");
      return;
    }
    setSavingCustomer(true);
    setError(null);
    try {
      const response = await api.post<CustomerLookupDto>("/api/customer", {
        name,
        city: formState.address,
        locationText: formState.customerLocationText || formState.address,
        googleLocation: formState.googleMapLink,
        receiver1Contact: formState.phone1,
        receiver2Contact: formState.phone2,
        receiver1Name: formState.receiver1Name,
        receiver2Name: formState.receiver2Name,
        email: formState.customerEmail,
        requirements: formState.requirements,
      });
      applyCustomer(response.data);
      setCustomerQuery(response.data.name ?? name);
      setMessage("Customer saved to master data.");
    } catch (e) {
      console.error(e);
      setError("Unable to save customer details.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const isValidQuantity = () => qtyRows.some((row) => row.description.trim() && Number(row.quantity) > 0);

  const canSave = Boolean(
    selectedCustomer &&
      formState.transporterId &&
      formState.driverName.trim() &&
      formState.driverNumber.trim() &&
      isValidQuantity()
  );

  const handleSave = async () => {
    if (!canSave) {
      setError("Customer, driver, transporter and at least one quantity are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post<DeliveryNoteResponse>("/api/delivery-note", {
        dnNumber: formState.dnNumber,
        outboundNumber: formState.outboundNumber,
        customerId: selectedCustomer?.id,
        address: formState.address,
        googleMapLink: formState.googleMapLink,
        requirements: formState.requirements,
        transporterId: Number(formState.transporterId),
        driverId: Number(formState.driverId),
        status: "draft",
        quantities: qtyRows
          .filter((row) => row.description.trim() && Number(row.quantity) > 0)
          .map((row) => ({
            description: row.description.trim(),
          quantity: Number(row.quantity),
        })),
      });
      setSavedNoteId(response.data.id);
      setMessage("Delivery note saved.");
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setError("Failed to save delivery note.");
    } finally {
      setSaving(false);
    }
  };

  const pdfAvailable = Boolean(savedNoteId);

  const handleDownloadPdf = async () => {
    if (!savedNoteId) {
      setError("Save the delivery note before downloading.");
      return;
    }
    try {
      const response = await api.get<Blob>(`/api/delivery-note/${savedNoteId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `DeliveryNote-${formState.dnNumber || savedNoteId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Unable to download PDF.");
    }
  };

  const handleEmail = () => {
    if (!savedNoteId) {
      setError("Save the delivery note before emailing.");
      return;
    }
    setEmailError(null);
    setEmailStatus(null);
    setEmailModalOpen(true);
  };

  const parseRecipients = (value: string) =>
    value
      .split(/[,;]+/)
      .map((token) => token.trim())
      .filter(Boolean);

  const sendEmail = async () => {
    if (!savedNoteId) {
      setEmailError("No saved delivery note to email.");
      return;
    }
    const recipients = parseRecipients(emailForm.recipients);
    if (!recipients.length) {
      setEmailError("Add at least one valid recipient.");
      return;
    }
    setEmailSending(true);
    setEmailError(null);
    try {
      await api.post(`/api/delivery-note/${savedNoteId}/email`, {
        recipients,
        subject:
          emailForm.subject ||
          `Delivery Note ${formState.dnNumber || formState.outboundNumber}`,
        message: emailForm.message,
      });
      setEmailModalOpen(false);
      setEmailStatus("Delivery note email queued.");
      setEmailForm({ recipients: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setEmailError("Failed to send email.");
    } finally {
      setEmailSending(false);
    }
  };

  const addQtyRow = () => {
    if (qtyRows.length >= MAX_ROWS) return;
    setQtyRows((prev) => [...prev, { description: "", quantity: "" }]);
  };

  const removeQtyRow = (index: number) => {
    setQtyRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateQtyRow = (index: number, field: keyof QuantityRow, value: string) => {
    setQtyRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleDriverSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const driverId = event.target.value;
    const selected = drivers.find((driver) => String(driver.id) === driverId);
    if (selected) {
      updateForm({
        driverId: driverId,
        driverName: selected.driverName,
        driverNumber: selected.driverNumber,
        driverIdNumber: selected.idNumber ?? "",
      });
    } else {
      updateForm({
        driverId: "",
        driverName: "",
        driverNumber: "",
      });
    }
  };

  const handleTransporterCreate = async () => {
    if (!transporterForm.companyName.trim()) {
      setError("Transporter name is required.");
      return;
    }
    try {
      const response = await api.post<TransporterDto>("/api/transporter", transporterForm);
      setTransporters((prev) => [...prev, response.data]);
      updateForm({ transporterId: String(response.data.id) });
      setShowTransporterModal(false);
      setTransporterForm({ companyName: "", contactName: "", email: "" });
    } catch (e) {
      console.error(e);
      setError("Unable to create transporter.");
    }
  };

  const handleDriverCreate = async () => {
    if (!driverForm.driverName.trim() || !driverForm.driverNumber.trim()) {
      setError("Driver name and number are required.");
      return;
    }
    try {
      const response = await api.post<DriverDto>("/api/driver", driverForm);
      setDrivers((prev) => [...prev, response.data]);
      updateForm({
        driverId: String(response.data.id),
        driverName: response.data.driverName,
        driverNumber: response.data.driverNumber,
        driverIdNumber: response.data.idNumber ?? "",
      });
      setShowDriverModal(false);
      setDriverForm({ driverName: "", driverNumber: "", idNumber: "", truckNo: "" });
    } catch (e) {
      console.error(e);
      setError("Unable to create driver.");
    }
  };

  useEffect(() => {
    if (customerSuggestions.length === 0) {
      setCustomerFocus(-1);
    } else if (customerFocus >= customerSuggestions.length) {
      setCustomerFocus(customerSuggestions.length - 1);
    }
  }, [customerSuggestions, customerFocus]);

  return (
    <section className="delivery-page">
      <div className="delivery-panel">
        <div className="delivery-header">
          <div>
            <h1>Delivery Note Creation</h1>
            <p>Populate customer, transport and driver details before saving.</p>
          </div>
          <div className="delivery-header-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn teal"
              onClick={handleSave}
              disabled={!isEditing || saving || !canSave}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="order-selector">
          <label>
            Source Outbound Order
            <select value={selectedOrderId ?? ""} onChange={handleOrderChange}>
              <option value="">Choose an outbound order</option>
              {orders
                .filter((order) => !order.dnCreated)
                .map((order) => (
                  <option key={order.orderId} value={order.orderId}>
                    {order.outboundNumber} · {order.customerName ?? "Customer"}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="delivery-outbound">
          <label>
            Outbound Number
            <div className="input-with-addon">
              <input
                type="text"
                value={formState.outboundNumber}
                onChange={(event) =>
                  updateForm({ outboundNumber: event.target.value })
                }
                readOnly={!formState.allowOutboundEdit}
                placeholder="Auto-filled from picking"
              />
              <button
                type="button"
                className="btn ghost small"
                onClick={() =>
                  updateForm({
                    allowOutboundEdit: !formState.allowOutboundEdit,
                  })
                }
              >
                {formState.allowOutboundEdit ? "Locked" : "Admin override"}
              </button>
            </div>
          </label>
          <p className="muted">
            Outbound is read-only until override is activated.
          </p>
        </div>

        <div className="delivery-section">
          <h3>Customer Details</h3>
          <div className="field-grid">
            <label className="field-with-autosuggest">
              Customer Id
              <input
                type="text"
                value={customerQuery}
                onChange={(event) => {
                  setCustomerQuery(event.target.value);
                  updateForm({ customerName: event.target.value, customerId: "" });
                  setSelectedCustomer(null);
                }}
                onKeyDown={handleCustomerKeyDown}
                placeholder="Search by ID or name"
              />
              {customerSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {customerSuggestions.map((customer, index) => (
                    <li
                      key={customer.id}
                      className={index === customerFocus ? "active" : ""}
                      onMouseDown={() => applyCustomer(customer)}
                    >
                      <strong>{customer.name}</strong>
                      <span>{customer.city ?? customer.locationText}</span>
                    </li>
                  ))}
                </ul>
              )}
            </label>
            <label>
              Customer Name
              <input
                type="text"
                value={formState.customerName}
                onChange={(event) =>
                  updateForm({ customerName: event.target.value })
                }
                placeholder="Customer display name"
              />
            </label>
            <label>
              Location Type
              <select
                value={formState.customerLocationType}
                onChange={(event) =>
                  updateForm({
                    customerLocationType: event.target
                      .value as typeof locationTypes[number],
                  })
                }
              >
                {locationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-span">
              Location Details
              <input
                type="text"
                value={formState.customerLocationText}
                onChange={(event) =>
                  updateForm({ customerLocationText: event.target.value })
                }
                placeholder="Warehouse / office name, plot etc."
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={formState.address}
                onChange={(event) =>
                  updateForm({ address: event.target.value })
                }
              />
            </label>
            <label>
              Google Map Link
              <input
                type="url"
                value={formState.googleMapLink}
                onChange={(event) =>
                  updateForm({ googleMapLink: event.target.value })
                }
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={formState.customerEmail}
                onChange={(event) =>
                  updateForm({ customerEmail: event.target.value })
                }
                placeholder="customer@example.com"
              />
            </label>
            <label>
              Receiver 1
              <input
                type="text"
                value={formState.receiver1Name}
                onChange={(event) =>
                  updateForm({ receiver1Name: event.target.value })
                }
                placeholder="Primary receiver"
              />
            </label>
            <label>
              Phone 1
              <div className="input-with-icon">
                <input
                  type="tel"
                  value={formState.phone1}
                  onChange={(event) =>
                    updateForm({ phone1: event.target.value })
                  }
                  placeholder="Primary contact"
                />
                {formState.phone1 && (
                  <a
                    href={whatsappUrl(formState.phone1)}
                    target="_blank"
                    rel="noreferrer"
                    className="wa-link"
                    title="Open WhatsApp"
                  >
                    <span aria-hidden="true">📲</span>
                  </a>
                )}
              </div>
            </label>
            <label>
              Receiver 2
              <input
                type="text"
                value={formState.receiver2Name}
                onChange={(event) =>
                  updateForm({ receiver2Name: event.target.value })
                }
                placeholder="Alternate receiver"
              />
            </label>
            <label>
              Phone 2
              <div className="input-with-icon">
                <input
                  type="tel"
                  value={formState.phone2}
                  onChange={(event) =>
                    updateForm({ phone2: event.target.value })
                  }
                  placeholder="Secondary contact (optional)"
                />
                {formState.phone2 && (
                  <a
                    href={whatsappUrl(formState.phone2)}
                    target="_blank"
                    rel="noreferrer"
                    className="wa-link"
                    title="Open WhatsApp"
                  >
                    <span aria-hidden="true">📲</span>
                  </a>
                )}
              </div>
            </label>
            <div className="full-span">
              <button
                type="button"
                className="btn teal small"
                onClick={handleSaveCustomer}
                disabled={savingCustomer}
              >
                {savingCustomer ? "Saving customer…" : "Save to customer list"}
              </button>
              <p className="muted">
                New entries persist in the customer master for future use.
              </p>
            </div>
            <label className="full-span">
              Customer Requirements
              <textarea
                rows={3}
                value={formState.requirements}
                onChange={(event) =>
                  updateForm({ requirements: event.target.value })
                }
                placeholder="Additional instructions appear here"
              />
            </label>
          </div>
        </div>

        <div className="delivery-section">
          <h3>Delivery Details</h3>
          <div className="field-grid">
            <label>
              Transporter Name
              <div className="input-with-addon">
                <select
                  value={formState.transporterId}
                  onChange={(event) =>
                    updateForm({ transporterId: event.target.value })
                  }
                >
                  <option value="">Select transporter</option>
                  {transporters.map((transporter) => (
                    <option key={transporter.id} value={transporter.id}>
                      {transporter.companyName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => setShowTransporterModal(true)}
                >
                  Add
                </button>
              </div>
            </label>
            <label>
              Type of Truck
              <select
                value={formState.truckType}
                onChange={(event) =>
                  updateForm({ truckType: event.target.value })
                }
              >
                {truckTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-span">
              Quantity Under 9
              <div className="qty-table">
                {qtyRows.map((row, index) => (
                  <div key={index} className="qty-row">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(event) =>
                        updateQtyRow(index, "description", event.target.value)
                      }
                      placeholder="Item description"
                    />
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(event) =>
                        updateQtyRow(index, "quantity", event.target.value)
                      }
                      placeholder="Qty"
                    />
                    <button
                      type="button"
                      className="btn ghost tiny"
                      onClick={() => removeQtyRow(index)}
                      disabled={qtyRows.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn borderless"
                  onClick={addQtyRow}
                  disabled={qtyRows.length >= MAX_ROWS}
                >
                  + Add row
                </button>
              </div>
            </label>
            <label>
              Driver Name
              <div className="input-with-addon">
                <select value={formState.driverId} onChange={handleDriverSelect}>
                  <option value="">Select driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.driverName} / {driver.driverNumber}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => setShowDriverModal(true)}
                >
                  Add
                </button>
              </div>
            </label>
            <label>
              Driver Number
              <input
                type="text"
                value={formState.driverNumber}
                onChange={(event) =>
                  updateForm({ driverNumber: event.target.value })
                }
              />
            </label>
            <label>
              Driver ID (Iqama)
              <input
                type="text"
                value={formState.driverIdNumber}
                onChange={(event) =>
                  updateForm({ driverIdNumber: event.target.value })
                }
                placeholder="Iqama number"
              />
            </label>
            <label>
              Outbound Number (copy)
              <input type="text" value={formState.outboundNumber} readOnly />
            </label>
          </div>
        </div>

        <div className="delivery-section gallery">
          <h3>Driver Image Gallery</h3>
          <div className="gallery-grid">
            {["Iqama", "Istimara", "Insurance"].map((label) => {
              const url =
                label === "Iqama"
                  ? selectedDriver?.iqamaImage
                  : label === "Istimara"
                  ? selectedDriver?.istimaraImage
                  : selectedDriver?.insuranceImage;
              return (
                <button
                  key={label}
                  type="button"
                  className="gallery-card"
                  disabled={!url}
                  onClick={() => url && window.open(url, "_blank")}
                >
                  <div className="gallery-label">{label}</div>
                  {url ? (
                    <img src={url} alt={`${label} preview`} loading="lazy" />
                  ) : (
                    <div className="gallery-empty">No image</div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="muted">
            Images are pulled from the driver master. Click any card to enlarge.
          </p>
        </div>

        {error && <div className="banner">{error}</div>}
        {message && <div className="banner success">{message}</div>}
      </div>

      <div className="delivery-placeholder">
        {!selectedOrderId ? (
          <div className="placeholder">
            <p>Select an outbound order to preview the delivery note</p>
          </div>
        ) : (
          <DNPreview
            {...previewProps}
            onPrint={openPrintPreview}
            onDownload={handleDownloadPdf}
            onEmail={handleEmail}
            actionsDisabled={!pdfAvailable}
            printEnabled={true}
          />
        )}
        {emailStatus && (
          <div className="banner success email-banner">{emailStatus}</div>
        )}
      </div>

      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        onPrint={handleModalPrint}
        title={`Delivery Note ${formState.dnNumber || "TBD"}`}
        preview={
          <DNPreview
            {...previewProps}
            hideControls
            actionsDisabled={false}
            printEnabled={true}
          />
        }
      />

      {showDriverModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h4>Add Driver</h4>
            <label>
              Driver Name
              <input
                type="text"
                value={driverForm.driverName}
                onChange={(event) =>
                  setDriverForm((prev) => ({
                    ...prev,
                    driverName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Driver Number
              <input
                type="text"
                value={driverForm.driverNumber}
                onChange={(event) =>
                  setDriverForm((prev) => ({
                    ...prev,
                    driverNumber: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              ID Number
              <input
                type="text"
                value={driverForm.idNumber}
                onChange={(event) =>
                  setDriverForm((prev) => ({
                    ...prev,
                    idNumber: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Truck No
              <input
                type="text"
                value={driverForm.truckNo}
                onChange={(event) =>
                  setDriverForm((prev) => ({
                    ...prev,
                    truckNo: event.target.value,
                  }))
                }
              />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={handleDriverCreate}>
                Save Driver
              </button>
              <button
                className="btn ghost"
                onClick={() => setShowDriverModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransporterModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h4>Add Transporter</h4>
            <label>
              Company
              <input
                type="text"
                value={transporterForm.companyName}
                onChange={(event) =>
                  setTransporterForm((prev) => ({
                    ...prev,
                    companyName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Contact Name
              <input
                type="text"
                value={transporterForm.contactName}
                onChange={(event) =>
                  setTransporterForm((prev) => ({
                    ...prev,
                    contactName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={transporterForm.email}
                onChange={(event) =>
                  setTransporterForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={handleTransporterCreate}>
                Save Transporter
              </button>
              <button
                className="btn ghost"
                onClick={() => setShowTransporterModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {emailModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h4>Email Delivery Note</h4>
            <label>
              Recipients
              <input
                type="text"
                value={emailForm.recipients}
                onChange={(event) =>
                  setEmailForm((prev) => ({
                    ...prev,
                    recipients: event.target.value,
                  }))
                }
                placeholder="comma separated email addresses"
              />
            </label>
            <label>
              Subject
              <input
                type="text"
                value={emailForm.subject}
                onChange={(event) =>
                  setEmailForm((prev) => ({
                    ...prev,
                    subject: event.target.value,
                  }))
                }
                placeholder={`Delivery Note ${formState.dnNumber || ""}`}
              />
            </label>
            <label>
              Message
              <textarea
                rows={3}
                value={emailForm.message}
                onChange={(event) =>
                  setEmailForm((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
                placeholder="Optional message to include in the email."
              />
            </label>
            {emailError && <div className="banner">{emailError}</div>}
            <div className="modal-actions">
              <button
                className="btn"
                onClick={sendEmail}
                disabled={
                  emailSending ||
                  !parseRecipients(emailForm.recipients).length
                }
              >
                {emailSending ? "Sending..." : "Send Email"}
              </button>
              <button
                className="btn ghost"
                onClick={() => setEmailModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DeliveryNotes;
