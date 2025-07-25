import { LocationDisplay } from "./LocationDisplay";

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
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200">
        {pkg.status}
      </td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200">
        {pkg.eta ? new Date(pkg.eta).toLocaleString() : "N/A"}
      </td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200">
        {lastSeen}
      </td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200">
        <LocationDisplay lat={pkg.lat} lon={pkg.lon} />
      </td>
      <td className="p-4 px-6 whitespace-nowrap text-sm text-gray-500 border-t border-gray-200 max-w-xs truncate">
        {pkg.note || "N/A"}
      </td>
    </tr>
  );
};

export const PackageTable = ({
  packages,
  alerts,
  onRowClick,
  connectionError,
}) => {
  const stuckPackageIds = new Set(alerts.map((a) => a.package_id));

  return (
    <div className="overflow-x-auto h-[50vh]">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ETA
            </th>
            <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Seen
            </th>
            <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Place Name
            </th>
            <th className="p-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Note
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {packages.length > 0 ? (
            packages.map((pkg) => (
              <PackageRow
                key={pkg._id}
                pkg={pkg}
                isStuck={stuckPackageIds.has(pkg.package_id)}
                onClick={() => onRowClick(pkg.package_id)}
              />
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center p-8 text-gray-500">
                {connectionError ? "" : "No matching packages found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
