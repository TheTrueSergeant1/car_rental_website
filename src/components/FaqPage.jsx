import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqData = [
  {
    question: "What do I need to rent a car?",
    answer:
      "To rent a car from Prestige Rentals, you must be at least 25 years old, possess a valid driver's license, and provide a major credit card in your name. International drivers must also present a valid passport and, if applicable, an international driving permit.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "You can cancel your reservation free of charge up to 48 hours before your scheduled pick-up time. Cancellations made within 48 hours of pick-up may be subject to a one-day rental fee.",
  },
  {
    question: "Do you offer delivery and pick-up services?",
    answer:
      "Yes, we offer a premium concierge service that includes vehicle delivery and pick-up to your location, whether it's the airport, your hotel, or your home. Additional fees may apply based on the distance.",
  },
  {
    question: "Are there any mileage limits?",
    answer:
      "Most of our vehicles come with a generous daily mileage allowance. For specific details on mileage limits for the vehicle you are interested in, please refer to the vehicle's booking page or contact our support team.",
  },
  {
    question: "What insurance options are available?",
    answer:
      "We offer several insurance packages, including a Collision Damage Waiver (CDW) and supplemental liability protection. You may also be covered by your personal auto insurance policy or credit card, but we recommend verifying your coverage before the rental period.",
  },
];

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full py-6 text-left"
      >
        <span className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {question}
        </span>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-600 dark:text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="font-inter">
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 max-w-3xl">
          
          <motion.h1
            className="text-4xl md:text-5xl text-center font-bold text-gray-900 dark:text-white mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Frequently Asked Questions
          </motion.h1>

          <motion.p 
            className="text-lg text-center text-gray-600 dark:text-gray-400 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Have questions? We're here to help. Find answers to common
            inquiries below.
          </motion.p>

          <motion.div 
            className="divide-y divide-gray-200 dark:divide-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {faqData.map((faq, index) => (
              <AccordionItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
