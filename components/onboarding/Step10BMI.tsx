'use client'

import { useEffect, useState } from 'react'
import Button from '../Button'
import { useOnboardingStore } from '@/lib/store'
import { motion } from 'framer-motion'

interface Step10BMIProps {
  onNext: () => void
  onBack: () => void
}

const categories = [
  { label: 'Underweight', range: [0, 18.5], color: '#5630B0' },
  { label: 'Normal', range: [18.5, 25], color: '#5630B0' },
  { label: 'Overweight', range: [25, 30], color: '#FBC7D4' },
  { label: 'Obese', range: [30, 100], color: '#EF4444' },
]

const markers = [15, 18.5, 25, 30, 40]

export default function Step10BMI({ onNext }: Step10BMIProps) {
  const { metrics, setMetrics } = useOnboardingStore()
  
  // Calculate BMI from height and weight
  const calculateBMI = (): number | null => {
    if (!metrics.height.value || !metrics.currentWeight?.value) {
      return null
    }
    
    // Convert height to meters
    let heightInMeters: number
    if (metrics.height.unit === 'cm') {
      heightInMeters = metrics.height.value / 100
    } else {
      // inches to meters
      heightInMeters = (metrics.height.value * 2.54) / 100
    }
    
    // Convert weight to kg
    let weightInKg: number
    if (metrics.currentWeight.unit === 'kg') {
      weightInKg = metrics.currentWeight.value
    } else {
      // lbs to kg
      weightInKg = metrics.currentWeight.value * 0.453592
    }
    
    // BMI = weight (kg) / height (m)²
    const bmi = weightInKg / (heightInMeters * heightInMeters)
    return bmi
  }
  
  const [category, setCategory] = useState<string | null>(metrics.bmi.category || 'normal')
  
  useEffect(() => {
    // Calculate BMI inline to avoid dependency issues
    if (!metrics.height.value || !metrics.currentWeight?.value) {
      return
    }
    
    // Convert height to meters
    let heightInMeters: number
    if (metrics.height.unit === 'cm') {
      heightInMeters = metrics.height.value / 100
    } else {
      // inches to meters
      heightInMeters = (metrics.height.value * 2.54) / 100
    }
    
    // Convert weight to kg
    let weightInKg: number
    if (metrics.currentWeight.unit === 'kg') {
      weightInKg = metrics.currentWeight.value
    } else {
      // lbs to kg
      weightInKg = metrics.currentWeight.value * 0.453592
    }
    
    // BMI = weight (kg) / height (m)²
    const calculatedBmi = weightInKg / (heightInMeters * heightInMeters)
    
    let bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' = 'normal'
    
    if (calculatedBmi < 18.5) bmiCategory = 'underweight'
    else if (calculatedBmi < 25) bmiCategory = 'normal'
    else if (calculatedBmi < 30) bmiCategory = 'overweight'
    else bmiCategory = 'obese'
    
    setCategory(bmiCategory)
    setMetrics({
      bmi: {
        value: calculatedBmi,
        category: bmiCategory,
      },
    })
  }, [metrics.height.value, metrics.height.unit, metrics.currentWeight?.value, metrics.currentWeight?.unit, setMetrics])
  
  const bmiValue = calculateBMI() || 23.7
  
  const currentCategory = categories.find(c => {
    const [min, max] = c.range
    return bmiValue >= min && bmiValue < max
  })
  
  // Calculate position on scale (assuming scale goes from 15 to 40)
  const scaleMin = 15
  const scaleMax = 40
  const bmiPosition = ((bmiValue - scaleMin) / (scaleMax - scaleMin)) * 100
  
  const getCategoryMessage = () => {
    switch (category) {
      case 'underweight':
        return "You're below the normal range. We'll use this index to personalize your workouts and plan so you can stay consistent and feel your best."
      case 'normal':
        return "You're in great shape! We'll use this index to personalize your workouts and plan so you can stay consistent and feel your best."
      case 'overweight':
        return "You're above the normal range. We'll use this index to personalize your workouts and plan so you can stay consistent and feel your best."
      case 'obese':
        return "You're in the obese range. We'll use this index to personalize your workouts and plan so you can stay consistent and feel your best."
      default:
        return "We'll use this index to personalize your workouts and plan so you can stay consistent and feel your best."
    }
  }
  
  return (
    <div className="flex flex-col h-full px-6 py-8 bg-transparent">
      <div className="flex flex-col justify-start" style={{ paddingTop: '0px' }}>
        <h2 className="font-plus-jakarta text-[40px] font-bold leading-[48px] mb-8 text-center text-gray-800">
          Your current BMI
        </h2>
        
        <div className="flex flex-col items-center mb-8">
          {/* Large BMI number in circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative w-32 h-32 mb-8 bg-primary-light rounded-full flex items-center justify-center"
          >
            <div className="text-5xl font-bold text-primary">{bmiValue.toFixed(1)}</div>
          </motion.div>
          
          {/* BMI Scale */}
          <div className="w-full max-w-md mb-6" style={{ width: '110%', maxWidth: 'calc(550px * 1.1)' }}>
            {/* Number markers - ABOVE the bar */}
            <div className="relative mb-2 h-4">
              {markers.map((marker) => {
                const position = ((marker - scaleMin) / (scaleMax - scaleMin)) * 100
                return (
                  <div
                    key={marker}
                    className="absolute text-xs text-gray-600"
                    style={{
                      left: `${position}%`,
                      transform: 'translateX(-50%)',
                      top: 0,
                    }}
                  >
                    {marker}
                  </div>
                )
              })}
            </div>
            
            {/* Gradient bar */}
            <div className="relative h-2 rounded-full mb-2" style={{ overflow: 'visible' }}>
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(to right, #EAE2FF 0%, #CAB7FA 20%, #5630B0 45%, #FBC7D4 60%, #F59E0B 75%, #EF4444 100%)',
                  overflow: 'hidden',
                }}
              />
              {/* BMI position marker (notch) on the bar - triangular with rounded edges */}
              <div
                className="absolute"
                style={{
                  left: `${bmiPosition}%`,
                  transform: 'translateX(-50%) rotate(180deg)',
                  top: '-2px',
                  zIndex: 10,
                }}
              >
                <svg
                  width="20"
                  height="13"
                  viewBox="0 0 20 13"
                  style={{ display: 'block' }}
                >
                  <path
                    d="M 10 13 L 2 2 Q 2 0 4 0 L 16 0 Q 18 0 18 2 Z"
                    fill="#5630B0"
                    style={{
                      filter: 'drop-shadow(0 0 2px rgba(86, 48, 176, 0.5))',
                    }}
                  />
                </svg>
              </div>
            </div>
            
            {/* Category labels - BELOW the bar */}
            <div className="flex justify-between text-xs mt-8 relative">
              <span className={currentCategory?.label === 'Underweight' ? 'bg-primary-light text-primary font-semibold px-3 py-1 rounded-full' : 'text-gray-600'}>
                Underweight
              </span>
              <span className={currentCategory?.label === 'Normal' ? 'bg-primary-light text-primary font-semibold px-3 py-1 rounded-full' : 'text-gray-600'}>
                Normal
              </span>
              <span className={currentCategory?.label === 'Overweight' ? 'bg-primary-light text-primary font-semibold px-3 py-1 rounded-full' : 'text-gray-600'}>
                Overweight
              </span>
              <span className={currentCategory?.label === 'Obese' ? 'bg-primary-light text-primary font-semibold px-3 py-1 rounded-full' : 'text-gray-600'}>
                Obese
              </span>
            </div>
          </div>
          
          {/* Information message box */}
          <div className="bg-primary-light rounded-2xl p-4 max-w-md mb-4" style={{ width: '110%', maxWidth: 'calc(550px * 1.1)' }}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">i</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold">{currentCategory?.label}</span> {getCategoryMessage()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-2">
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

