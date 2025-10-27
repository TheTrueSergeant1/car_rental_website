// Hey team, this is the Maintenance Manager page.
// It's a bit different from the others. It's split into two columns:
// 1. A form on the left to *add* a new maintenance job.
// 2. A table on the right to see all *active* maintenance jobs.
// It also uses a custom hook to handle its data fetching, which is pretty cool.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// We'll need GET, POST (for the new job form), and PUT (to complete a job)
import { adminApiGet, adminApiPost, adminApiPut } from '../../utils/apiHelper';

// --- Constants & Configuration ---------------------------------------------

// This is just our master list for the "Service Type" dropdown.
// Keeping it as a constant up here makes it easy to change later.
const SERVICE_TYPES = [ 'Oil Change', 'Tire Rotation', 'Brake Inspection', 'Brake Pad Replacement', 'Brake Fluid Flush', 'Wheel Alignment', 'Tire Balancing', 'New Tires', 'Battery Check', 'Battery Replacement', 'Air Filter Replacement', 'Cabin Air Filter Replacement', 'Spark Plug Replacement', 'Engine Diagnostic', 'Check Engine Light Scan', 'State Inspection', 'Wiper Blade Replacement', 'Coolant Flush', 'Transmission Fluid Change', 'Power Steering Fluid Flush', 'Suspension Check', 'Shock/Strut Replacement', 'Exhaust System Inspection', 'Fuel System Cleaning', 'AC System Check', 'AC Recharge', 'Headlight/Taillight Replacement', 'Full Vehicle Detail', 'Software Update', 'Other' ];

// --- Reusable UI Components ------------------------------------------------
// These are our standard, generic UI pieces.

const Icon = ({ path, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 ${className}`}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const ICONS = {
    search: "M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z",
    chevronUp: "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z",
    chevronDown: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
    checkCircle: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${className}`}>
        {children}
    </div>
);

const Button = ({ children, onClick, variant = 'primary', type = 'button', className = '' }) => {
    const base = "font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500",
        success: "bg-green-600 text-white hover:bg-green-700",
    };
    return <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

// --- Custom Hooks for Logic Abstraction ------------------------------------

// OK, this is the coolest part of this file!
// This is a "custom hook" that we made. Its only job is to fetch
// all the data for this page and manage the loading/error state.
// This keeps our main `MaintenancePage` component *way* cleaner.
function useMaintenanceData() {
    // This hook manages its own state for the data and the fetch status
    const [data, setData] = useState({ allCars: [], activeMaintenance: [] });
    const [status, setStatus] = useState('loading');

    // We wrap our fetch logic in 'useCallback' so it doesn't get
    // re-created on every render.
    const fetchData = useCallback(async () => {
        setStatus('loading');
        try {
            // This is super efficient! We use 'Promise.all' to fetch
            // *both* endpoints at the same time, instead of one after another.
            const [allCarsData, activeMaintData] = await Promise.all([
                adminApiGet('http://localhost:3001/api/admin/cars'), // Need all cars for the form
                adminApiGet('http://localhost:3001/api/admin/maintenance/active') // Need active jobs for the table
            ]);
            
            // If *either* fetch fails, we throw an error
            if (!allCarsData.success || !activeMaintData.success) throw new Error("Failed to fetch data.");
            
            // Success! Store both sets of data
            setData({ allCars: allCarsData.cars, activeMaintenance: activeMaintData.active_maintenance });
            setStatus('success');
        } catch (err) {
            console.error("Failed to fetch maintenance data:", err);
            setStatus('error');
        }
    }, []); // Empty array means this 'fetchData' function is created *once*.

    // This 'useEffect' runs the 'fetchData' function when the hook first loads
    useEffect(() => { fetchData() }, [fetchData]);

    // Finally, the hook *returns* its data, the status, and
    // the 'fetchData' function itself (which we rename to 'refetch').
    // This lets our main component call 'refetch()' to refresh all the data!
    return { ...data, status, refetch: fetchData };
}

// --- Page-Specific Components ----------------------------------------------

