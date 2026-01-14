import type { ReactNode } from "react";

type PrintPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  preview: ReactNode;
  title?: string;
};

const PrintPreviewModal = ({
  isOpen,
  onClose,
  onPrint,
  preview,
  title = "Delivery Note",
}: PrintPreviewModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="print-preview-backdrop">
      <div className="print-preview-modal" role="dialog" aria-modal="true" aria-label="Delivery note preview">
        <div className="print-preview-header">
          <h3>{title}</h3>
          <button type="button" className="btn ghost tiny" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="print-preview-body">
          <div className="print-preview-sheet" style={{
            width: "210mm",
            minHeight: "297mm",
            aspectRatio: "210 / 297",
            maxWidth: "100%",
            margin: "0 auto",
            backgroundColor: "white",
            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
          }}>
            {preview}
          </div>
        </div>
        <div className="print-preview-footer">
          <button type="button" className="btn" onClick={onPrint}>
            Print
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;

