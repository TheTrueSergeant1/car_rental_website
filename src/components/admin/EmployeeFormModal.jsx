import React, { useState, useEffect } from 'react';

// Hey team, I noticed we're importing these, but this component
// doesn't actually use 'adminApiGet' or 'adminApiDelete'.
// We might be able to clean this up later.
import { adminApiGet, adminApiDelete } from '../../utils/apiHelper';

// This is our Add/Edit modal for Employees.
// It gets the 'employee' object if we're editing (or null if adding),
// an 'onClose' function to close itself, and an 'onSave' function
// to tell the parent page to refresh its list.
const EmployeeFormModal = ({ employee, onClose, onSave }) => {
    
    // This is the main state for our form.
    // We use the 'employee' prop to pre-fill the fields if we're in edit mode.
    // If 'employee' is null (add mode), all fields start empty.
    const [formData, setFormData] = useState({
        first_name: employee?.first_name || '',
        last_name: employee?.last_name || '',
        job_title: employee?.job_title || '',
        email: employee?.email || '',
        username: employee?.username || '',
        password: '', // We always start the password blank for security
    });

    // This state just tracks if we're currently talking to the API
    const [loading, setLoading] = useState(false);
    // This will hold any error messages from the server (like "username already taken")
    const [error, setError] = useState('');

    // Just storing our Tailwind classes in variables to make the JSX cleaner
    const inputStyles = "p-2 border rounded-lg w-full dark:bg-gray-700 dark:border-gray-600";
    const labelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    // This is our standard input handler.
    // It updates the 'formData' state every time we type in a box.
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // This is the big function that runs when we hit the "Save" button
    const handleSubmit = async (e) => {
        e.preventDefault(); // Stop the page from reloading
        setLoading(true);   // Show the "Saving..." text on the button
        setError('');       // Clear out any old errors

        // Make a copy of the form data to send to the API
        const payload = { ...formData };
        
        // **This is important!**
        // If we are in *edit* mode AND the password field is empty,
        // we delete the password key from our payload.
        // This tells the backend "don't update the password."
        if (employee && !payload.password) {
            delete payload.password;
        }

        // This is our add/edit logic:
        // If 'employee' exists, we use the 'PUT' (edit) URL.
        // If not, we use the 'POST' (add) URL.
        const url = employee 
            ? `http://localhost:3001/api/admin/employees/${employee.employee_id}`
            : 'http://localhost:3001/api/admin/employees';
        const method = employee ? 'PUT' : 'POST';

        // **Hey team, big note here!**
        // Notice we're using a standard 'fetch' call. This is different
        // from our other forms (like CarManager) that use 'adminApiPut' or 'adminApiPost'.
        // This 'fetch' call is **NOT** sending our admin auth token!
        // This will probably fail if the route is protected. We should
        // definitely look at swapping this out for our 'apiHelper' functions.
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json(); // Get the server's response

            if (data.success) {
                // It worked! Call 'onSave()' which tells the parent page
                // to close this modal and refresh the employee list.
                onSave(); 
            } else {
                // The API sent back an error (like "username taken")
                setError(data.error || 'Failed to save employee.');
            }
        } catch (err) {
            // This catches network errors (like if the server is down)
            setError('Failed to connect to the server.');
        } finally {
            // This 'finally' block *always* runs, whether we succeed or fail.
            // We use it to turn the "Saving..." button back to "Save".
            setLoading(false);
        }
    };

    // This is the JSX (the HTML-looking stuff) for our modal
    return (
        // This is the dark overlay that covers the whole screen
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30 p-4">
            {/* This is the white modal box itself */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                
                {/* The title changes based on if we're adding or editing */}
                <h2 className="text-2xl font-bold mb-6">
                    {employee ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                
                {/* This error message only shows up if 'error' state has something in it */}
                {error && <p className="text-red-500 mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyles}>First Name</label>
                            <input name="first_name" value={formData.first_name} onChange={handleChange} required className={inputStyles}/>
                        </div>
                        <div>
                            <label className={labelStyles}>Last Name</label>
                            <input name="last_name" value={formData.last_name} onChange={handleChange} required className={inputStyles}/>
                        </div>
                        <div>
                            <label className={labelStyles}>Job Title</label>
                            <input name="job_title" value={formData.job_title} onChange={handleChange} required className={inputStyles}/>
                        </div>
                        <div>
                            <label className={labelStyles}>Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputStyles}/>
                        </div>
                        <div>
                            <label className={labelStyles}>Username</label>
                            <input name="username" value={formData.username} onChange={handleChange} required className={inputStyles}/>
                        </div>
                        <div>
                            <label className={labelStyles}>Password</label>
                            {/* This is a neat trick:
                              - 'placeholder' changes if we're editing.
                              - 'required' is only true if we're ADDING (when !employee is true).
                                This means we don't *have* to enter a password when editing.
                            */}
                            <input 
                                name="password" 
                                type="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                placeholder={employee ? 'Leave blank to keep current' : ''} 
                                className={inputStyles} 
                                required={!employee}
                            />
                        </div>
                    </div>
                    
                    {/* These are the "Cancel" and "Save" buttons at the bottom */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">
                            Cancel
                        </button>
                        {/* The Save button is disabled if 'loading' is true */}
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeFormModal;