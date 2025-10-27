import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SVG Icons (No changes needed, but included for completeness) ---
const UsersIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const BriefcaseIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);
const CogIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /><path d="M12 2v2" /><path d="M12 22v-2" /><path d="m17 7 1.4-1.4" /><path d="m6.4 18.4 1.4-1.4" /><path d="M22 12h-2" /><path d="M4 12H2" /><path d="m18.4 6.4-1.4 1.4" /><path d="m7.4 17.4-1.4 1.4" /></svg>
);
const StarIcon = (props) => (
  <svg xmlns="http://www.w.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);
const SolidStarIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

export default function CustomerCarSearch() {
    // --- All your existing state and logic is perfect, no changes needed ---
    const [cars, setCars] = useState([]);
    const [carTypes, setCarTypes] = useState([]);
    const [filters, setFilters] = useState({ type: '', search: '' });
    const [sortOption, setSortOption] = useState('Featured');
    const [customerId, setCustomerId] = useState(null);
    const [status, setStatus] = useState('authenticating'); // 'authenticating', 'loading', 'success', 'error'
    const [notification, setNotification] = useState('');
    const [selectedCar, setSelectedCar] = useState(null);

    useEffect(() => {
        const userString = sessionStorage.getItem('customerUser');
        if (userString) {
            const user = JSON.parse(userString);
            setCustomerId(user.customer_id);
        } else {
            window.location.href = '/login';
        }
    }, []);

    useEffect(() => {
        if (!customerId) return;
        setStatus('loading');
        const debounceTimer = setTimeout(async () => {
            try {
                if (carTypes.length === 0) {
                    const typesRes = await fetch('http://localhost:3001/api/car-types');
                    setCarTypes(await typesRes.json());
                }
                const params = new URLSearchParams({ ...filters, customerId });
                const carsRes = await fetch(`http://localhost:3001/api/cars/available?${params.toString()}`);
                if (!carsRes.ok) throw new Error('Server request failed');
                const carsData = await carsRes.json();
                setCars(carsData);
                setStatus('success');
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setStatus('error');
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [customerId, filters]);

    const sortedCars = useMemo(() => {
        let sorted = [...cars];
        if (sortOption === 'Price: Low to High') sorted.sort((a, b) => a.daily_rate - b.daily_rate);
        if (sortOption === 'Price: High to Low') sorted.sort((a, b) => b.daily_rate - a.daily_rate);
        return sorted;
    }, [cars, sortOption]);

    const handleToggleFavorite = useCallback(async (carToToggle) => {
        const isCurrentlyFavorited = carToToggle.is_favorite;
        const newFavoriteStatus = isCurrentlyFavorited ? 0 : 1;
        setCars(currentCars => currentCars.map(car =>
            car.car_id === carToToggle.car_id ? { ...car, is_favorite: newFavoriteStatus } : car
        ));
        setNotification(isCurrentlyFavorited ? "Removed from favorites." : "Added to favorites!");
        const notificationTimer = setTimeout(() => setNotification(''), 3000);
        try {
            const url = `http://localhost:3001/api/customers/${customerId}/favorites/${isCurrentlyFavorited ? carToToggle.car_id : ''}`;
            const res = await fetch(url, {
                method: isCurrentlyFavorited ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: isCurrentlyFavorited ? null : JSON.stringify({ car_id: carToToggle.car_id })
            });
            if (!res.ok) throw new Error('API request failed');
        } catch (error) {
            clearTimeout(notificationTimer);
            setNotification('Error: Could not update favorites.');
            setTimeout(() => setNotification(''), 3000);
            setCars(currentCars => currentCars.map(car =>
                car.car_id === carToToggle.car_id ? { ...car, is_favorite: isCurrentlyFavorited } : car
            ));
        }
    }, [customerId]);

    if (status === 'authenticating') {
        return <div className="text-center p-12">Authenticating...</div>;
    }

    return (
        <div className="bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200 min-h-screen font-inter">
            <div className="container mx-auto px-6 py-12">
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            className="fixed top-5 right-5 z-50 bg-blue-600 text-white py-2 px-5 rounded-lg shadow-lg"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {notification}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Your Next Journey Awaits
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
                        Browse our exclusive collection of available vehicles and reserve your perfect ride today.
                    </p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8">
                    <FilterSidebar filters={filters} setFilters={setFilters} carTypes={carTypes} />
                    <MainContent status={status} cars={sortedCars} sortOption={sortOption} setSortOption={setSortOption} onToggleFavorite={handleToggleFavorite} onShowDetails={setSelectedCar} />
                </div>
            </div>
            <AnimatePresence>
                {selectedCar && <CarDetailModal car={selectedCar} onClose={() => setSelectedCar(null)} customerId={customerId} />}
            </AnimatePresence>
        </div>
    );
}

// --- Sub-Components ---

const FilterSidebar = ({ filters, setFilters, carTypes }) => (
    <aside className="w-full lg:w-1/4 xl:w-1/5">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg sticky top-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Filters</h2>
            <form className="space-y-6">
                <div>
                    <label htmlFor="search" className="block text-sm font-semibold mb-2">Search Make/Model</label>
                    <input id="search" name="search" value={filters.search} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))} placeholder="e.g. Ford Mustang" 
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-semibold mb-2">Vehicle Type</label>
                    <select id="type" name="type" value={filters.type} onChange={(e) => setFilters(p => ({ ...p, type: e.target.value }))} 
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                        <option value="">All Types</option>
                        {carTypes.map(t => <option key={t.car_type_id} value={t.car_type_id}>{t.type_name}</option>)}
                    </select>
                </div>
            </form>
        </div>
    </aside>
);

const MainContent = ({ status, cars, sortOption, setSortOption, onToggleFavorite, onShowDetails }) => (
    <main className="w-full lg:w-3/4 xl:w-4/5">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <p className="text-gray-600 dark:text-gray-400">{status === 'loading' ? 'Searching...' : `Showing ${cars.length} vehicles`}</p>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <label htmlFor="sort-by" className="text-sm font-semibold">Sort By:</label>
                <select id="sort-by" value={sortOption} onChange={(e) => setSortOption(e.target.value)} 
                    className="px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                    <option>Featured</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                </select>
            </div>
        </div>
        
        {status === 'loading' && <div className="text-center py-24 text-gray-500">Loading...</div>}
        {status === 'error' && <div className="text-center py-24 text-red-500">Could not load cars. Please try again later.</div>}
        {status === 'success' && (
            <div className="space-y-6">
                {cars.length > 0 ? (
                    cars.map((car, i) => <CarCard key={car.car_id} car={car} index={i} onToggleFavorite={onToggleFavorite} onShowDetails={onShowDetails} />)
                ) : (
                    <div className="text-center py-24 text-gray-500">
                        <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
                        <p>Try adjusting your search filters to find your perfect ride.</p>
                    </div>
                )}
            </div>
        )}
    </main>
);

const CarCard = React.memo(({ car, index, onToggleFavorite, onShowDetails }) => (
    <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row hover:shadow-2xl hover:scale-[1.01] transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
    >
        <img src={car.image_url || 'https://placehold.co/600x400/222/FFF?text=No+Image'} alt={`${car.make} ${car.model}`} className="w-full md:w-2/5 h-56 md:h-auto object-cover" />
        <div className="p-6 flex-grow flex flex-col">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{car.make} {car.model}</h3>
            <p className="text-sm text-gray-500 mb-4">{car.year} • {car.type_name}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-2"><CogIcon /> Automatic</span>
                <span className="flex items-center gap-2"><UsersIcon /> 5 People</span>
                <span className="flex items-center gap-2"><BriefcaseIcon /> 4 Bags</span>
            </div>
            <div className="flex-grow"></div>
            <button onClick={() => onShowDetails(car)} className="text-sm font-semibold text-blue-600 hover:underline mt-4 self-start">
                Features & Price Details →
            </button>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t md:border-l border-gray-200 dark:border-gray-700 text-right flex flex-col justify-between items-end min-w-[200px]">
            <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">${parseFloat(car.daily_rate).toFixed(2)}</p>
                <p className="text-sm text-gray-500">per day</p>
            </div>
            <div className="flex items-center gap-2 mt-4">
                <button onClick={() => onToggleFavorite(car)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" aria-label={car.is_favorite ? "Remove from favorites" : "Add to favorites"}>
                    <StarIcon className={`transition-all duration-300 ${car.is_favorite ? 'fill-yellow-400 stroke-yellow-500' : 'fill-none stroke-gray-400 hover:stroke-yellow-500'}`} />
                </button>
                <a href={`/customer/rent/${car.car_id}`} className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-bold hover:bg-blue-700 hover:scale-105 transition-transform">Select</a>
            </div>
        </div>
    </motion.div>
));

const ReviewForm = ({ carId, customerId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [review_text, setReviewText] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (review_text.length < 10) {
            setError('Review must be at least 10 characters.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            const res = await fetch('http://localhost:3001/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ car_id: carId, customer_id: customerId, rating, review_text })
            });
            const data = await res.json();
            if (data.success) {
                onReviewSubmitted(); // This will re-fetch the reviews in the modal
                setReviewText('');
                setRating(5);
            } else {
                setError(data.error || 'Failed to submit review.');
            }
        } catch (err) {
            setError('A network error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Leave Your Review</h4>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                <select 
                    id="rating" 
                    value={rating} 
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                </select>
            </div>
            <div>
                <label htmlFor="review_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Review</label>
                <textarea 
                    id="review_text" 
                    rows="4" 
                    value={review_text}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
            </div>
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="inline-block bg-blue-600 text-white py-2 px-5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
        </form>
    );
};

const ReviewList = ({ reviews, customerId, onReviewDeleted }) => {
    
    const handleDelete = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            const res = await fetch(`http://localhost:3001/api/reviews/${reviewId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                onReviewDeleted(); // Re-fetches reviews
            } else {
                alert('Failed to delete review.');
            }
        } catch (err) {
            alert('A network error occurred.');
        }
    };

    if (reviews.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400 italic">No reviews yet for this vehicle.</p>;
    }

    return (
        <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
            {reviews.map(review => (
                <div key={review.review_id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg relative">
                    <div className="flex items-center mb-1">
                        {[...Array(review.rating)].map((_, i) => <SolidStarIcon key={i} className="text-yellow-400" />)}
                        <span className="ml-auto text-sm font-semibold text-gray-700 dark:text-gray-200">{review.first_name}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{review.review_text}</p>
                    {review.isOwner && (
                        <button 
                            onClick={() => handleDelete(review.review_id)}
                            className="text-red-500 text-xs hover:underline mt-2"
                        >
                            Delete My Review
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

const CarDetailModal = ({ car, onClose, customerId }) => {
    const [details, setDetails] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [canReview, setCanReview] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCarData = useCallback(async () => {
        if (!customerId || !car.car_id) return;
        try {
            // Fetch details and review eligibility in parallel
            const [detailsRes, canReviewRes] = await Promise.all([
                fetch(`http://localhost:3001/api/cars/${car.car_id}?customerId=${customerId}`),
                fetch(`http://localhost:3001/api/customers/${customerId}/can-review/${car.car_id}`)
            ]);

            const detailsData = await detailsRes.json();
            if (detailsData.car) setDetails(detailsData.car);
            if (detailsData.reviews) setReviews(detailsData.reviews);

            const canReviewData = await canReviewRes.json();
            if (canReviewData.success) {
                setCanReview(canReviewData.canReview);
            }

        } catch (error) {
            console.error("Failed to fetch car data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [car.car_id, customerId]);

    useEffect(() => {
        setIsLoading(true);
        fetchCarData();
    }, [fetchCarData]);

    return (
        <motion.div
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {car.make} {car.model}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 text-3xl">&times;</button>
                </div>
                <div className="overflow-y-auto p-6">
                    <img src={car.image_url || 'https://placehold.co/600x400/222/FFF?text=No+Image'} alt={`${car.make} ${car.model}`} className="w-full h-72 object-cover rounded-lg mb-6" />
                    
                    {isLoading ? (
                        <p className="text-center text-gray-500">Loading details...</p>
                    ) : details ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                                    <p><strong>Type:</strong> {details.type_name}</p>
                                    <p><strong>Year:</strong> {details.year}</p>
                                    <p><strong>Mileage:</strong> {details.mileage.toLocaleString()} miles</p>
                                    <p><strong>Status:</strong> <span className="font-semibold text-green-500">{details.status}</span></p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Features</h3>
                                {details.features?.length > 0 ? (
                                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                        {details.features.map((f, i) => <li key={i} className="bg-gray-100 dark:bg-gray-700 py-2 px-3 rounded-md">{f}</li>)}
                                    </ul>
                                ) : <p className="text-gray-500">No specific features listed.</p>}
                            </div>

                            {/* --- NEW REVIEWS SECTION --- */}
                            <div>
                                <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Customer Reviews</h3>
                                <ReviewList 
                                    reviews={reviews} 
                                    customerId={customerId} 
                                    onReviewDeleted={fetchCarData} // Pass the refresh function
                                />
                                
                                {canReview && (
                                    <ReviewForm 
                                        carId={car.car_id} 
                                        customerId={customerId} 
                                        onReviewSubmitted={fetchCarData} // Pass the refresh function
                                    />
                                )}
                            </div>
                            {/* --- END NEW REVIEWS SECTION --- */}

                        </div>
                    ) : <p className="text-center text-red-500">Could not load car details.</p>}
                </div>
                <div className="p-6 mt-auto border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">${parseFloat(car.daily_rate).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">per day</p>
                    </div>
                    <a href={`/customer/rent/${car.car_id}`} className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg font-bold hover:bg-blue-700 hover:scale-105 transition-transform">
                        Rent This Car
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
};
