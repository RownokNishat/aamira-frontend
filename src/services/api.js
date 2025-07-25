const API_URL = "http://localhost:3001/api";
const API_KEY = "1234567890abcdef1234567890abcdef";

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
