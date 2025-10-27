import React from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

function TermsSection({ title, children, delay = 0 }) {
  return (
    <motion.div
      className="mb-8"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.6, delay }}
    >
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
        {title}
      </h2>
      <div className="space-y-4 text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </motion.div>
  );
}

export default function TermsPage() {
  return (
    <div className="font-inter">
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">

          <motion.h1
            className="text-4xl md:text-5xl text-center font-bold text-gray-900 dark:text-white mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6 }}
          >
            Terms of Service
          </motion.h1>

          <motion.p
            className="text-center text-gray-500 dark:text-gray-400 mb-16"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Last Updated: October 27, 2025
          </motion.p>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <TermsSection title="1. Introduction" delay={0.3}>
              <p>
                Welcome to Prestige Rentals ("Company", "we", "our", "us")! These Terms of Service ("Terms") govern your use of our website located at [Your Website URL] (the "Service") and our vehicle rental services.
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
              </p>
            </TermsSection>

            <TermsSection title="2. Use of Our Services" delay={0.4}>
              <p>
                You must be at least 25 years of age and hold a valid driver's license to rent a vehicle from us. You agree to provide accurate, current, and complete information during the reservation process and to update such information to keep it accurate, current, and complete.
              </p>
              <p>
                You are responsible for all activity that occurs under your account or reservation, and you agree to maintain the security and secrecy of your account username and password.
              </p>
            </TermsSection>

            <TermsSection title="3. Booking and Payment" delay={0.5}>
              <p>
                When you make a reservation, you agree to the pricing and payment terms presented to you. All payments are due at the time of booking unless otherwise specified.
              </p>
              <p>
                A security deposit is required for all rentals. This deposit is fully refundable upon the safe and timely return of the vehicle in the same condition it was rented, subject to inspection.
              </p>
              <p>
                Cancellation policies are detailed at the time of booking. Failure to cancel within the specified time frame may result in forfeiture of your deposit or a cancellation fee.
              </p>
            </TermsSection>
            
            <TermsSection title="4. Renter Obligations" delay={0.6}>
              <p>
                The renter agrees to:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Operate the vehicle in a safe and lawful manner.</li>
                <li>Use the vehicle only for its intended purpose and not for any illegal activities, racing, or off-roading.</li>
                <li>Ensure the vehicle is returned at the agreed-upon time and location.</li>
                <li>Be responsible for all fuel costs, tolls, parking fees, and traffic violations incurred during the rental period.</li>
                <li>Not smoke or allow pets in the vehicle without prior authorization.</li>
              </ul>
            </TermsSection>

            <TermsSection title="5. Limitation of Liability" delay={0.7}>
              <p>
                To the maximum extent permitted by applicable law, Prestige Rentals shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </TermsSection>
            
            <TermsSection title="6. Governing Law" delay={0.8}>
              <p>
                These Terms shall be governed and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions.
              </p>
            </TermsSection>
            
            <TermsSection title="7. Contact Information" delay={0.9}>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p>
                Email: contact@prestigerentals.fake <br />
                Phone: (936) 555-1234
              </p>
            </TermsSection>
          </div>
        </div>
      </section>
    </div>
  );
}
