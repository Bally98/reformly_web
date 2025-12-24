'use client'

import Button from '../Button'
import { motion } from 'framer-motion'

interface Step6MotivationProps {
  onNext: () => void
  onBack: () => void
}

export default function Step6Motivation({ onNext }: Step6MotivationProps) {
  return (
    <div className="flex flex-col h-full w-full py-8 px-4">
      <div className="flex flex-col justify-start items-center" style={{ paddingTop: '29.76px' }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-plus-jakarta text-[40px] font-bold leading-[48px] mb-4 text-center text-gray-800 px-2"
        >
          We&apos;ve helped thousands <br/>do it, you&apos;re next.
        </motion.h2>
        
        <div className="relative w-full max-w-lg px-2 flex items-end gap-3 py-10">
          {/* Circular reformly badge - avatar */}
          <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <span className="text-white text-[9px] font-bold  whitespace-nowrap">reformly</span>
          </div>
          
          {/* Message bubble with tail */}
          <div className="relative flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-primary-light rounded-3xl p-6 relative"
            >
              <p className="text-gray-700 leading-relaxed mb-3">
                You&apos;ve got enough to worry about, your fitness routine shouldn&apos;t be one of them.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Reformly helps you slim down gently, <strong>at your own pace</strong>, <strong>in your own space</strong>.
              </p>
              
              {/* Chat bubble tail */}
              <div className="absolute -left-2 bottom-6 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-primary-light border-b-[8px] border-b-transparent"></div>
            </motion.div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-center px-4">
            <div className="w-full max-w-md">
              <Button
                variant="primary"
                className="w-full py-2.5 text-base min-w-[300px]" 
                onClick={onNext}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
