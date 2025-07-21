import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// --- Configuration ---
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
    .flex-center { display: flex; align-items: center; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .alert-banner { border-left-width: 4px; border-color: #EF4444; background-color: #FEE2E2; color: #B91C1C; padding: 1rem; margin-bottom: 1rem; border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }
    .alert-title { font-weight: 700; }
    .table-container { overflow-x: auto; }
    .table { min-width: 100%; border-collapse: collapse; }
    .table-head { background-color: #F9FAFB; }
    .th { padding: 0.75rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .tbody { background-color: #ffffff; }
    .tr-stuck { background-color: #FEF2F2; }
    .td { padding: 1rem 1.5rem; white-space: nowrap; font-size: 0.875rem; color: #6B7280; border-top: 1px solid #E5E7EB; }
    .td-main { color: #111827; font-weight: 500; }
    .max-w-xs { max-width: 20rem; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

// --- Helper Components ---
const AlertBanner = ({ alert }) => (
    <div className="alert-banner" role="alert">
        <p className="alert-title">Stuck Package Alert!</p>
        <p>{alert.message}</p>
    </div>
);

const PackageRow = ({ pkg, isStuck }) => {
    const lastSeen = new Date(pkg.received_at).toLocaleTimeString();
    return (
        <tr className={isStuck ? "tr-stuck" : ""}>
            <td className="td td-main">{pkg.package_id}</td>
            <td className="td">{pkg.status}</td>
            <td className="td">{lastSeen}</td>
            <td className="td">{pkg.lat && pkg.lon ? `${pkg.lat.toFixed(4)}, ${pkg.lon.toFixed(4)}` : 'N/A'}</td>
            <td className="td max-w-xs truncate">{pkg.note || 'N/A'}</td>
        </tr>
    );
};

// Form to create/update packages
const PackageCreator = () => {
    const [formData, setFormData] = useState({ package_id: '', status: 'CREATED', lat: '', lon: '', note: '' });
    const [isStuckTest, setIsStuckTest] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    const API_URL = 'http://localhost:3001';
    const API_KEY = '1234567890abcdef1234567890abcdef';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResponseMessage('');
        let eventTimestamp = isStuckTest ? new Date(Date.now() - 45 * 60 * 1000).toISOString() : new Date().toISOString();
        const payload = { ...formData, lat: formData.lat ? parseFloat(formData.lat) : undefined, lon: formData.lon ? parseFloat(formData.lon) : undefined, event_timestamp: eventTimestamp };
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
                </select>
                <div style={{display: 'flex', gap: '1rem'}}>
                    <input name="lat" value={formData.lat} onChange={handleChange} type="number" step="any" placeholder="Latitude" className="form-input" />
                    <input name="lon" value={formData.lon} onChange={handleChange} type="number" step="any" placeholder="Longitude" className="form-input" />
                </div>
                <textarea name="note" value={formData.note} onChange={handleChange} placeholder="Note (optional)" className="form-textarea" />
                <div className="flex-center">
                    <input id="stuck-test" type="checkbox" checked={isStuckTest} onChange={(e) => setIsStuckTest(e.target.checked)} className="form-checkbox" />
                    <label htmlFor="stuck-test" className="form-label">Send as Stuck Package (Timestamp {'>'} 30 min ago)</label>
                </div>
                <button type="submit" disabled={isLoading} className="form-submit-btn">{isLoading ? 'Sending...' : 'Send Package Update'}</button>
                {responseMessage && <p style={{fontSize: '0.875rem', textAlign: 'center', marginTop: '0.5rem'}}>{responseMessage}</p>}
            </form>
        </div>
    );
};

// Main App Component
export default function App() {
    const [packages, setPackages] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const API_URL = 'http://localhost:3001';
    const API_KEY = '1234567890abcdef1234567890abcdef';

    const fetchInitialData = useCallback(async () => {
        try {
            const [pkgResponse, alertResponse] = await Promise.all([
                fetch(`${API_URL}/api/packages/active`, { headers: { 'Authorization': `Bearer ${API_KEY}` } }),
                fetch(`${API_URL}/api/alerts`, { headers: { 'Authorization': `Bearer ${API_KEY}` } })
            ]);
            if (pkgResponse.ok) setPackages(await pkgResponse.json());
            if (alertResponse.ok) setAlerts(await alertResponse.json());
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        }
    }, [API_URL, API_KEY]);

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
                                <div style={{marginBottom: '1rem'}}>{alerts.map(alert => <AlertBanner key={alert._id} alert={alert} />)}</div>
                                <div className="table-container">
                                    <table className="table">
                                        <thead className="table-head">
                                            <tr>
                                                <th className="th">Package ID</th>
                                                <th className="th">Status</th>
                                                <th className="th">Last Seen</th>
                                                <th className="th">Location</th>
                                                <th className="th">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody className="tbody">
                                            {packages.length > 0 ? (
                                                packages.map(pkg => <PackageRow key={pkg._id} pkg={pkg} isStuck={stuckPackageIds.has(pkg.package_id)} />)
                                            ) : (
                                                <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>No active packages. Send an update to see it here.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
