'use client'

import { useState, useEffect } from 'react'
import { useOnboardingStore } from '@/lib/store'
import OnboardingWizard from '@/components/OnboardingWizard'

const TOTAL_STEPS = 15

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const { getAllData } = useOnboardingStore()
  
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  return (
    <div className="min-h-screen bg-white">
      <OnboardingWizard
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  )
}
