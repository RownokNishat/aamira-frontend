import { useState, useEffect, useCallback, useMemo } from "react";
import { useSocket } from "./useSocket";
import * as api from "../services/api";

export const usePackages = () => {
  const [packages, setPackages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  const fetchInitialData = useCallback(async () => {
    setConnectionError(null);
    try {
      const [pkgResponse, alertResponse] = await Promise.all([
        api.fetchActivePackages(),
        api.fetchAlerts(),
      ]);
      if (pkgResponse.ok) setPackages(await pkgResponse.json());
      if (alertResponse.ok) setAlerts(await alertResponse.json());
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setConnectionError("Could not connect to the backend server.");
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const eventHandlers = useMemo(
    () => ({
      package_updated: (updatedPackage) => {
        setPackages((prev) => {
          if (["DELIVERED", "CANCELLED"].includes(updatedPackage.status)) {
            return prev.filter(
              (p) => p.package_id !== updatedPackage.package_id
            );
          }
          const existingIndex = prev.findIndex(
            (p) => p.package_id === updatedPackage.package_id
          );
          if (existingIndex > -1) {
            return prev.map((p) =>
              p.package_id === updatedPackage.package_id ? updatedPackage : p
            );
          }
          return [...prev, updatedPackage];
        });
      },
      new_alert: (newAlert) => {
        setAlerts((prev) =>
          prev.find((a) => a.package_id === newAlert.package_id)
            ? prev
            : [...prev, newAlert]
        );
      },
      alert_cleared: ({ package_id }) => {
        setAlerts((prev) => prev.filter((a) => a.package_id !== package_id));
      },
    }),
    []
  );

  useSocket(eventHandlers);

  return { packages, alerts, connectionError };
};
