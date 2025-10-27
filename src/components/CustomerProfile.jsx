import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SVG Icons ---
const TrashIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SortIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>;
const UserIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CreditCardIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
const HistoryIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>;
const HeartIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;

// --- Helper Function ---
// NEW: Moved this here to be used by PaymentMethods component
function detectCardType(number) {
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    return 'Card';
}

export default function CustomerProfile() {
    const [customerId, setCustomerId] = useState(null);
    const [token, setToken] = useState(null); // NEW: State to hold the auth token
    const [currentView, setCurrentView] = useState('profile');

    useEffect(() => {
        const userString = sessionStorage.getItem('customerUser');
        const tokenString = sessionStorage.getItem('customerToken'); // NEW: Get the token
        
        if (userString && tokenString) { // NEW: Check for both
            const user = JSON.parse(userString);
            setCustomerId(user.customer_id);
            setToken(tokenString); // NEW: Set the token
        } else {
            // NEW: If either is missing, log the user out
            sessionStorage.clear();
            window.location.href = '/'; 
        }
    }, []);

    const NavButton = ({ viewName, label, icon }) => {
        const isActive = currentView === viewName;
        return (
            <button
                onClick={() => setCurrentView(viewName)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 font-semibold rounded-lg transition-colors duration-200 ${
                    isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
                {icon}
                {label}
            </button>
        );
    };

    // UPDATED: Check for customerId AND token
    if (!customerId || !token) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200 min-h-screen font-inter">
            <div className="container mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-5xl md:text-6xl text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                        My Account
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                        Manage your profile, rentals, and payment details.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <aside className="lg:col-span-1">
                        <nav className="space-y-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg sticky top-8">
                            <NavButton viewName="profile" label="My Details" icon={<UserIcon />} />
                            <NavButton viewName="payment" label="Payment Methods" icon={<CreditCardIcon />} />
                            <NavButton viewName="history" label="Rental History" icon={<HistoryIcon />} />
                            <NavButton viewName="favorites" label="My Favorites" icon={<HeartIcon />} />
                        </nav>
                    </aside>
                    <main className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentView}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* UPDATED: Pass the token prop */}
                                {currentView === 'profile' && <ProfileDetails customerId={customerId} token={token} />}
                                {currentView === 'payment' && <PaymentMethods customerId={customerId} token={token} />}
                                {currentView === 'history' && <RentalHistory customerId={customerId} token={token} />}
                                {currentView === 'favorites' && <FavoriteCars customerId={customerId} token={token} />}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
}

// --- Reusable Form Input and Button Styles ---
const inputStyles = "w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:bg-gray-200 dark:disabled:bg-gray-700/50";
const primaryButtonStyles = "bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-60";
const secondaryButtonStyles = "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors";
const dangerButtonStyles = "w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors";

// --- Content Components ---

