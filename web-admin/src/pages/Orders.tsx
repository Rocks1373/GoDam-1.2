import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiBase } from "../services/api";
import { AxiosError } from "axios";
import * as XLSX from "xlsx";
import { useAuth } from "../contexts/authContext";
import { io } from "socket.io-client";

type UploadRow = {
  salesOrder?: string;
  outboundNumber: string;
  customerPo?: string;
  customerId?: string;
  partNumber: string;
  qty: number;
  invoiceNumber?: string;
};

type OrderSummaryDto = {
  orderId: number;
  invoiceNumber: string | null;
  outboundNumber: string;
  gappPo: string | null;
  customerPo: string | null;
  customerId?: string | null;
  customerName: string | null;
  dnCreated: boolean;
  itemCount: number;
  totalQty: number;
  pickingStatus?: string | null;
  checkingStatus?: string | null;
  insufficientStock?: boolean;
};

type OrderItemDto = {
  partNumber: string;
  description: string | null;
  qty: number;
  availableQty?: number | null;
  pickedQty?: number | null;
  pickedBy?: string | null;
  pickedRack?: string | null;
  picked?: boolean;
};

type OrderViewDto = {
  summary: OrderSummaryDto;
  items: OrderItemDto[];
};

type MovementDto = {
  movementType?: string | null;
  partNumber?: string | null;
  qtyChange?: number | null;
};

type StockItemDto = {
  partNumber: string;
  rack?: string | null;
  combineRack?: string | null;
  storageLocation?: string | null;
};

const modalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 500,
};

const modalCardStyle: CSSProperties = {
  background: "#0b1223",
  borderRadius: 12,
  padding: "24px",
  minWidth: 360,
  boxShadow: "0 25px 60px rgba(2, 6, 23, 0.8)",
};

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [ownerOverrideModal, setOwnerOverrideModal] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerOverrideMessage, setOwnerOverrideMessage] = useState<string | null>(null);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadRows, setUploadRows] = useState<UploadRow[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [suggestedRack, setSuggestedRack] = useState<Record<string, string>>({});
  const [orderDetails, setOrderDetails] = useState<Record<number, OrderViewDto>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  const [detailErrors, setDetailErrors] = useState<Set<number>>(new Set());
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPickEditModal, setShowPickEditModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedPickItem, setSelectedPickItem] = useState<OrderItemDto | null>(null);
  const [pickEditQty, setPickEditQty] = useState("");
  const [pickEditError, setPickEditError] = useState<string | null>(null);
  const [pickEditLoading, setPickEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    invoiceNumber: "",
    customerName: "",
    customerPo: "",
    gappPo: "",
    reason: "",
    performedBy: "",
  });
  const [deleteForm, setDeleteForm] = useState({ reason: "", performedBy: "" });
  const [sendReason, setSendReason] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [sendPerformedBy, setSendPerformedBy] = useState("");
  const [sendOwnerPassword, setSendOwnerPassword] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editItemPartNumber, setEditItemPartNumber] = useState("");
  const [editItemQty, setEditItemQty] = useState("");
  const [editItemError, setEditItemError] = useState<string | null>(null);
  const [editItemLoading, setEditItemLoading] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  const isAdmin = (user?.role ?? "").toUpperCase() === "ADMIN";
  const selectedOrderItems = selectedOrderId
    ? orderDetails[selectedOrderId]?.items ?? []
    : [];
  const [orderLineStages, setOrderLineStages] = useState<
    Record<number, Record<string, number>>
  >({});
  const realtimeBase = import.meta.env.VITE_REALTIME_URL ?? apiBase;

const toggleOrderExpand = (orderId: number) => {
  const newExpanded = new Set(expandedOrders);
  if (newExpanded.has(orderId)) {
    newExpanded.delete(orderId);
  } else {
    newExpanded.add(orderId);
  }
  setExpandedOrders(newExpanded);
  loadOrderDetailIfNeeded(orderId);
};

