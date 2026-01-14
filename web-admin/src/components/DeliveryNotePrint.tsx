import { useMemo } from "react";
import "./DeliveryNotePrint.css";

export type DeliveryNotePrintData = {
  dnNumber?: string;
  outboundNumber?: string;
  dnDate?: string;
  invoiceNumber?: string;
  customerPo?: string;
  gappPo?: string;
  
  // Customer Data
  customerName?: string;
  address?: string;
  phone1?: string;
  phone2?: string;
  receiver1Name?: string;
  receiver2Name?: string;
  customerEmail?: string;
  googleMapLink?: string;
  requirements?: string;
  
  // Warehouse Data
  warehouseName?: string;
  warehouseAddress?: string;
  warehouseContact?: string;

  // Transporter & Driver Data
  transporterName?: string;
  driverName?: string;
  driverNumber?: string;
  truckType?: string;
  vehiclePlate?: string;

  // Order Items
  items?: Array<{
    itemNumber?: string | number;
    partNumber?: string;
    description: string;
    quantity: number;
    uom?: string;
  }>;
  
  // Totals
  totalCases?: number;
  totalWeight?: number;
  totalVolume?: number;

  // Footer
  verifierName?: string;
  preparedBy?: string;
};

type DeliveryNotePrintProps = {
  data: DeliveryNotePrintData;
  className?: string;
};

