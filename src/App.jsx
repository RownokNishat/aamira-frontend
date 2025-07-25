import React, { useState, useEffect, useCallback, useMemo } from "react";
import io from "socket.io-client";

// --- Configuration ---
// Socket.io client initialization
const socket = io("http://localhost:3001");

// --- Helper Components ---

const AlertBanner = ({ alert }) => (
  <div
    className="border-l-4 border-red-500 bg-red-100 p-4 mb-4 rounded-r-lg"
    role="alert"
  >
    <p className="font-bold text-red-800">Stuck Package Alert!</p>
    <p className="text-red-800">{alert.message}</p>
  </div>
);

const LocationDisplay = ({ lat, lon }) => {
  const [placeName, setPlaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lat && lon) {
      setIsLoading(true);
      setPlaceName(""); // Reset on new coords
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data && data.display_name) {
            const shortName = data.display_name
              .split(",")
              .slice(0, 3)
              .join(",");
            setPlaceName(shortName);
          } else {
            setPlaceName("Location not found");
          }
          setIsLoading(false);
        })
        .catch(() => {
          setPlaceName("Could not fetch location");
          setIsLoading(false);
        });
    }
  }, [lat, lon]);

  if (!lat || !lon) return "N/A";
  if (isLoading) return "Loading location...";
  return placeName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
};

const PackageRow = ({ pkg, isStuck, onClick }) => {
  const lastSeen = new Date(pkg.received_at).toLocaleTimeString();
  const rowClass = `cursor-pointer hover:bg-gray-50 ${
    isStuck ? "bg-red-50" : ""
  }`;

  return (
    <tr className={rowClass} onClick={onClick}>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200 font-medium text-gray-900">
        {pkg.package_id}
      </td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200">{pkg.status}</td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200">
        {pkg.eta ? new Date(pkg.eta).toLocaleString() : "N/A"}
      </td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200">{lastSeen}</td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200">
        <LocationDisplay lat={pkg.lat} lon={pkg.lon} />
      </td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200 max-w-xs truncate">
        {pkg.note || "N/A"}
      </td>
    </tr>
  );
};

