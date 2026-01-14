import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import DeliveryNotePrint, { type DeliveryNotePrintData } from "../components/DeliveryNotePrint";
import PrintPreviewModal from "../components/PrintPreviewModal";

type OrderSummaryDto = {
  orderId: number;
  invoiceNumber: string | null;
  outboundNumber: string;
  gappPo: string | null;
  customerPo: string | null;
  customerId?: string | null;
  customerName: string | null;
  dnCreated: boolean;
  pickingStatus?: string | null;
  checkingStatus?: string | null;
};

type OutboundInfoDto = {
  orderId: number;
  outboundNumber: string;
  customerName: string;
  customerId: string | null;
  gappPo: string | null;
  customerPo: string | null;
  itemNumbers: string[];
  transporterId?: number | null;
  driverId?: number | null;
};

type CustomerLookupDto = {
  id: number;
  name: string | null;
  city: string | null;
  locationText: string | null;
  googleLocation: string | null;
  sapCustomerId: string | null;
  receiver1Contact: string | null;
  receiver2Contact: string | null;
  receiver1Name: string | null;
  receiver2Name: string | null;
  receiver1Email: string | null;
  receiver2Email: string | null;
  requirements: string | null;
};

type OrderItemDto = {
  partNumber: string;
  description: string | null;
  qty: number;
};

type OrderViewDto = {
  summary: OrderSummaryDto;
  items: OrderItemDto[];
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
  dnDate: string;
  invoiceNumber: string;
  customerPo: string;
  gappPo: string;
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

type LocationFormState = {
  customerLocationType: LocationType;
  customerLocationText: string;
  address: string;
  googleMapLink: string;
  customerEmail: string;
  receiver1Name: string;
  phone1: string;
  receiver2Name: string;
  phone2: string;
};

const generateDnNumber = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `DN-${datePart}-${suffix}`;
};

const resolvePreparedByName = () => {
  if (typeof window === "undefined") {
    return "GoDam User";
  }
  const stored = localStorage.getItem("godam_user");
  if (!stored) {
    return "GoDam User";
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed?.username ?? parsed?.name ?? "GoDam User";
  } catch {
    return "GoDam User";
  }
};

