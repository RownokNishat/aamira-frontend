const API_URL =
  `${import.meta.env.VITE_APP_API_URL}/api` || "http://localhost:3001/api";
const API_KEY = import.meta.env.VITE_APP_API_SECRET_KEY || "default-secret";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
});

export const fetchActivePackages = () =>
  fetch(`${API_URL}/packages/active`, { headers: getHeaders() });
export const fetchAlerts = () =>
  fetch(`${API_URL}/alerts`, { headers: getHeaders() });
export const fetchPackageHistory = (packageId) =>
  fetch(`${API_URL}/packages/${packageId}`, { headers: getHeaders() });

export const postPackageUpdate = (payload) => {
  // Clean up empty fields before sending
  Object.keys(payload).forEach(
    (key) =>
      (payload[key] === undefined || payload[key] === "") && delete payload[key]
  );

  return fetch(`${API_URL}/updates`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
};
