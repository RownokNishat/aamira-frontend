import { useState, useEffect } from "react";

export const LocationDisplay = ({ lat, lon }) => {
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
        })
        .catch(() => setPlaceName("Could not fetch location"))
        .finally(() => setIsLoading(false));
    }
  }, [lat, lon]);

  if (!lat || !lon) return "N/A";
  if (isLoading) return "Loading location...";

  return placeName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
};