const DeliveryNotes = () => {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [searchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [outboundInfo, setOutboundInfo] = useState<OutboundInfoDto | null>(null);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerLookupDto[]>([]);
  const [customerFocus, setCustomerFocus] = useState(-1);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLookupDto | null>(null);
  const [locationOptions, setLocationOptions] = useState<CustomerLookupDto[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showMissingCustomerMasterModal, setShowMissingCustomerMasterModal] = useState(false);
  const [missingCustomerSapId, setMissingCustomerSapId] = useState<string | null>(null);
  const [locationForm, setLocationForm] = useState<LocationFormState>({
    customerLocationType: locationTypes[0],
    customerLocationText: "",
    address: "",
    googleMapLink: "",
    customerEmail: "",
    receiver1Name: "",
    phone1: "",
    receiver2Name: "",
    phone2: "",
  });
  const [transporters, setTransporters] = useState<TransporterDto[]>([]);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [qtyRows, setQtyRows] = useState<QuantityRow[]>([{ description: "", quantity: "" }]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<number | null>(null);
  const [dnStatus, setDnStatus] = useState<string | null>(null);
  const isFinalized = dnStatus === "FINAL" || dnStatus === "COMPLETE";
  // Fields are editable if: editing mode is ON AND fields are not locked AND not finalized
  // Exception: DN Date and Requirements are always editable (unless finalized)
  const canEditFields = isEditing && !fieldsLocked && !isFinalized;
  // Header fields (Invoice, Outbound, DN Number, DN Date) are always editable unless finalized
  const canEditHeader = !isFinalized;
  // DN Date and Requirements are always editable (unless finalized)
  const canEditDateAndRemarks = !isFinalized;
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipients: "",
    subject: "",
    message: "",
  });
  const [emailSending, setEmailSending] = useState(false);
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
  const customerIdLookupDebounce = useRef<number | null>(null);
  const [loadingCustomerById, setLoadingCustomerById] = useState(false);

  const [formState, setFormState] = useState<DeliveryNoteFormState>({
    dnNumber: generateDnNumber(),
    dnDate: new Date().toISOString(),
    invoiceNumber: "",
    customerPo: "",
    gappPo: "",
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




  // Build print data from current form state
  const buildPrintData = (): DeliveryNotePrintData => {
    const items = qtyRows
      .filter((row) => row.description.trim() && Number(row.quantity) > 0)
      .map((row, index) => {
        const parts = row.description.split(" - ");
        return {
          itemNumber: index + 1,
          partNumber: parts.length > 1 ? parts[0] : "",
          description: parts.length > 1 ? parts.slice(1).join(" - ") : row.description,
          quantity: Number(row.quantity),
          uom: "PCS",
        };
      });

    return {
      dnNumber: formState.dnNumber || undefined,
      outboundNumber: formState.outboundNumber || undefined,
      dnDate: formState.dnDate || new Date().toISOString(),
      invoiceNumber: formState.invoiceNumber || undefined,
      customerPo: formState.customerPo || outboundInfo?.customerPo || undefined,
      gappPo: formState.gappPo || outboundInfo?.gappPo || undefined,
      customerName: formState.customerName || undefined,
      address: formState.address || undefined,
      phone1: formState.phone1 || undefined,
      phone2: formState.phone2 || undefined,
      receiver1Name: formState.receiver1Name || undefined,
      receiver2Name: formState.receiver2Name || undefined,
      customerEmail: formState.customerEmail || undefined,
      googleMapLink: formState.googleMapLink || undefined,
      requirements: formState.requirements || undefined,
      warehouseName: "Main Warehouse",
      warehouseAddress: "Warehouse Address",
      transporterName: selectedTransporter?.companyName || undefined,
      driverName: formState.driverName || undefined,
      driverNumber: formState.driverNumber || undefined,
      truckType: formState.truckType || undefined,
      items,
      verifierName: resolvePreparedByName(),
      preparedBy: resolvePreparedByName(),
    };
  };

  // Handle Print - opens browser print dialog
  const handlePrint = () => {
    // Create a hidden print container
    const printContainer = document.createElement("div");
    printContainer.id = "dn-print-temp-container";
    printContainer.style.position = "absolute";
    printContainer.style.left = "-9999px";
    printContainer.style.top = "0";
    printContainer.style.width = "210mm";
    document.body.appendChild(printContainer);

    // Render the printable component
    import("react-dom/client").then(({ createRoot }) => {
      const root = createRoot(printContainer);
      root.render(
        React.createElement(DeliveryNotePrint, { data: buildPrintData() })
      );

      setTimeout(() => {
        // Add print styles to hide everything except print container
        const printStyle = document.createElement("style");
        printStyle.id = "dn-print-style";
        printStyle.textContent = `
          @media print {
            body * {
              visibility: hidden;
            }
            #dn-print-temp-container,
            #dn-print-temp-container * {
              visibility: visible;
            }
            #dn-print-temp-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `;
        document.head.appendChild(printStyle);

        // Trigger print
        window.print();

        // Clean up after print
        setTimeout(() => {
          document.body.removeChild(printContainer);
          const styleEl = document.getElementById("dn-print-style");
          if (styleEl) {
            document.head.removeChild(styleEl);
          }
        }, 1000);
      }, 100);
    });
  };

  // Handle Preview - opens modal with printable component
  const handlePreview = () => {
    setIsPrintPreviewOpen(true);
  };

  // Handle modal print
  const handleModalPrint = () => {
    setIsPrintPreviewOpen(false);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const whatsappUrl = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : undefined;
  };

  const handleOutboundChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const orderId = Number(event.target.value);
    if (!orderId) {
      setSelectedOrderId(null);
      setOutboundInfo(null);
      setSelectedCustomer(null);
      setFieldsLocked(false);
      setFormState((prev) => ({
        ...prev,
        outboundNumber: "",
        invoiceNumber: "",
        customerId: "",
        customerName: "",
        customerPo: "",
        gappPo: "",
      }));
      setQtyRows([{ description: "", quantity: "" }]);
      return;
    }

    setSelectedOrderId(orderId);
    setFieldsLocked(false); // Keep fields editable
    setIsEditing(true); // Enable edit mode
  };

  const loadOrders = async () => {
    try {
      // Load orders that are ready to ship: picked = true OR checked = true
      // Interpreted as: pickingStatus = COMPLETED OR checkingStatus = CONFIRMED
      const response = await api.get<OrderSummaryDto[]>("/orders?dnCreated=false");
      // Filter: picked (pickingStatus = COMPLETED) OR checked (checkingStatus = CONFIRMED)
      const filtered = (response.data ?? []).filter(
        (order) =>
          !order.dnCreated &&
          (order.pickingStatus?.toUpperCase() === "COMPLETED" ||
            order.checkingStatus?.toUpperCase() === "CONFIRMED")
      );
      setOrders(filtered);
    } catch (e) {
      console.error(e);
      setError("Unable to load outbound orders.");
    }
  };

  const loadTransporters = async () => {
    try {
      const response = await api.get<TransporterDto[]>("/transporter");
      setTransporters(response.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await api.get<DriverDto[]>("/driver");
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

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (customerIdLookupDebounce.current) {
        window.clearTimeout(customerIdLookupDebounce.current);
      }
    };
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
      return;
    }
    const fetchOutbound = async () => {
      try {
        // Get full order data including items and transport
        const orderViewResponse = await api.get<OrderViewDto>(`/orders/${selectedOrderId}`);
        const orderSummary = orderViewResponse.data?.summary;
        const orderItems = orderViewResponse.data?.items ?? [];
        
        if (!orderSummary) {
          setError("Order not found.");
          return;
        }

        // Get outbound info for customer data
        const outboundResponse = await api.get<OutboundInfoDto>(`/outbound/${selectedOrderId}`);
        setOutboundInfo(outboundResponse.data);
        setError(null);
        
        // Auto-fill basic fields from order (but NOT customer name yet - will be set from customer table)
        setFormState((prev) => ({
          ...prev,
          outboundNumber: orderSummary.outboundNumber ?? prev.outboundNumber,
          invoiceNumber: orderSummary.invoiceNumber ?? prev.invoiceNumber,
          customerPo: orderSummary.customerPo ?? prev.customerPo,
          gappPo: orderSummary.gappPo ?? prev.gappPo,
          // Map customer_id to Customer ID field only
          customerId: orderSummary.customerId ?? prev.customerId,
          // DO NOT set customerName here - it might contain customer_id
          // Customer name will be set from customer table lookup below
        }));

        // Load customer details and auto-fill customer fields using outbound response
        // Order.customer_id should match Customer.sap_customer_id
        if (outboundResponse.data.customerId) {
          try {
            // First try direct lookup by SAP Customer ID (exact match)
            try {
              const customer = await api.get<CustomerLookupDto>(
                `/customer/by-sap-id/${encodeURIComponent(outboundResponse.data.customerId)}`
              );
              if (customer.data) {
                applyCustomer(customer.data);
                setFieldsLocked(false); // Keep fields editable
                return; // Successfully loaded customer
              }
            } catch (directLookupError: unknown) {
              // If direct lookup fails (404), try search as fallback
              if ((directLookupError as { response?: { status?: number } })?.response?.status === 404) {
                console.log(`Customer not found by SAP ID: ${outboundResponse.data.customerId}, trying search...`);
                // Fall through to search
              } else {
                throw directLookupError; // Re-throw if it's a different error
              }
            }

            // Fallback: Try search if direct lookup didn't work
            const customerResponse = await api.get<CustomerLookupDto[]>(
              `/customer/search?q=${encodeURIComponent(outboundResponse.data.customerId)}`
            );
            const customer = customerResponse.data?.find(
              (c) => c.sapCustomerId?.toLowerCase() === outboundResponse.data.customerId?.toLowerCase()
            );
            if (customer) {
              applyCustomer(customer);
              setFieldsLocked(false); // Keep fields editable
            } else {
              // Customer master not found - show popup
              setMissingCustomerSapId(outboundResponse.data.customerId);
              setShowMissingCustomerMasterModal(true);
              // Still populate basic fields from order
              // Only use orderSummary.customerName if it doesn't look like a customer_id (all digits)
              const potentialCustomerName = orderSummary.customerName;
              const isCustomerIdPattern = /^\d+$/.test(potentialCustomerName || "");
              setFormState((prev) => ({
                ...prev,
                customerId: outboundResponse.data.customerId || "",
                // Only use customerName if it's not a customer_id pattern
                customerName: (!isCustomerIdPattern && potentialCustomerName) ? potentialCustomerName : prev.customerName,
              }));
              setFieldsLocked(false); // Keep fields editable
            }
          } catch (e: unknown) {
            // If 404 or customer not found, show popup
            const errorResponse = (e as { response?: { status?: number } } | null)?.response;
            if (errorResponse?.status === 404 || errorResponse?.status === 400) {
              setMissingCustomerSapId(outboundResponse.data.customerId);
              setShowMissingCustomerMasterModal(true);
              // Still populate basic fields from order
              // Only use orderSummary.customerName if it doesn't look like a customer_id (all digits)
              const potentialCustomerName = orderSummary.customerName;
              const isCustomerIdPattern = /^\d+$/.test(potentialCustomerName || "");
              setFormState((prev) => ({
                ...prev,
                customerId: outboundResponse.data.customerId || "",
                // Only use customerName if it's not a customer_id pattern
                customerName: (!isCustomerIdPattern && potentialCustomerName) ? potentialCustomerName : prev.customerName,
              }));
              setFieldsLocked(false); // Keep fields editable
            } else {
              console.error("Failed to load customer details", e);
              // Show popup even on other errors
              setMissingCustomerSapId(outboundResponse.data.customerId);
              setShowMissingCustomerMasterModal(true);
              // Still populate basic fields from order
              // Only use orderSummary.customerName if it doesn't look like a customer_id (all digits)
              const potentialCustomerName = orderSummary.customerName;
              const isCustomerIdPattern = /^\d+$/.test(potentialCustomerName || "");
              setFormState((prev) => ({
                ...prev,
                customerId: outboundResponse.data.customerId || "",
                // Only use customerName if it's not a customer_id pattern
                customerName: (!isCustomerIdPattern && potentialCustomerName) ? potentialCustomerName : prev.customerName,
              }));
              setFieldsLocked(false); // Keep fields editable
            }
          }
        } else {
          // No customer ID in order - that's okay, customer was optional
          // Only use orderSummary.customerName if it doesn't look like a customer_id (all digits)
          const potentialCustomerName = orderSummary.customerName;
          const isCustomerIdPattern = /^\d+$/.test(potentialCustomerName || "");
          setFormState((prev) => ({
            ...prev,
            customerId: "",
            // Only use customerName if it's not a customer_id pattern
            customerName: (!isCustomerIdPattern && potentialCustomerName) ? potentialCustomerName : prev.customerName,
          }));
          setFieldsLocked(false); // Keep fields editable
        }

        // Auto-fill transporter and driver from order transport
        if (outboundResponse.data.transporterId != null) {
          updateForm({ transporterId: String(outboundResponse.data.transporterId) });
        }
        if (outboundResponse.data.driverId != null) {
          // Find driver in the loaded drivers list
          const driver = drivers.find((d) => d.id === outboundResponse.data.driverId);
          if (driver) {
            updateForm({
              driverId: String(driver.id),
              driverName: driver.driverName,
              driverNumber: driver.driverNumber,
              driverIdNumber: driver.idNumber ?? "",
              truckType: driver.truckNo ?? formState.truckType,
            });
          } else {
            // Driver ID exists but not in loaded list, just set the ID
            updateForm({ driverId: String(outboundResponse.data.driverId) });
          }
        }
        
        // Auto-fill items from order_items (editable)
        if (orderItems.length > 0) {
          setQtyRows(
            orderItems.map((item) => ({
              description: item.description
                ? `${item.partNumber ?? ""} - ${item.description}`
                : item.partNumber ?? "",
              quantity: item.qty != null ? String(item.qty) : "",
            }))
          );
        } else {
          setQtyRows([]);
        }
      } catch (e) {
        console.error(e);
        setError("Unable to resolve outbound details.");
      }
    };
    fetchOutbound();
  }, [selectedOrderId, orders]);

  // Items are now loaded in the fetchOutbound effect above

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
        const response = await api.get<CustomerLookupDto[]>(`/customer/search?q=${encodeURIComponent(term)}`);
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
      outboundInfo.customerId &&
      !selectedCustomer &&
      customerSuggestions.length > 0
    ) {
      const matches = customerSuggestions.filter(
        (customer) =>
          customer.sapCustomerId &&
          customer.sapCustomerId.toLowerCase() === outboundInfo.customerId?.toLowerCase()
      );
      if (matches.length === 1) {
        applyCustomer(matches[0]);
      } else if (matches.length > 1) {
        setLocationOptions(matches);
        setShowLocationModal(true);
      }
    }
  }, [customerSuggestions, outboundInfo, selectedCustomer]);

  const applyCustomer = (customer: CustomerLookupDto, lockFields = false) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name ?? customer.sapCustomerId ?? "");
    setCustomerSuggestions([]);
    
    setFormState((prev) => {
      // Location Details priority: locationText -> city -> address
      const locationDetails = customer.locationText 
        || (customer.city ? customer.city : "")
        || prev.address
        || "";
      
      return {
        ...prev,
        // Map customer_id (SAP Customer ID) to Customer ID field only - DO NOT put in Customer Name
        customerId: customer.sapCustomerId ?? prev.customerId,
        // Map customer name to Customer Name field only - DO NOT put customer_id here
        customerName: customer.name ?? prev.customerName,
        // Location Details: locationText -> city -> address (priority order)
        customerLocationText: locationDetails,
        // Address: use locationText if available, else city, else keep existing
        address: customer.locationText || customer.city || prev.address,
        googleMapLink: customer.googleLocation ?? prev.googleMapLink,
        phone1: customer.receiver1Contact ?? prev.phone1,
        phone2: customer.receiver2Contact ?? prev.phone2,
        receiver1Name: customer.receiver1Name ?? prev.receiver1Name,
        receiver2Name: customer.receiver2Name ?? prev.receiver2Name,
        customerEmail: customer.receiver1Email ?? prev.customerEmail,
        requirements: customer.requirements ?? prev.requirements,
      };
    });
    // Lock fields if requested (when auto-filled from Customer ID lookup)
    if (lockFields) {
      setFieldsLocked(true);
    } else {
      setFieldsLocked(false); // Keep fields editable
    }
  };

  // Handle Customer ID change/blur - auto-fetch customer from Customer table
  const handleCustomerIdChange = async (customerId: string) => {
    // Clear any previous debounce
    if (customerIdLookupDebounce.current) {
      window.clearTimeout(customerIdLookupDebounce.current);
      customerIdLookupDebounce.current = null;
    }

    // If empty, clear customer data
    if (!customerId || customerId.trim() === "") {
      setSelectedCustomer(null);
      setShowMissingCustomerMasterModal(false);
      setMissingCustomerSapId(null);
      return;
    }

    const trimmedCustomerId = customerId.trim();

    // Debounce the lookup
    customerIdLookupDebounce.current = window.setTimeout(async () => {
      setLoadingCustomerById(true);
      try {
        // Fetch customer by SAP Customer ID
        const customer = await api.get<CustomerLookupDto>(
          `/customer/by-sap-id/${encodeURIComponent(trimmedCustomerId)}`
        );
        
        if (customer.data) {
          // Auto-fill all fields and lock them
          applyCustomer(customer.data, true);
          setShowMissingCustomerMasterModal(false);
          setMissingCustomerSapId(null);
        } else {
          // Customer not found
          setMissingCustomerSapId(trimmedCustomerId);
          setShowMissingCustomerMasterModal(true);
          setSelectedCustomer(null);
        }
      } catch (error: unknown) {
        const errorResponse = (error as { response?: { status?: number } } | null)?.response;
        if (errorResponse?.status === 404) {
          // Customer not found - show popup
          setMissingCustomerSapId(trimmedCustomerId);
          setShowMissingCustomerMasterModal(true);
          setSelectedCustomer(null);
        } else {
          console.error("Failed to load customer by ID", error);
          setError("Failed to load customer. Please try again.");
        }
      } finally {
        setLoadingCustomerById(false);
      }
    }, 500); // 500ms debounce
  };


  const updateForm = (payload: Partial<DeliveryNoteFormState>) => {
    setFormState((prev) => ({ ...prev, ...payload }));
  };


  const isValidQuantity = () => qtyRows.some((row) => row.description.trim() && Number(row.quantity) > 0);

  const hasLocation = Boolean(
    formState.customerLocationText.trim() || formState.address.trim()
  );
  // Customer is validated at order upload time, so if order exists, customer should be valid
  // Allow save if: customer is selected OR customer data exists from order
  const hasValidCustomer = Boolean(
    selectedCustomer || // Customer loaded from Customers table
    (formState.customerId && formState.customerName) // Customer data from order (already validated at upload)
  );
  
  const canSave = Boolean(
    hasValidCustomer &&
      formState.invoiceNumber.trim() &&
      formState.transporterId &&
      formState.driverId &&
      isValidQuantity() &&
      hasLocation
  );

  const executeSave = async (status: "COMPLETE" | "INCOMPLETE") => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const preparedBy = resolvePreparedByName();
      const payload = {
        orderId: selectedOrderId,
        dnNumber: formState.dnNumber,
        dnDate: formState.dnDate || new Date().toISOString(),
        invoiceNumber: formState.invoiceNumber.trim(),
        customerPo: formState.customerPo || outboundInfo?.customerPo,
        gappPo: formState.gappPo || outboundInfo?.gappPo,
        preparedBy,
        outboundNumber: formState.outboundNumber,
        customerId: selectedCustomer?.id,
        address: formState.address,
        googleMapLink: formState.googleMapLink,
        requirements: formState.requirements,
        transporterId: Number(formState.transporterId),
        driverId: Number(formState.driverId),
        truckType: formState.truckType,
        status,
        quantities: qtyRows
          .filter((row) => row.description.trim() && Number(row.quantity) > 0)
          .map((row) => ({
            description: row.description.trim(),
            quantity: Number(row.quantity),
          })),
      };

      let response;
      if (savedNoteId) {
        // Update existing DN
        response = await api.put<DeliveryNoteResponse>(`/api/delivery-note/${savedNoteId}`, payload);
      } else {
        // Create new DN
        response = await api.post<DeliveryNoteResponse>("/api/delivery-note", payload);
      }

      setSavedNoteId(response.data.id);
      setDnStatus(response.data.status || status);
      setMessage("Delivery Note saved successfully");
      setIsEditing(false);
      setFieldsLocked(true); // Lock fields after save
      await loadOrders();
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message 
        || (e as { message?: string })?.message 
        || "Failed to save delivery note.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const validateStock = async (): Promise<boolean> => {
    // Stock validation would go here - check if quantities are available
    // For now, we'll let the backend handle it
    return true;
  };

  const handleSave = async () => {
    if (!formState.invoiceNumber.trim()) {
      setError("Invoice number is required.");
      return;
    }
    if (!selectedCustomer) {
      setError("Customer is required.");
      return;
    }
    if (!formState.transporterId) {
      setError("Transporter is required.");
      return;
    }
    if (!formState.driverId) {
      setError("Driver is required.");
      return;
    }
    if (!isValidQuantity()) {
      setError("At least one item with quantity > 0 is required.");
      return;
    }
    
    // Validate stock availability
    const stockValid = await validateStock();
    if (!stockValid) {
      setError("Insufficient stock for one or more items.");
      return;
    }

    await executeSave("COMPLETE");
  };


  // Handle Download PDF - generates PDF from printable component
  const handleDownloadPdf = async () => {
    if (!savedNoteId && !selectedOrderId) {
      setError("Please select an outbound or save the delivery note before downloading.");
      return;
    }

    try {
      // If saved, use backend PDF endpoint
      if (savedNoteId) {
        const filename = `DN_${formState.dnNumber || savedNoteId}.pdf`;
        const response = await api.get<Blob>(`/api/delivery-note/${savedNoteId}/pdf`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(response.data);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      } else {
        // For unsaved DNs, generate client-side PDF (requires html2pdf library)
        setError("Please save the delivery note before downloading PDF.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to download PDF.");
    }
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
      await api.post(`/delivery-note/${savedNoteId}/email`, {
        recipients,
        subject:
          emailForm.subject ||
          `Delivery Note ${formState.dnNumber || formState.outboundNumber}`,
        message: emailForm.message,
      });
      setEmailModalOpen(false);
      setMessage("Delivery note email queued.");
      setEmailForm({ recipients: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setEmailError("Failed to send email.");
    } finally {
      setEmailSending(false);
    }
  };





  const handleTransporterCreate = async () => {
    if (!transporterForm.companyName.trim()) {
      setError("Transporter name is required.");
      return;
    }
    try {
      const response = await api.post<TransporterDto>("/transporter", transporterForm);
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
      const response = await api.post<DriverDto>("/driver", driverForm);
      setDrivers((prev) => [...prev, response.data]);
      updateForm({
        driverId: String(response.data.id),
        driverName: response.data.driverName,
        driverNumber: response.data.driverNumber,
        driverIdNumber: response.data.idNumber ?? "",
        truckType: response.data.truckNo ?? formState.truckType,
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
              onClick={() => {
                if (isFinalized) {
                  setError("Cannot edit finalized delivery note.");
                  return;
                }
                setIsEditing(!isEditing);
                if (!isEditing) {
                  setFieldsLocked(false); // Unlock fields when entering edit mode
                }
              }}
              disabled={isFinalized}
            >
              {isEditing ? "Cancel Edit" : "Edit"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={handlePreview}
              disabled={!selectedOrderId}
            >
              Preview
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={handleDownloadPdf}
              disabled={!savedNoteId}
            >
              Download
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={handlePrint}
              disabled={!savedNoteId && !isPrintPreviewOpen}
            >
              Print
            </button>
            <button
              type="button"
              className="btn teal"
              onClick={handleSave}
              disabled={saving || !canSave}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="delivery-outbound">
          <div className="field-grid">
            <label>
              Outbound Number
              <select
                value={selectedOrderId ?? ""}
                onChange={handleOutboundChange}
                disabled={!canEditHeader}
              >
                <option value="">Select outbound</option>
                {orders.map((order) => (
                  <option key={order.orderId} value={order.orderId}>
                    {order.outboundNumber} · {order.customerName ?? "Customer"} · {order.invoiceNumber ?? "No Invoice"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Invoice Number
              <input
                type="text"
                value={formState.invoiceNumber}
                onChange={(event) => updateForm({ invoiceNumber: event.target.value })}
                placeholder="Invoice number"
                readOnly={!canEditHeader}
              />
            </label>
            <label>
              DN Number
              <input
                type="text"
                value={formState.dnNumber}
                onChange={(event) => updateForm({ dnNumber: event.target.value })}
                placeholder="DN number"
                readOnly={!canEditHeader}
              />
            </label>
            <label>
              DN Date
              <input
                type="date"
                value={formState.dnDate ? new Date(formState.dnDate).toISOString().split('T')[0] : ''}
                onChange={(event) => {
                  const date = event.target.value ? new Date(event.target.value).toISOString() : '';
                  updateForm({ dnDate: date });
                }}
                readOnly={!canEditDateAndRemarks}
              />
            </label>
          </div>
        </div>

        <div className="delivery-section">
          <div className="section-header">
            <h3>Customer Details</h3>
            {!selectedCustomer && (
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setShowAddLocationModal(true)}
              >
                + Add Location
              </button>
            )}
          </div>
          <div className="field-grid">
            <label>
              Customer Name
              <input
                type="text"
                value={formState.customerName}
                onChange={(event) => updateForm({ customerName: event.target.value })}
                placeholder="Customer name"
                readOnly={!canEditFields}
              />
            </label>
            <label>
              Customer ID
              <input
                type="text"
                value={formState.customerId}
                onChange={(event) => {
                  updateForm({ customerId: event.target.value });
                  // Trigger lookup on change (debounced)
                  handleCustomerIdChange(event.target.value);
                }}
                onBlur={(event) => {
                  // Also trigger lookup on blur if value changed
                  handleCustomerIdChange(event.target.value);
                }}
                placeholder="Customer ID"
                readOnly={!canEditHeader || loadingCustomerById}
              />
              {loadingCustomerById && (
                <span style={{ fontSize: "0.85em", color: "#94a3b8", marginLeft: "0.5rem" }}>
                  Loading...
                </span>
              )}
            </label>
            <label>
              Location Type
              <select
                value={formState.customerLocationType}
                onChange={(event) =>
                  updateForm({
                    customerLocationType: event.target.value as typeof locationTypes[number],
                  })
                }
                disabled={!canEditFields}
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
                onChange={(event) => updateForm({ customerLocationText: event.target.value })}
                placeholder="Location details"
                readOnly={!canEditFields}
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={formState.address}
                onChange={(event) => updateForm({ address: event.target.value })}
                placeholder="Address"
                readOnly={!canEditFields}
              />
            </label>
            <label>
              Google Map Link
              <input
                type="url"
                value={formState.googleMapLink}
                onChange={(event) => updateForm({ googleMapLink: event.target.value })}
                placeholder="Google Map link"
                readOnly={!canEditFields}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={formState.customerEmail}
                onChange={(event) => updateForm({ customerEmail: event.target.value })}
                placeholder="Email"
                readOnly={!canEditFields}
              />
            </label>
            <label>
              Receiver 1
              <input
                type="text"
                value={formState.receiver1Name}
                onChange={(event) => updateForm({ receiver1Name: event.target.value })}
                placeholder="Receiver 1 name"
                readOnly={!canEditFields}
              />
            </label>
            <label>
              Phone 1
              <div className="input-with-icon">
                <input
                  type="tel"
                  value={formState.phone1}
                  onChange={(event) => updateForm({ phone1: event.target.value })}
                  placeholder="Phone 1"
                  readOnly={!canEditFields}
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
                onChange={(event) => updateForm({ receiver2Name: event.target.value })}
                placeholder="Receiver 2 name"
                readOnly={!canEditFields}
              />
            </label>
            <label>
              Phone 2
              <div className="input-with-icon">
                <input
                  type="tel"
                  value={formState.phone2}
                  onChange={(event) => updateForm({ phone2: event.target.value })}
                  placeholder="Phone 2"
                  readOnly={!canEditFields}
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
            <label className="full-span">
              Customer Requirements
              <textarea
                rows={3}
                value={formState.requirements}
                onChange={(event) => updateForm({ requirements: event.target.value })}
                placeholder="Requirements/remarks"
                readOnly={!canEditDateAndRemarks}
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
                  onChange={(event) => {
                    const transporterId = event.target.value;
                    const selected = transporters.find((t) => String(t.id) === transporterId);
                    if (selected) {
                      updateForm({ transporterId });
                    } else {
                      updateForm({ transporterId: "" });
                    }
                  }}
                  disabled={!canEditFields}
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
                  disabled={!canEditFields}
                >
                  Add
                </button>
              </div>
            </label>
            {selectedTransporter && (
              <>
                <label>
                  Transporter Contact
                  <input
                    type="text"
                    value={selectedTransporter.contactName ?? ""}
                    readOnly
                    placeholder="Auto-filled from transporter database"
                  />
                </label>
                <label>
                  Transporter Email
                  <input
                    type="email"
                    value={selectedTransporter.email ?? ""}
                    readOnly
                    placeholder="Auto-filled from transporter database"
                  />
                </label>
              </>
            )}
            <label>
              Type of Truck
              <select
                value={formState.truckType}
                onChange={(event) =>
                  updateForm({ truckType: event.target.value })
                }
                disabled={!canEditFields}
              >
                {truckTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-span">
              Items (Auto-loaded from order - editable)
              <div className="qty-table">
                {qtyRows.map((row, index) => (
                  <div key={index} className="qty-row">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => {
                        const newRows = [...qtyRows];
                        newRows[index] = { ...newRows[index], description: e.target.value };
                        setQtyRows(newRows);
                      }}
                      placeholder="Item description"
                      disabled={isFinalized}
                    />
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => {
                        const newRows = [...qtyRows];
                        newRows[index] = { ...newRows[index], quantity: e.target.value };
                        setQtyRows(newRows);
                      }}
                      placeholder="Qty"
                      disabled={isFinalized}
                    />
                  </div>
                ))}
                {qtyRows.length === 0 && (
                  <p className="muted">Items will be loaded automatically when outbound is selected.</p>
                )}
              </div>
            </label>
            <label>
              Driver Name
              <div className="input-with-addon">
                <select
                  value={formState.driverId}
                  onChange={(event) => {
                    const driverId = event.target.value;
                    const selected = drivers.find((d) => String(d.id) === driverId);
                    if (selected) {
                      updateForm({
                        driverId: driverId,
                        driverName: selected.driverName,
                        driverNumber: selected.driverNumber,
                        driverIdNumber: selected.idNumber ?? "",
                        truckType: selected.truckNo ?? formState.truckType,
                      });
                    } else {
                      updateForm({
                        driverId: "",
                        driverName: "",
                        driverNumber: "",
                        driverIdNumber: "",
                      });
                    }
                  }}
                  disabled={!canEditFields}
                >
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
                  disabled={!canEditFields}
                >
                  Add
                </button>
              </div>
            </label>
            {selectedDriver && (
              <>
                <label>
                  Driver Number
                  <input
                    type="text"
                    value={formState.driverNumber}
                    readOnly
                    placeholder="Auto-filled from driver database"
                  />
                </label>
                <label>
                  Driver ID (Iqama)
                  <input
                    type="text"
                    value={formState.driverIdNumber}
                    readOnly
                    placeholder="Auto-filled from driver database"
                  />
                </label>
                <label>
                  Truck Number
                  <input
                    type="text"
                    value={selectedDriver.truckNo ?? ""}
                    readOnly
                    placeholder="Auto-filled from driver database"
                  />
                </label>
              </>
            )}
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


      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        onPrint={handleModalPrint}
        title={`Delivery Note ${formState.dnNumber || "TBD"}`}
        preview={
          <DeliveryNotePrint
            data={buildPrintData()}
            className="preview-mode"
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

      {showLocationModal && locationOptions.length > 0 && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Select Customer Location</h3>
              <button className="btn tiny" onClick={() => setShowLocationModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p className="muted">Multiple locations found for this customer. Choose one.</p>
              <div className="selection-list">
                {locationOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="selection-item"
                    onClick={() => {
                      applyCustomer(option);
                      setShowLocationModal(false);
                    }}
                  >
                    <strong>{option.name ?? "Customer"}</strong>
                    <span>{option.locationText || option.city || "No location details"}</span>
                    <span>{option.receiver1Name || option.receiver1Contact || "-"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddLocationModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Location</h3>
              <button className="btn tiny" onClick={() => setShowAddLocationModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Location Type
                  <select
                    value={locationForm.customerLocationType}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        customerLocationType: event.target
                          .value as typeof locationTypes[number],
                      }))
                    }
                  >
                    {locationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Location Name
                  <input
                    className="search-input"
                    value={locationForm.customerLocationText}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        customerLocationText: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Address
                  <input
                    className="search-input"
                    value={locationForm.address}
                    onChange={(event) =>
                      setLocationForm((prev) => ({ ...prev, address: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Google Map Link
                  <input
                    className="search-input"
                    value={locationForm.googleMapLink}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        googleMapLink: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    className="search-input"
                    value={locationForm.customerEmail}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        customerEmail: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Receiver 1
                  <input
                    className="search-input"
                    value={locationForm.receiver1Name}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        receiver1Name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Phone 1
                  <input
                    className="search-input"
                    value={locationForm.phone1}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        phone1: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Receiver 2
                  <input
                    className="search-input"
                    value={locationForm.receiver2Name}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        receiver2Name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Phone 2
                  <input
                    className="search-input"
                    value={locationForm.phone2}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        phone2: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowAddLocationModal(false)}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  updateForm({
                    customerLocationType: locationForm.customerLocationType,
                    customerLocationText: locationForm.customerLocationText,
                    address: locationForm.address,
                    googleMapLink: locationForm.googleMapLink,
                    customerEmail: locationForm.customerEmail,
                    receiver1Name: locationForm.receiver1Name,
                    receiver2Name: locationForm.receiver2Name,
                    phone1: locationForm.phone1,
                    phone2: locationForm.phone2,
                  });
                  setShowAddLocationModal(false);
                }}
              >
                Use Location
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

      {showMissingCustomerMasterModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h4>Customer Not Found</h4>
            <div style={{ marginBottom: "1rem" }}>
              {missingCustomerSapId ? (
                <>
                  <p style={{ fontSize: "1.1em", fontWeight: "bold", color: "#333", marginBottom: "0.5rem" }}>
                    Customer ID: <span style={{ color: "#0066cc" }}>{missingCustomerSapId}</span>
                  </p>
                  <p>
                    The customer record is not found in the Customers table.
                    Please add the customer to continue, or cancel to clear the Customer ID field.
                  </p>
                </>
              ) : (
                <p>Customer record not found. Please add the customer or cancel.</p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn ghost"
                onClick={() => {
                  setShowMissingCustomerMasterModal(false);
                  setMissingCustomerSapId(null);
                  // Clear Customer ID field
                  updateForm({ customerId: "" });
                  setSelectedCustomer(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  // Navigate to Customers page to add customer
                  const url = missingCustomerSapId 
                    ? `/customers?sapCustomerId=${encodeURIComponent(missingCustomerSapId)}`
                    : "/customers";
                  window.location.href = url;
                }}
              >
                Add New Customer {missingCustomerSapId ? `(ID: ${missingCustomerSapId})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DeliveryNotes;
