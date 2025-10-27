// The page that shows the table of all employees and lets us add,
// edit, or delete them. It's the "parent" component for the
// `EmployeeFormModal` we just looked at.

import React, { useState, useEffect } from 'react';
// This is our Add/Edit modal component
import EmployeeFormModal from './EmployeeFormModal.jsx';
// We need these API helpers to GET the list and DELETE employees
import { adminApiGet, adminApiDelete } from '../../utils/apiHelper.js';

export default function EmployeeManager() {
    // --- State ---
    
    // 'employees' holds our full list from the database
    const [employees, setEmployees] = useState([]);
    // 'loading' is just a boolean for our "Loading..." message
    const [loading, setLoading] = useState(true);
    // 'error' will hold any error messages from the API
    const [error, setError] = useState('');
    // 'isFormOpen' is our simple switch to show/hide the modal
    const [isFormOpen, setFormOpen] = useState(false);
    // 'selectedEmployee' is key:
    // - if it's 'null', the modal knows we're ADDING a new employee.
    // - if it has an employee object, the modal knows we're EDITING.
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // --- Data Fetching ---

    // This is our main function to get the employee list from the server
    const fetchEmployees = async () => {
        setLoading(true); // Show the loading message
        setError('');     // Clear any old errors
        try {
            // We're using our secure 'adminApiGet' helper here
            const data = await adminApiGet('http://localhost:3001/api/admin/employees');
            if (data.success) {
                setEmployees(data.employees); // Success! Save the list to our state
            } else {
                // The API returned success: false
                setError(data.error || 'Failed to fetch employees.');
            }
        } catch (err) {
            // This catches network errors (server down, etc.)
            setError(err.message || 'Failed to connect to the server.');
        } finally {
            // This 'finally' block *always* runs, even if we get an error
            setLoading(false); // Hide the loading message
        }
    };

    // This useEffect runs *only once* when the component first loads (see the empty `[]`)
    // Its only job is to call 'fetchEmployees' and get our initial data.
    useEffect(() => {
        fetchEmployees();
    }, []);

    // --- Event Handlers ---

    // This runs when we click the "Add New Employee" button
    const handleAdd = () => {
        setSelectedEmployee(null); // Set to null so the modal knows it's in "add" mode
        setFormOpen(true);         // Open the modal
    };

    // This runs when we click "Edit" on a specific employee
    const handleEdit = (employee) => {
        setSelectedEmployee(employee); // Pass the employee's data to the modal
        setFormOpen(true);             // Open the modal
    };

    // This runs when we click "Delete"
    const handleDelete = async (employeeId) => {
        // TODO: We should swap this ugly 'window.confirm' for a nice
        // confirmation modal, like the one on the Customer page.
        if (window.confirm('Are you sure you want to delete this employee? This cannot be undone.')) {
            try {
                // Use our secure 'adminApiDelete' helper
                const data = await adminApiDelete(`http://localhost:3001/api/admin/employees/${employeeId}`);
                if (data.success) {
                    fetchEmployees(); // Success! Refresh the employee list
                } else {
                    // TODO: This alert is also ugly. We should use a better notification system.
                    alert(data.error || 'Failed to delete employee.');
                }
            } catch (err) {
                alert(err.message || 'Failed to connect to the server.');
            }
        }
    };

    // This function gets passed *into* the EmployeeFormModal.
    // The modal will call this 'onSave' function when it successfully saves.
    const handleSave = () => {
        setFormOpen(false); // Close the modal
        fetchEmployees();   // Refresh the employee list to show the changes
    };

    // --- Render Logic ---

    // First, we handle our loading and error states.
    // If we're loading, just show this message and stop.
    if (loading) return <p>Loading employee data...</p>;
    // If we have an error, just show that and stop.
    if (error) return <p className="text-red-500">{error}</p>;

    // If we're not loading and have no errors, render the page:
    return (
        <div>
            {/* Page Header: Title and Add Button */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>Employee Roster</h2>
                <button onClick={handleAdd} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                    Add New Employee
                </button>
            </div>

            {/* The main table container */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Table Header */}
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Job Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {/* We map over our 'employees' state and create a row for each one */}
                        {employees.map(emp => (
                            <tr key={emp.employee_id}>
                                <td className="px-6 py-4 whitespace-nowrap">{emp.first_name} {emp.last_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{emp.job_title}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{emp.email}</td>
                                {/* Action buttons that call our handlers */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleEdit(emp)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    <button onClick={() => handleDelete(emp.employee_id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Modal --- */}
            {/* This is the magic: the modal is only *rendered* if 'isFormOpen' is true */}
            {/* We pass it:
                1. 'employee': The employee object to edit, or 'null' to add
                2. 'onClose': The function to run when we click "Cancel"
                3. 'onSave': The function to run when the modal saves successfully
            */}
            {/* (As we noted in the last file, that modal uses its own 'fetch'.
               We should refactor it to use our adminApiPost/Put helpers for security!) */}
            {isFormOpen && <EmployeeFormModal employee={selectedEmployee} onClose={() => setFormOpen(false)} onSave={handleSave} />}
        </div>
    );
}