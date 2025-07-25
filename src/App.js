import React, { useState, useEffect, useCallback, useMemo } from 'react';
import io from 'socket.io-client';

// --- Configuration ---
// In this specific environment, we initialize socket directly with the URL.
const socket = io('http://localhost:3001');

// --- CSS Styles ---
// All styles are defined here to avoid build process issues with Tailwind CSS.
const styles = `
    .font-sans { font-family: Inter, sans-serif; }
    .bg-gray-100 { background-color: #F3F4F6; }
    .min-h-screen { min-height: 100vh; }
    .container { width: 100%; max-width: 1280px; margin-left: auto; margin-right: auto; padding: 1.5rem; }
    .header { margin-bottom: 2rem; }
    .header-title { font-size: 2.25rem; font-weight: 700; color: #111827; }
    .main-grid { display: flex; flex-wrap: wrap; gap: 2rem; }
    .grid-col-1 { flex: 1 1 300px; }
    .grid-col-2 { flex: 2 1 600px; }
    .card { background-color: #ffffff; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .card-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 1rem; }
    .form-input, .form-select, .form-textarea { display: block; width: 100%; padding: 0.75rem 1rem; background-color: #F9FAFB; border: 1px solid #D1D5DB; border-radius: 0.5rem; }
    .form-input:focus, .form-select:focus, .form-textarea:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3B82F6; box-shadow: 0 0 0 2px #BFDBFE; }
    .form-checkbox { height: 1rem; width: 1rem; color: #EF4444; border-radius: 0.25rem; border-color: #D1D5DB; }
    .form-label { margin-left: 0.5rem; display: block; font-size: 0.875rem; color: #B91C1C; font-weight: 500; }
    .form-submit-btn { width: 100%; background-color: #2563EB; color: #ffffff; font-weight: 700; padding: 0.75rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; transition: background-color 0.2s; }
    .form-submit-btn:hover { background-color: #1D4ED8; }
    .form-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .location-btn { width: 100%; background-color: #10B981; color: #ffffff; font-weight: 500; padding: 0.6rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; transition: background-color 0.2s; text-align: center; }
    .location-btn:hover { background-color: #059669; }
    .flex-center { display: flex; align-items: center; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .alert-banner { border-left-width: 4px; border-color: #EF4444; background-color: #FEE2E2; color: #B91C1C; padding: 1rem; margin-bottom: 1rem; border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }
    .error-banner { border-left-width: 4px; border-color: #FBBF24; background-color: #FFFBEB; color: #92400E; padding: 1rem; margin-bottom: 1rem; border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }
    .alert-title { font-weight: 700; }
    .table-container { overflow-x: auto; }
    .table { min-width: 100%; border-collapse: collapse; }
    .table-head { background-color: #F9FAFB; }
    .th { padding: 0.75rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .tbody { background-color: #ffffff; }
    .tr-clickable { cursor: pointer; }
    .tr-clickable:hover { background-color: #F9FAFB; }
    .tr-stuck { background-color: #FEF2F2; }
    .td { padding: 1rem 1.5rem; white-space: nowrap; font-size: 0.875rem; color: #6B7280; border-top: 1px solid #E5E7EB; }
    .td-main { color: #111827; font-weight: 500; }
    .max-w-xs { max-width: 20rem; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
    .modal-content { background-color: white; padding: 2rem; border-radius: 1rem; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-title { font-size: 1.5rem; font-weight: 700; }
    .modal-close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #9CA3AF; }
    .timeline { border-left: 2px solid #E5E7EB; padding-left: 1.5rem; }
    .timeline-item { position: relative; margin-bottom: 1.5rem; }
    .timeline-dot { position: absolute; left: -2.05rem; top: 0.25rem; height: 0.75rem; width: 0.75rem; background-color: #9CA3AF; border-radius: 9999px; }
    .timeline-item:first-child .timeline-dot { background-color: #3B82F6; }
    .filter-controls { display: flex; gap: 1rem; margin-bottom: 1rem; }
`;

// --- Helper Components ---
const AlertBanner = ({ alert }) => (
    <div className="alert-banner" role="alert">
        <p className="alert-title">Stuck Package Alert!</p>
        <p>{alert.message}</p>
    </div>
);

// New component to fetch and display place name from coordinates
const LocationDisplay = ({ lat, lon }) => {
    const [placeName, setPlaceName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (lat && lon) {
            setIsLoading(true);
            setPlaceName(''); // Reset on new coords
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.display_name) {
                        const shortName = data.display_name.split(',').slice(0, 3).join(',');
                        setPlaceName(shortName);
                    } else {
                        setPlaceName('Location not found');
                    }
                    setIsLoading(false);
                })
                .catch(() => {
                    setPlaceName('Could not fetch location');
                    setIsLoading(false);
                });
        }
    }, [lat, lon]);

    if (!lat || !lon) return 'N/A';
    if (isLoading) return 'Loading location...';
    return placeName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
};


