import React, { useState, useEffect } from 'react';

// --- Imports for all the sub-pages ---
// These are all the different "tabs" or "views" we can switch between.
import MetricsDashboard from './MetricsDashboard.jsx';
import CarManager from './CarManager.jsx';
import EmployeeManager from './EmployeeManager.jsx';
import CustomerManager from './CustomerManager.jsx';
import RentalManager from './RentalManager.jsx';
import MaintenanceManager from './MaintenanceManager.jsx';
// This is just the little sun/moon icon button for dark mode
import ThemeToggleButton from '../ThemeToggleButton.jsx'; 

// This is the main dashboard component
export default function AdminDashboard() {
  
    // --- State Hooks ---
  
    // 'currentView' tracks which tab we're looking at. Starts on 'metrics'.
    const [currentView, setCurrentView] = useState('metrics'); 
    
    // 'isAuthenticated' is our gatekeeper. 
    // It's false until we check the token, then true if the token exists.
    const [isAuthenticated, setIsAuthenticated] = useState(false); 

    // --- Effects ---

    // This useEffect hook runs *only once* when the component first loads (see the empty `[]` array)
    useEffect(() => {
        // It checks localStorage to see if our 'adminToken' exists.
        const token = localStorage.getItem('adminToken');

        if (!token) {
            // If there's NO token, boot them back to the login page.
            // Our Astro page also has a script for this, but this is a good React-side backup.
            window.location.href = '/login';
        } else {
            // If we find a token, we'll *assume* they're logged in for now.
            // TODO: For better security, we should probably send this token to the API 
            // to make sure it's *actually* valid before setting this to true.
            setIsAuthenticated(true);
        }
    }, []); // The empty array means "only run on mount"

    // --- Helper Functions ---

    // This function runs when the user clicks the "Logout" button
    const handleLogout = () => {
        localStorage.removeItem('adminToken'); // Ditch the token
        localStorage.removeItem('adminUser'); // Ditch any user info too
        window.location.href = '/login'; // Send 'em to the login page
    };

    // --- Early Return (Auth Check) ---

    // This is super important! 
    // If 'isAuthenticated' is still false (because we're still checking or they failed),
    // we return 'null' so nothing flashes on the screen.
    // We could put a <LoadingSpinner /> here instead.
    if (!isAuthenticated) {
        return null;
    }

    // --- View Rendering Logic ---

    // This function figures out which component to show based on the 'currentView' state
    const renderView = () => {
        switch (currentView) {
            case 'metrics':
                return <MetricsDashboard />;
            case 'cars':
                return <CarManager />;
            case 'maintenance':
                return <MaintenanceManager />;
            case 'employees':
                return <EmployeeManager />;
            case 'customers':
                return <CustomerManager />;
            case 'rentals':
                return <RentalManager />;
            default:
                // If something goes wrong, just show the metrics page
                return <MetricsDashboard />;
        }
    };

    // --- Reusable NavButton Sub-Component ---

    // I made this little component just for our navigation tabs.
    // It makes the main JSX cleaner.
    const NavButton = ({ viewName, label }) => {
        // Check if this button's view is the one currently active
        const isActive = currentView === viewName; 
        
        return (
            <button
                // When clicked, it updates the 'currentView' state
                onClick={() => setCurrentView(viewName)}
                // This magic string just changes the style if 'isActive' is true
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isActive
                        ? 'bg-blue-600 text-white shadow-sm' // Active style
                        : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700' // Inactive style
                }`}
            >
                {label}
            </button>
        );
    };

    // --- Main JSX Render ---
    // This is what actually gets rendered to the page
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-inter">
            
            {/* This is the whole top bar that sticks */}
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
                
                {/* Top part of the header: Title and buttons */}
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>Admin Dashboard</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Prestige Rentals</p>
                    </div>
                    
                    {/* Right-side buttons */}
                    <div className="flex items-center space-x-4">
                        <ThemeToggleButton />
                        <button
                            onClick={handleLogout} // Hook up our logout function
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Bottom part of the header: Navigation tabs */}
                <nav className="bg-white dark:bg-gray-800/50 shadow-sm">
                    <div className="container mx-auto px-6 py-2 flex space-x-2 overflow-x-auto">
                        {/* Here we use our reusable NavButton component */}
                        <NavButton viewName="metrics" label="Metrics" />
                        <NavButton viewName="cars" label="Manage Cars" />
                        <NavButton viewName="maintenance" label="Manage Maintenance" />
                        <NavButton viewName="employees" label="Manage Employees" />
                        <NavButton viewName="customers" label="Manage Customers" />
                        <NavButton viewName="rentals" label="Manage Rentals" />
                    </div>
                </nav>
            </header>

            {/* This is the main content area */}
            <main className="container mx-auto p-6 md:p-8">
                {/* This is the magic! It calls our renderView() function, 
                  which puts the correct component (like <CarManager />) right here.
                */}
                {renderView()}
            </main>
        </div>
    );
}