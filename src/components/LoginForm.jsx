import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Main component that orchestrates the login and registration forms.
export default function LoginForm() {
    // ... (rest of LoginForm component is unchanged) ...
    const [activeTab, setActiveTab] = useState('customer');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleTabChange = (tab) => {
        setError('');
        setMessage('');
        setActiveTab(tab);
    };

    const tabButtonStyles = (isActive) =>
        `w-1/2 py-4 text-center font-semibold rounded-t-lg transition-all duration-300 focus:outline-none ${
        isActive
            ? 'bg-white dark:bg-gray-800 text-blue-600'
            : 'bg-transparent text-gray-500 hover:text-blue-500'
        }`;

    const formContainerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 font-inter p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-6">
                    <h1 className="text-5xl text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Prestige Rentals
                    </h1>
                </div>

                {/* Form Container */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                    {/* Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-900 rounded-t-2xl">
                        <button onClick={() => handleTabChange('customer')} className={tabButtonStyles(activeTab === 'customer')}>
                            Customer
                        </button>
                        <button onClick={() => handleTabChange('employee')} className={tabButtonStyles(activeTab === 'employee')}>
                            Employee
                        </button>
                    </div>

                    <div className="p-8 min-h-[450px]">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.p
                                    className="bg-red-100 text-red-700 p-3 rounded-lg text-center mb-6 border border-red-200 dark:bg-red-900/40 dark:text-red-300 text-sm"
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                >
                                    {error}
                                </motion.p>
                            )}
                            {message && (
                                <motion.p
                                    className="bg-green-100 text-green-700 p-3 rounded-lg text-center mb-6 border border-green-200 dark:bg-green-900/40 dark:text-green-300 text-sm"
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                >
                                    {message}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                variants={formContainerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {activeTab === 'customer' ? (
                                    <CustomerForm setError={setError} setMessage={setMessage} />
                                ) : (
                                    <EmployeeForm setError={setError} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Customer login/register toggle form
function CustomerForm({ setError, setMessage }) {
    const [isLoginView, setLoginView] = useState(true);

    return (
        <div>
            <div className="flex justify-center mb-8">
                <div className="relative inline-flex bg-gray-100 dark:bg-gray-900 rounded-full p-1">
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-blue-600 rounded-full shadow-md transition-transform duration-300 ease-out ${
                        isLoginView ? 'translate-x-1' : 'translate-x-[calc(100%-0.25rem)]'
                        }`}
                    />
                    <button onClick={() => setLoginView(true)} className={`relative w-24 py-2 text-sm font-bold rounded-full transition-colors z-10 ${isLoginView ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        Sign In
                    </button>
                    <button onClick={() => setLoginView(false)} className={`relative w-24 py-2 text-sm font-bold rounded-full transition-colors z-10 ${!isLoginView ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        Sign Up
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={isLoginView ? 'login' : 'register'}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                >
                    {isLoginView ? (
                        <CustomerLoginForm setError={setError} />
                    ) : (
                        <CustomerRegisterForm setError={setError} setMessage={setMessage} setLoginView={setLoginView} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Customer Login Form - UPDATED WITH TOKEN FIX
function CustomerLoginForm({ setError }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        console.log("Customer login initiated...");
        try {
            const response = await fetch('http://localhost:3001/api/customers/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            console.log("Login response received:", data);

            if (data.success) {
                console.log("Login successful. Storing user data and token..."); // <-- UPDATED LOG
                try {
                    sessionStorage.setItem('customerUser', JSON.stringify(data.user));
                    sessionStorage.setItem('customerToken', data.token); // <-- ****** THE FIX ******
                    
                    console.log("User data and token stored in sessionStorage."); // <-- UPDATED LOG
                    console.log("Attempting redirect to /customer/dashboard...");
                    window.location.href = '/customer/dashboard';
                } catch (storageError) {
                    console.error("Error saving to sessionStorage:", storageError);
                    setError("Failed to save login session.");
                }
            } else {
                console.log("Login failed:", data.error);
                setError(data.error || 'Login failed.');
            }
        } catch(networkError) {
            console.error("Network or fetch error during login:", networkError);
            setError('Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
            <h2 className="text-3xl text-center text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Welcome Back
            </h2>
            <div className="space-y-4">
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email Address"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Password"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <a href="/reset-password" className="text-sm text-blue-600 hover:underline block text-right">Forgot Password?</a>
            <button type="submit" disabled={isLoading}
                className="w-full bg-gray-800 text-white dark:bg-blue-600 font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-60">
                {isLoading ? 'Signing In…' : 'Sign In'}
            </button>
        </form>
    );
}

// Customer Registration Form
function CustomerRegisterForm({ setError, setMessage, setLoginView }) {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    const [isLoading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = { first_name: formData.firstName, last_name: formData.lastName, email: formData.email, password: formData.password };
            const response = await fetch('http://localhost:3001/api/customers/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setMessage('Registration successful! Please sign in.');
                setLoginView(true);
            } else {
                setError(data.error || 'Registration failed.');
            }
        } catch {
            setError('Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-3xl text-center text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Create an Account
            </h2>
            <div className="flex gap-4">
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="First Name"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Last Name"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email Address"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Password"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Confirm Password"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-5G00 transition" />
            <button type="submit" disabled={isLoading}
                className="w-full bg-gray-800 text-white dark:bg-blue-600 font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-60">
                {isLoading ? 'Creating Account…' : 'Create Account'}
            </button>
        </form>
    );
}

// Employee Login Form
function EmployeeForm({ setError }) {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isLoading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:3001/api/employees/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (data.success && data.token) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                window.location.href = '/admin/dashboard';
            } else {
                setError(data.error || 'Login failed. Token not received.');
            }

        } catch {
            setError('Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
            <h2 className="text-3xl text-center text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                Employee Portal
            </h2>
            <div className="space-y-4">
                <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Username"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Password"
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <button type="submit" disabled={isLoading}
                className="w-full bg-gray-800 text-white dark:bg-blue-600 font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-60">
                {isLoading ? 'Signing In…' : 'Sign In'}
            </button>
        </form>
    );
}
