const ItemManagement = () => {
  return (
    <section className="panel stock-panel">
      <div className="panel-header">
        <div>
          <h1>Item Management</h1>
          <p>Parent/Child, Cable/Drum, and Roll controls.</p>
        </div>
      </div>

      <div className="item-management">
        <div className="item-section">
          <div className="item-section-header">
            <h3>Parent / Child</h3>
            <span className="muted">Mappings and base quantity</span>
          </div>
          <div className="empty">Coming next: mapping list + add child mapping.</div>
        </div>

        <div className="item-section">
          <div className="item-section-header">
            <h3>Cable / Drum</h3>
            <span className="muted">Split + cut tracking</span>
          </div>
          <div className="empty">Coming next: drum splits, FIFO picks.</div>
        </div>

        <div className="item-section">
          <div className="item-section-header">
            <h3>Rolls</h3>
            <span className="muted">Length conversion view</span>
          </div>
          <div className="empty">Coming next: roll qty conversion table.</div>
        </div>
      </div>
    </section>
  );
};

export default ItemManagement;
