// Alright team, this is the CarManager page. It's got a lot going on,
// but it's mostly just:
// 1. Reusable helper components (buttons, modals)
// 2. Page-specific components (the table, the edit form, the details view)
// 3. The main component that fetches data and ties it all together.

import React, { useState, useEffect, useCallback } from 'react';
// These are our special API functions from apiHelper.
// They automatically add the auth token to our requests.
import { adminApi, adminApiGet, adminApiPost, adminApiPut, adminApiDelete } from '../../utils/apiHelper';

// --- Helper & UI Components --------------------------------------------------
// These are generic components we could (and probably should)
// reuse on other manager pages.

// Just a simple component to render an SVG icon.
// It takes an SVG 'path' string.
const Icon = ({ path, className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

// This is our 'bank' of SVG path strings.
// We just grab 'em by name, like ICONS.plus.
const ICONS = {
    plus: "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z",
    edit: "M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 14H3a1 1 0 01-1-1V5a1 1 0 011-1h2v2H4v6h2v2z",
    trash: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
    eye: "M10 12a2 2 0 100-4 2 2 0 000 4zM2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z",
    close: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
};

// Our reusable Button. It has different 'variants' (styles)
// like 'primary' (blue), 'danger' (red), etc.
const Button = ({ onClick, children, variant = 'primary', className = '' }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    const variants = {
        primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        secondary: "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
        danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
        ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
    };
    return <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</button>;
};

// This is the main Modal "shell". It's the dark overlay and the
// white box. The 'children' prop is where all the content
// (like the form or the details) will go.
const Modal = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity font-inter" aria-modal="true" role="dialog">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header with title and close button */}
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Icon path={ICONS.close} />
                </button>
            </header>
            {/* This is where the modal's content gets rendered */}
            <main className="p-6 overflow-y-auto">{children}</main>
        </div>
    </div>
);


// --- Page-Specific Components ------------------------------------------------
// These components are built just for the Car Manager page.

// This component just renders the <table> of cars.
// It doesn't fetch data, it just receives the 'cars' array as a prop.
const CarTable = ({ cars, onEdit, onDelete, onViewDetails }) => {
    
    // A little sub-component to show the "Available", "Rented" status badges
    const StatusBadge = ({ status }) => {
        const styles = {
            Available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            Rented: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            Maintenance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${styles[status] || ''}`}>{status}</span>;
    };

    // The main table JSX
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        {/* Table Headers */}
                        {["Car", "Status", "Daily Rate", ""].map((header) => (
                            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Loop over the 'cars' prop and create a row for each one */}
                    {cars.map((car) => (
                        <tr key={car.car_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{car.make} {car.model}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{car.year} - {car.license_plate}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={car.status} /></td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">${parseFloat(car.daily_rate).toFixed(2)}</td>
                            {/* Action buttons. They call the functions passed in as props. */}
                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                <Button onClick={() => onViewDetails(car)} variant="ghost"><Icon path={ICONS.eye} /></Button>
                                <Button onClick={() => onEdit(car)} variant="ghost"><Icon path={ICONS.edit} /></Button>
                                <Button onClick={() => onDelete(car.car_id)} variant="ghost"><Icon path={ICONS.trash} className="h-5 w-5 text-red-500" /></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// This is the modal for "View Details"
// It's special because it fetches its *own* data (the maintenance history).
const CarDetailModal = ({ car, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // This useEffect runs when the modal opens (because car.car_id changes)
    // It fetches the maintenance history for *this specific car*.
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const data = await adminApiGet(`http://localhost:3001/api/admin/maintenance/history/${car.car_id}`);
                if (data.success) setHistory(data.history);
            } catch (err) {
                console.error("Failed to fetch maintenance history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [car.car_id]); // It re-runs if the car ID changes

    return (
        <Modal onClose={onClose} title={`${car.make} ${car.model}`}>
            {/* Car Image */}
            <img src={car.image_url || 'https://placehold.co/600x400/222/FFF?text=No+Image'} alt={`${car.make} ${car.model}`} className="w-full h-60 object-cover rounded-lg mb-4" />
            
            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-gray-800 dark:text-gray-200">
                <span><strong>License Plate:</strong> {car.license_plate}</span>
                <span><strong>Mileage:</strong> {car.mileage.toLocaleString()} miles</span>
                <span><strong>Rate:</strong> ${parseFloat(car.daily_rate).toFixed(2)}/day</span>
                <span><strong>Status:</strong> {car.status}</span>
            </div>
            
            {/* Features List (only if features exist) */}
            {car.features && Array.isArray(car.features) && car.features.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Features</h3>
                    <div className="flex flex-wrap gap-2">
                        {car.features.map((f, i) => <span key={i} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">{f}</span>)}
                    </div>
                </div>
            )}
            
            {/* Maintenance History Section */}
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Maintenance History</h3>
            <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-2">
                {/* Show loading, history, or "no records" message */}
                {loading ? <p>Loading history...</p> : history.length > 0 ? (
                    history.map((item) => (
                        <div key={item.maintenance_id} className="p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{new Date(item.service_date).toLocaleDateString()}: {item.service_type}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.notes || 'No details provided.'} | Cost: ${parseFloat(item.cost).toFixed(2)}</p>
                        </div>
                    ))
                ) : <p className="text-center text-gray-500 dark:text-gray-400 p-4">No maintenance records found.</p>}
            </div>
            
            {/* Modal Footer */}
            <footer className="text-right mt-6 pt-4 border-t dark:border-gray-700">
                <Button onClick={onClose} variant="secondary">Close</Button>
            </footer>
        </Modal>
    );
};

// This is the modal for "Add New Car" OR "Edit Car"
// It's a big form.
const CarFormModal = ({ car, carTypes, onClose, onSave }) => {
    // 'car' prop will be null if it's "Add New", or have a car object if "Edit"
    // We use that to set the initial state of the form.
    const [formData, setFormData] = useState({
        make: car?.make || "", 
        model: car?.model || "", 
        year: car?.year || new Date().getFullYear(), 
        license_plate: car?.license_plate || "", 
        daily_rate: car?.daily_rate || "", 
        car_type_id: car?.car_type_id || "", 
        status: car?.status || "Available", 
        mileage: car?.mileage || "", 
        image_url: car?.image_url || "", 
        features: car?.features || [], // Features are handled as an array
    });
    // This state is just for the "add new feature" text box
    const [newFeatureText, setNewFeatureText] = useState("");

    // Standard form input handler
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // --- Feature Management ---
    const handleAddFeature = (e) => {
        e.preventDefault();
        const featureToAdd = newFeatureText.trim();
        // Add feature if it's not empty and not already in the list
        if (featureToAdd && !formData.features.includes(featureToAdd)) {
            setFormData(prev => ({ ...prev, features: [...prev.features, featureToAdd] }));
        }
        setNewFeatureText(""); // Clear the input box
    };
    const handleRemoveFeature = (featureToRemove) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== featureToRemove) }));
    };
    // --- End Feature Management ---

    // This runs when we click the "Save Car" button
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Separate features from the rest of the car data, 'cause they're saved to a different table
        const { features, ...carPayload } = formData;
        
        try {
            let carData;
            // If 'car' prop exists, we're EDITING (PUT request)
            if (car) {
                carData = await adminApiPut(`http://localhost:3001/api/admin/cars/${car.car_id}`, carPayload);
            } else {
                // Otherwise, we're ADDING (POST request)
                carData = await adminApiPost("http://localhost:3001/api/admin/cars", carPayload);
            }
            
            // After the car is saved (or updated), we save the features
            if (carData.success) {
                const carId = car ? car.car_id : carData.carId; // Get the ID (either from prop or from POST response)
                // This call updates the features list for this car
                await adminApiPost(`http://localhost:3001/api/admin/cars/${carId}/features`, { features: features });
                onSave(); // This tells the parent page to close the modal and refresh
            } else {
                alert(carData.error || "An unknown error occurred.");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving car data to the server.");
        }
    };
    
    // Just some reusable class strings to make the form JSX cleaner
    const inputClass = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <Modal onClose={onClose} title={car ? "Edit Car Details" : "Add New Car"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Main form grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Make</label><input name="make" value={formData.make} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>Model</label><input name="model" value={formData.model} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>Year</label><input name="year" type="number" value={formData.year} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>License Plate</label><input name="license_plate" value={formData.license_plate} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>Daily Rate ($)</label><input name="daily_rate" type="number" step="0.01" value={formData.daily_rate} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>Mileage</label><input name="mileage" type="number" value={formData.mileage} onChange={handleChange} required className={inputClass} /></div>
                    <div>
                        <label className={labelClass}>Car Type</label>
                        {/* Dropdown for car types, populated from 'carTypes' prop */}
                        <select name="car_type_id" value={formData.car_type_id} onChange={handleChange} required className={inputClass}>
                            <option value="">-- Select Type --</option>
                            {carTypes.map((type) => (<option key={type.car_type_id} value={type.car_type_id}>{type.type_name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} required className={inputClass}>
                            <option>Available</option><option>Rented</option><option>Maintenance</option>
                        </select>
                    </div>
                    <div className="md:col-span-2"><label className={labelClass}>Image URL</label><input name="image_url" placeholder="https://example.com/image.png" value={formData.image_url} onChange={handleChange} className={inputClass} /></div>
                </div>
                
                {/* Features section */}
                <div className="md:col-span-2">
                    <label className={labelClass}>Features</label>
                    <div className="p-4 border dark:border-gray-600 rounded-lg">
                        {/* List of current features with 'x' to remove */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {formData.features.map(feature => (
                                <span key={feature} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full flex items-center dark:bg-blue-900 dark:text-blue-300">
                                    {feature}
                                    <button type="button" onClick={() => handleRemoveFeature(feature)} className="ml-2 text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-500">&times;</button>
                                </span>
                            ))}
                        </div>
                        {/* Input to add a new feature */}
                        <div className="flex gap-2">
                            <input type="text" value={newFeatureText} onChange={(e) => setNewFeatureText(e.target.value)} placeholder="e.g., GPS Navigation" className={inputClass} />
                            <Button type="button" onClick={handleAddFeature} variant="secondary">Add</Button>
                        </div>
                    </div>
                </div>
                
                {/* Form Footer */}
                <footer className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
                    <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                    <Button type="submit" variant="primary">Save Car</Button>
                </footer>
            </form>
        </Modal>
    );
};


// --- Main Page Component ----------------------------------------------------
// This is the component that gets exported.
// It manages the state for the whole page.

export default function CarManagerPage() {
    // --- State ---
    const [cars, setCars] = useState([]); // Holds the list of all cars
    const [carTypes, setCarTypes] = useState([]); // Holds the car types for the dropdown
    const [loading, setLoading] = useState(true); // True while fetching data
    const [error, setError] = useState(""); // Holds any error messages
    
    // This state is key! It controls which modal is open.
    // { type: null, car: null } -> No modal
    // { type: 'form', car: null } -> "Add New" modal
    // { type: 'form', car: {...} } -> "Edit" modal
    // { type: 'details', car: {...} } -> "View Details" modal
    const [modalState, setModalState] = useState({ type: null, car: null });

    // --- Data Fetching ---
    
    // This function fetches *all* the data needed for the page
    // We wrap it in useCallback so it doesn't get recreated on every render.
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            // Promise.all lets us fetch cars and car types at the same time
            const [carsData, typesData] = await Promise.all([
                adminApiGet("http://localhost:3001/api/admin/cars"),
                adminApiGet("http://localhost:3001/api/car-types"), // This one is a public route, but adminApiGet still works
            ]);
            
            // Process the cars data
            if (carsData.success) {
                // This 'map' is to make sure 'features' is always an array.
                // Sometimes it might come from the DB as null or a string.
                const formattedCars = carsData.cars.map(car => ({
                    ...car,
                    features: Array.isArray(car.features) ? car.features : (car.features ? car.features.split(',') : [])
                }));
                setCars(formattedCars);
            } else {
                throw new Error(carsData.error || "Failed to fetch cars.");
            }
            
            // Process the car types data
            setCarTypes(Array.isArray(typesData) ? typesData : []);

        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to fetch car data. Is the API server running?");
        } finally {
            setLoading(false); // Always stop loading, even if there's an error
        }
    }, []); // Empty array means this function is created once

    // This useEffect runs once on mount and calls our fetchData function
    useEffect(() => {
        fetchData();
    }, [fetchData]); // We include fetchData here 'cause of useCallback

    // --- Event Handlers ---

    // These two just update the modalState to open/close popups
    const handleOpenModal = (type, car = null) => setModalState({ type, car });
    const handleCloseModal = () => setModalState({ type: null, car: null });

    // This runs when the user clicks the trash icon
    const handleDelete = async (carId) => {
        // Show a confirmation box first!
        if (!window.confirm("Are you sure you want to delete this car? This action cannot be undone.")) return;
        
        try {
            const data = await adminApiDelete(`http://localhost:3001/api/admin/cars/${carId}`);
            if (data.success) {
                fetchData(); // Refresh the car list after deleting
            } else {
                alert(data.error || "Failed to delete the car.");
            }
        } catch(err) {
            alert(err.message || "Failed to connect to the server for deletion.");
        }
    };

    // This runs after the Add/Edit form is successfully submitted
    const handleSave = () => {
        handleCloseModal(); // Close the form
        fetchData(); // Refresh the car list
    };

    // --- Render Logic ---

    // If there's an error, just show the error message
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    // This is the main page JSX
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen font-inter">
            {/* Page Header */}
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>Car Fleet Management</h1>
                {/* The "Add New Car" button */}
                <Button onClick={() => handleOpenModal('form')}>
                    <Icon path={ICONS.plus} className="h-5 w-5 mr-2" />
                    Add New Car
                </Button>
            </header>

            {/* Show "Loading..." or the CarTable */}
            {loading ? (
                <p className="text-center p-8">Loading car data...</p>
            ) : (
                <CarTable
                    cars={cars}
                    onEdit={(car) => handleOpenModal('form', car)} // Opens edit modal
                    onDelete={handleDelete} // Calls delete function
                    onViewDetails={(car) => handleOpenModal('details', car)} // Opens details modal
                />
            )}

            {/* --- Modals --- */}
            {/* These components are always in the JSX, but they only *render* (as in, show up) when their conditions are met. */}

            {/* Show the Add/Edit Form Modal */}
            {modalState.type === 'form' && (
                <CarFormModal
                    car={modalState.car} // 'car' object (for edit) or null (for add)
                    carTypes={carTypes} // Pass in the car types for the dropdown
                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}

            {/* Show the View Details Modal */}
            {modalState.type === 'details' && (
                <CarDetailModal car={modalState.car} onClose={handleCloseModal} />
            )}
        </div>
    );
}