'use client'

import { useState, useEffect } from 'react'
import Button from '../Button'
import { useOnboardingStore } from '@/lib/store'

interface Step8HeightProps {
  onNext: () => void
  onBack: () => void
}

export default function Step8Height({ onNext }: Step8HeightProps) {
  const { metrics, setMetrics } = useOnboardingStore()
  const [value, setValue] = useState<string>(String(metrics.height.value || 173))
  const [unit, setUnit] = useState<'cm' | 'inch'>(metrics.height.unit === 'in' ? 'inch' : (metrics.height.unit === 'cm' ? 'cm' : 'cm'))
  
  useEffect(() => {
    const numValue = parseFloat(value) || 0
    if (numValue > 0) {
      setMetrics({
        height: { 
          value: numValue, 
          unit: unit === 'inch' ? 'in' : 'cm' 
        },
      })
    }
  }, [value, unit, setMetrics])
  
  const handleUnitChange = (newUnit: 'cm' | 'inch') => {
    if (newUnit === unit) return
    
    const numValue = parseFloat(value) || 0
    if (numValue > 0) {
      if (unit === 'cm' && newUnit === 'inch') {
        // Convert cm to inches
        setValue(String(Math.round((numValue / 2.54) * 10) / 10))
      } else if (unit === 'inch' && newUnit === 'cm') {
        // Convert inches to cm
        setValue(String(Math.round(numValue * 2.54)))
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
      setValue(unit === 'cm' ? '173' : '68')
    } else {
      setValue(String(numValue))
    }
  }
  
  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex flex-col justify-start" style={{ paddingTop: '29.76px' }}>
        <h2 className="font-plus-jakarta text-[40px] font-bold leading-[48px] mb-8 text-center text-gray-800">
          What&apos;s your height?
        </h2>
        
        <div className="flex flex-col items-center mb-7">
          {/* Input field container - widened and less tall */}
          <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-gray-200 px-8 py-4">
            {/* Unit selector */}
            <div className="flex justify-center gap-2 mb-5">
              <button
                onClick={() => handleUnitChange('cm')}
                className={`
                  px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${unit === 'cm'
                    ? 'bg-primary-light text-primary'
                    : 'bg-white text-gray-600'
                  }
                `}
              >
                cm
              </button>
              <button
                onClick={() => handleUnitChange('inch')}
                className={`
                  px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${unit === 'inch'
                    ? 'bg-primary-light text-primary'
                    : 'bg-white text-gray-600'
                  }
                `}
              >
                inch
              </button>
            </div>
            
            {/* Value display and input - wider and less tall */}
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={handleValueChange}
                onBlur={handleBlur}
                className="text-5xl font-bold text-gray-800 text-center w-64 h-14 border-b-2 border-gray-300 focus:border-primary focus:outline-none pb-1"
                placeholder={unit === 'cm' ? '173' : '68'}
                style={{ minWidth: '14rem', maxWidth: '100%' }}
              />
              <span className="text-2xl font-semibold text-gray-800">{unit}</span>
            </div>
          </div>
        </div>
        {/* Information message - widened and less tall */}
        <div className="bg-primary-light rounded-2xl px-8 py-3 max-w-lg mx-auto mb-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary mb-1">
                Creating your personal plan
              </p>
              <p className="text-sm text-gray-700">
                People tend to have a higher body-fat percentage as they age, even at identical BMIs.
              </p>
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