const DeliveryNotePrint = ({ data, className = "" }: DeliveryNotePrintProps) => {
  const {
    dnNumber,
    outboundNumber,
    dnDate,
    invoiceNumber,
    customerPo,
    gappPo,
    customerName,
    address,
    phone1,
    phone2,
    receiver1Name,
    receiver2Name,
    customerEmail,
    googleMapLink,
    requirements,
    warehouseName = "Main Warehouse",
    warehouseAddress = "Warehouse Address",
    warehouseContact,
    transporterName,
    driverName,
    driverNumber,
    truckType,
    vehiclePlate,
    items = [],
    totalCases,
    totalWeight,
    totalVolume,
    verifierName,
    preparedBy,
  } = data;

  const displayDate = useMemo(() => {
    if (dnDate) {
      try {
        const date = new Date(dnDate);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
          });
        }
      } catch (e) {
        // Fall through to default
      }
    }
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }, [dnDate]);

  const nonEmptyItems = useMemo(
    () => items.filter((item) => item.description && item.quantity > 0),
    [items]
  );

  const calculatedTotalQty = useMemo(
    () => nonEmptyItems.reduce((sum, item) => sum + item.quantity, 0),
    [nonEmptyItems]
  );

  return (
    <div className={`delivery-note-print ${className}`}>
      {/* Top Header Row */}
      <div className="dn-print-header">
        <div>
          <h1 className="dn-print-title">Delivery Note</h1>
          <div className="dn-print-dn-number">DN #: <strong>{dnNumber || "DRAFT"}</strong></div>
          {invoiceNumber && (
            <div className="dn-print-invoice">Invoice #: <strong>{invoiceNumber}</strong></div>
          )}
        </div>
        <div className="dn-print-meta">
          <div>Date: <strong>{displayDate}</strong></div>
          <div>Outbound #: <strong>{outboundNumber || "N/A"}</strong></div>
          {customerPo && (
            <div>Customer PO: <strong>{customerPo}</strong></div>
          )}
          {gappPo && (
            <div>GAPP PO: <strong>{gappPo}</strong></div>
          )}
          <div className="dn-print-page">Page 1 of 1</div>
        </div>
      </div>

      {/* Address Boxes */}
      <div className="dn-print-addresses">
        {/* Delivery To */}
        <div className="dn-print-box">
          <div className="dn-print-section-header">Delivery To:</div>
          <div className="dn-print-content">
            <strong className="dn-print-customer-name">{customerName || "Customer Name"}</strong><br />
            {address || "Delivery Address"}<br />
            {phone1 && <span>Tel: {phone1}<br /></span>}
            {phone2 && <span>Tel 2: {phone2}<br /></span>}
            {receiver1Name && <span>Attn: {receiver1Name}<br /></span>}
            {receiver2Name && <span>Attn 2: {receiver2Name}<br /></span>}
            {customerEmail && <span>Email: {customerEmail}<br /></span>}
            {googleMapLink && (
              <span className="dn-print-map-link">
                <a 
                  href={googleMapLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  📍 View on Google Maps
                </a>
              </span>
            )}
          </div>
        </div>

        {/* Dispatched From */}
        <div className="dn-print-box">
          <div className="dn-print-section-header">Dispatched From:</div>
          <div className="dn-print-content">
            <strong>{warehouseName}</strong><br />
            {warehouseAddress}<br />
            {warehouseContact && <span>Contact: {warehouseContact}</span>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="dn-print-items">
        <table className="dn-print-table">
          <thead>
            <tr>
              <th className="dn-print-th" style={{ width: "8%" }}>ITEM #</th>
              <th className="dn-print-th" style={{ width: "22%" }}>PART NUMBER</th>
              <th className="dn-print-th" style={{ width: "45%" }}>DESCRIPTION</th>
              <th className="dn-print-th" style={{ width: "10%", textAlign: "center" }}>UOM</th>
              <th className="dn-print-th" style={{ width: "15%", textAlign: "center" }}>QTY</th>
            </tr>
          </thead>
          <tbody>
            {nonEmptyItems.length > 0 ? (
              nonEmptyItems.map((item, index) => (
                <tr key={index}>
                  <td className="dn-print-td" style={{ textAlign: "center" }}>{item.itemNumber || index + 1}</td>
                  <td className="dn-print-td">{item.partNumber || "-"}</td>
                  <td className="dn-print-td">{item.description}</td>
                  <td className="dn-print-td" style={{ textAlign: "center" }}>{item.uom || "PCS"}</td>
                  <td className="dn-print-td" style={{ textAlign: "center", fontWeight: "bold" }}>{item.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="dn-print-td" style={{ textAlign: "center", padding: "30px", color: "#999" }}>
                  No items to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="dn-print-totals">
        <div className="dn-print-total-row">
          <strong>Total Quantity:</strong>
          <strong>{calculatedTotalQty} PCS</strong>
        </div>
        <div className="dn-print-total-row">
          <strong>Total Cases:</strong>
          <span>{totalCases || 0} CASES</span>
        </div>
        <div className="dn-print-total-row">
          <strong>Gross Weight (KG):</strong>
          <span>{totalWeight?.toFixed(2) || "0.00"}</span>
        </div>
        <div className="dn-print-total-row" style={{ borderBottom: "none" }}>
          <strong>Volume (CBM):</strong>
          <span>{totalVolume?.toFixed(3) || "0.000"}</span>
        </div>
      </div>

      {/* Requirements/Remarks Section */}
      {requirements && requirements.trim() && (
        <div className="dn-print-remarks">
          <div className="dn-print-section-header">Special Instructions / Remarks:</div>
          <div className="dn-print-content">{requirements}</div>
        </div>
      )}

      {/* Footer Section */}
      <div className="dn-print-footer">
        {/* Driver Info */}
        <div className="dn-print-delivery-info">
          <div className="dn-print-section-header">Delivery Information</div>
          <div className="dn-print-delivery-grid">
            <div><strong>Driver:</strong> {driverName || "N/A"}</div>
            <div><strong>Mobile:</strong> {driverNumber || "N/A"}</div>
            <div><strong>Carrier:</strong> {transporterName || "N/A"}</div>
            <div><strong>Vehicle:</strong> {truckType || "N/A"} {vehiclePlate ? `(${vehiclePlate})` : ""}</div>
          </div>
        </div>

        {/* Receiver Confirmation */}
        <div className="dn-print-receiver">
          <div className="dn-print-section-header">Receiver Confirmation</div>
          <div className="dn-print-receiver-fields">
            <div className="dn-print-receiver-field">
              <span className="dn-print-field-label">NAME:</span>
              <div className="dn-print-field-line"></div>
            </div>
            <div className="dn-print-receiver-field">
              <span className="dn-print-field-label">SIGN:</span>
              <div className="dn-print-field-line"></div>
            </div>
            <div className="dn-print-receiver-field">
              <span className="dn-print-field-label">DATE:</span>
              <div className="dn-print-field-line"></div>
            </div>
          </div>
          
          <div className="dn-print-signatures">
            <div className="dn-print-stamp">
              Receiver Stamp
            </div>
            <div className="dn-print-verified">
              <strong>Verified by:</strong> {verifierName || preparedBy || "_________________"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryNotePrint;
