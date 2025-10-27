// Hey team, this is the CustomerManager page.
// It's pretty similar to the CarManager, but it has some new tricks
// like live search, table sorting, and a form with real-time validation.

import React, { useState, useEffect, useMemo } from 'react';
// API helpers for GET, DELETE, and PUT (editing)
import { adminApiGet, adminApiDelete, adminApiPut } from '../../utils/apiHelper.js'; 

// --- Icon Components --------------------------------------------------------
// Simple SVG components for our buttons.
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
// This icon is for the sortable table headers
const SortIcon = (properties) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...properties}>
        <path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>
    </svg>
);

// Our same reusable Button component
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

export default function CustomerManager() {
    // --- State ---
    // This holds the *original, complete* list of customers from the API
    const [allCustomers, setAllCustomers] = useState([]);
    // Tracks our data fetching: 'loading', 'success', or 'error'
    const [loadingStatus, setLoadingStatus] = useState('loading');
    // Holds the text from the search bar
    const [searchTerm, setSearchTerm] = useState('');
    // Stores how the table is sorted, e.g., { key: 'last_name', direction: 'ascending' }
    const [sortConfiguration, setSortConfiguration] = useState({ key: 'last_name', direction: 'ascending' });
    // Our old friend, the modal state object
    const [activeModal, setActiveModal] = useState({ type: null, data: null });

    // --- Data Fetching ---

    // This is our main function to get all customer data
    const fetchAllCustomers = async () => {
        setLoadingStatus('loading');
        try {
            const data = await adminApiGet('http://localhost:3001/api/admin/customers');
            if (data.success) {
                setAllCustomers(data.customers); // Store the full list
                setLoadingStatus('success');
            } else {
                throw new Error(data.error || "Failed to fetch customer list from the API.");
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            setLoadingStatus('error');
        }
    };

    // This useEffect runs just once on mount to load our initial data
    useEffect(() => {
        fetchAllCustomers();
    }, []);

    // --- Event Handlers ---

    // This function is cool: it handles *both* ADDING a new customer
    // and *UPDATING* (editing) an existing one.
    const handleSaveCustomer = async (customerFormData) => {
        // We're re-mapping the form's camelCase names to the database's snake_case names
        const payload = {
            first_name: customerFormData.firstName,
            last_name: customerFormData.lastName,
            email: customerFormData.email,
            phone_number: customerFormData.phone_number,
            address: customerFormData.address,
            city: customerFormData.city,
            state: customerFormData.state,
            zip_code: customerFormData.zip_code,
        };
        // We know we're in "edit mode" if the form data has a customer_id
        const isEditingMode = !!customerFormData.customer_id;

        // ** THIS IS IMPORTANT! **
        // If we're editing, we use the secure ADMIN endpoint.
        // If we're adding, we use the PUBLIC registration endpoint.
        const url = isEditingMode
            ? `http://localhost:3001/api/admin/customers/${customerFormData.customer_id}` // Admin-only UPDATE route
            : 'http://localhost:3001/api/customers/register'; // Public ADD route
        
        try {
            let data;
            if (isEditingMode) {
                // For editing, we use our secure 'adminApiPut' helper
                data = await adminApiPut(url, payload);
            } else {
                // For *adding*, we use a regular 'fetch' because it's a public endpoint.
                // We also have to add the password back in for new registrations.
                const response = await fetch(url, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({...payload, password: customerFormData.password}) 
                });
                data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Registration failed.');
            }

            if (!data.success) {
                // If the API send success: false, throw an error
                throw new Error(data.error || `Failed to ${isEditingMode ? 'update' : 'add'} the customer.`);
            }

            // Success! Close the modal and refresh the customer list
            setActiveModal({ type: null, data: null });
            fetchAllCustomers(); 
        } catch (error) {
            // TODO: We should replace this ugly alert with a nice error message in the modal
            alert(`Error: ${error.message}`);
        }
    };

    // This runs when we confirm deletion
    const handleDeleteCustomer = async (customerId) => {
        try {
            // Use our secure helper to send the DELETE request
            const data = await adminApiDelete(`http://localhost:3001/api/admin/customers/${customerId}`);
            if (!data.success) {
                throw new Error(data.error || "Failed to delete customer.");
            }
            // Success! Close the confirmation modal and refresh the list
            setActiveModal({ type: null, data: null });
            fetchAllCustomers(); 
        } catch (error) {
            // TODO: This should also be a better notification
            alert(`Error: ${error.message}`);
        }
    };

    // --- Memoized Calculations ---

    // This 'useMemo' hook is a big performance win.
    // It creates the list of customers to *actually show* in the table.
    // It will only re-calculate this list if:
    // 1. The main 'allCustomers' list changes (e.g., after a fetch)
    // 2. The 'searchTerm' changes (e.g., user is typing)
    // 3. The 'sortConfiguration' changes (e.g., user clicks a header)
    // Without this, it would re-filter and re-sort on *every single render*.
    const processedCustomers = useMemo(() => {
        // 1. Start with our full list and filter it
        let filteredCustomers = allCustomers.filter(customer =>
            // Combine all searchable fields into one string and check if the search term is in it
            `${customer.first_name} ${customer.last_name} ${customer.email} ${customer.phone_number || ''}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );

        // 2. Now, sort the *filtered* list
        if (sortConfiguration.key) {
            filteredCustomers.sort((customerA, customerB) => {
                // Get the values we're sorting by, default to empty string
                const valueA = (customerA[sortConfiguration.key] || '').toLowerCase();
                const valueB = (customerB[sortConfiguration.key] || '').toLowerCase();
                
                if (valueA < valueB) return sortConfiguration.direction === 'ascending' ? -1 : 1;
                if (valueA > valueB) return sortConfiguration.direction === 'ascending' ? 1 : -1;
                return 0; // They're equal
            });
        }
        
        // 3. Return the final processed list
        return filteredCustomers;
    }, [allCustomers, searchTerm, sortConfiguration]);

    // This function is called when a table header is clicked
    const requestTableSort = (key) => {
        setSortConfiguration(currentConfiguration => ({
            key,
            // This logic is slick:
            // IF we're clicking the same key AND it's already 'ascending',
            // THEN switch to 'descending'.
            // OTHERWISE, just set it to 'ascending'.
            direction: currentConfiguration.key === key && currentConfiguration.direction === 'ascending' 
                ? 'descending' 
                : 'ascending'
        }));
    };

    // --- JSX Render ---
    return (
        <div className="font-inter">
            {/* Header: Title, Search Bar, Add Button */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>Customer Directory</h2>
                <div className="flex items-center gap-4">
                    {/* The search bar just updates the 'searchTerm' state */}
                    <input 
                        type="text" 
                        placeholder="Search customers..." 
                        value={searchTerm} 
                        onChange={(event) => setSearchTerm(event.target.value)} 
                        className="p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" 
                    />
                    {/* This button opens the 'add' modal */}
                    <Button onClick={() => setActiveModal({ type: 'add', data: null })}>
                        <AddIcon className="mr-2" /> Add New Customer
                    </Button>
                </div>
            </div>

            {/* Main Content: Table (or loading/error messages) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
                {/* Show a message based on our loadingStatus */}
                {loadingStatus === 'loading' && <p>Loading customer data...</p>}
                {loadingStatus === 'error' && <p className="text-red-500">Failed to load customer data.</p>}
                
                {/* Once loading is successful, show the table */}
                {loadingStatus === 'success' && (
                    <CustomerTable
                        customers={processedCustomers} // Pass in our *processed* list
                        sortConfiguration={sortConfiguration}
                        requestSort={requestTableSort}
                        onEdit={(customer) => setActiveModal({ type: 'edit', data: customer })}
                        onDelete={(customer) => setActiveModal({ type: 'delete', data: customer })}
                        onViewDetails={(customer) => setActiveModal({ type: 'details', data: customer })}
                    />
                )}
            </div>

            {/* --- Modals --- */}
            {/* These components are only *rendered* if their 'type' is active */}

            {/* Add / Edit Form Modal */}
            {(activeModal.type === 'add' || activeModal.type === 'edit') &&
                <CustomerFormModal
                    isOpen={true}
                    onClose={() => setActiveModal({ type: null, data: null })}
                    onSave={handleSaveCustomer}
                    customer={activeModal.data} // This will be null for 'add', or a customer object for 'edit'
                />
            }
            {/* Delete Confirmation Modal */}
            {activeModal.type === 'delete' &&
                <DeleteConfirmationModal
                    isOpen={true}
                    onClose={() => setActiveModal({ type: null, data: null })}
                    onConfirm={() => handleDeleteCustomer(activeModal.data.customer_id)}
                    customerName={`${activeModal.data.first_name} ${activeModal.data.last_name}`}
                />
            }
            {/* View Details Modal */}
            {activeModal.type === 'details' &&
                <CustomerDetailModal
                    isOpen={true}
                    onClose={() => setActiveModal({ type: null, data: null })}
                    customer={activeModal.data}
                />
            }
        </div>
    );
}

// --- Child Components -------------------------------------------------------

// This is the Table component. It's "dumb" - it just displays
// whatever data we pass into it via props.
const CustomerTable = ({ customers, sortConfiguration, requestSort, onEdit, onDelete, onViewDetails }) => {
    
    // I made this a little sub-component to keep the table header JSX clean.
    // It's a button that calls 'requestSort' and shows the right icon.
    const SortableHeader = ({ label, sortKey }) => (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
            <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white">
                {label}
                {/* Only show the icon if this header is the active one */}
                {sortConfiguration.key === sortKey && <SortIcon className={sortConfiguration.direction === 'descending' ? 'rotate-180' : ''} />}
            </button>
        </th>
    );

    return (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <SortableHeader label="Name" sortKey="last_name" />
                    <SortableHeader label="Email" sortKey="email" />
                    <SortableHeader label="Phone" sortKey="phone_number" />
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Loop over the customers and make a row for each */}
                {customers.map(customer => (
                    <tr key={customer.customer_id}>
                        <td className="px-6 py-4 whitespace-nowrap">{customer.first_name} {customer.last_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{customer.phone_number || 'Not Available'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                            {/* These buttons just call the functions passed in as props */}
                            <Button onClick={() => onViewDetails(customer)} variant="ghost" className="p-1"><ViewIcon /></Button>
                            <Button onClick={() => onEdit(customer)} variant="ghost" className="p-1"><EditIcon /></Button>
                            <Button onClick={() => onDelete(customer)} variant="ghost" className="p-1 text-red-500"><DeleteIcon /></Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

// This is the Add/Edit form modal.
// It manages all its *own* state for the form inputs.
const CustomerFormModal = ({ isOpen, onClose, onSave, customer }) => {
    // Set the initial form state based on the 'customer' prop.
    // If 'customer' is null (Add mode), all fields are empty.
    const [formData, setFormData] = useState({
        firstName: customer?.first_name || '',
        lastName: customer?.last_name || '',
        email: customer?.email || '',
        phone_number: customer?.phone_number || '',
        address: customer?.address || '',
        city: customer?.city || '',
        state: customer?.state || '',
        zip_code: customer?.zip_code || '',
        password: '', // Always starts empty
    });
    // This state holds any validation errors
    const [formErrors, setFormErrors] = useState({});

    if (!isOpen) return null; // Don't render anything if it's not open

    // This checks our form fields *before* submitting
    const validateForm = () => {
        const newErrors = {};
        // Use regex to check formats
        if (formData.phone_number && !/^\d{3}-\d{3}-\d{4}$/.test(formData.phone_number)) {
            newErrors.phone_number = "Phone must be in XXX-XXX-XXXX format.";
        }
        if (formData.state && !/^[A-Z]{2}$/.test(formData.state)) {
            newErrors.state = "State must be 2 capital letters.";
        }
        if (formData.zip_code && !/^\d{5}$/.test(formData.zip_code)) {
            newErrors.zip_code = "ZIP Code must be 5 numbers.";
        }
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Return true if no errors
    };

    // This is our "smart" input handler
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        let formattedValue = value;

        // This is the real-time formatting magic
        if (name === 'phone_number') {
            const digits = value.replace(/\D/g, ''); // Remove all non-numbers
            // Magically add the dashes as the user types
            const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (match) {
                formattedValue = !match[2] ? match[1] : `${match[1]}-${match[2]}` + (match[3] ? `-${match[3]}` : '');
            }
        } else if (name === 'state') {
            // Force to 2 uppercase letters
            formattedValue = value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
        } else if (name === 'zip_code') {
            // Force to 5 numbers
            formattedValue = value.replace(/\D/g, '').slice(0, 5);
        }

        setFormData(previousState => ({ ...previousState, [name]: formattedValue }));
        // Clear errors for this field as the user types
        if (formErrors[name]) {
            setFormErrors(previousErrors => ({ ...previousErrors, [name]: null }));
        }
    };

    // This runs when we click the "Save Customer" button
    const handleSubmit = (event) => {
        event.preventDefault();
        // Only call onSave if the form is valid
        if (validateForm()) {
            // Add the customer_id back in if we're in edit mode
            const payload = customer ? { ...formData, customer_id: customer.customer_id } : formData;
            onSave(payload); // Send the data up to the parent
        }
    };
    
    // Just some Tailwind class strings to de-clutter the JSX
    const baseInputStyles = "w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600";
    const labelStyles = "block text-sm font-medium mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 font-inter">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>{customer ? "Edit Customer" : "Add New Customer"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Form grid... */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyles}>First Name</label>
                            <input name="firstName" value={formData.firstName} onChange={handleInputChange} required className={baseInputStyles} />
                        </div>
                        <div>
                            <label className={labelStyles}>Last Name</label>
                            <input name="lastName" value={formData.lastName} onChange={handleInputChange} required className={baseInputStyles} />
                        </div>
                    </div>
                    <div>
                        <label className={labelStyles}>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={baseInputStyles} />
                    </div>
                    {/* !!customer is false if 'customer' is null. So this *only* shows in "Add New" mode. */}
                    {!customer && 
                        <div>
                            <label className={labelStyles}>Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required className={baseInputStyles} placeholder="Required for new customers"/>
                        </div>
                    }
                    <div>
                        <label className={labelStyles}>Phone</label>
                        {/* Show a red border if there's an error for this field */}
                        <input name="phone_number" value={formData.phone_number} onChange={handleInputChange} className={`${baseInputStyles} ${formErrors.phone_number ? 'border-red-500' : ''}`} placeholder="XXX-XXX-XXXX" />
                        {/* Show the error message */}
                        {formErrors.phone_number && <p className="text-red-500 text-xs mt-1">{formErrors.phone_number}</p>}
                    </div>
                    <div>
                        <label className={labelStyles}>Address</label>
                        <input name="address" value={formData.address} onChange={handleInputChange} className={baseInputStyles} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelStyles}>City</label>
                            <input name="city" value={formData.city} onChange={handleInputChange} className={baseInputStyles} />
                        </div>
                        <div>
                            <label className={labelStyles}>State</label>
                            <input name="state" value={formData.state} onChange={handleInputChange} className={`${baseInputStyles} ${formErrors.state ? 'border-red-500' : ''}`} placeholder="TX" />
                            {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
                        </div>
                        <div>
                            <label className={labelStyles}>ZIP Code</label>
                            <input name="zip_code" value={formData.zip_code} onChange={handleInputChange} className={`${baseInputStyles} ${formErrors.zip_code ? 'border-red-500' : ''}`} placeholder="77301" />
                            {formErrors.zip_code && <p className="text-red-500 text-xs mt-1">{formErrors.zip_code}</p>}
                        </div>
                    </div>
                    {/* Modal Footer Buttons */}
                    <div className="flex justify-end space-x-4 pt-4 mt-4 border-t dark:border-gray-600">
                        <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                        <Button type="submit" variant="primary">Save Customer</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// This is the simple "Are you sure?" modal for deleting.
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, customerName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 font-inter">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Delete Customer</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete <strong>{customerName}</strong>? This action cannot be undone.</p>
                <div className="flex justify-center space-x-4">
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={onConfirm} variant="danger">Delete</Button>
                </div>
            </div>
        </div>
    );
};

// This modal opens to show *all* details for one customer.
// It fetches its own data when it opens.
const CustomerDetailModal = ({ isOpen, customer, onClose }) => {
    // This state will hold all the *extra* data we fetch
    const [details, setDetails] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState('loading');

    // This useEffect runs when the 'customer' prop changes (i.e., when the modal opens)
    useEffect(() => {
        if (customer?.customer_id) {
            const fetchCustomerDetails = async () => {
                setLoadingStatus('loading');
                try {
                    // Okay, this is cool. We want to fetch 3 different things:
                    // payments, favorites, and rental history.
                    // We use 'Promise.allSettled' instead of 'Promise.all'.
                    // 'allSettled' will run *all* promises, even if one fails.
                    // 'Promise.all' would just stop and throw an error if *any* of them failed.
                    // This way, we can still show rental history even if favorites fails to load.
                    const apiResults = await Promise.allSettled([
                        fetch(`http://localhost:3001/api/customers/${customer.customer_id}/payment-methods`),
                        fetch(`http://localhost:3001/api/customers/${customer.customer_id}/favorites`),
                        fetch(`http://localhost:3001/api/customers/${customer.customer_id}/rental-history`),
                    ]);

                    // This is a helper function to safely get the JSON data
                    // from the 'allSettled' results
                    const getJsonFromResponse = async (result) => {
                        if (result.status === 'fulfilled' && result.value.ok) {
                            return result.value.json();
                        }
                        // Log an error but don't stop everything
                        console.error("API request failed:", result.reason || result.value.statusText);
                        return {}; // Return an empty object on failure
                    };
                    
                    // Now we process the results
                    const [paymentsData, favoritesData, historyData] = await Promise.all(apiResults.map(getJsonFromResponse));

                    // Set all our data into state
                    setDetails({
                        paymentMethods: paymentsData.methods || [],
                        favoriteCars: favoritesData.favorites || [],
                        rentalHistory: historyData.history || [],
                    });
                    setLoadingStatus('success');
                } catch (error) {
                    console.error("A critical error occurred while fetching details:", error);
                    setLoadingStatus('error');
                }
            };
            fetchCustomerDetails();
        }
    }, [customer]); // Re-run this whole effect if the 'customer' prop changes

    if (!isOpen) return null;

    // A simple date formatting helper
    const formatDate = (dateString) => {
        if (!dateString) return 'Not Available';
        const date = new Date(dateString);
        return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 font-inter">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <header className="flex justify-between items-center border-b pb-4 mb-6 dark:border-gray-600">
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{customer ? `${customer.first_name} ${customer.last_name}` : 'Customer Details'}</h2>
                    <button onClick={onClose} className="text-3xl hover:text-red-500">&times;</button>
                </header>
                
                {/* Modal Body (scrollable) */}
                <main className="overflow-y-auto">
                    {/* Show messages based on loading status */}
                    {!customer ? (
                        <p>No customer selected.</p>
                    ) : loadingStatus === 'loading' ? (
                        <p>Loading details...</p>
                    ) : loadingStatus === 'error' ? (
                        <p className="text-red-500">Could not load all customer details. Some information may be missing.</p>
                    ) : loadingStatus === 'success' && details && (
                        // This is the main details grid
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Contact Info */}
                            <div>
                                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Contact & Address</h3>
                                <p><strong>Email:</strong> {customer.email}</p>
                                <p><strong>Phone:</strong> {customer.phone_number || 'Not Available'}</p>
                                <p><strong>Address:</strong> {`${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} ${customer.zip_code || ''}`.replace(/, , /g, ', ').replace(/^, |, $/g, '') || 'Not Available'}</p>
                            </div>
                            {/* Payment Info */}
                            <div>
                                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Payment Methods</h3>
                                {details.paymentMethods.length > 0 ? details.paymentMethods.map(method => (
                                    <p key={method?.payment_method_id}>{method?.card_type} ending in {(method?.masked_number || '****').slice(-4)}</p>
                                )) : <p className="text-gray-500">No saved cards.</p>}
                            </div>
                            {/* Favorite Cars */}
                            <div className="md:col-span-2">
                                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Favorite Cars</h3>
                                {details.favoriteCars.length > 0 ? (
                                    <ul className="list-disc pl-5">
                                        {details.favoriteCars.map(car => <li key={car?.car_id}>{car?.year} {car?.make} {car?.model}</li>)}
                                    </ul>
                                ) : <p className="text-gray-500">No favorite cars.</p>}
                            </div>
                            {/* Rental History */}
                            <div className="md:col-span-2">
                                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Rental History</h3>
                                {details.rentalHistory.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto border p-2 rounded-lg dark:border-gray-600">
                                        {details.rentalHistory.map(rental => (
                                            <div key={rental?.rental_id} className="text-sm">
                                                <p>
                                                    <strong>{rental?.make} {rental?.model}</strong> 
                                                    {' ('}{formatDate(rental?.pickup_date)} - {formatDate(rental?.return_date)}{')'}
                                                    - ${(parseFloat(rental?.total_cost) || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-500">No rental history.</p>}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};