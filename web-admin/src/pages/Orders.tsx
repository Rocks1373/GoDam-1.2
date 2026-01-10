import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiBase } from "../services/api";
import { AxiosError } from "axios";
import * as XLSX from "xlsx";

type UploadRow = {
  salesOrder?: string;
  outboundNumber: string;
  customerPo?: string;
  partNumber: string;
  qty: number;
  customerName?: string;
  invoiceNumber?: string;
};

type OrderSummaryDto = {
  orderId: number;
  invoiceNumber: string | null;
  outboundNumber: string;
  gappPo: string | null;
  customerPo: string | null;
  customerName: string | null;
  dnCreated: boolean;
  itemCount: number;
  totalQty: number;
  pickingStatus?: string | null;
  checkingStatus?: string | null;
};

type OrderItemDto = {
  partNumber: string;
  description: string | null;
  qty: number;
  pickedBy?: string | null;
  pickedRack?: string | null;
  picked?: boolean;
};

type OrderViewDto = {
  summary: OrderSummaryDto;
  items: OrderItemDto[];
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
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
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
  const [sendLoading, setSendLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

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

  const statusLabel = (order: OrderSummaryDto) => {
    const picking = (order.pickingStatus ?? "").toUpperCase();
    const checking = (order.checkingStatus ?? "").toUpperCase();
    if (checking === "COMPLETED") return "CHECKED";
    if (picking === "COMPLETED") return "PICKED";
    if (picking === "PICK_REQUESTED" || checking === "PICK_REQUESTED") return "PICK REQUESTED";
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
        customerName: String(row["customer"] ?? "").trim() || undefined,
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

  const handleSendForPickup = async () => {
    if (!selectedOrderId) return;
    setSendLoading(true);
    setActionError(null);
    try {
      await api.post(`/orders/${selectedOrderId}/send-pickup`, {
        reason: sendReason || undefined,
        note: sendNote || undefined,
        performedBy: sendPerformedBy || undefined,
      });
      setSendReason("");
      setSendNote("");
      setSendPerformedBy("");
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
    const isSent = order.pickingStatus?.toUpperCase() === "PICK_REQUESTED";

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
              <span className="separator">·</span>
              <span>PO: {order.customerPo ?? "-"}</span>
              <span className="separator">·</span>
              <span>Qty: {order.totalQty}</span>
              <span className="separator">·</span>
              <span className={order.dnCreated ? "dn-ok" : "dn-pending"}>
                DN: {order.dnCreated ? "Created" : "Pending"}
              </span>
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
                handleSendForPickup();
              }}
              disabled={sendLoading || isSent}
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
                        <th>Suggested Rack</th>
                        <th>Picked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item) => {
                        const suggested =
                          suggestedRack[item.partNumber] ??
                          item.pickedRack ??
                          item.pickedBy ??
                          "-";
                        return (
                          <tr key={`${item.partNumber}-${item.qty}`}>
                            <td className="part-number">{item.partNumber}</td>
                            <td>{item.description || "-"}</td>
                            <td>{item.qty}</td>
                            <td>{suggested}</td>
                            <td>{item.pickedBy ? `by ${item.pickedBy}` : "waiting"}</td>
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
                          <td>{row.customerName ?? "-"}</td>
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
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowEditModal(false)}>
                Cancel
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
    </section>
  );
};

export default Orders;