// Form to create/update packages
const PackageCreator = () => {
  const [formData, setFormData] = useState({
    package_id: "",
    status: "CREATED",
    lat: "",
    lon: "",
    note: "",
    eta: "",
  });
  const [isStuckTest, setIsStuckTest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const API_URL = "http://localhost:3001";
  const API_KEY = "1234567890abcdef1234567890abcdef";

  const formElementClasses = "block w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude.toFixed(6),
            lon: position.coords.longitude.toFixed(6),
          }));
          setResponseMessage("Location captured successfully!");
        },
        (error) => {
          setResponseMessage(`Error: ${error.message}`);
        }
      );
    } else {
      setResponseMessage(
        "Error: Geolocation is not supported by this browser."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponseMessage("");
    let eventTimestamp = isStuckTest
      ? new Date(Date.now() - 45 * 60 * 1000).toISOString()
      : new Date().toISOString();
    const payload = {
      ...formData,
      lat: formData.lat ? parseFloat(formData.lat) : undefined,
      lon: formData.lon ? parseFloat(formData.lon) : undefined,
      event_timestamp: eventTimestamp,
      eta: formData.eta || undefined,
    };
    Object.keys(payload).forEach(
      (key) =>
        (payload[key] === undefined || payload[key] === "") &&
        delete payload[key]
    );

    try {
      const response = await fetch(`${API_URL}/api/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setResponseMessage(`Success: Package '${result.package_id}' updated.`);
    } catch (error) {
      setResponseMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Package Control Panel
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="package_id"
          value={formData.package_id}
          onChange={handleChange}
          placeholder="Package ID"
          required
          className={formElementClasses}
        />
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={formElementClasses}
        >
          <option value="CREATED">CREATED</option>
          <option value="PICKED_UP">PICKED_UP</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="EXCEPTION">EXCEPTION</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <div className="flex gap-4">
          <input
            name="lat"
            value={formData.lat}
            onChange={handleChange}
            type="number"
            step="any"
            placeholder="Latitude"
            className={formElementClasses}
          />
          <input
            name="lon"
            value={formData.lon}
            onChange={handleChange}
            type="number"
            step="any"
            placeholder="Longitude"
            className={formElementClasses}
          />
        </div>
        <button
          type="button"
          onClick={handleGetLocation}
          className="w-full bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors hover:bg-emerald-600"
        >
          Get Current Location
        </button>
        <input
          name="eta"
          value={formData.eta}
          onChange={handleChange}
          type="datetime-local"
          placeholder="ETA (Optional)"
          className={formElementClasses}
        />
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Note (optional)"
          className={formElementClasses}
        />
        <div className="flex items-center">
          <input
            id="stuck-test"
            type="checkbox"
            checked={isStuckTest}
            onChange={(e) => setIsStuckTest(e.target.checked)}
            className="h-4 w-4 text-red-600 border-gray-300 rounded"
          />
          <label
            htmlFor="stuck-test"
            className="ml-2 block text-sm text-red-800 font-medium"
          >
            Send as Stuck Package (Timestamp &gt; 30 min ago)
          </label>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send Package Update"}
        </button>
        {responseMessage && (
          <p className="text-sm text-center mt-2">{responseMessage}</p>
        )}
      </form>
    </div>
  );
};

// Timeline Modal Component
const TimelineModal = ({ history, onClose }) => {
  if (!history) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">
            Package History: {history[0]?.package_id}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <div className="border-l-2 border-gray-200 pl-6">
          {history.map((event, index) => (
            <div key={event._id} className="relative mb-6">
              <div
                className={`absolute -left-[35px] top-1 h-3 w-3 rounded-full ${
                  index === 0 ? "bg-blue-500" : "bg-gray-400"
                }`}
              ></div>
              <p className="font-semibold text-gray-800">{event.status}</p>
              <p className="text-sm text-gray-500">
                {new Date(event.event_timestamp).toLocaleString()}
              </p>
              {event.lat && event.lon && (
                <div className="text-sm text-gray-600 mt-1">
                  <LocationDisplay lat={event.lat} lon={event.lon} />
                </div>
              )}
              {event.note && (
                <p className="text-sm text-gray-600 mt-1">
                  Note: {event.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [packages, setPackages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedPackageHistory, setSelectedPackageHistory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL_ACTIVE");
  const [connectionError, setConnectionError] = useState(null);
  const API_URL = "http://localhost:3001";
  const API_KEY = "1234567890abcdef1234567890abcdef";

  const fetchInitialData = useCallback(async () => {
    setConnectionError(null);
    try {
      const [pkgResponse, alertResponse] = await Promise.all([
        fetch(`${API_URL}/api/packages/active`, {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }),
        fetch(`${API_URL}/api/alerts`, {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }),
      ]);
      if (pkgResponse.ok) setPackages(await pkgResponse.json());
      if (alertResponse.ok) setAlerts(await alertResponse.json());
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setConnectionError(
        "Could not connect to the backend server. Please ensure it's running and accessible at http://localhost:3001."
      );
    }
  }, [API_URL, API_KEY]);

  const handleRowClick = async (packageId) => {
    try {
      const response = await fetch(`${API_URL}/api/packages/${packageId}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (response.ok) {
        const historyData = await response.json();
        setSelectedPackageHistory(historyData);
      }
    } catch (error) {
      console.error("Failed to fetch package history:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
    socket.on("package_updated", (updatedPackage) => {
      setPackages((prev) => {
        const existingIndex = prev.findIndex(
          (p) => p.package_id === updatedPackage.package_id
        );
        if (["DELIVERED", "CANCELLED"].includes(updatedPackage.status))
          return prev.filter((p) => p.package_id !== updatedPackage.package_id);
        if (existingIndex > -1)
          return prev.map((p) =>
            p.package_id === updatedPackage.package_id ? updatedPackage : p
          );
        return [...prev, updatedPackage];
      });
    });
    socket.on("new_alert", (newAlert) =>
      setAlerts((prev) =>
        prev.find((a) => a.package_id === newAlert.package_id)
          ? prev
          : [...prev, newAlert]
      )
    );
    socket.on("alert_cleared", ({ package_id }) =>
      setAlerts((prev) => prev.filter((a) => a.package_id !== package_id))
    );
    return () => {
      socket.off("package_updated");
      socket.off("new_alert");
      socket.off("alert_cleared");
    };
  }, [fetchInitialData]);

  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        if (statusFilter === "ALL_ACTIVE") return true;
        return pkg.status === statusFilter;
      })
      .filter((pkg) => {
        return pkg.package_id.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [packages, statusFilter, searchQuery]);

  const stuckPackageIds = new Set(alerts.map((a) => a.package_id));
  const formElementClasses = "block w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500";

  return (
    <>
      <div className="bg-gray-100 min-h-screen font-sans">
        <div className="container mx-auto p-6">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Aamira Courier Real-time Dashboard
            </h1>
          </header>
          <div className="flex flex-col lg:flex-row lg:flex-wrap gap-8">
            <div className="lg:flex-[1_1_400px]">
              <PackageCreator />
            </div>
            <div className="lg:flex-[2_1_600px]">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Live Package Feed
                </h2>

                {connectionError && (
                  <div className="border-l-4 border-amber-400 bg-amber-50 p-4 mb-4 rounded-r-lg">
                    <p className="font-bold text-amber-800">
                      Connection Error
                    </p>
                    <p className="text-amber-800">{connectionError}</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search by Package ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${formElementClasses} sm:w-2/3`}
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`${formElementClasses} sm:w-1/3`}
                  >
                    <option value="ALL_ACTIVE">All Active</option>
                    <option value="CREATED">Created</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="mb-4">
                  {alerts.map((alert) => (
                    <AlertBanner key={alert._id} alert={alert} />
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                        <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                        <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Place Name</th>
                        <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredPackages.length > 0 ? (
                        filteredPackages.map((pkg) => (
                          <PackageRow
                            key={pkg._id}
                            pkg={pkg}
                            isStuck={stuckPackageIds.has(pkg.package_id)}
                            onClick={() => handleRowClick(pkg.package_id)}
                          />
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center p-8 text-gray-500"
                          >
                            {connectionError
                              ? " "
                              : "No matching packages found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TimelineModal
        history={selectedPackageHistory}
        onClose={() => setSelectedPackageHistory(null)}
      />
    </>
  );
}