// This is the component for the form on the left side of the page.
const MaintenanceForm = ({ cars, allCars, onSave }) => {
    // 'cars' is the *filtered* list of available cars.
    // 'allCars' is the *full* list, used to find mileage.
    // 'onSave' is the 'refetch' function from our custom hook.

    const initialFormState = { car_id: '', service_date: '', service_type: SERVICE_TYPES[0], mileage_at_service: '', cost: '', notes: '' };
    const [formData, setFormData] = useState(initialFormState);
    
    // This logic handles the mileage field
    const [isMileageLocked, setMileageLocked] = useState(true); // Starts locked
    const [originalMileage, setOriginalMileage] = useState(''); // Stores the car's *actual* mileage
    
    // These are for the form's state
    const [isSuccess, setSuccess] = useState(false); // For our "Success!" pop-up
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // For the car search bar
    
    // This 'useMemo' is for the car search.
    // It re-filters the 'cars' list *only* when 'cars' or 'searchTerm' changes.
    // This is way more performant than filtering on every render.
    const availableCars = useMemo(() => 
        cars.filter(car => 
            `${car.make} ${car.model} ${car.license_plate}`.toLowerCase().includes(searchTerm.toLowerCase())
        ), [cars, searchTerm]);

    // This is our main 'onChange' handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // This is our magic auto-fill!
        // If they just selected a car...
        if (name === 'car_id') {
            // Find the full car object from the 'allCars' prop
            const selectedCar = allCars.find(car => car.car_id === parseInt(value, 10));
            if (selectedCar) {
                const currentMileage = selectedCar.mileage.toString();
                // ...and automatically set the mileage field
                setFormData(prev => ({ ...prev, mileage_at_service: currentMileage, car_id: value }));
                // We also save the original mileage and re-lock the field
                setOriginalMileage(currentMileage);
                setMileageLocked(true);
            }
        }
    };

    // This runs when we click "Submit for Maintenance"
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.car_id) { setError("Please select a car."); return; } // Simple validation
        
        const mileage = parseInt(formData.mileage_at_service, 10);
        if (isNaN(mileage) || mileage < 0) { setError("Mileage must be a valid, non-negative number."); return; }
        
        // TODO: We have logic here to detect if the user changed the mileage,
        // but we're not doing anything with it. We should probably add
        // a 'window.confirm' or a custom modal here.
        if (!isMileageLocked && formData.mileage_at_service !== originalMileage) {
             // console.warn("Mileage manually changed, confirmation needed."); 
        }

        try {
            // Use our 'adminApiPost' helper to create the new maintenance record
            const data = await adminApiPost('http://localhost:3001/api/admin/maintenance', { 
                ...formData, 
                mileage_at_service: mileage, // Send the number version
                cost: formData.cost ? parseFloat(formData.cost) : null // Send float or null
            });
            
            if (!data.success) throw new Error(data.error || 'Failed to schedule maintenance.');
            
            // Success!
            setSuccess(true); // Show the pop-up
            setFormData(initialFormState); // Clear the form
            setSearchTerm(''); // Clear the car search
            setMileageLocked(true); // Re-lock the mileage field
            onSave(); // This calls 'refetch()' to update the *whole page*
        } catch (err) { setError(err.message); }
    };
    
    // Just our style variables for cleaner JSX
    const inputStyles = "w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50";
    const labelStyles = "block text-sm font-medium mb-1";

    return (
        <Card className="p-6">
            {/* This is our "Success!" modal. It only shows when 'isSuccess' is true. */}
            {isSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <Card className="p-8 w-full max-w-sm text-center">
                        <div className="flex justify-center items-center mx-auto bg-green-100 dark:bg-green-900 h-16 w-16 rounded-full mb-4">
                           <Icon path={ICONS.checkCircle} className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Success!</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">The car is scheduled for maintenance.</p>
                        <Button onClick={() => setSuccess(false)} variant="primary">OK</Button>
                    </Card>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Schedule Service</h2>
            
            {/* The main form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</p>}
                
                {/* Car selection with search */}
                <div>
                    <label className={labelStyles} htmlFor="car-search">Select a Car</label>
                    <input type="text" id="car-search" placeholder="Search by make, model, or plate..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputStyles} mb-2`} />
                    <select id="car_id" name="car_id" value={formData.car_id} onChange={handleChange} required className={inputStyles} size={5}>
                        <option value="" disabled>-- Choose a car --</option>
                        {/* We render the list from our 'availableCars' useMemo */}
                        {availableCars.map(car => (
                            <option key={car.car_id} value={car.car_id}>{car.make} {car.model} - {car.license_plate}</option>
                        ))}
                    </select>
                </div>
                
                {/* Other form fields */}
                <div><label className={labelStyles} htmlFor="service_date">Service Start Date</label><input type="date" id="service_date" name="service_date" value={formData.service_date} onChange={handleChange} required className={inputStyles} /></div>
                <div><label className={labelStyles} htmlFor="service_type">Service Type</label><select id="service_type" name="service_type" value={formData.service_type} onChange={handleChange} required className={inputStyles}>{SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                
                {/* Mileage field with lock/edit button */}
                <div>
                    <label className={labelStyles} htmlFor="mileage_at_service">Mileage at Service</label>
                    <div className="flex items-center gap-2">
                        <input type="number" id="mileage_at_service" name="mileage_at_service" value={formData.mileage_at_service} onChange={handleChange} placeholder="Select car to auto-fill" required disabled={isMileageLocked} className={inputStyles} />
                        <button type="button" onClick={() => setMileageLocked(p => !p)} className="font-semibold text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap">
                            {isMileageLocked ? 'Edit' : 'Lock'}
                        </button>
                    </div>
                </div>
                
                <div><label className={labelStyles} htmlFor="cost">Cost ($)</label><input type="number" step="0.01" id="cost" name="cost" value={formData.cost} onChange={handleChange} placeholder="e.g., 49.99 (optional)" className={inputStyles} /></div>
                <div><label className={labelStyles} htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange} placeholder="Add any relevant notes..." className={inputStyles}></textarea></div>

                <Button type="submit" variant="primary" className="w-full !py-3" >Submit for Maintenance</Button>
            </form>
        </Card>
    );
};

