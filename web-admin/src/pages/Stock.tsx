import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table";

type StockRow = {
  warehouse: string;
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
};

const Stock = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [data, setData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState("");
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
        const rows = (response.data ?? []).map((item) => ({
          warehouse: item.warehouseNo ?? "-",
          partNumber: item.partNumber ?? "-",
          sapPn: item.sapPn ?? "-",
          description: item.description ?? "-",
          indicator: item.parentPn ?? "-",
          uom: item.uom ?? "-",
          qty: item.qty ?? 0,
          rack: item.rack ?? "-",
          bin: "-",
          combinedRack: item.combineRack ?? "-",
          vendor: "-",
          status: item.qtyStatus ?? "-",
        }));
        if (active) {
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
  }, [warehouseFilter]);

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

  const rows = table.getRowModel().rows;
  const selectedIndex = rows.findIndex((row) => row.id === selectedRowId);

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
      setSelectedRowId(rows[nextIndex].id);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(
        (selectedIndex === -1 ? 0 : selectedIndex - 1),
        0
      );
      setSelectedRowId(rows[nextIndex].id);
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
          <button className="btn">+ New Item</button>
          <button className="btn">Edit</button>
          <button className="btn danger">Delete</button>
          <button className="btn ghost">Upload CSV/XLSX</button>
        </div>
      </div>
      {error ? <div className="banner">{error}</div> : null}

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
                key={row.id}
                className={row.id === selectedRowId ? "row-selected" : ""}
                onClick={() => setSelectedRowId(row.id)}
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
    </section>
  );
};

export default Stock;
