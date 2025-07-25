import { useState, useMemo } from "react";
import { usePackages } from "./hooks/usePackages";
import { PackageCreator } from "./components/PackageCreator";
import { PackageTable } from "./components/PackageTable";
import { TimelineModal } from "./components/TimelineModal";
import { AlertBanner } from "./components/AlertBanner";
import * as api from "./services/api";

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
              {/* Package Table and Filters will go here */}
              <PackageTable
                packages={filteredPackages}
                alerts={alerts}
                onRowClick={handleRowClick}
                // ... other props for filtering
              />
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
