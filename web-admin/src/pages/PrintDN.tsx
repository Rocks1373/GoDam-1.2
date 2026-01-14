import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import templateHtml from "../templates/dn-template/index.html?raw";
import templateCss from "../templates/dn-template/style.css?raw";
import logoUrl from "../templates/dn-template/logo.png?url";
import { api } from "../services/api";

const PRINT_PREVIEW_STORAGE_KEY = "godam-print-dn-preview";

type PrintPreviewPayload = {
  id?: number;
  dnNumber: string;
  outboundNumber: string;
  dateCreated: string;
  invoiceNumber?: string;
  customerPo?: string;
  gappPo?: string;
  preparedBy?: string;
  customer?: {
    name?: string;
    address?: string;
    locationText?: string;
    googleLocation?: string;
    receiver1Name?: string;
    receiver1Contact?: string;
    receiver2Name?: string;
    receiver2Contact?: string;
  };
  transporter?: {
    companyName?: string;
    contactName?: string;
  };
  driver?: {
    driverName?: string;
    driverNumber?: string;
  };
  truckType?: string;
  quantities?: Array<{ description?: string; quantity?: number }>;
  status?: string;
};

type DeliveryNoteApiResponse = {
  id: number;
  dnNumber?: string;
  invoiceNumber?: string;
  customerPo?: string;
  gappPo?: string;
  preparedBy?: string;
  truckType?: string;
  dnDate?: string;
  outboundNumber?: string;
  address?: string;
  googleMapLink?: string;
  createdAt?: string;
  status?: string;
  // Snapshot fields - persisted at DN creation time
  customerName?: string;
  customerPhone?: string;
  transporterName?: string;
  transporterPhone?: string;
  driverName?: string;
  driverPhone?: string;
  // Master entity references (kept for backward compatibility, but snapshot fields are preferred)
  customer?: {
    name?: string;
    locationText?: string;
    googleLocation?: string;
  };
  transporter?: {
    companyName?: string;
    contactName?: string;
  };
  driver?: {
    driverName?: string;
    driverNumber?: string;
    truckNo?: string;
  };
  quantities?: Array<{ description?: string; quantity?: number }>;
};

type OutboundInfoPayload = {
  orderId?: number;
  outboundNumber?: string;
  customerName?: string;
  gappPo?: string | null;
  customerPo?: string | null;
};

type TemplatePayload = {
  dnNumber?: string;
  dnDate?: string;
  outboundNumber?: string;
  gappPo?: string;
  customerPo?: string;
  invoice?: string;
  status?: string;
  product?: string;
  products?: string;
  customerName?: string;
  customerDisplayName?: string;
  address?: string;
  googleLocation?: string;
  receiver1Name?: string;
  receiver1Phone?: string;
  receiver2Name?: string;
  receiver2Phone?: string;
  carrier?: string;
  driverName?: string;
  driverMobile?: string;
  truckType?: string;
  vehicle?: string;
  totalCases?: number;
  grossWeight?: string;
  volume?: string;
  pallets?: number;
  preparedBy?: string;
  preparedDate?: string;
  deliveryMode?: "Transporter" | "Courier" | "Direct";
  courierCompany?: string;
  courierWaybill?: string;
  directRemarks?: string;
  quantities?: Array<{
    partNumber?: string;
    description?: string;
    qty?: number;
    uom?: string;
    condition?: string;
  }>;
  drivers?: Array<{ name?: string; truck?: string; qty?: number; transporterName?: string }>;
};

const formatDateString = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return undefined;
  }
  return timestamp.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const resolvePreparedByName = (): string => {
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

const loadPreviewPayload = (): PrintPreviewPayload | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(PRINT_PREVIEW_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(PRINT_PREVIEW_STORAGE_KEY);
    return null;
  }
};

