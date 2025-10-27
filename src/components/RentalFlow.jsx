import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- HELPER FUNCTION ---
// Copied from CustomerProfile.jsx to be used in PaymentStep
function detectCardType(number) {
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    return 'Card';
}

/**
 * Manages the entire multi-step car rental process, from date selection to final receipt.
 * @param {{ carId: string }} props
 */
export default function RentalFlow({ carId }) {
    // Overall flow state
    const [isComplete, setComplete] = useState(false);
    const [step, setStep] = useState(1);
    
    // Data state
    const [car, setCar] = useState(null);
    const [customerId, setCustomerId] = useState(null);
    const [token, setToken] = useState(null); // <-- FIX: Added token state
    const [rentalDetails, setRentalDetails] = useState({ pickupDate: '', dueDate: '' });
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [totalCost, setTotalCost] = useState(0);
    const [receiptData, setReceiptData] = useState(null);

    // --- FIX: Split useEffect for session and data fetching ---

    // 1. Get customer session and auth token first
    useEffect(() => {
        const userString = sessionStorage.getItem('customerUser');
        const tokenString = sessionStorage.getItem('customerToken'); // Get token

        if (userString && tokenString) { // Check for both
            setCustomerId(JSON.parse(userString).customer_id);
            setToken(tokenString); // Set token
        } else {
            // If either is missing, user is not logged in
            sessionStorage.clear();
            window.location.href = '/'; // Redirect to login
        }
    }, []); // Runs once on mount

    // 2. Fetch car details *after* we have the token
    useEffect(() => {
        if (!carId || !token) return; // Don't run until we have session data

        const fetchCarDetails = async () => {
            try {
                // Add Authorization header
                const res = await fetch(`http://localhost:3001/api/cars/${carId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.car) setCar(data.car);
            } catch (error) {
                console.error("Failed to fetch car details:", error);
            }
        };

        fetchCarDetails();
    }, [carId, token]); // Runs when carId and token are ready

    // Recalculates the total cost whenever dates or addons change
    const calculateCost = (pickup, due, addons) => {
        if (!pickup || !due || !car) {
            setTotalCost(0);
            return;
        }

        const pickupDate = new Date(pickup);
        const dueDate = new Date(due);
        
        if (dueDate <= pickupDate) {
            setTotalCost(0);
            return;
        }

        const diffTime = Math.abs(dueDate - pickupDate);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        const carCost = diffDays * car.daily_rate;
        const addonsCost = addons.reduce((sum, addon) => sum + parseFloat(addon.price), 0);
        
        setTotalCost(carCost + addonsCost);
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newDetails = { ...rentalDetails, [name]: value };
        setRentalDetails(newDetails);
        calculateCost(newDetails.pickupDate, newDetails.dueDate, selectedAddons);
    };
    
    const handleAddonsUpdate = (newAddons) => {
        setSelectedAddons(newAddons);
        calculateCost(rentalDetails.pickupDate, newDetails.dueDate, newAddons);
    };

    // Final callback when payment is successful
    const handleRentalSuccess = (finalReceiptData) => {
        setReceiptData(finalReceiptData);
        setComplete(true);
    };

    // --- FIX: Update loading check ---
    if (!car || !customerId || !token) {
        return <p className="text-center p-8">Loading...</p>;
    }
    
    if (isComplete) {
        return <Receipt receiptData={receiptData} />;
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return <CarDetailsStep car={car} rentalDetails={rentalDetails} totalCost={totalCost} onDateChange={handleDateChange} onProceed={() => totalCost > 0 ? setStep(2) : alert("Please select a valid date range.")} />;
            case 2:
                return <AgreementStep onAgree={() => setStep(3)} onDecline={() => setStep(1)} />;
            case 3:
                return <AddonsStep onProceed={() => setStep(4)} onBack={() => setStep(2)} onAddonsUpdate={handleAddonsUpdate} initialAddons={selectedAddons} />;
            case 4:
                // --- FIX: Pass token to PaymentStep ---
                return <PaymentStep car={car} customerId={customerId} token={token} rentalDetails={rentalDetails} totalCost={totalCost} selectedAddons={selectedAddons} onBack={() => setStep(3)} onSuccess={handleRentalSuccess} />;
            default:
                return <p>An unexpected error occurred.</p>;
        }
    };
    
    return <div>{renderStep()}</div>;
}

/**
 * Step 1: Displays car details and date selection form.
 */
const CarDetailsStep = ({ car, rentalDetails, totalCost, onDateChange, onProceed }) => {
    const today = new Date().toISOString().split('T')[0];
    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-4">{car.make} {car.model}</h1>
                <img src={car.image_url || 'https://placehold.co/600x400/222/FFF?text=No+Image'} alt={`${car.make} ${car.model}`} className="w-full aspect-video object-contain rounded-lg mb-4 bg-gray-200 dark:bg-gray-700" />
                <p><strong>Type:</strong> {car.type_name}</p>
                <p><strong>Year:</strong> {car.year}</p>
                <p><strong>Mileage:</strong> {car.mileage.toLocaleString()}</p>
                <p className="text-2xl font-bold text-green-500 mt-4">${car.daily_rate}/day</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Select Rental Dates</h2>
                <form onSubmit={(e) => { e.preventDefault(); onProceed(); }} className="space-y-4">
                    <div>
                        <label className="block font-medium mb-1">Pickup Date</label>
                        <input type="date" name="pickupDate" value={rentalDetails.pickupDate} onChange={onDateChange} required min={today} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Return Date</label>
                        <input type="date" name="dueDate" value={rentalDetails.dueDate} onChange={onDateChange} required min={rentalDetails.pickupDate || today} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div className="text-right pt-4 border-t dark:border-gray-600">
                        <p className="text-lg font-bold">Estimated Total: <span className="text-blue-600 dark:text-blue-400">${totalCost.toFixed(2)}</span></p>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Proceed to Agreement
                    </button>
                </form>
            </div>
        </div>
    );
};

/**
 * Step 2: Displays the rental agreement for user acceptance.
 */
const AgreementStep = ({ onAgree, onDecline }) => {
    const [agreementText, setAgreementText] = useState('Loading agreement...');
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        // Dynamically import the markdown file content
        import('../components/RentalAgreement.md?raw').then(module => {
            setAgreementText(module.default);
        });
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Rental Service Agreement</h2>
            <div className="prose dark:prose-invert max-w-none h-96 overflow-y-auto border dark:border-gray-600 rounded-lg p-4 mb-4" dangerouslySetInnerHTML={{ __html: agreementText.replace(/\n/g, '<br />') }} />
            <div className="flex items-center mb-4">
                <input type="checkbox" id="agree" checked={agreed} onChange={() => setAgreed(!agreed)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                <label htmlFor="agree" className="ml-2">I have read and agree to the terms and conditions.</label>
            </div>
            <div className="flex justify-end space-x-4">
                <button onClick={onDecline} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Back</button>
                <button onClick={onAgree} disabled={!agreed} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Agree & Proceed
                </button>
            </div>
        </div>
    );
};

/**
 * Step 3: Allows the user to select optional add-ons.
 */
const AddonsStep = ({ onProceed, onBack, onAddonsUpdate, initialAddons }) => {
    const [availableAddons, setAvailableAddons] = useState([]);
    const [selected, setSelected] = useState(initialAddons);

    useEffect(() => {
        fetch('http://localhost:3001/api/addons')
            .then(res => res.json())
            .then(data => { if (data.success) setAvailableAddons(data.addons) });
    }, []);

    const handleToggle = (addon) => {
        const isSelected = selected.some(a => a.addon_id === addon.addon_id);
        const newSelected = isSelected ? selected.filter(a => a.addon_id !== addon.addon_id) : [...selected, addon];
        setSelected(newSelected);
        onAddonsUpdate(newSelected); // Notify parent of the change
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Optional Services & Add-Ons</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Enhance your rental experience with our available extras.</p>
            <div className="space-y-4">
                {availableAddons.map(addon => (
                    <div key={addon.addon_id} className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${selected.some(a => a.addon_id === addon.addon_id) ? 'border-blue-500 ring-2 ring-blue-500' : 'dark:border-gray-600 hover:border-blue-400'}`} onClick={() => handleToggle(addon)}>
                        <div>
                            <h4 className="font-bold">{addon.name}</h4>
                            <p className="text-sm text-gray-500">{addon.description}</p>
                        </div>
                        <div className="text-right flex items-center space-x-4">
                            <p className="font-bold text-lg">${parseFloat(addon.price).toFixed(2)}</p>
                            <input type="checkbox" readOnly checked={selected.some(a => a.addon_id === addon.addon_id)} className="h-5 w-5 text-blue-600 pointer-events-none" />
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex justify-end space-x-4 mt-8">
                <button onClick={onBack} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Back</button>
                <button onClick={onProceed} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Proceed to Payment</button>
            </div>
        </div>
    );
};

/**
 * Step 4: Handles final payment confirmation and submission.
 */
// --- FIX: Accept `token` prop ---
const PaymentStep = ({ car, customerId, token, rentalDetails, totalCost, selectedAddons, onBack, onSuccess }) => {
    const [savedMethods, setSavedMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isProcessing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [newCardDetails, setNewCardDetails] = useState({ cardHolderName: '', cardNumber: '', expiryDate: '', cvv: '', saveCard: true });

    useEffect(() => {
        const fetchMethods = async () => {
            // --- FIX: Use correct route and add auth header ---
            const res = await fetch(`http://localhost:3001/api/customers/payment-methods`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.methods.length > 0) {
                setSavedMethods(data.methods);
                setSelectedMethod(data.methods[0].payment_method_id);
            } else {
                setIsAddingNew(true);
            }
        };
        // Don't fetch until token is available
        if (token) {
            fetchMethods();
        }
    }, [customerId, token]); // <-- FIX: Add token to dependency array
    
    const handleRentalSubmit = async () => {
        setError('');
        setProcessing(true);

        if (isAddingNew && newCardDetails.saveCard) {
            try {
                // --- FIX: Create secure payload, use correct route, add auth header ---
                const newCardPayload = {
                    cardHolderName: newCardDetails.cardHolderName,
                    expiryDate: newCardDetails.expiryDate,
                    maskedNumber: `************${newCardDetails.cardNumber.slice(-4)}`,
                    cardType: detectCardType(newCardDetails.cardNumber)
                };
                
                const saveCardRes = await fetch(`http://localhost:3001/api/customers/payment-methods`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Add token
                    },
                    body: JSON.stringify(newCardPayload) // Send secure payload
                });
                if (!saveCardRes.ok) throw new Error("Could not save payment method.");
            } catch (err) {
                setError("Failed to save your new card. Please check the details.");
                setProcessing(false);
                return;
            }
        }

        const rentalPayload = {
            // customer_id is no longer needed in body, it comes from the token
            car_id: car.car_id,
            pickup_date: rentalDetails.pickupDate,
            due_date: rentalDetails.dueDate,
            addon_ids: selectedAddons.map(a => a.addon_id)
        };

        try {
            // --- FIX: Add auth header ---
            const rentalRes = await fetch('http://localhost:3001/api/rentals/create', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Add token
                }, 
                body: JSON.stringify(rentalPayload) 
            });
            const rentalData = await rentalRes.json();
            if (rentalData.success) {
                onSuccess({ rentalId: rentalData.rentalId, car, rentalDetails, totalCost, selectedAddons });
            } else {
                throw new Error(rentalData.error || "An unknown error occurred during rental creation.");
            }
        } catch (err) {
            setError(err.message);
            setProcessing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Confirm Payment</h2>
            <div className="mb-6 border-b pb-4 dark:border-gray-600">
                <p><strong>Car:</strong> {car.make} {car.model}</p>
                {selectedAddons.length > 0 && <div><strong>Add-Ons:</strong> {selectedAddons.map(a => a.name).join(', ')}</div>}
                <p className="text-2xl font-bold mt-2"><strong>Final Total:</strong> <span className="text-blue-600 dark:text-blue-400">${totalCost.toFixed(2)}</span></p>
            </div>

            <h3 className="text-xl font-bold mb-4">Select Payment Method</h3>
            <div className="space-y-3 mb-6">
                {savedMethods.map(method => (
                    <div key={method.payment_method_id} className={`p-4 border rounded-lg cursor-pointer ${selectedMethod === method.payment_method_id ? 'border-blue-500 ring-2 ring-blue-500' : 'dark:border-gray-600'}`} onClick={() => { setSelectedMethod(method.payment_method_id); setIsAddingNew(false); }}>
                        <p className="font-semibold">{method.card_type} ending in {method.masked_number.slice(-4)}</p>
                        <p className="text-sm text-gray-500">{method.card_holder_name}</p>
                    </div>
                ))}
                 <div className={`p-4 border rounded-lg cursor-pointer ${isAddingNew ? 'border-blue-500 ring-2 ring-blue-500' : 'dark:border-gray-600'}`} onClick={() => { setSelectedMethod(''); setIsAddingNew(true); }}>
                    <p className="font-semibold">Add a New Card</p>
                </div>
            </div>

            {isAddingNew && <NewCardForm cardDetails={newCardDetails} setCardDetails={setNewCardDetails} />}
            {error && <p className="text-red-500 text-center my-4">{error}</p>}

            <div className="flex justify-end space-x-4 mt-8">
                <button onClick={onBack} disabled={isProcessing} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg disabled:opacity-50">Back</button>
                <button onClick={handleRentalSubmit} disabled={(!selectedMethod && !isAddingNew) || isProcessing} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isProcessing ? 'Processing...' : `Confirm & Pay $${totalCost.toFixed(2)}`}
                </button>
            </div>
        </div>
    );
};

