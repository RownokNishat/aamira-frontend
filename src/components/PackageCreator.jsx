import { useState } from "react";
import { postPackageUpdate } from "../services/api";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";

export const PackageCreator = () => {
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
        (error) => setResponseMessage(`Error: ${error.message}`)
      );
    } else {
      setResponseMessage("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponseMessage("");

    try {
      // Set timestamp to the past if "Stuck Test" is checked
      const eventTimestamp = isStuckTest
        ? new Date(Date.now() - 45 * 60 * 1000).toISOString()
        : new Date().toISOString();
      
      // *** FIX: Convert lat/lon to numbers and prepare payload ***
      const payload = {
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lon: formData.lon ? parseFloat(formData.lon) : undefined,
        event_timestamp: eventTimestamp,
        eta: formData.eta || undefined,
      };

      const response = await postPackageUpdate(payload);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "An unknown error occurred.");
      }
      setResponseMessage(`Success: Package '${result.package_id}' updated.`);

    } catch (error) {
      setResponseMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Package Control Panel
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="package_id"
          value={formData.package_id}
          onChange={handleChange}
          placeholder="Package ID"
          required
        />
        <Select name="status" value={formData.status} onChange={handleChange}>
          <option value="CREATED">CREATED</option>
          <option value="PICKED_UP">PICKED_UP</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="EXCEPTION">EXCEPTION</option>
          <option value="CANCELLED">CANCELLED</option>
        </Select>

        <div className="flex gap-4">
          <Input
            name="lat"
            type="number"
            step="any"
            value={formData.lat}
            onChange={handleChange}
            placeholder="Latitude"
          />
          <Input
            name="lon"
            type="number"
            step="any"
            value={formData.lon}
            onChange={handleChange}
            placeholder="Longitude"
          />
        </div>

        <Button type="button" variant="secondary" onClick={handleGetLocation}>
          Get Current Location
        </Button>

        <Input
          name="eta"
          type="datetime-local"
          value={formData.eta}
          onChange={handleChange}
        />

        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Note (optional)"
          className="block w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
        />

        <div className="flex items-center">
          <input
            id="stuck-test"
            type="checkbox"
            checked={isStuckTest}
            onChange={(e) => setIsStuckTest(e.target.checked)}
            className="h-4 w-4 text-red-600 border-gray-300 rounded"
          />
          <label htmlFor="stuck-test" className="ml-2 block text-sm text-red-800 font-medium">
            Send as Stuck Package (Timestamp &gt; 30 min ago)
          </label>
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Package Update"}
        </Button>

        {responseMessage && (
          <p className="text-sm text-center mt-2">{responseMessage}</p>
        )}
      </form>
    </Card>
  );
};