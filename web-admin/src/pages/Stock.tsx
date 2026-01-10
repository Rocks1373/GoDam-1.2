import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table";
import * as XLSX from "xlsx";

type StockRow = {
  id: number;
  warehouse: string;
  storageLocation: string;
  partNumber: string;
  sapPn: string;
  description: string;
  indicator: string;
  uom: string;
  qty: number;
  rack: string;
  bin: string;
  combinedRack: string;
  vendor: string;
  status: string;
};

type UploadRow = {
  warehouseNo: string;
  storageLocation: string;
  partNumber: string;
  sapPn?: string;
  parentPn?: string;
  description?: string;
  qty: number;
  uom?: string;
  vendorName?: string;
  category?: string;
  subCategory?: string;
  rack?: string;
  bin?: string;
  combineRack?: string;
  receivedAt?: string;
  drumNo?: number;
  drumQty?: number;
};

type StockItemDto = {
  id: number;
  warehouseNo: string;
  storageLocation: string;
  partNumber: string;
  sapPn: string | null;
  description: string | null;
  uom: string;
  qty: number;
  rack: string | null;
  combineRack: string | null;
  qtyStatus: string | null;
  serialRequired: boolean;
  schneider: boolean;
  drumNo: number | null;
  drumQty: number | null;
  parentPn: string | null;
  baseQty?: number | null;
  pnIndicator?: string | null;
};

