'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useOnboardingStore } from '@/lib/store'
import OnboardingWizard from '@/components/OnboardingWizard'

const TOTAL_STEPS = 15

function OnboardingContent() {
  const searchParams = useSearchParams()
  const getStepIndexFromParams = (params: ReturnType<typeof useSearchParams> | null): number => {
    const stepParam = params?.get('step')
    if (!stepParam) return 0
    const step = parseInt(stepParam, 10)
    if (Number.isNaN(step) || step < 0) return 0
    // Support both 0-based (step=14) and 1-based (step=15) indexing
    const stepIndex = step >= TOTAL_STEPS ? TOTAL_STEPS - 1 : step
    if (stepIndex < 0 || stepIndex >= TOTAL_STEPS) return 0
    return stepIndex
  }

  // Initialize from URL synchronously (avoid "stuck on step 0" after returning from Stripe)
  const [currentStep, setCurrentStep] = useState(() => getStepIndexFromParams(searchParams))
  const { getAllData, auth, aboutYou, metrics, profile } = useOnboardingStore()
  
  // Keep step in sync with URL (e.g., after router.push)
  useEffect(() => {
    const stepIndex = getStepIndexFromParams(searchParams)
    setCurrentStep(stepIndex)
  }, [searchParams])
  
  // Guard: redirect to email step if trying to access protected steps without verification
  useEffect(() => {
    // Steps 0, 1, 2 are public (welcome, email, OTP)
    // Steps 3+ require verification
    // Step 15 (index 14) is allowed if user has onboarding data (payment retry scenario)
    // Skip guard if user just authenticated with Google (they should go to step 3)
    
    // Allow step 15 (index 14) if user has onboarding data (for payment retry after failure)
    if (currentStep === 14) {
      const hasOnboardingData = aboutYou.mainGoal || metrics.height.value || profile.name || metrics.currentWeight?.value
      console.log('[OnboardingPage] Step 15 access check:', {
        currentStep,
        hasOnboardingData,
        mainGoal: aboutYou.mainGoal,
        height: metrics.height.value,
        name: profile.name,
        weight: metrics.currentWeight?.value,
        isVerified: auth.isVerified
      })
      if (hasOnboardingData) {
        // Allow access to step 15 even without verification (payment retry scenario)
        console.log('[OnboardingPage] Allowing access to step 15 - user has onboarding data')
        return
      } else {
        console.log('[OnboardingPage] No onboarding data found, redirecting to step 1')
      }
    }
    
    if (currentStep >= 3 && currentStep < 14 && !auth.isVerified && auth.provider !== 'google') {
      console.log('[OnboardingPage] Guard: redirecting to step 1 - no verification for step', currentStep)
      setCurrentStep(1) // Redirect to email step
    }
  }, [currentStep, auth.isVerified, auth.provider, aboutYou.mainGoal, metrics.height.value, metrics.currentWeight?.value, profile.name])
  
  // Auto-advance from step 2 (OTP) to step 3 when verification is complete
  useEffect(() => {
    if (currentStep === 2 && auth.isVerified) {
      console.log('[OnboardingPage] User verified, auto-advancing to step 3')
      setCurrentStep(3)
    }
  }, [auth.isVerified, currentStep])
  
  // Auto-advance to step 3 when Google auth is complete (skip email/OTP steps)
  useEffect(() => {
    if (auth.isVerified && auth.provider === 'google' && currentStep <= 2) {
      console.log('[OnboardingPage] Google auth complete, skipping to step 3')
      setCurrentStep(3)
    }
  }, [auth.isVerified, auth.provider, currentStep])
  
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      // Guard: prevent going to protected steps without verification
      // Note: Step 2 (OTP) auto-advances via useEffect when verified, so we skip the check here
      // Step 15 (index 14) is allowed if user has onboarding data (payment retry scenario)
      const isStep15 = currentStep === 14
      const hasOnboardingData = aboutYou.mainGoal || metrics.height.value || profile.name || metrics.currentWeight?.value
      
      if (currentStep > 2 && !isStep15 && !auth.isVerified) {
        // Can't proceed to protected steps without verification (except step 15 with onboarding data)
        setCurrentStep(1) // Redirect to email step
        return
      }
      
      // Allow proceeding to step 15 if user has onboarding data, even without verification
      if (isStep15 && !auth.isVerified && !hasOnboardingData) {
        setCurrentStep(1) // Redirect to email step if no onboarding data
        return
      }
      
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

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
