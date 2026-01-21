'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Step15PlanPreview from '@/components/onboarding/Step15PlanPreview'
import Button from '@/components/Button'

export default function PaymentErrorPage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Show modal after component mounts
    setShowModal(true)
  }, [])

  const handleClose = () => {
    setShowModal(false)
    // Navigate to onboarding step 15 (last step, payment page, 0-based index 14)
    router.push('/onboarding?step=14')
  }

  const handleTryAgain = () => {
    setShowModal(false)
    // Navigate to onboarding step 15 (last step, payment page, 0-based index 14)
    // User will see step 15 with all saved onboarding data
    router.push('/onboarding?step=14')
  }

  // Empty handlers for background Step15 component
  const handleNext = () => {}
  const handleBack = () => {}

  return (
    <div className="min-h-screen bg-white w-full relative">
      {/* Background - Step15 with reduced opacity */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Step15PlanPreview onNext={handleNext} onBack={handleBack} />
      </div>

      {/* Overlay to darken background */}
      <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none z-40" />

      {/* Error Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full mx-4 relative" style={{ maxWidth: '896px' }}>
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Modal Content */}
                <div className="p-8 text-center">
                  {/* Error Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="relative" style={{ width: '100px', height: '100px' }}>
                      <Image
                        src="/logos/failed.svg"
                        alt="Failed"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  <h2
                    className="text-2xl font-bold text-gray-800 mb-2"
                    style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}
                  >
                    Payment was unsuccessful!
                  </h2>
                  <p
                    className="text-gray-600 mb-6"
                    style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}
                  >
                    Something went wrong
                  </p>

                  {/* Try Again Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full max-w-[340px] py-3 sm:py-[13.6px] text-sm sm:text-base md:text-[17px] font-bold"
                      onClick={handleTryAgain}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

