const mockPartMasters = [
  "KIT1000",
  "KIT2000",
  "PN1001",
  "PN1002",
  "PN2001",
  "PN3005",
  "PN4001",
  "PN5002",
  "PN6003",
];

type MappingRow = {
  id: number;
  parentPn: string;
  childPn: string;
  baseQty: number;
};

const formatParent = (pn: string) => `[P] ${pn}`;
const formatChild = (pn: string) => `[C] ${pn}`;

import { useMemo, useState } from "react";

const ItemManagement = () => {
  const [mappings, setMappings] = useState<MappingRow[]>([
    { id: 1, parentPn: "KIT1000", childPn: "PN1001", baseQty: 2 },
    { id: 2, parentPn: "KIT1000", childPn: "PN1002", baseQty: 1 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMapping, setActiveMapping] = useState<MappingRow | null>(null);
  const [form, setForm] = useState({ parentPn: "", childPn: "", baseQty: "" });
  const [error, setError] = useState("");

  const sortedMappings = useMemo(
    () => [...mappings].sort((a, b) => a.parentPn.localeCompare(b.parentPn)),
    [mappings]
  );

  const resetForm = () => {
    setForm({ parentPn: "", childPn: "", baseQty: "" });
    setError("");
    setActiveMapping(null);
  };

  const openModal = (mapping?: MappingRow) => {
    if (mapping) {
      setActiveMapping(mapping);
      setForm({
        parentPn: mapping.parentPn,
        childPn: mapping.childPn,
        baseQty: mapping.baseQty.toString(),
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSave = () => {
    const parent = form.parentPn.trim().toUpperCase();
    const child = form.childPn.trim().toUpperCase();
    const qty = Number(form.baseQty);

    if (!parent || !child) {
      setError("Both parent and child part numbers are required.");
      return;
    }
    if (parent === child) {
      setError("Parent and child cannot be the same part.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Base quantity must be greater than zero.");
      return;
    }
    const exists = mappings.some(
      (row) =>
        row.parentPn === parent &&
        row.childPn === child &&
        row.id !== activeMapping?.id
    );
    if (exists) {
      setError("This parent-child pairing already exists.");
      return;
    }

    const nextMappings = activeMapping
      ? mappings.map((row) =>
          row.id === activeMapping.id
            ? { ...row, parentPn: parent, childPn: child, baseQty: qty }
            : row
        )
      : [
          ...mappings,
          {
            id: Date.now(),
            parentPn: parent,
            childPn: child,
            baseQty: qty,
          },
        ];

    setMappings(nextMappings);
    closeModal();
  };

  const handleDelete = (id: number) => {
    setMappings((prev) => prev.filter((row) => row.id !== id));
  };

  const partOptions = mockPartMasters.map((pn) => (
    <option key={pn} value={pn}>
      {pn}
    </option>
  ));

  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h1>Item Management</h1>
          <p>Build parent/child kits and conversions before stock logic is wired.</p>
        </div>
      </div>

      <div className="item-management">
        <div className="item-section">
          <div className="item-section-header">
            <h3>Parent / Child</h3>
            <span className="muted">Define kit components and base quantities.</span>
          </div>
          <div className="parent-child-panel">
            <div className="panel-actions">
              <button className="btn primary" onClick={() => openModal()}>
                + Add Mapping
              </button>
            </div>
            <div className="mapping-table">
              <div className="mapping-row header">
                <div>Parent PN</div>
                <div>Child PN</div>
                <div>Base Qty</div>
                <div>Actions</div>
              </div>
              {sortedMappings.map((row) => (
                <div key={row.id} className="mapping-row">
                  <div>{formatParent(row.parentPn)}</div>
                  <div>{formatChild(row.childPn)}</div>
                  <div>{row.baseQty}</div>
                  <div className="actions">
                    <button className="btn ghost tiny" onClick={() => openModal(row)}>
                      Edit
                    </button>
                    <button className="btn ghost danger tiny" onClick={() => handleDelete(row.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {sortedMappings.length === 0 && (
                <div className="mapping-row empty-row">
                  No parent/child mappings yet. Use the button above to add one.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="item-section">
          <div className="item-section-header">
            <h3>Cable / Drum</h3>
            <span className="muted">Split + cut tracking (coming soon)</span>
          </div>
          <div className="empty">Coming next: drum splits, FIFO picks.</div>
        </div>

        <div className="item-section">
          <div className="item-section-header">
            <h3>Rolls</h3>
            <span className="muted">Length conversion view (coming soon)</span>
          </div>
          <div className="empty">Coming next: roll qty conversion table.</div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{activeMapping ? "Edit Mapping" : "Add Mapping"}</h3>
            </div>
            <div className="modal-body">
              <label>
                Parent Part Number
                <input
                  list="part-options"
                  value={form.parentPn}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, parentPn: event.target.value.toUpperCase() }))
                  }
                  placeholder="Start typing a part number"
                />
              </label>
              {form.parentPn && <p className="preview">{formatParent(form.parentPn)}</p>}
              <label>
                Child Part Number
                <input
                  list="part-options"
                  value={form.childPn}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, childPn: event.target.value.toUpperCase() }))
                  }
                  placeholder="Start typing a part number"
                />
              </label>
              {form.childPn && <p className="preview">{formatChild(form.childPn)}</p>}
              <label>
                Base Quantity
                <input
                  type="number"
                  min={1}
                  value={form.baseQty}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, baseQty: event.target.value }))
                  }
                />
              </label>
              {error && <div className="form-error">{error}</div>}
              <datalist id="part-options">{partOptions}</datalist>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ItemManagement;
