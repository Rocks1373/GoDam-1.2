import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

export type PreviewItem = {
  itemNumber?: string | number;
  partNumber?: string;
  description: string;
  quantity: number;
  uom?: string;
};

type DNPreviewProps = {
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
  receiver1Name?: string;
  
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
  items?: PreviewItem[];
  
  // Totals
  totalCases?: number;
  totalWeight?: number;
  totalVolume?: number;

  // Footer
  verifierName?: string;
  
  // Actions
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
  actionsDisabled?: boolean;
  printEnabled?: boolean;
  hideControls?: boolean;
  
  // Legacy props support
  requirements?: string;
  googleMapLink?: string;
  phone2?: string;
  receiver2Name?: string;
  customerEmail?: string;
  customerLocationType?: string;
  customerLocationDetail?: string;
  transporterContact?: string;
  quantities?: { description: string; quantity: number }[]; 
};

const DNPreview = ({
  dnNumber,
  outboundNumber,
  dnDate,
  invoiceNumber,
  customerPo,
  gappPo,
  customerName,
  address,
  phone1,
  receiver1Name,
  warehouseName = "Main Warehouse",
  warehouseAddress = "Warehouse Address",
  warehouseContact,
  transporterName,
  driverName,
  driverNumber,
  truckType,
  vehiclePlate,
  items,
  quantities, // Legacy support
  totalCases,
  totalWeight,
  totalVolume,
  verifierName,
  requirements,
  googleMapLink,
  onPrint,
  onDownload,
  onEmail,
  actionsDisabled,
  printEnabled,
  hideControls,
}: DNPreviewProps) => {
  const [zoom, setZoom] = useState(1);

  // Merge items and legacy quantities if needed, preferring items
  const displayItems: PreviewItem[] = useMemo(() => {
    if (items && items.length > 0) return items;
    if (quantities && quantities.length > 0) {
      return quantities.map((q, i) => ({
        itemNumber: i + 1,
        partNumber: "N/A",
        description: q.description,
        quantity: q.quantity,
        uom: "PCS"
      }));
    }
    return [];
  }, [items, quantities]);

  const nonEmptyItems = useMemo(
    () => displayItems.filter((item) => item.description && item.quantity > 0),
    [displayItems]
  );

  const calculatedTotalQty = useMemo(
    () => nonEmptyItems.reduce((sum, item) => sum + item.quantity, 0),
    [nonEmptyItems]
  );

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

  const handleZoom = (direction: "in" | "out") => {
    setZoom((prev) => {
      const next = direction === "in" ? prev + 0.1 : prev - 0.1;
      return Math.min(1.4, Math.max(0.6, Number(next.toFixed(2))));
    });
  };

  const previewStyle = {
    "--preview-scale": zoom,
    fontFamily: "Arial, sans-serif",
    color: "#000",
  } as CSSProperties;

  // Professional Design Styles
  const boxStyle: CSSProperties = {
    border: "2px solid #333",
    padding: "15px",
    minHeight: "120px",
    backgroundColor: "#fff",
  };

  const sectionHeaderStyle: CSSProperties = {
    fontWeight: 700,
    fontSize: "14px",
    textTransform: "uppercase",
    marginBottom: "8px",
    color: "#000",
  };

  const tableHeaderStyle: CSSProperties = {
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "12px",
    padding: "10px 8px",
    border: "2px solid #000",
    textAlign: "left",
  };

  const tableCellStyle: CSSProperties = {
    border: "2px solid #333",
    padding: "8px",
    fontSize: "12px",
  };

  return (
    <section className="dn-preview-panel">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .dn-preview-sheet, .dn-preview-sheet * {
            visibility: visible;
          }
          .dn-preview-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      <div className="dn-preview-header">
        <div>
          <p className="dn-preview-company">GoDam Logistics</p>
          <h3>{dnNumber ? `DN-${dnNumber}` : "DELIVERY NOTE PREVIEW"}</h3>
          <p className="dn-preview-meta">
            Outbound: {outboundNumber || "TBD"} · {displayDate}
          </p>
        </div>
        {!hideControls && (
          <div className="dn-preview-button-row">
            <button
              type="button"
              className="btn ghost tiny"
              onClick={() => onPrint?.()}
              disabled={!printEnabled}
            >
              Print
            </button>
            <button
              type="button"
              className="btn ghost tiny"
              onClick={onDownload}
              disabled={actionsDisabled}
            >
              Download
            </button>
            <button
              type="button"
              className="btn ghost tiny"
              onClick={onEmail}
              disabled={actionsDisabled}
            >
              Email
            </button>
            <div className="zoom-controls">
              <button
                type="button"
                className="btn ghost tiny"
                onClick={() => handleZoom("out")}
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                className="btn ghost tiny"
                onClick={() => handleZoom("in")}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="dn-preview-frame" style={previewStyle}>
        {/* A4 Sheet Simulation */}
        <div className="dn-preview-sheet" style={{ 
          padding: "40px", 
          backgroundColor: "white", 
          width: "210mm", 
          minHeight: "297mm", 
          margin: "0 auto", 
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          position: "relative"
        }}>
          
          {/* Top Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "15px" }}>
            <div>
               <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 5px 0", textTransform: "uppercase" }}>Delivery Note</h1>
               <div style={{ fontSize: "16px" }}>DN #: <strong>{dnNumber || "DRAFT"}</strong></div>
               {invoiceNumber && (
                 <div style={{ fontSize: "14px", marginTop: "4px" }}>Invoice #: <strong>{invoiceNumber}</strong></div>
               )}
            </div>
            <div style={{ textAlign: "right" }}>
               <div style={{ fontSize: "14px", marginBottom: "2px" }}>Date: <strong>{displayDate}</strong></div>
               <div style={{ fontSize: "14px", marginBottom: "2px" }}>Outbound #: <strong>{outboundNumber || "N/A"}</strong></div>
               {customerPo && (
                 <div style={{ fontSize: "14px", marginBottom: "2px" }}>Customer PO: <strong>{customerPo}</strong></div>
               )}
               {gappPo && (
                 <div style={{ fontSize: "14px", marginBottom: "2px" }}>GAPP PO: <strong>{gappPo}</strong></div>
               )}
               <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>Page 1 of 1</div>
            </div>
          </div>

          {/* Address Boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
            {/* Delivery To */}
            <div style={boxStyle}>
              <div style={sectionHeaderStyle}>Delivery To:</div>
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                <strong style={{ fontSize: "14px" }}>{customerName || "Customer Name"}</strong><br />
                {address || "Delivery Address"}<br />
                {phone1 && <span>Tel: {phone1}<br /></span>}
                {receiver1Name && <span>Attn: {receiver1Name}<br /></span>}
                {googleMapLink && (
                  <span style={{ marginTop: "4px", display: "block" }}>
                    <a 
                      href={googleMapLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: "#0066cc", textDecoration: "underline", fontSize: "12px" }}
                    >
                      📍 View on Google Maps
                    </a>
                  </span>
                )}
              </div>
            </div>

            {/* Dispatched From */}
            <div style={boxStyle}>
              <div style={sectionHeaderStyle}>Dispatched From:</div>
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                <strong style={{ fontSize: "14px" }}>{warehouseName}</strong><br />
                {warehouseAddress}<br />
                {warehouseContact && <span>Contact: {warehouseContact}</span>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: "25px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000" }}>
              <thead>
                <tr>
                  <th style={{ ...tableHeaderStyle, width: "8%" }}>ITEM #</th>
                  <th style={{ ...tableHeaderStyle, width: "22%" }}>PART NUMBER</th>
                  <th style={{ ...tableHeaderStyle, width: "45%" }}>DESCRIPTION</th>
                  <th style={{ ...tableHeaderStyle, width: "10%", textAlign: "center" }}>UOM</th>
                  <th style={{ ...tableHeaderStyle, width: "15%", textAlign: "center" }}>QTY</th>
                </tr>
              </thead>
              <tbody>
                {nonEmptyItems.length > 0 ? (
                  nonEmptyItems.map((item, index) => (
                    <tr key={index}>
                      <td style={{ ...tableCellStyle, textAlign: "center" }}>{item.itemNumber || index + 1}</td>
                      <td style={tableCellStyle}>{item.partNumber || "-"}</td>
                      <td style={tableCellStyle}>{item.description}</td>
                      <td style={{ ...tableCellStyle, textAlign: "center" }}>{item.uom || "PCS"}</td>
                      <td style={{ ...tableCellStyle, textAlign: "center", fontWeight: "bold" }}>{item.quantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ ...tableCellStyle, textAlign: "center", padding: "30px", color: "#999" }}>
                      No items to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ border: "2px solid #333", padding: "15px", marginBottom: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ddd", paddingBottom: "8px", marginBottom: "8px" }}>
              <strong>Total Quantity:</strong>
              <strong>{calculatedTotalQty} PCS</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ddd", paddingBottom: "8px", marginBottom: "8px" }}>
              <strong>Total Cases:</strong>
              <span>{totalCases || 0} CASES</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ddd", paddingBottom: "8px", marginBottom: "8px" }}>
              <strong>Gross Weight (KG):</strong>
              <span>{totalWeight?.toFixed(2) || "0.00"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Volume (CBM):</strong>
              <span>{totalVolume?.toFixed(3) || "0.000"}</span>
            </div>
          </div>

          {/* Requirements/Remarks Section */}
          {requirements && requirements.trim() && (
            <div style={{ border: "2px solid #333", padding: "15px", marginBottom: "30px" }}>
              <div style={sectionHeaderStyle}>Special Instructions / Remarks:</div>
              <div style={{ fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {requirements}
              </div>
            </div>
          )}

          {/* Footer Section */}
          <div style={{ marginTop: "auto" }}>
            
            {/* Driver Info */}
            <div style={{ marginBottom: "20px" }}>
              <div style={sectionHeaderStyle}>Delivery Information</div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "15px", 
                fontSize: "13px",
                border: "2px solid #333",
                padding: "10px"
              }}>
                <div><strong>Driver:</strong> {driverName || "N/A"}</div>
                <div><strong>Mobile:</strong> {driverNumber || "N/A"}</div>
                <div><strong>Carrier:</strong> {transporterName || "N/A"}</div>
                <div><strong>Vehicle:</strong> {truckType || "N/A"} {vehiclePlate ? `(${vehiclePlate})` : ""}</div>
              </div>
            </div>

            {/* Receiver Confirmation */}
            <div>
              <div style={sectionHeaderStyle}>Receiver Confirmation</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontSize: "13px", marginTop: "15px" }}>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ width: "60px", fontWeight: "bold" }}>NAME:</span>
                  <div style={{ flex: 1, borderBottom: "2px dotted #000" }}></div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ width: "60px", fontWeight: "bold" }}>SIGN:</span>
                  <div style={{ flex: 1, borderBottom: "2px dotted #000" }}></div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ width: "60px", fontWeight: "bold" }}>DATE:</span>
                  <div style={{ flex: 1, borderBottom: "2px dotted #000" }}></div>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", alignItems: "flex-end" }}>
                <div style={{ 
                  fontWeight: "bold", 
                  fontSize: "14px", 
                  color: "#000",
                  textTransform: "uppercase"
                }}>
                  Receiver Stamp
                </div>
                <div style={{ fontSize: "13px" }}>
                  <strong>Verified by:</strong> {verifierName || "_________________"}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

    </section>
  );
};

export default DNPreview;