const Stock = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [data, setData] = useState<StockRow[]>([]);
  const [rawItems, setRawItems] = useState<StockItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadRows, setUploadRows] = useState<UploadRow[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editMode, setEditMode] = useState<"new" | "edit">("new");
  const [editForm, setEditForm] = useState<UploadRow>({
    warehouseNo: "",
    storageLocation: "",
    partNumber: "",
    qty: 0,
    uom: "EA",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [rackEditing, setRackEditing] = useState<StockItemDto | null>(null);
  const [rackEditValue, setRackEditValue] = useState("");
  const [binEditValue, setBinEditValue] = useState("");
  const [combineRackEditValue, setCombineRackEditValue] = useState("");
  const [rackSaving, setRackSaving] = useState(false);
  const [rackError, setRackError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const columns = useMemo<ColumnDef<StockRow>[]>(
    () => [
      { accessorKey: "warehouse", header: "Warehouse" },
      { accessorKey: "partNumber", header: "Part Number" },
      { accessorKey: "sapPn", header: "SAP PN" },
      { accessorKey: "description", header: "Description" },
      { accessorKey: "indicator", header: "Indicator" },
      { accessorKey: "uom", header: "UOM" },
      { accessorKey: "qty", header: "Qty" },
      { accessorKey: "rack", header: "Rack" },
      { accessorKey: "bin", header: "Bin" },
      { accessorKey: "combinedRack", header: "Combined Rack" },
      { accessorKey: "vendor", header: "Vendor" },
      { accessorKey: "status", header: "Status" },
    ],
    []
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<StockItemDto[]>("/stock", {
          params: warehouseFilter ? { warehouseNo: warehouseFilter } : undefined,
        });
        const items = response.data ?? [];
        const rows = (response.data ?? []).map((item) => ({
          id: item.id,
          warehouse: item.warehouseNo ?? "-",
          storageLocation: item.storageLocation ?? "-",
          partNumber: item.partNumber ?? "-",
          sapPn: item.sapPn ?? "-",
          description: item.description ?? "-",
          indicator: item.pnIndicator ?? item.parentPn ?? "-",
          uom: item.uom ?? "-",
          qty: item.qty ?? 0,
          rack: item.rack ?? "-",
          bin: item.storageLocation ?? "-",
          combinedRack: item.combineRack ?? "-",
          vendor: "-",
          status: item.qtyStatus ?? "-",
        }));
        if (active) {
          setRawItems(items);
          setData(rows);
        }
      } catch {
        if (active) {
          setError("Unable to load stock list.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [warehouseFilter, reloadToken]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const parseUpload = (file: File) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string | number | Date>>(
        sheet,
        { defval: "" }
      );

      const normalized = json.map((row) => {
        const map: Record<string, string | number | Date> = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.toLowerCase().trim();
          map[normalizedKey] = row[key];
        });
        return map;
      });

      const rows: UploadRow[] = normalized.map((row) => ({
        warehouseNo: String(row["warehouse_no"] ?? "").trim(),
        storageLocation: String(row["storage_location"] ?? "").trim(),
        partNumber: String(row["part_number"] ?? "").trim(),
        sapPn: String(row["sap_pn"] ?? "").trim() || undefined,
        parentPn: String(row["parent_pn"] ?? "").trim() || undefined,
        description: String(row["description"] ?? "").trim() || undefined,
        qty: Number(row["qty"] ?? 0),
        uom: String(row["uom"] ?? "").trim() || undefined,
        vendorName: String(row["vendor_name"] ?? "").trim() || undefined,
        category: String(row["category"] ?? "").trim() || undefined,
        subCategory: String(row["sub_category"] ?? "").trim() || undefined,
        rack: String(row["rack"] ?? "").trim() || undefined,
        bin: String(row["bin"] ?? "").trim() || undefined,
        combineRack: String(row["combine_rack"] ?? "").trim() || undefined,
        receivedAt: String(row["received_at"] ?? "").trim() || undefined,
        drumNo: row["drum_no"] ? Number(row["drum_no"]) : undefined,
        drumQty: row["drum_qty"] ? Number(row["drum_qty"]) : undefined,
      }));

      const valid = rows.filter(
        (row) => row.warehouseNo && row.storageLocation && row.partNumber
      );
      if (valid.length === 0) {
        setUploadError("No valid rows found. Check required columns.");
      }
      setUploadRows(valid);
    };
    reader.readAsArrayBuffer(file);
  };

  const submitUpload = async () => {
    if (uploadRows.length === 0) {
      setUploadError("No rows to upload.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await api.post("/stock/bulk", uploadRows);
      setShowUpload(false);
      setUploadRows([]);
      setWarehouseFilter("");
      setReloadToken((value) => value + 1);
    } catch {
      setUploadError("Upload failed. Check backend logs.");
    } finally {
      setUploading(false);
    }
  };

  const buildUploadRow = (item: StockItemDto, overrides: Partial<UploadRow> = {}): UploadRow => ({
    warehouseNo: item.warehouseNo,
    storageLocation: item.storageLocation,
    partNumber: item.partNumber,
    sapPn: item.sapPn ?? undefined,
    parentPn: item.parentPn ?? undefined,
    description: item.description ?? undefined,
    qty: item.qty ?? 0,
    uom: item.uom ?? undefined,
    vendorName: undefined,
    category: undefined,
    subCategory: undefined,
    rack: item.rack ?? undefined,
    bin: undefined,
    combineRack: item.combineRack ?? undefined,
    receivedAt: undefined,
    drumNo: item.drumNo ?? undefined,
    drumQty: item.drumQty ?? undefined,
    ...overrides,
  });

  const openRackEditor = (item: StockItemDto) => {
    setRackError(null);
    setRackEditing(item);
    setRackEditValue(item.rack ?? "");
    setBinEditValue("");
    setCombineRackEditValue(item.combineRack ?? "");
  };

  const closeRackEditor = () => {
    setRackEditing(null);
    setRackEditValue("");
    setBinEditValue("");
    setCombineRackEditValue("");
    setRackError(null);
  };

  const saveRackUpdate = async () => {
    if (!rackEditing) return;
    const nextRack = rackEditValue.trim();
    if (!nextRack) {
      setRackError("Rack is required.");
      return;
    }
    setRackSaving(true);
    setRackError(null);
    try {
      const currentRack = (rackEditing.rack ?? "").trim();
      const payload: UploadRow[] = [];
      if (currentRack && currentRack.toLowerCase() !== nextRack.toLowerCase()) {
        payload.push(buildUploadRow(rackEditing, { qty: 0 }));
        payload.push(
          buildUploadRow(rackEditing, {
            rack: nextRack,
            bin: binEditValue.trim() || undefined,
            combineRack: combineRackEditValue.trim() || undefined,
          })
        );
      } else {
        payload.push(
          buildUploadRow(rackEditing, {
            rack: nextRack,
            bin: binEditValue.trim() || undefined,
            combineRack: combineRackEditValue.trim() || undefined,
          })
        );
      }
      await api.post("/stock/bulk", payload);
      setWarehouseFilter("");
      setReloadToken((value) => value + 1);
      closeRackEditor();
    } catch {
      setRackError("Rack update failed. Check backend logs.");
    } finally {
      setRackSaving(false);
    }
  };

  const deleteRack = async (item: StockItemDto) => {
    setRackSaving(true);
    setRackError(null);
    try {
      await api.post("/stock/bulk", [buildUploadRow(item, { qty: 0 })]);
      setWarehouseFilter("");
      setReloadToken((value) => value + 1);
    } catch {
      setRackError("Rack delete failed. Check backend logs.");
    } finally {
      setRackSaving(false);
    }
  };

  const rows = table.getRowModel().rows;
  const selectedIndex = rows.findIndex((row) => row.original.id === selectedRowId);

  const selectedItem = selectedRowId
    ? rawItems.find((item) => item.id === selectedRowId)
    : null;

  const openNewItem = () => {
    setEditMode("new");
    setEditError(null);
    setEditForm({
      warehouseNo: warehouseFilter.trim(),
      storageLocation: "",
      partNumber: "",
      sapPn: "",
      parentPn: "",
      description: "",
      qty: 0,
      uom: "EA",
      vendorName: "",
      category: "",
      subCategory: "",
      rack: "",
      bin: "",
      combineRack: "",
      drumNo: undefined,
      drumQty: undefined,
    });
    setShowEditor(true);
  };

  const openEditItem = () => {
    if (!selectedItem) {
      setError("Select a stock row first.");
      return;
    }
    setEditMode("edit");
    setEditError(null);
    setEditForm(buildUploadRow(selectedItem));
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditError(null);
  };

  const saveEditor = async () => {
    setEditError(null);
    if (!editForm.warehouseNo.trim() || !editForm.storageLocation.trim() || !editForm.partNumber.trim()) {
      setEditError("Warehouse, Location, and Part Number are required.");
      return;
    }
    if (Number.isNaN(editForm.qty)) {
      setEditError("Qty must be a number.");
      return;
    }
    setEditSaving(true);
    try {
      await api.post("/stock/bulk", [{ ...editForm, qty: Number(editForm.qty) }]);
      setShowEditor(false);
      setWarehouseFilter("");
      setReloadToken((value) => value + 1);
    } catch {
      setEditError("Save failed. Check backend logs.");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedItem) {
      setError("Select a stock row first.");
      return;
    }
    setError(null);
    try {
      await api.post("/stock/bulk", [buildUploadRow(selectedItem, { qty: 0 })]);
      setWarehouseFilter("");
      setReloadToken((value) => value + 1);
      setSelectedRowId(null);
    } catch {
      setError("Delete failed. Check backend logs.");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (rows.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(
        (selectedIndex === -1 ? 0 : selectedIndex + 1),
        rows.length - 1
      );
      setSelectedRowId(rows[nextIndex].original.id);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(
        (selectedIndex === -1 ? 0 : selectedIndex - 1),
        0
      );
      setSelectedRowId(rows[nextIndex].original.id);
    }
    if (event.key === "Enter" && selectedIndex !== -1) {
      event.preventDefault();
    }
  };

  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h1>Stock Management</h1>
          <p>Keyboard-first inventory control.</p>
        </div>
        <div className="stock-actions">
          <button className="btn" onClick={openNewItem}>
            + New Item
          </button>
          <button className="btn" onClick={openEditItem} disabled={!selectedItem}>
            Edit
          </button>
          <button className="btn danger" onClick={deleteSelected} disabled={!selectedItem}>
            Delete
          </button>
          <button
            className="btn ghost"
            onClick={() => selectedItem && openRackEditor(selectedItem)}
            disabled={!selectedItem}
          >
            Edit rack
          </button>
          <button
            className="btn ghost danger"
            onClick={() => selectedItem && deleteRack(selectedItem)}
            disabled={!selectedItem || rackSaving}
          >
            Delete rack
          </button>
          <button className="btn ghost" onClick={() => setShowUpload(true)}>
            Upload CSV/XLSX
          </button>
        </div>
      </div>
      {error ? <div className="banner">{error}</div> : null}
      {rackError ? <div className="banner">{rackError}</div> : null}

      <div className="stock-toolbar">
        <div className="toolbar-left">
          <input
            className="search-input"
            placeholder="Search part, description, rack..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
          />
          <input
            className="search-input"
            placeholder="Warehouse filter (optional)"
            value={warehouseFilter}
            onChange={(event) => setWarehouseFilter(event.target.value)}
          />
        </div>
        <div className="toolbar-note">
          {loading ? "Loading stock..." : "Showing live data."}
        </div>
      </div>

      <div className="table-wrap" tabIndex={0} onKeyDown={handleKeyDown}>
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    className={index === 1 ? "sticky-col" : undefined}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="th-content">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span className="sort-indicator">
                        {header.column.getIsSorted() === "asc"
                          ? "↑"
                          : header.column.getIsSorted() === "desc"
                          ? "↓"
                          : ""}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
            <tr>
              {table.getHeaderGroups()[0].headers.map((header, index) => (
                <th
                  key={`${header.id}-filter`}
                  className={index === 1 ? "sticky-col" : undefined}
                >
                  {header.column.getCanFilter() ? (
                    <input
                      className="column-filter"
                      placeholder="Filter..."
                      value={(header.column.getFilterValue() ?? "") as string}
                      onChange={(event) =>
                        header.column.setFilterValue(event.target.value)
                      }
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.original.id}
                className={row.original.id === selectedRowId ? "row-selected" : ""}
                onClick={() => setSelectedRowId(row.original.id)}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={index === 1 ? "sticky-col" : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="empty">No stock rows available.</div>
        ) : null}
      </div>
      {showUpload ? (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Upload Stock (Excel)</h3>
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
              {uploadError ? <div className="banner">{uploadError}</div> : null}
              <div className="upload-preview">
                <div className="hint">
                  Parsed rows: {uploadRows.length}
                </div>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Warehouse</th>
                        <th>Location</th>
                        <th>Part</th>
                        <th>Qty</th>
                        <th>UOM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadRows.slice(0, 8).map((row, index) => (
                        <tr key={`${row.partNumber}-${index}`}>
                          <td>{row.warehouseNo}</td>
                          <td>{row.storageLocation}</td>
                          <td>{row.partNumber}</td>
                          <td>{row.qty}</td>
                          <td>{row.uom}</td>
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
      ) : null}
      {showEditor ? (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editMode === "new" ? "New Stock Item" : "Edit Stock Item"}</h3>
              <button className="btn tiny" onClick={closeEditor}>
                Close
              </button>
            </div>
            <div className="modal-body">
              {editError ? <div className="banner">{editError}</div> : null}
              <div className="form-grid">
                <label>
                  Warehouse *
                  <input
                    className="search-input"
                    value={editForm.warehouseNo}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, warehouseNo: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Location *
                  <input
                    className="search-input"
                    value={editForm.storageLocation}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, storageLocation: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Part Number *
                  <input
                    className="search-input"
                    value={editForm.partNumber}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, partNumber: event.target.value }))
                    }
                  />
                </label>
                <label>
                  SAP PN
                  <input
                    className="search-input"
                    value={editForm.sapPn ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, sapPn: event.target.value || undefined }))
                    }
                  />
                </label>
                <label>
                  Parent PN
                  <input
                    className="search-input"
                    value={editForm.parentPn ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, parentPn: event.target.value || undefined }))
                    }
                  />
                </label>
                <label>
                  Description
                  <input
                    className="search-input"
                    value={editForm.description ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, description: event.target.value || undefined }))
                    }
                  />
                </label>
                <label>
                  Qty *
                  <input
                    className="search-input"
                    type="number"
                    value={editForm.qty}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, qty: Number(event.target.value) }))
                    }
                  />
                </label>
                <label>
                  UOM
                  <input
                    className="search-input"
                    value={editForm.uom ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, uom: event.target.value || undefined }))
                    }
                  />
                </label>
                <label>
                  Rack
                  <input
                    className="search-input"
                    value={editForm.rack ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, rack: event.target.value || undefined }))
                    }
                  />
                </label>
                <label>
                  Bin
                  <input
                    className="search-input"
                    value={editForm.bin ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, bin: event.target.value || undefined }))
                    }
                  />
                </label>
                <label>
                  Combined Rack
                  <input
                    className="search-input"
                    value={editForm.combineRack ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, combineRack: event.target.value || undefined }))
                    }
                  />
                </label>
                <label>
                  Drum No
                  <input
                    className="search-input"
                    type="number"
                    value={editForm.drumNo ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        drumNo: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                  />
                </label>
                <label>
                  Drum Qty
                  <input
                    className="search-input"
                    type="number"
                    value={editForm.drumQty ?? ""}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        drumQty: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button className="btn ghost" onClick={closeEditor}>
                  Cancel
                </button>
                <button className="btn" onClick={saveEditor} disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rackEditing ? (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Rack</h3>
              <button className="btn tiny" onClick={closeRackEditor}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Rack *
                  <input
                    className="search-input"
                    value={rackEditValue}
                    onChange={(event) => setRackEditValue(event.target.value)}
                  />
                </label>
                <label>
                  Bin
                  <input
                    className="search-input"
                    value={binEditValue}
                    onChange={(event) => setBinEditValue(event.target.value)}
                  />
                </label>
                <label>
                  Combined rack
                  <input
                    className="search-input"
                    value={combineRackEditValue}
                    onChange={(event) => setCombineRackEditValue(event.target.value)}
                  />
                </label>
              </div>
              <div className="hint">
                Changing rack moves stock by creating a new rack row and zeroing the old rack qty.
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={closeRackEditor}>
                Cancel
              </button>
              <button className="btn primary" onClick={saveRackUpdate} disabled={rackSaving}>
                {rackSaving ? "Saving..." : "Save rack"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Stock;