const mapPreviewToTemplate = (
  preview: PrintPreviewPayload | null | undefined,
  preparedByName?: string
): TemplatePayload => {
  if (!preview) {
    return {
      preparedBy: preparedByName,
      preparedDate: formatDateString(new Date().toISOString()),
    };
  }
  const quantities = preview.quantities ?? [];
  const totalQty = quantities.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  return {
    dnNumber: preview.dnNumber,
    dnDate: formatDateString(preview.dateCreated),
    gappPo: preview.gappPo,
    customerPo: preview.customerPo,
    invoice: preview.invoiceNumber,
    outboundNumber: preview.outboundNumber,
    customerDisplayName: preview.customer?.name,
    address: preview.customer?.address,
    googleLocation: preview.customer?.googleLocation,
    receiver1Name: preview.customer?.receiver1Name,
    receiver1Phone: preview.customer?.receiver1Contact,
    receiver2Name: preview.customer?.receiver2Name,
    receiver2Phone: preview.customer?.receiver2Contact,
    carrier: preview.transporter?.companyName,
    driverName: preview.driver?.driverName,
    driverMobile: preview.driver?.driverNumber,
    truckType: preview.truckType,
    deliveryMode: "Transporter",
    products: undefined,
    quantities: quantities.map((item, index) => ({
      partNumber: `PREV-${index + 1}`,
      description: item.description,
      qty: item.quantity,
      uom: "EA",
      condition: "New",
    })),
    drivers: [
      {
        name: preview.driver?.driverName,
        truck: preview.truckType,
        qty: totalQty || undefined,
        transporterName: preview.transporter?.companyName,
      },
    ],
    totalCases: totalQty || undefined,
    pallets: 0,
    preparedBy: preview.preparedBy ?? preparedByName,
    preparedDate: formatDateString(preview.dateCreated),
    status: preview.status,
  };
};

const mapDeliveryNoteToTemplate = (
  note: DeliveryNoteApiResponse | null | undefined,
  preparedByName?: string
): TemplatePayload => {
  if (!note) {
    return {};
  }
  const quantities = note.quantities ?? [];
  const totalQty = quantities.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  // Use snapshot fields (persisted at DN creation) with fallback to master entity references
  const customerName = note.customerName ?? note.customer?.name;
  const transporterName = note.transporterName ?? note.transporter?.companyName;
  const driverName = note.driverName ?? note.driver?.driverName;
  const driverPhone = note.driverPhone ?? note.driver?.driverNumber;

  return {
    dnNumber: note.dnNumber,
    dnDate: formatDateString(note.dnDate ?? note.createdAt),
    gappPo: note.gappPo,
    customerPo: note.customerPo,
    invoice: note.invoiceNumber,
    outboundNumber: note.outboundNumber,
    // Use snapshot customer name - this is the legally preserved value
    customerDisplayName: customerName,
    address: note.address ?? note.customer?.locationText,
    googleLocation: note.googleMapLink ?? note.customer?.googleLocation,
    carrier: transporterName,
    driverName: driverName,
    driverMobile: driverPhone,
    truckType: note.truckType ?? note.driver?.truckNo,
    deliveryMode: "Transporter",
    products: undefined,
    quantities: quantities.map((item, index) => ({
      partNumber: item.description ? `API-${index + 1}` : undefined,
      description: item.description,
      qty: item.quantity,
      uom: "EA",
      condition: "New",
    })),
    drivers: [
      {
        name: driverName,
        truck: note.truckType ?? note.driver?.truckNo,
        qty: totalQty || undefined,
        transporterName: transporterName,
      },
    ],
    totalCases: totalQty || undefined,
    pallets: 0,
    preparedBy: note.preparedBy ?? preparedByName,
    preparedDate: formatDateString(note.dnDate ?? note.createdAt),
    status: note.status,
  };
};

const mapOutboundToTemplate = (
  outbound: OutboundInfoPayload | null | undefined
): TemplatePayload => {
  if (!outbound) {
    return {};
  }
  return {
    gappPo: outbound.gappPo ?? undefined,
    customerPo: outbound.customerPo ?? undefined,
    customerDisplayName: outbound.customerName ?? undefined,
  };
};

const mergePayloads = (...payloads: Array<TemplatePayload | null | undefined>): TemplatePayload => {
  const merged: TemplatePayload = {};
  for (const payload of payloads) {
    if (!payload) {
      continue;
    }
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) {
        continue;
      }
      (merged as any)[key] = value;
    }
  }
  return merged;
};

