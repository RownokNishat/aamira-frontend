import { useState, useMemo } from "react";
import { usePackages } from "./hooks/usePackages";
import * as api from "./services/api";

import { PackageCreator } from "./components/PackageCreator";
import { PackageTable } from "./components/PackageTable";
import { TimelineModal } from "./components/TimelineModal";
import { AlertsPopover } from "./components/AlertsPopover";
import { Input } from "./components/ui/Input";
import { Select } from "./components/ui/Select";

function App() {
  const { packages, alerts, connectionError } = usePackages();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL_ACTIVE");
  const [selectedPackageHistory, setSelectedPackageHistory] = useState(null);

  const filteredPackages = useMemo(() => {
    return packages
      .filter(
        (pkg) => statusFilter === "ALL_ACTIVE" || pkg.status === statusFilter
      )
      .filter((pkg) =>
        pkg.package_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [packages, statusFilter, searchQuery]);

  const handleRowClick = async (packageId) => {
    try {
      const response = await api.fetchPackageHistory(packageId);
      if (response.ok) {
        setSelectedPackageHistory(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch package history:", error);
    }
  };

  return (
    <>
      <div className="bg-gray-100 min-h-screen font-sans">
        <div className="container mx-auto p-6">
          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Aamira Courier Dashboard
            </h1>
            <AlertsPopover alerts={alerts} />
          </header>

          {/* ## MODIFICATION: Switched to CSS Grid for a responsive layout ## */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ## MODIFICATION: This column now spans 1/3 of the grid on large screens ## */}
            <div className="lg:col-span-1">
              <PackageCreator />
            </div>

            {/* ## MODIFICATION: This column now spans 2/3 of the grid on large screens ## */}
            <div className="lg:col-span-2 h-[80vh]">
              <div className="bg-white p-8 rounded-xl shadow-lg h-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Live Package Feed
                </h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Input
                    type="text"
                    placeholder="Search by Package ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="sm:w-2/3"
                  />
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="sm:w-1/3"
                  >
                    <option value="ALL_ACTIVE">All Active</option>
                    <option value="CREATED">Created</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </div>

                <PackageTable
                  packages={filteredPackages}
                  alerts={alerts}
                  onRowClick={handleRowClick}
                  connectionError={connectionError}
                />
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

export default App;