const generateDeliveryNote = (orderId: number) => {
  navigate(`/delivery-notes?orderId=${orderId}`);
};

  const loadOrderDetailIfNeeded = async (orderId: number) => {
    if (orderDetails[orderId] || loadingDetails.has(orderId)) {
      return;
    }
    setLoadingDetails((prev) => new Set(prev).add(orderId));
    setDetailErrors((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
    try {
      const response = await api.get<OrderViewDto>(`/orders/${orderId}`);
      const detail = response.data;
      setOrderDetails((prev) => ({ ...prev, [orderId]: detail }));

      if (detail.summary?.outboundNumber) {
        try {
          const movementResp = await api.get<MovementDto[]>(
            `/movements/${detail.summary.outboundNumber}`
          );
          const stages = buildLineStages(movementResp.data ?? []);
          setOrderLineStages((prev) => ({ ...prev, [orderId]: stages }));
        } catch {
          // Ignore movement fetch failures for read-only UI.
        }
      }

      const items = detail.items ?? [];
      const partNumbers = [...new Set(items.map((item) => item.partNumber).filter(Boolean))];
      const newSuggested: Record<string, string> = {};
      await Promise.all(
        partNumbers.map(async (partNumber) => {
          const stockResponse = await api.get<StockItemDto[]>("/stock", {
            params: { partNumber },
          });
          const first = stockResponse.data?.[0];
          if (first) {
            const suggestion = first.rack || first.combineRack || first.storageLocation || "";
            if (suggestion) {
              newSuggested[partNumber] = suggestion;
            }
          }
        })
      );
      setSuggestedRack((prev) => ({ ...prev, ...newSuggested }));
    } catch {
      setDetailErrors((prev) => new Set(prev).add(orderId));
    } finally {
      setLoadingDetails((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const buildLineStages = (movements: MovementDto[]) => {
    const stages: Record<string, number> = {};
    movements.forEach((movement) => {
      const partNumber = movement.partNumber ?? "";
      if (!partNumber) return;
      const stage = movementStage(movement.movementType ?? "");
      const current = stages[partNumber] ?? 0;
      if (stage > current) {
        stages[partNumber] = stage;
      }
    });
    return stages;
  };

  const movementStage = (movementType: string) => {
    const type = movementType.toUpperCase();
    if (type.startsWith("O109")) return 4;
    if (type.startsWith("O106")) return 3;
    if (type.startsWith("O104")) return 2;
    if (type.startsWith("O103")) return 1;
    return 0;
  };

  const statusLabelForStage = (stage: number) => {
    if (stage >= 4) return "[✓✓✓✓]";
    if (stage === 3) return "[✓✓✓]";
    if (stage === 2) return "[✓✓]";
    if (stage === 1) return "[✓]";
    return "[ ]";
  };

  useEffect(() => {
    const token = localStorage.getItem("godam_token");
    const socket = io(realtimeBase, {
      transports: ["websocket"],
      auth: token ? { token } : undefined,
    });

    socket.on("PICKED", (payload: Record<string, unknown>) => {
      const orderId = Number(payload.orderId);
      const partNumber = String(payload.partNumber ?? "");
      const pickedQty = Number(payload.pickedQty ?? payload.qty ?? 0);
      const pickedBy = payload.pickedBy ? String(payload.pickedBy) : undefined;
      if (!orderId || !partNumber) return;
      setOrderLineStages((prev) => {
        const current = prev[orderId] ?? {};
        const nextStage = Math.max(current[partNumber] ?? 0, 1);
        return { ...prev, [orderId]: { ...current, [partNumber]: nextStage } };
      });
      setOrderDetails((prev) => {
        const detail = prev[orderId];
        if (!detail) return prev;
        const updatedItems = detail.items.map((item) => {
          if (item.partNumber !== partNumber) return item;
          return {
            ...item,
            pickedQty: pickedQty || item.pickedQty,
            pickedBy: pickedBy || item.pickedBy,
          };
        });
        return { ...prev, [orderId]: { ...detail, items: updatedItems } };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [realtimeBase]);

  const statusLabel = (order: OrderSummaryDto) => {
    const picking = (order.pickingStatus ?? "").toUpperCase();
    const checking = (order.checkingStatus ?? "").toUpperCase();
    if (checking === "COMPLETED") return "CHECKED";
    if (picking === "COMPLETED") return "PICKED";
    if (
      picking === "PICK_REQUESTED" ||
      picking === "PICK_REQUESTED_OVERRIDE" ||
      checking === "PICK_REQUESTED"
    ) {
      return "PICK REQUESTED";
    }
    return "PROCESSING";
  };

  const statusClass = (label: string) => {
    if (label === "CHECKED") return "pill pill-ok";
    if (label === "PICKED" || label === "PICK REQUESTED") return "pill pill-warn";
    return "pill pill-neutral";
  };

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await api.get<OrderSummaryDto[]>("/orders");
      setOrders(response.data ?? []);
    } catch {
      if (!silent) {
        setError("Unable to load orders.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = window.setInterval(() => {
        loadOrders(true);
      }, 5000);
    }
    return () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, loadOrders]);

  useEffect(() => {
    setActionMessage(null);
    setActionError(null);
    setEditItemError(null);
    if (selectedOrderId) {
      const detail = orderDetails[selectedOrderId];
      if (detail) {
        setEditForm((prev) => ({
          ...prev,
          invoiceNumber: detail.summary.invoiceNumber ?? "",
          customerName: detail.summary.customerName ?? "",
          customerPo: detail.summary.customerPo ?? "",
          gappPo: detail.summary.gappPo ?? "",
          reason: "",
          performedBy: "",
        }));
        const firstItem = detail.items?.[0];
        setEditItemPartNumber(firstItem?.partNumber ?? "");
        setEditItemQty(firstItem ? String(firstItem.qty ?? "") : "");
      }
    }
  }, [selectedOrderId, orderDetails]);

  const refreshView = () => {
    loadOrders(true);
  };

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError && error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error instanceof Error) return error.message;
    return fallback;
  };

  const submitUpload = async () => {
    if (uploadRows.length === 0) {
      setUploadError("No rows to upload.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await api.post("/orders/bulk", uploadRows);
      setUploadRows([]);
      setShowUpload(false);
      refreshView();
    } catch (error) {
      setUploadError(extractErrorMessage(error, "Upload failed. Check backend logs."));
    } finally {
      setUploading(false);
    }
  };

  const parseUpload = (file: File) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(new Uint8Array(event.target?.result as ArrayBuffer), {
        type: "array",
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
        defval: "",
      });
      const normalized = json.map((row) => {
        const map: Record<string, string | number> = {};
        Object.keys(row).forEach((key) => {
          map[key.toLowerCase().trim()] = row[key];
        });
        return map;
      });
      const rows: UploadRow[] = normalized.map((row) => ({
        salesOrder: String(row["so"] ?? "").trim() || undefined,
        outboundNumber: String(row["outbound"] ?? "").trim(),
        customerPo: String(row["po"] ?? "").trim() || undefined,
        partNumber: String(row["part number"] ?? "").trim(),
        qty: Number(row["quantity"] ?? 0),
        customerId: String(row["customer"] ?? "").trim() || undefined,
        invoiceNumber: String(row["invoice"] ?? "").trim() || undefined,
      }));
      const valid = rows.filter((row) => row.outboundNumber && row.partNumber);
      if (valid.length === 0) {
        setUploadError("No valid rows found. Check required columns.");
      }
      setUploadRows(valid);
    };
    reader.readAsArrayBuffer(file);
  };

  const submitOwnerOverride = async () => {
    if (!selectedOrderId) return;
    if (!ownerPassword) {
      setOwnerOverrideMessage("Password is required for override.");
      return;
    }
    setOverrideSubmitting(true);
    setOwnerOverrideMessage(null);
    try {
      await api.post(`/orders/${selectedOrderId}/override-status`, {
        ownerPassword,
      });
      setOwnerOverrideMessage("Override applied.");
      refreshView();
    } catch (error) {
      setOwnerOverrideMessage(
        extractErrorMessage(error, "Override failed. Check backend logs.")
      );
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const submitEditOrder = async () => {
    if (!selectedOrderId) return;
    if (!editForm.reason.trim()) {
      setActionError("Provide a reason for editing.");
      return;
    }
    setEditLoading(true);
    setActionError(null);
    try {
      await api.patch(`/orders/${selectedOrderId}`, {
        invoiceNumber: editForm.invoiceNumber || undefined,
        customerName: editForm.customerName || undefined,
        customerPo: editForm.customerPo || undefined,
        gappPo: editForm.gappPo || undefined,
        reason: editForm.reason,
        performedBy: editForm.performedBy || undefined,
      });
      setShowEditModal(false);
      setActionMessage("Order updated.");
      refreshView();
    } catch (error) {
      setActionError(extractErrorMessage(error, "Edit failed. Check backend logs."));
    } finally {
      setEditLoading(false);
    }
  };

  const submitEditOrderItem = async () => {
    if (!selectedOrderId) return;
    if (!editForm.reason.trim()) {
      setEditItemError("Provide a reason for editing.");
      return;
    }
    if (!editItemPartNumber) {
      setEditItemError("Select a part number to edit.");
      return;
    }
    const qtyValue = Number(editItemQty);
    if (!Number.isFinite(qtyValue) || qtyValue <= 0) {
      setEditItemError("Qty must be greater than zero.");
      return;
    }
    setEditItemLoading(true);
    setEditItemError(null);
    try {
      const response = await api.patch<OrderItemDto>(`/orders/${selectedOrderId}/items`, {
        partNumber: editItemPartNumber,
        qty: qtyValue,
        reason: editForm.reason,
        performedBy: editForm.performedBy || undefined,
      });
      setOrderDetails((prev) => {
        const detail = prev[selectedOrderId];
        if (!detail) return prev;
        const updatedItems = detail.items.map((item) =>
          item.partNumber === editItemPartNumber ? { ...item, ...response.data } : item
        );
        return { ...prev, [selectedOrderId]: { ...detail, items: updatedItems } };
      });
      setActionMessage(`Item ${editItemPartNumber} updated.`);
      loadOrders(true);
    } catch (error) {
      setEditItemError(extractErrorMessage(error, "Item update failed. Check backend logs."));
    } finally {
      setEditItemLoading(false);
    }
  };

  const submitDeleteOrder = async () => {
    if (!selectedOrderId) return;
    if (!deleteForm.reason.trim()) {
      setActionError("Provide a reason for deletion.");
      return;
    }
    setDeleteLoading(true);
    setActionError(null);
    try {
      await api.delete(`/orders/${selectedOrderId}`, {
        data: {
          reason: deleteForm.reason,
          performedBy: deleteForm.performedBy || undefined,
        },
      });
      setShowDeleteModal(false);
      setSelectedOrderId(null);
      setActionMessage("Order deleted.");
      loadOrders();
    } catch (error) {
      setActionError(extractErrorMessage(error, "Delete failed. Check backend logs."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openPickEditModal = (orderId: number, item: OrderItemDto) => {
    setSelectedOrderId(orderId);
    setSelectedPickItem(item);
    setPickEditError(null);
    const pickedSoFar = item.pickedQty ?? (item.pickedBy ? item.qty : 0);
    setPickEditQty(String(pickedSoFar));
    setShowPickEditModal(true);
  };

  const closePickEditModal = () => {
    setShowPickEditModal(false);
    setSelectedPickItem(null);
    setPickEditQty("");
    setPickEditError(null);
  };

  const submitPickEdit = async () => {
    if (!selectedOrderId || !selectedPickItem) return;
    const desiredQty = Number(pickEditQty);
    if (!Number.isFinite(desiredQty) || desiredQty < 0) {
      setPickEditError("Pick quantity must be zero or more.");
      return;
    }
    if (desiredQty > selectedPickItem.qty) {
      setPickEditError(`Pick quantity cannot exceed ${selectedPickItem.qty}.`);
      return;
    }
    const alreadyPicked = selectedPickItem.pickedQty ?? 0;
    if (desiredQty <= alreadyPicked) {
      setPickEditError("Use the mobile picker to reduce picks. Web edit only increases.");
      return;
    }
    setPickEditLoading(true);
    setPickEditError(null);
    try {
      const delta = desiredQty - alreadyPicked;
      const resolvedRack =
        suggestedRack[selectedPickItem.partNumber] || selectedPickItem.pickedRack || "COMBINED";
      const pickedBy = user?.username ?? "Admin";
      const response = await api.post<OrderItemDto>(
        `/orders/${selectedOrderId}/items/pick`,
        {
          partNumber: selectedPickItem.partNumber,
          pickedRack: resolvedRack,
          pickedBy,
          pickedQty: delta,
        }
      );
      setOrderDetails((prev) => {
        const detail = prev[selectedOrderId];
        if (!detail) return prev;
        const updatedItems = detail.items.map((row) =>
          row.partNumber === selectedPickItem.partNumber ? { ...row, ...response.data } : row
        );
        return { ...prev, [selectedOrderId]: { ...detail, items: updatedItems } };
      });
      setActionMessage(`Picked ${selectedPickItem.partNumber} +${delta}.`);
      loadOrders(true);
      closePickEditModal();
    } catch (error) {
      setPickEditError(extractErrorMessage(error, "Pick update failed. Check backend logs."));
    } finally {
      setPickEditLoading(false);
    }
  };

  const handlePickItem = async (orderId: number, item: OrderItemDto) => {
    setActionMessage(null);
    setActionError(null);
    try {
      const resolvedRack =
        suggestedRack[item.partNumber] || item.pickedRack || "COMBINED";
      const pickedBy = user?.username ?? "Admin";
      const response = await api.post<OrderItemDto>(`/orders/${orderId}/items/pick`, {
        partNumber: item.partNumber,
        pickedRack: resolvedRack,
        pickedBy,
        pickedQty: item.qty,
      });
      setOrderDetails((prev) => {
        const detail = prev[orderId];
        if (!detail) return prev;
        const updatedItems = detail.items.map((row) =>
          row.partNumber === item.partNumber ? { ...row, ...response.data } : row
        );
        return { ...prev, [orderId]: { ...detail, items: updatedItems } };
      });
      setActionMessage(`Picked ${item.partNumber} from ${resolvedRack}.`);
      loadOrders(true);
    } catch (error) {
      setActionError(extractErrorMessage(error, "Pick failed. Check backend logs."));
    }
  };

  const handleSystemPickItem = async (orderId: number, item: OrderItemDto) => {
    setActionMessage(null);
    setActionError(null);
    try {
      const response = await api.post<OrderItemDto>(`/orders/${orderId}/items/pick`, {
        partNumber: item.partNumber,
        pickedRack: "VENDOR",
        pickedBy: "SYSTEM",
        pickedQty: item.qty,
      });
      setOrderDetails((prev) => {
        const detail = prev[orderId];
        if (!detail) return prev;
        const updatedItems = detail.items.map((row) =>
          row.partNumber === item.partNumber ? { ...row, ...response.data } : row
        );
        return { ...prev, [orderId]: { ...detail, items: updatedItems } };
      });
      setActionMessage(`System picked ${item.partNumber}.`);
      loadOrders(true);
    } catch (error) {
      setActionError(extractErrorMessage(error, "System pick failed. Check backend logs."));
    }
  };

  const handleSendForPickup = async () => {
    if (!selectedOrderId) return;
    if (!sendOwnerPassword.trim()) {
      setActionError("Owner password is required to send for pickup.");
      return;
    }
    setSendLoading(true);
    setActionError(null);
    try {
      await api.post(`/orders/${selectedOrderId}/send-pickup`, {
        reason: sendReason || undefined,
        note: sendNote || undefined,
        performedBy: sendPerformedBy || undefined,
        ownerPassword: sendOwnerPassword,
      });
      setSendReason("");
      setSendNote("");
      setSendPerformedBy("");
      setSendOwnerPassword("");
      setShowSendModal(false);
      setActionMessage("Sent to picker.");
      refreshView();
    } catch (error) {
      setActionError(
        extractErrorMessage(error, "Pickup request failed. Check backend logs.")
      );
    } finally {
      setSendLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      return (
        order.outboundNumber?.toLowerCase().includes(term) ||
        order.invoiceNumber?.toLowerCase().includes(term) ||
        order.customerName?.toLowerCase().includes(term) ||
        order.customerPo?.toLowerCase().includes(term) ||
        order.gappPo?.toLowerCase().includes(term)
      );
    });
  }, [orders, search]);

  const renderOrderCard = (order: OrderSummaryDto) => {
    const isExpanded = expandedOrders.has(order.orderId);
    const isLoadingDetail = loadingDetails.has(order.orderId);
    const hasDetailError = detailErrors.has(order.orderId);
    const detail = orderDetails[order.orderId];
    const label = statusLabel(order);
    const pickingStatus = order.pickingStatus?.toUpperCase() ?? "";
    const isSent =
      pickingStatus === "PICK_REQUESTED" || pickingStatus === "PICK_REQUESTED_OVERRIDE";
    const pickingComplete = pickingStatus === "COMPLETED";
    const canPickOrder = isAdmin && !order.dnCreated && !pickingComplete;
    const canSystemPickOrder =
      isAdmin &&
      !order.dnCreated &&
      (pickingStatus === "PROCESSING" ||
        pickingStatus === "PICK_REQUESTED" ||
        pickingStatus === "PICK_REQUESTED_OVERRIDE");
    const canSendPickup = isAdmin && !order.dnCreated;

    return (
      <div key={order.orderId} className="order-card">
        <div
          className={`order-card-header ${isExpanded ? "expanded" : ""}`}
          onClick={() => toggleOrderExpand(order.orderId)}
        >
          <div className="order-card-info">
            <div className="order-card-title">
              <span className="order-outbound">{order.outboundNumber}</span>
              <span className={statusClass(label)}>{label}</span>
            </div>
            <div className="order-card-meta">
              <span>{order.customerName ?? "-"}</span>
              {order.customerId && (
                <>
                  <span className="separator">·</span>
                  <span style={{ fontSize: "0.9em", color: "#94a3b8" }}>
                    ID: {order.customerId}
                  </span>
                </>
              )}
              <span className="separator">·</span>
              <span>PO: {order.customerPo ?? "-"}</span>
              <span className="separator">·</span>
              <span>Qty: {order.totalQty}</span>
              <span className="separator">·</span>
              <span className={order.dnCreated ? "dn-ok" : "dn-pending"}>
                DN: {order.dnCreated ? "Created" : "Pending"}
              </span>
              {order.insufficientStock ? (
                <>
                  <span className="separator">·</span>
                  <span className="pill pill-warn">Stock Low</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="order-card-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn ghost small"
              onClick={() => {
                setSelectedOrderId(order.orderId);
                setShowEditModal(true);
              }}
            >
              Edit
            </button>
            <button
              className="btn warn small"
              onClick={() => {
                setSelectedOrderId(order.orderId);
                setShowDeleteModal(true);
              }}
            >
              Delete
            </button>
            <button
              className="btn primary small"
              onClick={() => {
                setSelectedOrderId(order.orderId);
                setSendReason("");
                setSendNote("");
                setSendPerformedBy("");
                setSendOwnerPassword("");
                setShowSendModal(true);
              }}
              disabled={sendLoading || isSent || !canSendPickup}
            >
              {isSent ? "Sent" : "Send"}
            </button>
            <button
              className="btn ghost small"
              onClick={() => generateDeliveryNote(order.orderId)}
            >
              Generate DN
            </button>
            <button
              className="btn ghost small"
              onClick={() =>
                window.open(`${apiBase}/dn/${order.orderId}/print`, "_blank")
              }
            >
              Print DN
            </button>
          </div>
          <div className={`expand-icon ${isExpanded ? "rotated" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        {isExpanded && (
          <div className="order-card-body">
            {isLoadingDetail ? (
              <div className="banner">Loading order details...</div>
            ) : hasDetailError ? (
              <div className="banner">Unable to load order details.</div>
            ) : detail ? (
              <>
                <div className="order-items-section">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Part</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Available</th>
                        <th>Suggested Rack</th>
                        <th>Picked</th>
                        <th>Status</th>
                        {canPickOrder && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item) => {
                        const availableQty = Number(item.availableQty ?? 0);
                        const orderedQty = Number(item.qty ?? 0);
                        const suggested =
                          suggestedRack[item.partNumber] ??
                          item.pickedRack ??
                          item.pickedBy ??
                          "-";
                        const pickedSoFar = item.pickedQty ?? (item.pickedBy ? item.qty : 0);
                        const isPicked = item.picked || pickedSoFar >= item.qty;
                        const canPickItem = canPickOrder && !isPicked;
                        const canSystemPickItem = canSystemPickOrder && !isPicked;
                        const canEditPick = isAdmin && !order.dnCreated;
                        const rowClass =
                          availableQty <= 0
                            ? "stock-zero"
                            : availableQty < orderedQty
                              ? "stock-shortage"
                              : "";
                        const stage =
                          orderLineStages[order.orderId]?.[item.partNumber] ??
                          (pickedSoFar > 0 ? 1 : 0);
                        return (
                          <tr key={`${item.partNumber}-${item.qty}`} className={rowClass}>
                            <td className="part-number">{item.partNumber}</td>
                            <td>{item.description || "-"}</td>
                            <td>{item.qty}</td>
                            <td>{availableQty}</td>
                            <td>{suggested}</td>
                            <td>
                              {pickedSoFar > 0
                                ? `${pickedSoFar} / ${item.qty} ${item.pickedBy ? `by ${item.pickedBy}` : ""}`.trim()
                                : "waiting"}
                            </td>
                            <td>
                              <span className={`pick-status pick-status-${stage}`}>
                                {statusLabelForStage(stage)}
                              </span>
                            </td>
                            {canPickOrder && (
                              <td>
                                <button
                                  className="btn tiny"
                                  disabled={!canPickItem}
                                  onClick={() => handlePickItem(order.orderId, item)}
                                >
                                  {isPicked ? "Picked" : "Pick"}
                                </button>
                                {canSystemPickOrder && (
                                  <button
                                    className="btn tiny ghost"
                                    disabled={!canSystemPickItem}
                                    onClick={() => handleSystemPickItem(order.orderId, item)}
                                  >
                                    System Pick
                                  </button>
                                )}
                                {canEditPick && (
                                  <button
                                    className="btn tiny ghost"
                                    onClick={() => openPickEditModal(order.orderId, item)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            )}
                            {!canPickOrder && canSystemPickOrder && (
                              <td>
                                <button
                                  className="btn tiny ghost"
                                  disabled={!canSystemPickItem}
                                  onClick={() => handleSystemPickItem(order.orderId, item)}
                                >
                                  System Pick
                                </button>
                                {canEditPick && (
                                  <button
                                    className="btn tiny ghost"
                                    onClick={() => openPickEditModal(order.orderId, item)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h1>Order Management</h1>
          <p>Upload, validate, and dispatch outbound orders.</p>
        </div>
        <div className="stock-actions">
          <button className="btn ghost" onClick={() => setShowUpload(true)}>
            Upload Order (Excel)
          </button>
          <button className="btn ghost" onClick={refreshView}>
            Refresh
          </button>
          <button
            className="btn ghost"
            onClick={() => setAutoRefresh((value) => !value)}
          >
            Auto-refresh: {autoRefresh ? "On" : "Off"}
          </button>
        </div>
      </div>

      {ownerOverrideMessage ? <div className="banner">{ownerOverrideMessage}</div> : null}
      {actionMessage ? <div className="banner">{actionMessage}</div> : null}
      {actionError ? <div className="banner">{actionError}</div> : null}
      {error ? <div className="banner">{error}</div> : null}

      <div className="stock-toolbar">
        <div className="toolbar-left">
          <input
            className="search-input"
            placeholder="Search outbound, invoice, customer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="toolbar-note">
          {loading ? "Loading orders..." : `Showing ${filteredOrders.length} orders`}
        </div>
      </div>

      <div className="orders-container">
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty">No orders yet.</div>
          ) : (
            filteredOrders.map(renderOrderCard)
          )}
        </div>
      </div>

      {showUpload && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Upload Orders</h3>
              <button className="btn tiny" onClick={() => setShowUpload(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) parseUpload(file);
                }}
              />
              {uploadError && <div className="banner">{uploadError}</div>}
              <div className="upload-preview">
                <p className="muted">Parsed rows: {uploadRows.length}</p>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Outbound</th>
                        <th>Part</th>
                        <th>Qty</th>
                        <th>Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadRows.slice(0, 6).map((row, index) => (
                        <tr key={`${row.partNumber}-${index}`}>
                          <td>{row.outboundNumber}</td>
                          <td>{row.partNumber}</td>
                          <td>{row.qty}</td>
                          <td>{row.customerId ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowUpload(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={submitUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Send to Pick</h3>
              <button className="btn tiny" onClick={() => setShowSendModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <label>
                Reason
                <input
                  className="search-input"
                  value={sendReason}
                  onChange={(event) => setSendReason(event.target.value)}
                />
              </label>
              <label>
                Note
                <input
                  className="search-input"
                  value={sendNote}
                  onChange={(event) => setSendNote(event.target.value)}
                />
              </label>
              <label>
                Your name
                <input
                  className="search-input"
                  value={sendPerformedBy}
                  onChange={(event) => setSendPerformedBy(event.target.value)}
                />
              </label>
              <label>
                Owner password
                <input
                  type="password"
                  className="search-input"
                  value={sendOwnerPassword}
                  onChange={(event) => setSendOwnerPassword(event.target.value)}
                />
              </label>
              {actionError && <div className="banner">{actionError}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowSendModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleSendForPickup} disabled={sendLoading}>
                {sendLoading ? "Sending..." : "Send to picker"}
              </button>
            </div>
          </div>
        </div>
      )}

      {ownerOverrideModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Owner Override</h3>
              <button className="btn tiny" onClick={() => setOwnerOverrideModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>
                Use owner override to bypass the normal picking/checking statuses and mark
                the order as processed.
              </p>
              <label>
                Owner password
                <input
                  type="password"
                  className="search-input"
                  value={ownerPassword}
                  onChange={(event) => setOwnerPassword(event.target.value)}
                />
              </label>
              {ownerOverrideMessage && <div className="banner">{ownerOverrideMessage}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setOwnerOverrideModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={submitOwnerOverride} disabled={overrideSubmitting}>
                {overrideSubmitting ? "Applying..." : "Apply Override"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <div className="modal-header">
              <h3>Edit Order</h3>
              <button className="btn tiny" onClick={() => setShowEditModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Invoice
                  <input
                    className="search-input"
                    value={editForm.invoiceNumber}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, invoiceNumber: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Customer
                  <input
                    className="search-input"
                    value={editForm.customerName}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, customerName: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Customer PO
                  <input
                    className="search-input"
                    value={editForm.customerPo}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, customerPo: event.target.value }))
                    }
                  />
                </label>
                <label>
                  GAPP PO
                  <input
                    className="search-input"
                    value={editForm.gappPo}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, gappPo: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Reason
                  <input
                    className="search-input"
                    value={editForm.reason}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, reason: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Your name
                  <input
                    className="search-input"
                    value={editForm.performedBy}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, performedBy: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Part Number
                  <select
                    className="search-input"
                    value={editItemPartNumber}
                    onChange={(event) => {
                      const partNumber = event.target.value;
                      setEditItemPartNumber(partNumber);
                      const match = selectedOrderItems.find(
                        (item) => item.partNumber === partNumber
                      );
                      setEditItemQty(match ? String(match.qty ?? "") : "");
                    }}
                  >
                    <option value="">Select part number</option>
                    {selectedOrderItems.map((item) => (
                      <option key={item.partNumber} value={item.partNumber}>
                        {item.partNumber}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Item Qty
                  <input
                    className="search-input"
                    value={editItemQty}
                    onChange={(event) => setEditItemQty(event.target.value)}
                  />
                </label>
              </div>
              {editItemError && <div className="banner">{editItemError}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button
                className="btn ghost"
                onClick={submitEditOrderItem}
                disabled={editItemLoading}
              >
                {editItemLoading ? "Saving item..." : "Save item qty"}
              </button>
              <button className="btn primary" onClick={submitEditOrder} disabled={editLoading}>
                {editLoading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <div className="modal-header">
              <h3>Delete Order</h3>
              <button className="btn tiny" onClick={() => setShowDeleteModal(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <label>
                Reason
                <input
                  className="search-input"
                  value={deleteForm.reason}
                  onChange={(event) =>
                    setDeleteForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                />
              </label>
              <label>
                Your name
                <input
                  className="search-input"
                  value={deleteForm.performedBy}
                  onChange={(event) =>
                    setDeleteForm((prev) => ({ ...prev, performedBy: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn warn" onClick={submitDeleteOrder} disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPickEditModal && selectedPickItem && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Picked Qty</h3>
              <button className="btn tiny" onClick={closePickEditModal}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>
                Part: <strong>{selectedPickItem.partNumber}</strong>
              </p>
              <p>Ordered Qty: {selectedPickItem.qty}</p>
              <label>
                New picked qty
                <input
                  className="search-input"
                  type="number"
                  min={0}
                  max={selectedPickItem.qty}
                  value={pickEditQty}
                  onChange={(event) => setPickEditQty(event.target.value)}
                />
              </label>
              <p className="muted">Web edit supports increase only.</p>
              {pickEditError && <div className="banner">{pickEditError}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={closePickEditModal}>
                Cancel
              </button>
              <button className="btn primary" onClick={submitPickEdit} disabled={pickEditLoading}>
                {pickEditLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Orders;
