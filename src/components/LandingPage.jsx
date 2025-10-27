import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Helper for animations
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carsRes, testRes] = await Promise.all([
          fetch("http://localhost:3001/api/public/featured-cars"),
          fetch("http://localhost:3001/api/public/testimonials"),
        ]);
        const carsData = await carsRes.json();
        const testData = await testRes.json();
        if (carsData.success) setFeaturedCars(carsData.cars);
        if (testData.success) setTestimonials(testData.testimonials);
      } catch (err) {
        console.error("Failed to fetch landing page data:", err);
      }
    };
    fetchData();
  }, []);

  return (

    <div className="font-inter">
      {/* ================= HERO ================= */}
      <section className="relative flex flex-col items-center justify-center h-[90vh] text-center overflow-hidden">
        {/* === THIS IS THE CORRECTED LINE === */}
        <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-[url('/splash.jpg')]"
        />
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          className="relative z-10 px-6"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 
            className="text-5xl md:text-7xl text-white drop-shadow-2xl"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            The Ultimate Driving Experience
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mt-6 max-w-2xl mx-auto">
            Discover our curated collection of luxury and exotic vehicles. Your journey begins with Prestige.
          </p>
          <a
            href="/guestcarsearch"
            className="mt-10 inline-block bg-blue-600 text-white font-bold text-lg py-4 px-12 rounded-full shadow-lg hover:shadow-blue-500/50 hover:bg-blue-700 hover:scale-105 transition-all duration-300"
          >
            Explore the Fleet
          </a>
        </motion.div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section id="why-us" className="py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 text-center">
              <h2 className="text-4xl mb-4 font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Why Prestige Rentals?</h2>
              <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-400 mb-16">We provide more than just a car; we deliver an unparalleled experience from start to finish.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="p-6">
                      <h3 className="text-2xl font-semibold mb-3">Exquisite Fleet</h3>
                      <p className="text-gray-600 dark:text-gray-400">Hand-picked selection of the world's most sought-after luxury and performance vehicles.</p>
                  </div>
                   <div className="p-6">
                      <h3 className="text-2xl font-semibold mb-3">Seamless Booking</h3>
                      <p className="text-gray-600 dark:text-gray-400">A simple, elegant, and secure online reservation process that takes only minutes.</p>
                  </div>
                   <div className="p-6">
                      <h3 className="text-2xl font-semibold mb-3">First-Class Service</h3>
                      <p className="text-gray-600 dark:text-gray-400">Our dedicated concierge team is available 24/7 to cater to your every need.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* ================= FEATURED CARS ================= */}
      <section id="featured" className="py-24 container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Playfair Display, serif' }}>Our Featured Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuredCars.map((car, i) => (
            <motion.div
              key={car.car_id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <div className="relative">
                <img
                  src={car.image_url}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="text-2xl font-bold text-white">{car.make} {car.model}</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center">
                    <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                        ${car.daily_rate}<span className="text-sm font-normal text-gray-500">/day</span>
                    </p>
                    <a href="/guestcarsearch" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        Rent Now →
                    </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section id="testimonials" className="bg-gray-50 dark:bg-black py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ fontFamily: 'Playfair Display, serif' }}>Words From Our Clients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {testimonials.slice(0, 2).map((t, i) => (
              <motion.div
                key={i}
                className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
              >
                <p className="text-gray-600 dark:text-gray-300 italic mb-6">
                  "{t.review_text}"
                </p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  — {t.first_name}
                </p>
                <p className="text-sm text-gray-500">{t.make} {t.model}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
