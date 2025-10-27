import React, { useState, useEffect, useMemo } from 'react';
// --- FIX: Added .js extension to the import path ---
import { adminApiGet, adminApiDelete, adminApiPut } from '../../utils/apiHelper.js';
// --- END FIX ---


// --- Icon Components --------------------------------------------------------
// ... (Icons, Button components are fine) ...
const AddIcon = (properties) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...properties}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
const EditIcon = (properties) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...properties}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);
const DeleteIcon = (properties) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...properties}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);
const ViewIcon = (properties) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...properties}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);
const SortIcon = (properties) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...properties}>
        <path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>
    </svg>
);
const Button = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled = false }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50";
    const variants = {
        primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        secondary: "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
        danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
        ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 shadow-none border-none",
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</button>;
};

// --- Main Page Component ----------------------------------------------------

// !! This component is named CustomerManager but is in RentalManager.jsx
// !! I am fixing the fetches as-is, assuming you will rename functions.
export default function CustomerManager() {
    const [allRentals, setAllRentals] = useState([]); // !! Renamed state
    const [loadingStatus, setLoadingStatus] = useState('loading');
    const [searchTerm, setSearchTerm] = useState('');
    // !! Changed default sort key to something relevant for rentals
    const [sortConfiguration, setSortConfiguration] = useState({ key: 'pickup_date', direction: 'descending' });
    const [activeModal, setActiveModal] = useState({ type: null, data: null });

    // !! Renamed function
    const fetchAllRentals = async () => {
        setLoadingStatus('loading');
        try {
            const data = await adminApiGet('http://localhost:3001/api/admin/rentals');
            if (data.success) {
                setAllRentals(data.rentals); // !! Use data.rentals
                setLoadingStatus('success');
            } else {
                throw new Error("Failed to fetch rental list from the API.");
            }
        } catch (error) {
            console.error("Error fetching rentals:", error);
            setLoadingStatus('error');
        }
    };

    useEffect(() => {
        fetchAllRentals(); // !! Call renamed function
    }, []);


    // !! This function needs to be replaced with RENTAL-specific actions,
    // !! like marking a rental as returned.
    const handleReturnRental = async (rentalId) => {
        try {
            const data = await adminApiPut(`http://localhost:3001/api/admin/rentals/return/${rentalId}`);
            if (!data.success) {
                throw new Error(data.error || 'Failed to mark rental as returned.');
            }
            setActiveModal({ type: null, data: null });
            fetchAllRentals(); // Refresh list
        } catch(error) {
             // Replace alert with a better UI notification
            alert(`Error: ${error.message}`);
        }
    };

     // !! This function is likely NOT needed for rentals in the admin panel,
     // !! unless you allow admins to DELETE historical records.
     // !! Keeping it for now, but ensure the endpoint exists if used.
    const handleDeleteRental = async (rentalId) => {
        // Maybe show a confirmation modal first
        try {
            // !! Ensure this DELETE endpoint exists and is secure if you keep this.
            // const data = await adminApiDelete(`http://localhost:3001/api/admin/rentals/${rentalId}`);
            // if (!data.success) {
            //     throw new Error(data.error || "Failed to delete rental.");
            // }
            console.warn("Delete rental functionality not fully implemented."); // Placeholder
            setActiveModal({ type: null, data: null });
            fetchAllRentals(); // Refresh data on success (if deletion happens)
        } catch (error) {
            // Replace alert with a better UI notification
            alert(`Error: ${error.message}`);
        }
    };

    // !! Updated filtering/sorting logic for RENTALS
    const processedRentals = useMemo(() => {
        let filteredRentals = allRentals.filter(rental =>
            `${rental.first_name} ${rental.last_name} ${rental.make} ${rental.model}`.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfiguration.key) {
            filteredRentals.sort((rentalA, rentalB) => {
                const valueA = rentalA[sortConfiguration.key];
                const valueB = rentalB[sortConfiguration.key];
                let comparison = 0;

                // Handle date sorting
                if (['pickup_date', 'due_date', 'return_date'].includes(sortConfiguration.key)) {
                    const dateA = valueA ? new Date(valueA) : new Date(0); // Treat null dates as earliest
                    const dateB = valueB ? new Date(valueB) : new Date(0);
                    comparison = dateA - dateB;
                } else {
                     // Handle string/number sorting (case-insensitive for strings)
                     const strA = String(valueA || '').toLowerCase();
                     const strB = String(valueB || '').toLowerCase();
                     if (strA < strB) comparison = -1;
                     if (strA > strB) comparison = 1;
                }

                return sortConfiguration.direction === 'ascending' ? comparison : comparison * -1;
            });
        }
        return filteredRentals;
    }, [allRentals, searchTerm, sortConfiguration]);


    const requestTableSort = (key) => {
        setSortConfiguration(currentConfiguration => ({
            key,
            direction: currentConfiguration.key === key && currentConfiguration.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    // --- Helper to format dates ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'Invalid Date';
        }
    };

    return (
        <div className="font-inter">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>Rental Management</h2>
                <div className="flex items-center gap-4">
                    <input type="text" placeholder="Search rentals..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
                {loadingStatus === 'loading' && <p>Loading rental data...</p>}
                {loadingStatus === 'error' && <p className="text-red-500">Failed to load rental data.</p>}
                {loadingStatus === 'success' && (
                    // !! Need a RentalTable component
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {/* !! Rental specific headers */}
                                <SortableHeader label="Customer" sortKey="last_name" requestSort={requestTableSort} sortConfiguration={sortConfiguration}/>
                                <SortableHeader label="Car" sortKey="make" requestSort={requestTableSort} sortConfiguration={sortConfiguration}/>
                                <SortableHeader label="Pickup Date" sortKey="pickup_date" requestSort={requestTableSort} sortConfiguration={sortConfiguration}/>
                                <SortableHeader label="Due Date" sortKey="due_date" requestSort={requestTableSort} sortConfiguration={sortConfiguration}/>
                                <SortableHeader label="Return Date" sortKey="return_date" requestSort={requestTableSort} sortConfiguration={sortConfiguration}/>
                                <SortableHeader label="Total Cost" sortKey="total_cost" requestSort={requestTableSort} sortConfiguration={sortConfiguration}/>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {processedRentals.map(rental => (
                                <tr key={rental.rental_id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{rental.first_name} {rental.last_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{rental.make} {rental.model}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(rental.pickup_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(rental.due_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {rental.return_date ? formatDate(rental.return_date) : (
                                            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">${parseFloat(rental.total_cost || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        {/* !! Actions for rentals */}
                                        {!rental.return_date && (
                                             <Button onClick={() => handleReturnRental(rental.rental_id)} variant="secondary" className="text-xs !px-2 !py-1">Mark Returned</Button>
                                        )}
                                        {/* Add View Details button if needed */}
                                        {/* <Button onClick={() => setActiveModal({ type: 'details', data: rental })} variant="ghost" className="p-1"><ViewIcon /></Button> */}
                                        {/* Add Delete button if needed */}
                                        {/* <Button onClick={() => setActiveModal({ type: 'delete', data: rental })} variant="ghost" className="p-1 text-red-500"><DeleteIcon /></Button> */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// --- Child Components -------------------------------------------------------

// !! This needs to be a RENTAL table component
// !! Keeping CustomerTable structure for now, but headers/data need changing
const SortableHeader = ({ label, sortKey, requestSort, sortConfiguration }) => ( // Helper component
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
        <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white">
            {label}
            {sortConfiguration.key === sortKey && <SortIcon className={sortConfiguration.direction === 'descending' ? 'rotate-180' : ''} />}
        </button>
    </th>
);


// !! These modals are for CUSTOMERS and need to be replaced/removed
const CustomerFormModal = ({ isOpen, onClose, onSave, customer }) => {
    // ... (This modal is for creating/editing CUSTOMERS) ...
     if (!isOpen) return null; return <div>Customer Form Placeholder</div>
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, customerName }) => {
    // ... (This modal confirms CUSTOMER deletion) ...
     if (!isOpen) return null; return <div>Delete Confirmation Placeholder</div>
};

const CustomerDetailModal = ({ isOpen, customer, onClose }) => {
    // ... (This modal shows CUSTOMER details) ...
     if (!isOpen) return null; return <div>Customer Detail Placeholder</div>
};

