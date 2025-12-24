'use client'

import Image from 'next/image'
import Button from '../Button'
import { useOnboardingStore } from '@/lib/store'
import { motion } from 'framer-motion'

interface Step7ActivitiesProps {
  onNext: () => void
  onBack: () => void
}

const activityOptions = [
  { name: 'Pilates', icon: '/logos/pilates.png' },
  { name: 'General Fitness', icon: '/logos/fitness.png' },
  { name: 'Yoga', icon: '/logos/yoga.png' },
  { name: 'Walking', icon: '/logos/walk.png' },
  { name: 'Stretching', icon: '/logos/stretching.png' },
]

export default function Step7Activities({ onNext }: Step7ActivitiesProps) {
  const selectedActivities = useOnboardingStore(s => s.aboutYou.activities)
  const setAboutYou = useOnboardingStore(s => s.setAboutYou)
  
  const handleToggle = (activityName: string) => {
    let newSelected: string[]
    if (selectedActivities.includes(activityName)) {
      newSelected = selectedActivities.filter(a => a !== activityName)
    } else if (selectedActivities.length < 3) {
      newSelected = [...selectedActivities, activityName]
    } else {
      return
    }
    setAboutYou({ activities: newSelected })
  }
  
  return (
    <div className="flex flex-col h-full px-6 py-4">
      <div className="flex flex-col justify-start flex-1" style={{ paddingTop: '29.76px' }}>
        <h2 className="font-plus-jakarta text-[40px] font-bold leading-[48px] mb-7 text-center text-gray-800">
          Choose up to 3 activities you&apos;re interested in
        </h2>
        
        <div className="space-y-2 mb-1">
          {activityOptions.map((activity) => {
            const isSelected = selectedActivities.includes(activity.name)
            const isDisabled = !isSelected && selectedActivities.length >= 3
            
            return (
              <motion.button
                key={activity.name}
                type="button"
                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                onClick={() => handleToggle(activity.name)}
                disabled={isDisabled}
                className={`
                  w-full p-2.5 rounded-xl border-2 text-left transition-all flex items-center gap-3
                  ${isSelected
                    ? 'border-black bg-white'
                    : isDisabled
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex-shrink-0">
                  <Image
                    src={activity.icon}
                    alt={activity.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className="font-medium flex-1">{activity.name}</span>
                <div className="flex-shrink-0" style={{ flexShrink: 0, width: '24px', height: '24px', position: 'relative', zIndex: 100 }}>
                  {isSelected ? (
                    <div 
                      style={{ 
                        width: '24px', 
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid #000000',
                        backgroundColor: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxSizing: 'border-box',
                        zIndex: 100,
                        opacity: 1,
                        visibility: 'visible'
                      }}
                      aria-label="Selected"
                    >
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ 
                          display: 'block',
                          opacity: 1,
                          visibility: 'visible'
                        }}
                      >
                        <path 
                          d="M5 13l4 4L19 7" 
                          stroke="#ffffff" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div 
                      style={{ 
                        width: '24px', 
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid #d1d5db',
                        backgroundColor: 'transparent',
                        boxSizing: 'border-box'
                      }}
                    ></div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
        
        <div className="mt-auto pt-2 pb-6 flex-shrink-0">
          <div className="flex justify-center px-4 mt-6">
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