/**
 * A controlled form for entering new credit card details.
 */
const NewCardForm = ({ cardDetails, setCardDetails }) => {
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCardDetails(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    return (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 space-y-4">
            <input name="cardHolderName" placeholder="Card Holder Name" value={cardDetails.cardHolderName} onChange={handleChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
            <input name="cardNumber" placeholder="Card Number" value={cardDetails.cardNumber} onChange={handleChange} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
            <div className="grid grid-cols-2 gap-4">
                <input name="expiryDate" placeholder="Expiry (MM/YYYY)" value={cardDetails.expiryDate} onChange={handleChange} required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                <input name="cvv" placeholder="CVV" value={cardDetails.cvv} onChange={handleChange} required className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="saveCard" name="saveCard" checked={cardDetails.saveCard} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                <label htmlFor="saveCard" className="ml-2 block text-sm">Save this card for future rentals.</label>
            </div>
        </div>
    );
};

/**
 * Displays the final rental receipt and allows saving as a PDF.
 */
const Receipt = ({ receiptData }) => {
    const { rentalId, car, rentalDetails, totalCost, selectedAddons } = receiptData;
    const receiptRef = useRef();

    const handleSaveAsPdf = () => {
        const input = receiptRef.current;
        html2canvas(input, { scale: 2 }) // Higher scale for better PDF quality
            .then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgWidth / imgHeight;
                const pdfHeight = (pdfWidth - 20) / ratio; // Subtract margins
                pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
                pdf.save(`PrestigeRentals-Receipt-${rentalId}.pdf`);
            });
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 flex flex-col items-center">
            <div ref={receiptRef} className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-2xl w-full max-w-4xl text-black dark:text-white">
                <div className="border-b dark:border-gray-600 pb-6 mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Rental Confirmed!</h1>
                        <p className="text-gray-600 dark:text-gray-400">Thank you for choosing Prestige Rentals.</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-sm">Receipt #{rentalId}</p>
                        <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 border-b dark:border-gray-600 pb-2">Your Rental Details</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <p className="font-bold">{car.make} {car.model} ({car.year})</p>
                            <p className="text-gray-600 dark:text-gray-400">{car.type_name}</p>
                        </div>
                        <div className="md:text-right">
                            <p><strong>Pickup:</strong> {new Date(rentalDetails.pickupDate).toLocaleDateString()}</p>
                            <p><strong>Return:</strong> {new Date(rentalDetails.dueDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-2">Invoice Summary</h3>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-gray-600">
                                <th className="py-2">Item</th>
                                <th className="py-2 text-right">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-2">Car Rental ({car.make} {car.model})</td>
                                <td className="py-2 text-right">${(totalCost - selectedAddons.reduce((sum, a) => sum + parseFloat(a.price), 0)).toFixed(2)}</td>
                            </tr>
                            {selectedAddons.map(addon => (
                                <tr key={addon.addon_id}>
                                    <td className="py-2 pl-4 text-gray-600 dark:text-gray-400">{addon.name}</td>
                                    <td className="py-2 text-right">${parseFloat(addon.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 dark:border-gray-500 font-bold">
                                <td className="py-4 text-xl">Total Amount Charged</td>
                                <td className="py-4 text-xl text-right">${totalCost.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button onClick={handleSaveAsPdf} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                    Save as PDF
                </button>
                <a href="/customer/dashboard" className="text-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                    Back to Dashboard
                </a>
            </div>
        </div>
    );
};