const PackageRow = ({ pkg, isStuck, onClick }) => {
    const lastSeen = new Date(pkg.received_at).toLocaleTimeString();
    let rowClass = "tr-clickable";
    if (isStuck) {
        rowClass += " tr-stuck";
    }

    return (
        <tr className={rowClass} onClick={onClick}>
            <td className="td td-main">{pkg.package_id}</td>
            <td className="td">{pkg.status}</td>
            <td className="td">{pkg.eta ? new Date(pkg.eta).toLocaleString() : 'N/A'}</td>
            <td className="td">{lastSeen}</td>
            <td className="td"><LocationDisplay lat={pkg.lat} lon={pkg.lon} /></td>
            <td className="td max-w-xs truncate">{pkg.note || 'N/A'}</td>
        </tr>
    );
};

// Form to create/update packages
const PackageCreator = () => {
    const [formData, setFormData] = useState({ package_id: '', status: 'CREATED', lat: '', lon: '', note: '', eta: '' });
    const [isStuckTest, setIsStuckTest] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const API_URL = 'http://localhost:3001';
    const API_KEY = '1234567890abcdef1234567890abcdef';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({ ...prev, lat: position.coords.latitude.toFixed(6), lon: position.coords.longitude.toFixed(6) }));
                    setResponseMessage('Location captured successfully!');
                },
                (error) => { setResponseMessage(`Error: ${error.message}`); }
            );
        } else {
            setResponseMessage("Error: Geolocation is not supported by this browser.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResponseMessage('');
        let eventTimestamp = isStuckTest ? new Date(Date.now() - 45 * 60 * 1000).toISOString() : new Date().toISOString();
        const payload = { ...formData, lat: formData.lat ? parseFloat(formData.lat) : undefined, lon: formData.lon ? parseFloat(formData.lon) : undefined, event_timestamp: eventTimestamp, eta: formData.eta || undefined };
        Object.keys(payload).forEach(key => (payload[key] === undefined || payload[key] === '') && delete payload[key]);

        try {
            const response = await fetch(`${API_URL}/api/updates`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` }, body: JSON.stringify(payload) });
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
        <div className="card">
            <h2 className="card-title">Package Control Panel</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="package_id" value={formData.package_id} onChange={handleChange} placeholder="Package ID" required className="form-input" />
                <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                    <option value="CREATED">CREATED</option>
                    <option value="PICKED_UP">PICKED_UP</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="EXCEPTION">EXCEPTION</option>
                    <option value="CANCELLED">CANCELLED</option>
                </select>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input name="lat" value={formData.lat} onChange={handleChange} type="number" step="any" placeholder="Latitude" className="form-input" />
                    <input name="lon" value={formData.lon} onChange={handleChange} type="number" step="any" placeholder="Longitude" className="form-input" />
                </div>
                <button type="button" onClick={handleGetLocation} className="location-btn">Get Current Location</button>
                <input name="eta" value={formData.eta} onChange={handleChange} type="datetime-local" placeholder="ETA (Optional)" className="form-input" />
                <textarea name="note" value={formData.note} onChange={handleChange} placeholder="Note (optional)" className="form-textarea" />
                <div className="flex-center">
                    <input id="stuck-test" type="checkbox" checked={isStuckTest} onChange={(e) => setIsStuckTest(e.target.checked)} className="form-checkbox" />
                    <label htmlFor="stuck-test" className="form-label">Send as Stuck Package (Timestamp {'>'} 30 min ago)</label>
                </div>
                <button type="submit" disabled={isLoading} className="form-submit-btn">{isLoading ? 'Sending...' : 'Send Package Update'}</button>
                {responseMessage && <p style={{ fontSize: '0.875rem', textAlign: 'center', marginTop: '0.5rem' }}>{responseMessage}</p>}
            </form>
        </div>
    );
};

// Timeline Modal Component
const TimelineModal = ({ history, onClose }) => {
    if (!history) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Package History: {history[0]?.package_id}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="timeline">
                    {history.map(event => (
                        <div key={event._id} className="timeline-item">
                            <div className="timeline-dot"></div>
                            <p style={{ fontWeight: '600', color: '#1F2937' }}>{event.status}</p>
                            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{new Date(event.event_timestamp).toLocaleString()}</p>
                            {event.lat && event.lon && (
                                <div style={{ fontSize: '0.875rem', color: '#4B5563', marginTop: '0.25rem' }}>
                                    <LocationDisplay lat={event.lat} lon={event.lon} />
                                </div>
                            )}
                            {event.note && <p style={{ fontSize: '0.875rem', color: '#4B5563', marginTop: '0.25rem' }}>Note: {event.note}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Main App Component
export default function App() {
    const [packages, setPackages] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedPackageHistory, setSelectedPackageHistory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL_ACTIVE');
    const [connectionError, setConnectionError] = useState(null);
    const API_URL = 'http://localhost:3001';
    const API_KEY = '1234567890abcdef1234567890abcdef';

    const fetchInitialData = useCallback(async () => {
        // Clear previous errors on a new attempt
        setConnectionError(null);
        try {
            const [pkgResponse, alertResponse] = await Promise.all([
                fetch(`${API_URL}/api/packages/active`, { headers: { 'Authorization': `Bearer ${API_KEY}` } }),
                fetch(`${API_URL}/api/alerts`, { headers: { 'Authorization': `Bearer ${API_KEY}` } })
            ]);
            if (pkgResponse.ok) setPackages(await pkgResponse.json());
            if (alertResponse.ok) setAlerts(await alertResponse.json());
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            // Set a user-friendly error message
            setConnectionError("Could not connect to the backend server. Please ensure it's running and accessible at http://localhost:3001.");
        }
    }, [API_URL, API_KEY]);

    const handleRowClick = async (packageId) => {
        try {
            const response = await fetch(`${API_URL}/api/packages/${packageId}`, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
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
        socket.on('package_updated', (updatedPackage) => {
            setPackages(prev => {
                const existingIndex = prev.findIndex(p => p.package_id === updatedPackage.package_id);
                if (['DELIVERED', 'CANCELLED'].includes(updatedPackage.status)) return prev.filter(p => p.package_id !== updatedPackage.package_id);
                if (existingIndex > -1) return prev.map(p => p.package_id === updatedPackage.package_id ? updatedPackage : p);
                return [...prev, updatedPackage];
            });
        });
        socket.on('new_alert', (newAlert) => setAlerts(prev => prev.find(a => a.package_id === newAlert.package_id) ? prev : [...prev, newAlert]));
        socket.on('alert_cleared', ({ package_id }) => setAlerts(prev => prev.filter(a => a.package_id !== package_id)));
        return () => {
            socket.off('package_updated');
            socket.off('new_alert');
            socket.off('alert_cleared');
        };
    }, [fetchInitialData]);

    const filteredPackages = useMemo(() => {
        return packages
            .filter(pkg => {
                if (statusFilter === 'ALL_ACTIVE') return true;
                return pkg.status === statusFilter;
            })
            .filter(pkg => {
                return pkg.package_id.toLowerCase().includes(searchQuery.toLowerCase());
            });
    }, [packages, statusFilter, searchQuery]);

    const stuckPackageIds = new Set(alerts.map(a => a.package_id));

    return (
        <>
            <style>{styles}</style>
            <div className="bg-gray-100 min-h-screen font-sans">
                <div className="container">
                    <header className="header">
                        <h1 className="header-title">Aamira Courier Real-time Dashboard</h1>
                    </header>
                    <div className="main-grid">
                        <div className="grid-col-1"><PackageCreator /></div>
                        <div className="grid-col-2">
                            <div className="card">
                                <h2 className="card-title">Live Package Feed</h2>

                                {/* Connection Error Display */}
                                {connectionError && (
                                    <div className="error-banner">
                                        <p className="alert-title">Connection Error</p>
                                        <p>{connectionError}</p>
                                    </div>
                                )}

                                {/* Search and Filter Controls */}
                                <div className="filter-controls">
                                    <input
                                        type="text"
                                        placeholder="Search by Package ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="form-input"
                                        style={{ flex: 2 }}
                                    />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="form-select"
                                        style={{ flex: 1 }}
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

                                <div style={{ marginBottom: '1rem' }}>{alerts.map(alert => <AlertBanner key={alert._id} alert={alert} />)}</div>
                                <div className="table-container">
                                    <table className="table">
                                        <thead className="table-head">
                                            <tr>
                                                <th className="th">Package ID</th>
                                                <th className="th">Status</th>
                                                <th className="th">ETA</th>
                                                <th className="th">Last Seen</th>
                                                <th className="th">Place Name</th>
                                                <th className="th">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody className="tbody">
                                            {filteredPackages.length > 0 ? (
                                                filteredPackages.map(pkg => <PackageRow key={pkg._id} pkg={pkg} isStuck={stuckPackageIds.has(pkg.package_id)} onClick={() => handleRowClick(pkg.package_id)} />)
                                            ) : (
                                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                                                    {connectionError ? ' ' : 'No matching packages found.'}
                                                </td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <TimelineModal history={selectedPackageHistory} onClose={() => setSelectedPackageHistory(null)} />
        </>
    );
}
