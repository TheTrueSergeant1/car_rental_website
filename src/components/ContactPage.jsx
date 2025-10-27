import React from "react";
import { motion } from "framer-motion";

// Helper for animations
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

/**
 * A reusable component for info blocks (e.g., Address, Phone)
 */
function InfoBlock({ icon, title, children }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <span className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400">
          {icon}
        </span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="text-gray-600 dark:text-gray-400">{children}</div>
      </div>
    </div>
  );
}

/**
 * The main component for the Contact page content.
 */
export default function ContactPage() {
  
  // Fake form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd handle form submission here.
    // For now, we'll just log it.
    console.log("Form submitted!");
    e.target.reset();
    // You could show a success message here
  };

  return (
    <div className="font-inter">
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          
          {/* Page Title */}
          <motion.h1
            className="text-4xl md:text-5xl text-center font-bold text-gray-900 dark:text-white mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6 }}
          >
            Get In Touch
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We'd love to hear from you. Whether you have a question about our
            fleet, pricing, or anything else, our team is ready to answer all
            your questions.
          </motion.p>

          {/* Main Content Grid: Form on left, Info on right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            
            {/* ================= Contact Form ================= */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <form 
                onSubmit={handleSubmit} 
                className="space-y-6 bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl shadow-lg"
              >
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>
                
                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    placeholder="Your inquiry..."
                  ></textarea>
                </div>
                
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    // Re-using the button style from your hero section
                    className="w-full bg-blue-600 text-white font-bold text-lg py-3 px-10 rounded-full shadow-lg hover:shadow-blue-500/50 hover:bg-blue-700 hover:scale-105 transition-all duration-300"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </motion.div>

            {/* ================= Contact Info ================= */}
            <motion.div
              className="space-y-8"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* Address */}
              <InfoBlock
                title="Our Location"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              >
                <p>123 Luxury Lane</p>
                <p>Conroe, TX 77301</p>
              </InfoBlock>

              {/* Phone */}
              <InfoBlock
                title="Call Us"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              >
                <p>(936) 555-1234</p>
              </InfoBlock>

              {/* Email */}
              <InfoBlock
                title="Email Us"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              >
                <p>contact@prestigerentals.fake</p>
              </InfoBlock>
              
              {/* Business Hours */}
              <InfoBlock
                title="Business Hours"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                <p>Mon - Fri: 9:00 AM - 6:00 PM</p>
                <p>Sat - Sun: 10:00 AM - 4:00 PM</p>
              </InfoBlock>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
