import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Main component for the car search page
export default function CustomerCarSearch() {
  const [cars, setCars] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ type: '', search: '' });
  const [customerId, setCustomerId] = useState(null);
  const [notification, setNotification] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);

  // (No changes needed for the logic)
  useEffect(() => {
    const userString = sessionStorage.getItem('customerUser');
    if (userString) {
      const user = JSON.parse(userString);
      setCustomerId(user.customer_id);
      checkRentalStatus(user.customer_id);
    } else {
      setCustomerId(0); // Guest users
    }
  }, []);

  const checkRentalStatus = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/customers/active-rental/${id}`);
      const data = await res.json();
      if (data.success && data.rental) {
        setNotification(`Reminder: Your ${data.rental.make} ${data.rental.model} is currently rented.`);
      }
    } catch (err) {
      console.error("Failed to check rental status:", err);
    }
  };

  const fetchCars = async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ ...filters, customerId });
    try {
      const response = await fetch(`http://localhost:3001/api/cars/available?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) setCars(data);
      else throw new Error(data.error || 'Invalid response from server.');
    } catch (err) {
      setError('Failed to fetch cars. The API server may be down.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId !== null) fetchCars();
  }, [customerId]);

  useEffect(() => {
    const fetchCarTypes = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/car-types');
        setCarTypes(await response.json());
      } catch (err) {
        console.error("Failed to fetch car types:", err);
      }
    };
    fetchCarTypes();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCars();
  };

  const handleFilterChange = (e) =>
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleViewDetails = (car) => setSelectedCar(car);
  const handleCloseModal = () => setSelectedCar(null);

  const toggleFavorite = async (carId, isFavorite) => {
    if (!customerId) {
      alert("Please log in to save favorites.");
      return;
    }
    const url = `http://localhost:3001/api/customers/${customerId}/favorites${
      isFavorite ? `/${carId}` : ''
    }`;
    const method = isFavorite ? 'DELETE' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: isFavorite ? null : JSON.stringify({ car_id: carId }),
    });
    fetchCars();
  };


  return (
    <div className="font-inter bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl text-center mb-4 text-gray-800 dark:text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Explore Our Fleet
          </h1>
          <p className="text-lg text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Find the perfect vehicle for your next journey. Unmatched quality and service, guaranteed.
          </p>
        </motion.div>

        {notification && (
          <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 p-4 rounded-md mb-8 shadow-sm">
            <p>{notification}</p>
          </div>
        )}

        {/* Filter and Search Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-12">
          <form onSubmit={handleSearch} className="grid md:grid-cols-3 gap-6 items-end">
            <input
              type="text" name="search" value={filters.search} onChange={handleFilterChange}
              placeholder="Search by Make or Model (e.g., Ford Mustang)"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <select
              name="type" value={filters.type} onChange={handleFilterChange}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">All Vehicle Types</option>
              {carTypes.map((type) => (
                <option key={type.car_type_id} value={type.car_type_id}>{type.type_name}</option>
              ))}
            </select>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-300">
              Find My Ride
            </button>
          </form>
        </div>

        {/* Car Grid Section */}
        {loading && <div className="text-center py-16 text-gray-500">Loading available cars...</div>}
        {error && <div className="text-center py-16 text-red-500">{error}</div>}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {cars.length > 0 ? (
              cars.map((car, i) => (
                <motion.div
                  key={car.car_id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden group flex flex-col"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  {/* Car Image with Overlays */}
                  <div className="relative">
                    <img
                      src={car.image_url} alt={`${car.make} ${car.model}`}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                      onClick={() => handleViewDetails(car)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" onClick={() => handleViewDetails(car)}/>
                    <div className="absolute top-3 right-3">
                      <button onClick={() => toggleFavorite(car.car_id, car.is_favorite)} className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className={car.is_favorite ? 'fill-red-500 stroke-red-600' : 'fill-none stroke-white'}>
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="text-2xl font-bold text-white shadow-lg">{car.make} {car.model}</h3>
                      <p className="text-sm text-gray-200">{car.year}</p>
                    </div>
                  </div>
                  {/* Car Details Section */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-center mb-4">
                      <StarRating rating={car.average_rating} />
                      <span className="text-xs text-gray-500">
                        {car.average_rating ? parseFloat(car.average_rating).toFixed(1) : 'No reviews'}
                      </span>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                        ${car.daily_rate}<span className="text-sm font-normal text-gray-500">/day</span>
                      </p>
                      <button onClick={() => handleViewDetails(car)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        View Details →
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-16">No available cars match your criteria.</p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedCar && (
          <CarDetailModal car={selectedCar} customerId={customerId} onClose={handleCloseModal} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Redesigned Car Detail Modal
const CarDetailModal = ({ car, customerId, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
  
    useEffect(() => {
      const fetchDetails = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await fetch(`http://localhost:3001/api/cars/${car.car_id}?customerId=${customerId}`);
          const data = await res.json();
          if (data.car) setDetails(data);
          else throw new Error(data.error || 'Invalid data.');
        } catch (err) {
          setError('Could not load car details.');
        } finally {
          setLoading(false);
        }
      };
      if (car && customerId !== null) fetchDetails();
    }, [car, customerId]);
  
    return (
      <motion.div
        className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: 'Playfair Display, serif' }}>
              {car.make} {car.model}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 text-3xl">&times;</button>
          </div>
          <div className="overflow-y-auto p-6">
            {loading ? <p>Loading details...</p> : error ? <p className="text-red-500">{error}</p> : details && (
              <>
                <img src={details.car.image_url} alt={`${details.car.make} ${details.car.model}`} className="w-full h-64 object-cover rounded-lg mb-6"/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6 text-gray-700 dark:text-gray-300">
                  <p><strong>Type:</strong> {details.car.type_name}</p>
                  <p><strong>Year:</strong> {details.car.year}</p>
                  <p><strong>Mileage:</strong> {details.car.mileage.toLocaleString()}</p>
                  <p><strong>Status:</strong> <span className="font-semibold text-green-600 dark:text-green-400">{details.car.status}</span></p>
                </div>
                <button className="w-full mt-4 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all">
                  Rent for ${details.car.daily_rate}/day
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };
  

// Star Rating Helper Component (no changes needed)
const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.round(rating);
  for (let i = 0; i < 5; i++)
    stars.push(
      <span key={i} className={i < fullStars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    );
  return <div className="flex">{stars}</div>;
};