// This is the component for the table on the right (Active Jobs).
// It's a "dumb" component: it just renders data and calls functions
// that are passed in via props. It doesn't fetch anything itself.
const ActiveJobsTable = ({ jobs, onComplete, onFilterChange, onSortChange, filters }) => {
    
    // A little sub-component to make our table headers sortable
    const TableHeader = ({ children, sortKey, currentSort, onSortChange }) => {
        const isSorted = currentSort.key === sortKey;
        const IconComponent = isSorted && currentSort.dir === 'asc' ? ICONS.chevronUp : ICONS.chevronDown;
        return (
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                <button onClick={() => onSortChange(sortKey)} className="flex items-center gap-1 hover:text-blue-500">
                    {children}
                    {isSorted && <Icon path={IconComponent} className="h-4 w-4" />}
                </button>
            </th>
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Car</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Service Type</th>
                        {/* Here we use our sortable header */}
                        <TableHeader sortKey="service_date" currentSort={filters.sort} onSortChange={onSortChange}>Service Date</TableHeader>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Loop over the 'jobs' prop and render a row for each */}
                    {jobs.length > 0 ? jobs.map(job => (
                        <tr key={job.maintenance_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">{job.make} {job.model}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{job.service_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(job.service_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                {/* This button calls 'onComplete' with the job ID */}
                                <button onClick={() => onComplete(job.maintenance_id)} className="font-semibold text-green-600 hover:text-green-800">
                                    Mark as Complete
                                </button>
                            </td>
                        </tr>
                    )) : (
                        // Show this message if the 'jobs' array is empty
                        <tr><td colSpan="4" className="text-center py-8 text-gray-500">No cars match filters.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// --- Main Page Component ----------------------------------------------------
// This is the main component that ties everything together.
export default function MaintenancePage() {
    
    // --- Data ---
    // Here we are! We're using our custom hook.
    // This one line gives us all our data, the loading status,
    // and the 'refetch' function. Super clean!
    const { allCars, activeMaintenance, status, refetch } = useMaintenanceData();

    // --- State ---
    // This state is just for the "Are you sure?" confirmation modal
    const [confirmingMaintId, setConfirmingMaintId] = useState(null);
    // This state object holds all the filter/sort settings for the table
    const [filters, setFilters] = useState({
        searchTerm: '',
        serviceType: 'all',
        sort: { key: 'service_date', dir: 'desc' }, // Default sort
    });
    
    // --- Handlers ---
    // These functions just update the 'filters' state object
    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const handleSortChange = (key) => {
        setFilters(prev => ({
            ...prev,
            sort: {
                key,
                // This logic flips the sort direction if we click the same header twice
                dir: prev.sort.key === key && prev.sort.dir === 'desc' ? 'asc' : 'desc'
            }
        }));
    };
    
    // This is the list of jobs for the *table*.
    // It's another 'useMemo' hook for performance.
    // It takes our 'activeMaintenance' list and filters/sorts it
    // based on our 'filters' state object.
    const processedJobs = useMemo(() => {
        return activeMaintenance
            .filter(job => 
                // Filter by search term
                `${job.make} ${job.model}`.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
                // Filter by service type dropdown
                (filters.serviceType === 'all' || job.service_type === filters.serviceType)
            )
            .sort((a, b) => {
                // Sort by the key and direction in our state
                const valA = a[filters.sort.key];
                const valB = b[filters.sort.key];
                const order = filters.sort.dir === 'asc' ? 1 : -1;
                // Special handling for sorting by date
                if (filters.sort.key === 'service_date') return (new Date(valA) - new Date(valB)) * order;
                
                const strA = String(valA || '');
                const strB = String(valB || '');
                return strA.localeCompare(strB) * order;
            });
    }, [activeMaintenance, filters]); // Re-run this *only* if data or filters change

    // This runs when we click "Confirm" in the completion modal
    const handleComplete = async () => {
        if (!confirmingMaintId) return;
        try {
            // Send the 'PUT' request to our API to complete the job
            await adminApiPut(`http://localhost:3001/api/admin/maintenance/complete/${confirmingMaintId}`);
            setConfirmingMaintId(null); // Close the modal
            refetch(); // And refetch ALL page data!
        } catch (err) {
            console.error("Failed to complete maintenance:", err);
            // TODO: Swap this alert for a better notification
            alert("Failed to update maintenance status."); 
        }
    };

    // This is the list of cars for the *form*.
    // It's a 'useMemo' so it only re-calculates when 'allCars' changes.
    // We filter out any car that is *already* in maintenance.
    const carsForForm = useMemo(() => allCars.filter(car => car.status !== 'Maintenance'), [allCars]);

    // --- Render ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            
            {/* The "Mark as Complete" confirmation modal.
                This only renders if 'confirmingMaintId' is not null. */}
            {confirmingMaintId && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <Card className="p-8 w-full max-w-sm text-center">
                        <h3 className="text-xl font-bold mb-4">Are you sure?</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">This will mark the service as complete and return the car to 'Available' status.</p>
                        <div className="flex justify-center space-x-4">
                            <Button onClick={() => setConfirmingMaintId(null)} variant="secondary">Cancel</Button>
                            <Button onClick={handleComplete} variant="success">Confirm</Button>
                        </div>
                    </Card>
                </div>
            )}
            
            {/* This is our main 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: The Form */}
                <div className="lg:col-span-1">
                    <MaintenanceForm 
                        cars={carsForForm} // Pass in the *filtered* list of available cars
                        allCars={allCars} // Pass in *all* cars so it can find mileage
                        onSave={refetch} // Pass in our 'refetch' function
                    />
                </div>
                
                {/* Column 2: The Table */}
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <header className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>In-Service Fleet</h2>
                            
                            {/* Filter controls for the table */}
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="relative flex-grow">
                                    <Icon path={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Search cars..." value={filters.searchTerm} onChange={e => handleFilterChange('searchTerm', e.target.value)} className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                                <select value={filters.serviceType} onChange={e => handleFilterChange('serviceType', e.target.value)} className="p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                                    <option value="all">All Services</option>
                                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </header>
                        
                        {/* Show loading/error or the table itself */}
                        {status === 'loading' ? <p>Loading...</p> : 
                            <ActiveJobsTable 
                                jobs={processedJobs} // Pass in our filtered/sorted list
                                // Here's the key: onComplete doesn't *run* the update,
                                // it just *sets the ID* for the confirmation modal.
                                onComplete={setConfirmingMaintId} 
                                onFilterChange={handleFilterChange}
                                onSortChange={handleSortChange}
                                filters={filters}
                            />
                        }
                        {status === 'error' && <p className="text-center text-red-500 py-4">Failed to load maintenance data.</p>}
                    </Card>
                </div>
            </div>
        </div>
    );
}