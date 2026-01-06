import { useEffect, useState } from "react";
import { api } from "../services/api";

const ApiStatusBadge = () => {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        await api.get("/orders");
        if (active) {
          setStatus("online");
        }
      } catch {
        if (active) {
          setStatus("offline");
        }
      }
    };

    check();

    return () => {
      active = false;
    };
  }, []);

  const label =
    status === "checking" ? "API Checking" : status === "online" ? "API Online" : "API Offline";

  return (
    <div className={`api-badge api-${status}`} aria-live="polite">
      <span className="api-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};

export default ApiStatusBadge;
