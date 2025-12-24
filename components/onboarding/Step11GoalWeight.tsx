'use client'

import { useState, useEffect } from 'react'
import Button from '../Button'
import { useOnboardingStore } from '@/lib/store'

interface Step11GoalWeightProps {
  onNext: () => void
  onBack: () => void
}

export default function Step11GoalWeight({ onNext }: Step11GoalWeightProps) {
  const { metrics, setMetrics } = useOnboardingStore()
  const [value, setValue] = useState<string>(String(metrics.goalWeight.value || 65))
  const [unit, setUnit] = useState<'kg' | 'lbs'>(metrics.goalWeight.unit === 'lb' ? 'lbs' : (metrics.goalWeight.unit === 'kg' ? 'kg' : 'kg'))
  
  // Calculate 10% weight loss
  const calculateWeightLoss = () => {
    if (!metrics.currentWeight?.value) return null
    
    const currentWeight = metrics.currentWeight.value
    const currentUnit = metrics.currentWeight.unit
    
    // Convert to same unit as displayed
    let weightInDisplayUnit = currentWeight
    if (currentUnit === 'lb' && unit === 'kg') {
      weightInDisplayUnit = currentWeight * 0.453592
    } else if (currentUnit === 'kg' && unit === 'lbs') {
      weightInDisplayUnit = currentWeight * 2.20462
    }
    
    const weightLoss = weightInDisplayUnit * 0.1
    return Math.round(weightLoss * 10) / 10
  }
  
  const weightLoss = calculateWeightLoss()
  
  useEffect(() => {
    const numValue = parseFloat(value) || 0
    if (numValue > 0) {
      setMetrics({
        goalWeight: { 
          value: numValue, 
          unit: unit === 'lbs' ? 'lb' : 'kg' 
        },
      })
    }
  }, [value, unit, setMetrics])
  
  const handleUnitChange = (newUnit: 'kg' | 'lbs') => {
    if (newUnit === unit) return
    
    const numValue = parseFloat(value) || 0
    if (numValue > 0) {
      if (unit === 'kg' && newUnit === 'lbs') {
        // Convert kg to lbs
        setValue(String(Math.round(numValue * 2.20462)))
      } else if (unit === 'lbs' && newUnit === 'kg') {
        // Convert lbs to kg
        setValue(String(Math.round(numValue * 0.453592)))
      }
    }
    setUnit(newUnit)
  }
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow only numbers and one decimal point
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      setValue(inputValue)
    }
  }
  
  const handleBlur = () => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      setValue(unit === 'kg' ? '65' : '143')
    } else {
      setValue(String(numValue))
    }
  }
  
  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex flex-col justify-start" style={{ paddingTop: '0px' }}>
        <h2 className="font-plus-jakarta text-[40px] font-bold leading-[48px] mb-8 text-center text-gray-800">
          What&apos;s your goal weight?
        </h2>
        
        <div className="flex flex-col items-center mb-8">
          {/* Input field container */}
          <div className="w-full bg-white rounded-2xl border-2 border-gray-200" style={{ width: '115%', maxWidth: 'calc(448px * 1.15)', padding: '19.2px' }}>
            {/* Unit selector */}
            <div className="flex justify-center gap-2" style={{ marginBottom: '19.2px' }}>
              <button
                onClick={() => handleUnitChange('kg')}
                className={`
                  px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${unit === 'kg'
                    ? 'bg-primary-light text-primary'
                    : 'bg-white text-gray-600'
                  }
                `}
              >
                kg
              </button>
              <button
                onClick={() => handleUnitChange('lbs')}
                className={`
                  px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${unit === 'lbs'
                    ? 'bg-primary-light text-primary'
                    : 'bg-white text-gray-600'
                  }
                `}
              >
                lbs
              </button>
            </div>
            
            {/* Value display and input */}
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={handleValueChange}
                onBlur={handleBlur}
                className="text-6xl font-bold text-gray-800 text-center w-32 border-b-2 border-gray-300 focus:border-primary focus:outline-none pb-2"
                placeholder={unit === 'kg' ? '65' : '143'}
              />
              <span className="text-3xl font-semibold text-gray-800">{unit}</span>
            </div>
          </div>
        </div>
        
        {/* Easy win information box */}
        <div className="bg-primary-light rounded-2xl p-5 mx-auto mb-4" style={{ width: '115%', maxWidth: 'calc(448px * 1.15)' }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
              <img
                src="/logos/stars.png"
                alt="star"
                className="w-5 h-5 text-primary"
                style={{ display: 'block' }}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-primary mb-1 flex items-center gap-1">
                <span>Easy win</span>
              </h3>
              <div className="text-sm text-gray-800 font-bold mb-0">
                You will lose 10% of your weight
              </div>
              <ul className="text-sm text-gray-700 mt-1 space-y-0">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Moderate weight loss already brings big changes.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Slimmer waist, toned muscles</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>A boost of body confidence</span>
                </li>
              </ul>
            </div>
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

