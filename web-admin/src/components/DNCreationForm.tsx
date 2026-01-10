import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import DNPreview, { type PreviewItem } from "./DNPreview";
import "./DNCreationForm.css";

// Define types based on expected API structure
interface OrderItem {
  id: number;
  partNumber: string;
  description: string;
  quantity: number;
  uom?: string;
  weight?: number;
  volume?: number;
}

interface Order {
  id: number;
  outboundNumber: string;
  customerName?: string; // Sometimes flattened in API response
  customerId?: number;
  items?: OrderItem[];
}

interface Customer {
  id: number;
  name: string;
  address: string;
  phone: string;
  contactPerson?: string;
}

interface Transporter {
  id: number;
  name: string;
  contactPerson?: string;
}

interface Driver {
  id: number;
  name: string;
  mobileNumber: string;
  transporterId?: number;
  vehiclePlate?: string;
  vehicleType?: string;
}

const DNCreationForm = () => {
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Selection State
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Form State
  const [dnNumber, setDnNumber] = useState("");
  const [dnDate, setDnDate] = useState(new Date().toISOString().split('T')[0]);
  const [warehouseName] = useState("Main Warehouse");
  const [warehouseAddress] = useState("123 Logistics Way, Industrial District");
  const [verifierName, setVerifierName] = useState("");
  
  // Loading State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, customersRes, transportersRes, driversRes] = await Promise.all([
          api.get("/orders"), 
          api.get("/customers"),
          api.get("/transporters"),
          api.get("/drivers")
        ]);

        setOrders(ordersRes.data || []);
        setCustomers(customersRes.data || []);
        setTransporters(transportersRes.data || []);
        setDrivers(driversRes.data || []);
      } catch (error) {
        console.error("Failed to load form data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Derived Data
  const selectedOrder = useMemo(() => 
    orders.find(o => o.id.toString() === selectedOrderId), 
    [orders, selectedOrderId]
  );

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id.toString() === selectedCustomerId), 
    [customers, selectedCustomerId]
  );

  const selectedTransporter = useMemo(() => 
    transporters.find(t => t.id.toString() === selectedTransporterId), 
    [transporters, selectedTransporterId]
  );

  const selectedDriver = useMemo(() => 
    drivers.find(d => d.id.toString() === selectedDriverId), 
    [drivers, selectedDriverId]
  );

  // Auto-select customer if order has one
  useEffect(() => {
    if (selectedOrder) {
      if (selectedOrder.customerId) {
        setSelectedCustomerId(selectedOrder.customerId.toString());
      } else if (selectedOrder.customerName) {
        // Try to find by name if ID not present
        const cust = customers.find(c => c.name === selectedOrder.customerName);
        if (cust) setSelectedCustomerId(cust.id.toString());
      }
    }
  }, [selectedOrder, customers]);

  // Filter drivers by transporter
  const availableDrivers = useMemo(() => {
    if (!selectedTransporterId) return drivers;
    return drivers.filter(d => !d.transporterId || d.transporterId.toString() === selectedTransporterId);
  }, [drivers, selectedTransporterId]);

  // Map items for preview
  const previewItems: PreviewItem[] = useMemo(() => {
    if (!selectedOrder?.items) return [];
    return selectedOrder.items.map((item, index) => ({
      itemNumber: index + 1,
      partNumber: item.partNumber,
      description: item.description,
      quantity: item.quantity,
      uom: item.uom || "PCS",
      // Pass through weight/volume if they exist on the item for calculation
      // @ts-ignore - attaching extra props for calculation
      weight: item.weight,
      // @ts-ignore
      volume: item.volume
    }));
  }, [selectedOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      cases: Math.ceil(previewItems.reduce((sum, i) => sum + i.quantity, 0) / 10), // Logic: 10 items per case (Adjust as needed)
      weight: previewItems.reduce((sum, i) => sum + ((i as any).weight || 0) * i.quantity, 0), 
      volume: previewItems.reduce((sum, i) => sum + ((i as any).volume || 0) * i.quantity, 0),
    };
  }, [previewItems]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        orderId: selectedOrderId,
        dnNumber,
        date: dnDate,
        customerId: selectedCustomerId,
        transporterId: selectedTransporterId,
        driverId: selectedDriverId,
        items: previewItems
      };
      await api.post("/delivery-notes", payload);
      alert("Delivery Note Created Successfully!");
    } catch (error) {
      console.error("Failed to save DN", error);
      alert("Failed to create Delivery Note");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading data...</div>;

  return (
    <div className="dn-creation-container">
      {/* Form Panel */}
      <div className="dn-form-panel">
        <h2>Create Delivery Note</h2>
        
        <div className="form-group">
          <label>Select Order</label>
          <select 
            value={selectedOrderId} 
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="form-control"
          >
            <option value="">-- Select Order --</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>{o.outboundNumber}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>DN Number</label>
          <input 
            type="text" 
            value={dnNumber} 
            onChange={(e) => setDnNumber(e.target.value)}
            placeholder="Auto-generated if empty"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input 
            type="date" 
            value={dnDate} 
            onChange={(e) => setDnDate(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="section-divider">Logistics Details</div>

        <div className="form-group">
          <label>Customer</label>
          <select 
            value={selectedCustomerId} 
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="form-control"
          >
            <option value="">-- Select Customer --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Transporter</label>
          <select 
            value={selectedTransporterId} 
            onChange={(e) => setSelectedTransporterId(e.target.value)}
            className="form-control"
          >
            <option value="">-- Select Transporter --</option>
            {transporters.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Driver</label>
          <select 
            value={selectedDriverId} 
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="form-control"
          >
            <option value="">-- Select Driver --</option>
            {availableDrivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="section-divider">Warehouse Info</div>
        
        <div className="form-group">
            <label>Verifier Name</label>
            <input 
                type="text"
                value={verifierName}
                onChange={(e) => setVerifierName(e.target.value)}
                className="form-control"
                placeholder="Enter verifier name"
            />
        </div>

        <div className="form-actions">
            <button 
                className="btn primary" 
                onClick={handleSave}
                disabled={saving || !selectedOrderId}
            >
                {saving ? "Saving..." : "Create Delivery Note"}
            </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="dn-preview-panel-wrapper">
        <DNPreview 
            dnNumber={dnNumber || "DRAFT"}
            outboundNumber={selectedOrder?.outboundNumber}
            dnDate={dnDate}
            
            customerName={selectedCustomer?.name}
            address={selectedCustomer?.address}
            phone1={selectedCustomer?.phone}
            receiver1Name={selectedCustomer?.contactPerson}
            
            warehouseName={warehouseName}
            warehouseAddress={warehouseAddress}
            
            transporterName={selectedTransporter?.name}
            driverName={selectedDriver?.name}
            driverNumber={selectedDriver?.mobileNumber}
            truckType={selectedDriver?.vehicleType}
            vehiclePlate={selectedDriver?.vehiclePlate}
            
            items={previewItems}
            
            totalCases={totals.cases}
            totalWeight={totals.weight}
            totalVolume={totals.volume}
            
            verifierName={verifierName}
            
            printEnabled={true}
            onPrint={() => window.print()}
        />
      </div>
    </div>
  );
};

export default DNCreationForm;