// UPDATED: Accept token prop
const ProfileDetails = ({ customerId, token }) => {
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [activeRental, setActiveRental] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [isDeleteProfileModalOpen, setDeleteProfileModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });

    const fetchData = useCallback(async () => {
        setMessage('');
        setErrors({});
        setLoading(true);
        try {
            // NEW: Create headers with the auth token
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const [profileRes, rentalRes] = await Promise.all([
                // UPDATED: Changed URL and added headers
                fetch(`http://localhost:3001/api/customers/profile`, { headers }),
                // UPDATED: Changed URL and added headers
                fetch(`http://localhost:3001/api/customers/active-rental`, { headers })
            ]);
            const profileData = await profileRes.json();
            const rentalData = await rentalRes.json();
            if (profileData.success) {
                setProfile(profileData.profile);
                setFormData(profileData.profile);
            }
            if (rentalData.success) setActiveRental(rentalData.rental);
        } catch (err) {
            console.error(err); // NEW: Log the error
            setErrors({ general: 'Failed to fetch profile data.' });
        }
        setLoading(false);
    }, [customerId, token]); // UPDATED: Add token to dependency array

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const validate = () => {
        const newErrors = {};
        if (formData.phone_number && !/^\d{3}-\d{3}-\d{4}$/.test(formData.phone_number)) {
            newErrors.phone_number = "Phone must be in xxx-xxx-xxxx format.";
        }
        if (formData.state && !/^[A-Z]{2}$/.test(formData.state)) {
            newErrors.state = "State must be 2 capital letters.";
        }
        if (formData.zip_code && !/^\d{5}$/.test(formData.zip_code)) {
            newErrors.zip_code = "ZIP must be 5 numbers.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'phone_number') {
            const digits = value.replace(/\D/g, '');
            const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
            if (match) {
                formattedValue = !match[2] ? match[1] : `${match[1]}-${match[2]}` + (match[3] ? `-${match[3]}` : '');
            }
        } else if (name === 'state') {
            formattedValue = value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
        } else if (name === 'zip_code') {
            formattedValue = value.replace(/\D/g, '').slice(0, 5);
        }

        setFormData(p => ({ ...p, [name]: formattedValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrors({});

        if (validate()) {
            // UPDATED: URL changed and token added to headers
            const res = await fetch(`http://localhost:3001/api/customers/profile`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Profile updated successfully!');
                setIsEditingProfile(false);
                fetchData();
            } else {
                setErrors({ general: data.error || 'Failed to update.' });
            }
        }
    };
    
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrors({});
        const passFormData = new FormData(e.target);
        const { currentPassword, newPassword, confirmPassword } = Object.fromEntries(passFormData.entries());
        if(newPassword !== confirmPassword) {
            setErrors({ password: "New passwords do not match." });
            return;
        }
        // UPDATED: URL changed and token added to headers
        const res = await fetch(`http://localhost:3001/api/customers/password`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({currentPassword, newPassword})
        });
        const data = await res.json();
        if (data.success) {
            setMessage('Password updated successfully!');
            setIsEditingPassword(false);
        } else {
            setErrors({ password: data.error || 'Failed to update password.' });
        }
    };

    const handleReturnCar = () => {
        if (!activeRental) return;
        const today = new Date();
        const dueDate = new Date(activeRental.due_date);
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        if (today < dueDate) {
            setModalContent({
                title: 'Early Return Confirmation',
                message: 'Returning the car before its due date will incur a $25.00 early return fee. Are you sure?',
            });
        } else {
            setModalContent({
                title: 'Confirm Car Return',
                message: 'Are you sure you want to return this car now?',
            });
        }
        setReturnModalOpen(true);
    };
    
    const confirmReturnCar = async () => {
        if (!activeRental) return;
        setReturnModalOpen(false);
        try {
            // UPDATED: Added headers with token
            const res = await fetch(`http://localhost:3001/api/rentals/return-by-customer/${activeRental.rental_id}`, { 
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                let successMessage = "Car returned successfully.";
                if (data.feeApplied > 0) {
                    successMessage += ` An early return fee of $${data.feeApplied.toFixed(2)} has been applied.`;
                }
                setMessage(successMessage);
                fetchData();
            } else {
                setErrors({ general: 'There was an error processing your return.' });
            }
        } catch (err) {
            setErrors({ general: 'Could not connect to the server to process the return.' });
        }
    };

    const handleDeleteProfile = async () => {
        // NOTE: This function requires a new route on your backend:
        // app.delete('/api/customers/profile', authenticateCustomer, async (req, res) => { ... });
        setDeleteProfileModalOpen(false);
        try {
            // UPDATED: Changed to a customer route and added token
            const res = await fetch(`http://localhost:3001/api/customers/profile`, { 
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            // FIXED: Removed artifact "_" before "if"
            if(data.success) {
                sessionStorage.clear();
                window.location.href = '/';
            } else {
                setErrors({ general: data.error || "Failed to delete profile." });
            }
        } catch(err) {
             setErrors({ general: "Could not connect to the server to delete profile." });
        }
    };

    if (loading) return <div>Loading profile...</div>;

    const labelStyles = "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300";

    return (
        <>
            <AnimatePresence>
                {isReturnModalOpen && <ConfirmationModal isOpen={isReturnModalOpen} onClose={() => setReturnModalOpen(false)} onConfirm={confirmReturnCar} title={modalContent.title} confirmButtonColor="blue"><p>{modalContent.message}</p></ConfirmationModal>}
                {isDeleteProfileModalOpen && <ConfirmationModal isOpen={isDeleteProfileModalOpen} onClose={() => setDeleteProfileModalOpen(false)} onConfirm={handleDeleteProfile} title="Delete Account" confirmButtonColor="red"><p>Are you sure you want to permanently delete your account? This action cannot be undone.</p></ConfirmationModal>}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Personal Information</h3>
                        {!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>}
                    </div>
                    {message && <p className="text-green-500 mb-4">{message}</p>}
                    {errors.general && <p className="text-red-500 mb-4">{errors.general}</p>}
                    <form onSubmit={handleProfileUpdate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className={labelStyles}>First Name</label><input name="first_name" value={formData?.first_name || ''} onChange={handleChange} disabled={!isEditingProfile} className={inputStyles} /></div>
                            <div><label className={labelStyles}>Last Name</label><input name="last_name" value={formData?.last_name || ''} onChange={handleChange} disabled={!isEditingProfile} className={inputStyles} /></div>
                            <div className="md:col-span-2"><label className={labelStyles}>Email</label><input type="email" name="email" value={formData?.email || ''} onChange={handleChange} disabled={!isEditingProfile} className={inputStyles} /></div>
                            <div className="md:col-span-2"><label className={labelStyles}>Phone Number</label><input name="phone_number" value={formData?.phone_number || ''} onChange={handleChange} placeholder="xxx-xxx-xxxx" disabled={!isEditingProfile} className={`${inputStyles} ${errors.phone_number ? 'border-red-500' : ''}`} />{errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}</div>
                            <div className="md:col-span-2"><label className={labelStyles}>Address</label><input name="address" value={formData?.address || ''} onChange={handleChange} disabled={!isEditingProfile} className={inputStyles} /></div>
                            <div><label className={labelStyles}>City</label><input name="city" value={formData?.city || ''} onChange={handleChange} disabled={!isEditingProfile} className={inputStyles} /></div>
                            <div><label className={labelStyles}>State</label><input name="state" value={formData?.state || ''} onChange={handleChange} placeholder="TX" disabled={!isEditingProfile} className={`${inputStyles} ${errors.state ? 'border-red-500' : ''}`} />{errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}</div>
                            <div><label className={labelStyles}>ZIP Code</label><input name="zip_code" value={formData?.zip_code || ''} onChange={handleChange} placeholder="77301" disabled={!isEditingProfile} className={`${inputStyles} ${errors.zip_code ? 'border-red-500' : ''}`} />{errors.zip_code && <p className="text-red-500 text-xs mt-1">{errors.zip_code}</p>}</div>
                        </div>
                        {isEditingProfile && (
                            <div className="flex justify-end space-x-4 mt-8">
                                <button type="button" onClick={() => { setIsEditingProfile(false); setFormData(profile); setErrors({}); }} className={secondaryButtonStyles}>Cancel</button>
                                <button type="submit" className={primaryButtonStyles}>Save Changes</button>
                            </div>
                        )}
                    </form>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Active Rental</h3>
                        {activeRental ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="font-semibold">{activeRental.make} {activeRental.model} ({activeRental.year})</p>
                                    {/* FIXED: Removed artifact "_" */}
                                    <p className="text-sm text-gray-500">Due: {new Date(activeRental.due_date).toLocaleDateString()}</p>
                                    <p className="text-xl font-bold mt-2">Cost so far: ${parseFloat(activeRental.estimated_cost).toFixed(2)}</p>
                                </div>
                                <button onClick={handleReturnCar} className="w-full bg-yellow-500 text-black font-bold py-2 rounded-lg hover:bg-yellow-600 transition-colors">Return Car Now</button>
                            </div>
                        ) : <p className="text-gray-500">No active rentals.</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Security</h3>
                        {isEditingPassword ? (
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <input name="currentPassword" type="password" placeholder="Current Password" required className={inputStyles} />
                                <input name="newPassword" type="password" placeholder="New Password" required className={inputStyles} />
                                <input name="confirmPassword" type="password" placeholder="Confirm New Password" required className={inputStyles} />
                                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                                    {/* FIXED: Removed artifact "_" */}
                                <div className="flex justify-end space-x-2 pt-2">
                                    <button type="button" onClick={() => { setIsEditingPassword(false); setErrors({}); }} className={secondaryButtonStyles}>Cancel</button>
                                    <button type="submit" className={primaryButtonStyles}>Save</button>
                                </div>
                            </form> 
                        ) : <button onClick={() => setIsEditingPassword(true)} className={`${primaryButtonStyles} w-full`}>Change Password</button>}
                         <button onClick={() => setDeleteProfileModalOpen(true)} className={`${dangerButtonStyles} mt-4`}>Delete Account</button>
                    </div>
                </div>
            </div>
        </>
    );
};

// UPDATED: Accept token prop
const PaymentMethods = ({ customerId, token }) => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        // UPDATED: URL changed and token added
        const res = await fetch(`http://localhost:3001/api/customers/payment-methods`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.success) setMethods(data.methods);
        setLoading(false);
    }, [customerId, token]); // UPDATED: Add token

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdd = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData.entries());

        // NEW: Create the exact object the secure backend expects
        // This is still insecure (handling full card number in JS),
        // but it matches your backend. Use Stripe.js for a real solution.
        const newCard = {
            cardHolderName: formProps.cardHolderName,
            expiryDate: formProps.expiryDate,
            maskedNumber: `************${formProps.cardNumber.slice(-4)}`,
            cardType: detectCardType(formProps.cardNumber)
        };

        // UPDATED: URL changed and token added
        await fetch(`http://localhost:3001/api/customers/payment-methods`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newCard)
        });
        setIsAdding(false);
        fetchData();
    };

    const handleDelete = async (methodId) => {
        if (window.confirm('Are you sure you want to remove this card?')) {
            // UPDATED: Added token
            await fetch(`http://localhost:3001/api/customers/payment-methods/${methodId}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        }
    };
    
    if (loading) return <div>Loading payment methods...</div>;
    
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Payment Methods</h3>
                {!isAdding && <button onClick={() => setIsAdding(true)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Add New Card</button>}
            </div>
            <AnimatePresence>
            {isAdding && (
                <motion.form 
                    onSubmit={handleAdd} 
                    className="p-6 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 mb-6 space-y-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="cardHolderName" placeholder="Card Holder Name" required className={`${inputStyles} md:col-span-2`} />
                        {/* UPDATED: This field is not stored in your DB */}
                        {/* <input name="address" placeholder="Billing Address" required className={`${inputStyles} md:col-span-2`}/> */}
                        <input name="cardNumber" placeholder="Card Number" required className={`${inputStyles} md:col-span-2`} />
                        <input name="expiryDate" placeholder="Expiry Date (MM/YYYY)" required className={inputStyles} />
                        {/* UPDATED: CVV is not stored in your DB */}
                        {/* <input name="cvv" placeholder="CVV" required className={inputStyles} /> */}
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className={secondaryButtonStyles}>Cancel</button>
                        <button type="submit" className={primaryButtonStyles}>Save Card</button>
                    </div>
                </motion.form>
            )}
            </AnimatePresence>
            <div className="space-y-4">
                {methods.length > 0 ? methods.map(method => (
                    <div key={method.payment_method_id} className="p-4 border rounded-lg flex justify-between items-center dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div>
                            <p className="font-semibold">{method.card_type} ending in {method.masked_number.slice(-4)}</p>
                            {/* UPDATED: Added null check for expiry_date */}
                            {method.expiry_date && <p className="text-sm text-gray-500">Expires {method.expiry_date}</p>}
                        </div>
                        <button onClick={() => handleDelete(method.payment_method_id)} className="text-red-500 hover:text-red-700 font-semibold text-sm">Remove</button>
                    </div>
                )) : <p className="text-gray-500">No saved payment methods.</p>}
            </div>
        </div>
    );
};

// UPDATED: Accept token prop
const RentalHistory = ({ customerId, token }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'pickup_date', direction: 'descending' });
    const [modal, setModal] = useState({ isOpen: false, rentalId: null });

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        // UPDATED: URL changed and token added
        const res = await fetch(`http://localhost:3001/api/customers/rental-history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setHistory(data.history);
        else setError("Could not fetch rental history.");
        setLoading(false);
    }, [customerId, token]); // UPDATED: Add token

    useEffect(() => { fetchHistory(); }, [fetchHistory]);
    
    const handleDelete = async (rentalId) => {
        setError(null);
        try {
            // UPDATED: Added token and removed body
            const res = await fetch(`http://localhost:3001/api/rentals/${rentalId}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
//                 body: JSON.stringify({ customerId }) // No longer needed, auth is in token
            });
            const data = await res.json();
            if (data.success) {
                fetchHistory();
            } else {
                setError(data.error || "Failed to delete rental history.");
            }
        } catch (err) {
            setError("A network error occurred. Please try again.");
        }
        setModal({ isOpen: false, rentalId: null });
    };

    const sortedHistory = useMemo(() => {
        let sortableItems = [...history];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [history, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const SortableHeader = ({ label, sortKey }) => (
      <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2 font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
          {label}
          {sortConfig.key === sortKey && <SortIcon className={sortConfig.direction === 'descending' ? 'rotate-180' : ''} />}
      </button>
    );

    if (loading) return <div>Loading rental history...</div>;

    return (
       <>
            <AnimatePresence>
               {modal.isOpen && <ConfirmationModal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, rentalId: null })} onConfirm={() => handleDelete(modal.rentalId)} title="Delete Rental Record" confirmButtonColor="red"><p>Are you sure you want to delete this rental record? This action cannot be undone.</p></ConfirmationModal>}
            </AnimatePresence>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg overflow-x-auto">
                <h3 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Rental History</h3>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {history.length > 0 ? (
                    <table className="min-w-full text-left">
                        <thead className="border-b-2 border-gray-200 dark:border-gray-600">
                            <tr>
                                <th className="py-3 pr-4"><SortableHeader label="Car" sortKey="make" /></th>
                                <th className="py-3 px-4"><SortableHeader label="Dates Rented" sortKey="pickup_date" /></th>
                                <th className="py-3 px-4 text-right"><SortableHeader label="Total Cost" sortKey="total_cost" /></th>
                                <th className="py-3 pl-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHistory.map(rental => (
                                <tr key={rental.rental_id} className="border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="py-4 pr-4 font-semibold">{rental.make} {rental.model} ({rental.year})</td>
                                    <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                                        {new Date(rental.pickup_date).toLocaleDateString()} - {new Date(rental.return_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-4 text-right font-mono">
                                        ${parseFloat(rental.total_cost).toFixed(2)}
                                    </td>
                                    <td className="py-4 pl-4 text-right">
                                        <button onClick={() => setModal({isOpen: true, rentalId: rental.rental_id})} title="Delete Record" className="text-red-500 hover:text-red-700 transition-colors">
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500">No past rentals found.</p>}
            </div>
       </>
    );
};

// UPDATED: Accept token prop
const FavoriteCars = ({ customerId, token }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, carId: null });

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        // UPDATED: URL changed and token added
        const res = await fetch(`http://localhost:3001/api/customers/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setFavorites(data.favorites);
        setLoading(false);
    }, [customerId, token]); // UPDATED: Add token

    useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

    const handleDelete = async (carId) => {
        // UPDATED: URL changed and token added
        const res = await fetch(`http://localhost:3001/api/customers/favorites/${carId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            fetchFavorites();
        } else {
            console.error("Failed to delete favorite.");
        }
        setModal({ isOpen: false, carId: null });
    };
    
    if (loading) return <div>Loading favorite cars...</div>;

    return (
       <>
         <AnimatePresence>
            {modal.isOpen && <ConfirmationModal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, carId: null })} onConfirm={() => handleDelete(modal.carId)} title="Remove Favorite" confirmButtonColor="red"><p>Are you sure you want to remove this car from your favorites?</p></ConfirmationModal>}
         </AnimatePresence>

         <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
             <h3 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>My Favorites</h3>
             <div className="space-y-4">
                 {favorites.length > 0 ? favorites.map(car => (
                    <div key={car.car_id} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                         <div>
                             <p className="font-bold">{car.make} {car.model} ({car.year})</p>
                             <p className="text-gray-700 dark:text-gray-300 text-sm">{car.type_name}</p>
                         </div>
                         <div className="flex items-center space-x-4">
                            <button onClick={() => setModal({ isOpen: true, carId: car.car_id })} className="text-red-500 hover:text-red-700 font-semibold text-sm">Remove</button>
                             <a href={`/customer/rent/${car.car_id}`} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Rent Now</a>
                         </div>
                     </div>
                 )) : <p className="text-gray-500">You have not favorited any cars yet.</p>}
             </div>
         </div>
       </>
   );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, confirmButtonColor = 'red' }) => {
    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        blue: 'bg-blue-600 hover:bg-blue-700'
    };

    return (
        <AnimatePresence>
        {isOpen && (
           <motion.div
                className="fixed inset-0 bg-black/70 flex justify-center items-center z-[100] p-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6"
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2>
                    <div className="text-gray-700 dark:text-gray-300 mb-6">{children}</div>
                    <div className="flex justify-end space-x-4">
                        <button onClick={onClose} className={secondaryButtonStyles}>Cancel</button>
                        <button onClick={onConfirm} className={`${colorClasses[confirmButtonColor]} text-white font-bold py-2 px-4 rounded-lg transition-colors`}>Confirm</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};