const PrintDN = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const location = useLocation();
  const preparedByName = useMemo(() => resolvePreparedByName(), []);
  const [templatePayload, setTemplatePayload] = useState<TemplatePayload | null>(null);
  const [dataSourceLabel, setDataSourceLabel] = useState("Loading delivery note...");
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const iframeContent = useMemo(() => {
    const replacedLogo = templateHtml.replace(/src="logo\.png"/g, `src="${logoUrl}"`);
    const withoutCssLink = replacedLogo.replace(
      /<link\s+rel="stylesheet"\s+href="style\.css"\s*>/i,
      ""
    );
    const withInlineStyle = withoutCssLink.replace(
      "</head>",
      `<style>${templateCss}</style></head>`
    );
    return withInlineStyle;
  }, []);

  const handlePrint = () => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) {
      return;
    }
    iframeWindow.focus();
    iframeWindow.print();
  };

  const postMessageToTemplate = (payload: unknown) => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (iframeWindow) {
      iframeWindow.postMessage(payload, "*");
    }
  };

  const handleIframeLoad = () => {
    if (templatePayload) {
      postMessageToTemplate({ type: "refresh-data", payload: templatePayload });
    }
  };

  const handleLanguageChange = (lang: "en" | "ar") => {
    postMessageToTemplate({ type: "set-language", lang });
  };

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams(location.search);
    const noteIdParam = params.get("id");
    const orderIdParam = params.get("orderId");
    const previewPayload = loadPreviewPayload();

    const loadData = async () => {
      setLoadingData(true);
      setLoadError(null);
      let noteResponse: DeliveryNoteApiResponse | null = null;
      let outboundResponse: OutboundInfoPayload | null = null;
      try {
        if (noteIdParam) {
          const numericId = Number(noteIdParam);
          if (!Number.isNaN(numericId)) {
            const response = await api.get<DeliveryNoteApiResponse>(`/delivery-note/${numericId}`);
            noteResponse = response.data;
          }
        }
        if (orderIdParam) {
          const numericOrderId = Number(orderIdParam);
          if (!Number.isNaN(numericOrderId)) {
            const response = await api.get<OutboundInfoPayload>(`/api/outbound/${numericOrderId}`);
            outboundResponse = response.data;
          }
        }
      } catch (err) {
        console.error("Unable to load print data", err);
        if (isMounted) {
          setLoadError("Unable to load delivery note data.");
        }
      } finally {
        if (!isMounted) {
          return;
        }
        const basePayload: TemplatePayload = {
          preparedBy: preparedByName,
          preparedDate: formatDateString(new Date().toISOString()),
        };
        const mergedPayload = mergePayloads(
          basePayload,
          mapPreviewToTemplate(previewPayload, preparedByName),
          mapOutboundToTemplate(outboundResponse),
          mapDeliveryNoteToTemplate(noteResponse, preparedByName)
        );
        setTemplatePayload(mergedPayload);
        if (noteResponse && noteIdParam) {
          setDataSourceLabel(`Delivery note #${noteIdParam}`);
        } else if (outboundResponse?.orderId) {
          setDataSourceLabel(`Order #${outboundResponse.orderId}`);
        } else if (orderIdParam) {
          setDataSourceLabel(`Order #${orderIdParam}`);
        } else if (previewPayload) {
          setDataSourceLabel("Draft preview (session)");
        } else {
          setDataSourceLabel("Static template");
        }
        setLoadingData(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [location.search, preparedByName]);

  useEffect(() => {
    if (templatePayload) {
      postMessageToTemplate({ type: "refresh-data", payload: templatePayload });
    }
  }, [templatePayload]);

  return (
    <div className="print-page">
      <div className="print-controls">
        <div className="language-actions">
          <button type="button" onClick={() => handleLanguageChange("en")}>
            English
          </button>
          <button type="button" onClick={() => handleLanguageChange("ar")}>
            العربية
          </button>
        </div>
        <button className="print-button" onClick={handlePrint}>
          🖨️ Print Delivery Note
        </button>
        <span className="data-source-badge">
          {loadingData ? "Loading delivery note..." : dataSourceLabel}
        </span>
      </div>
      {loadError && <div className="print-error">{loadError}</div>}
      <div className="print-container">
        <iframe
          ref={iframeRef}
          id="dn-template-iframe"
          title="Delivery note preview"
          srcDoc={iframeContent}
          onLoad={handleIframeLoad}
          style={{ width: "100%", minHeight: "880px", border: "1px solid #e2e8f0" }}
        />
      </div>
      <style>{`
        .print-page {
          min-height: 100vh;
          background: #f4f6fb;
          padding: 24px;
          box-sizing: border-box;
        }

        .print-controls {
          max-width: 210mm;
          margin: 0 auto 16px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
        }

        .language-actions {
          display: inline-flex;
          gap: 8px;
          margin-right: auto;
        }

        .language-actions button {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          background: transparent;
          color: white;
          font-size: 12px;
          cursor: pointer;
        }

        .language-actions button:hover {
          border-color: white;
        }

        .print-button {
          background: #1c3d5a;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }

        .print-button:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }

        .data-source-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 999px;
          background: #48bb78;
          color: white;
        }

        .print-error {
          max-width: 210mm;
          margin: 6px auto 0;
          color: #c53030;
          font-size: 12px;
          text-align: center;
        }

        .print-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(5, 16, 42, 0.25);
        }

        @media print {
          body {
            background: white;
          }
          .print-controls {
            display: none;
          }
          .print-page {
            padding: 0;
          }
          .print-container {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintDN;
