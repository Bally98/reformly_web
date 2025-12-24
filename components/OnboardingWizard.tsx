'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from './BackButton'
import ProgressBar from './ProgressBar'
import Step0Welcome from './onboarding/Step0Welcome'
import Step1Email from './onboarding/Step1Email'
import Step2OTP from './onboarding/Step2OTP'
import Step3Sex from './onboarding/Step3Sex'
import Step4Birthday from './onboarding/Step4Birthday'
import Step5MainGoal from './onboarding/Step5MainGoal'
import Step6Motivation from './onboarding/Step6Motivation'
import Step7Activities from './onboarding/Step7Activities'
import Step8Height from './onboarding/Step8Height'
import Step9Weight from './onboarding/Step9Weight'
import Step10BMI from './onboarding/Step10BMI'
import Step11GoalWeight from './onboarding/Step11GoalWeight'
import Step12RatingModal from './onboarding/Step12RatingModal'
import Step14Crafting from './onboarding/Step14Crafting'
import Step15PlanPreview from './onboarding/Step15PlanPreview'

interface OnboardingWizardProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

const stepComponents = [
  Step0Welcome,
  Step1Email,
  Step2OTP,
  Step3Sex,
  Step4Birthday,
  Step5MainGoal,
  Step6Motivation,
  Step7Activities,
  Step8Height,
  Step9Weight,
  Step10BMI,
  Step11GoalWeight,
  Step12RatingModal,
  Step14Crafting,
  Step15PlanPreview,
]

export default function OnboardingWizard({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: OnboardingWizardProps) {
  const [direction, setDirection] = useState(1)
  const prevStepRef = useRef(0)
  
  useEffect(() => {
    setDirection(currentStep > prevStepRef.current ? 1 : -1)
    prevStepRef.current = currentStep
  }, [currentStep])
  
  const StepComponent = stepComponents[currentStep]
  const showProgress = currentStep >= 3 && currentStep <= 13
  const showBackButton = currentStep > 0 && currentStep !== 14
  
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-white w-full relative">
      {/* Full-width gradient background for BMI step - starts from progress bar */}
      {currentStep === 10 && (
        <div 
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: '-9px',
            bottom: 0,
            background: 'linear-gradient(to bottom, transparent 0px, transparent 90px, #EAE2FF 90px, #EAE2FF 150px, rgba(234, 226, 255, 0.5) 250px, rgba(234, 226, 255, 0) 400px, transparent 100%)',
            width: '100%',
            zIndex: 0,
          }}
        />
      )}
      
      {/* Header - full width */}
      {currentStep > 0 && currentStep !== 14 && (
        <div className="w-full px-6 pt-6 pb-4 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            {showBackButton && <BackButton onClick={onBack} />}
            <h1 className="font-plus-jakarta text-[28px] font-bold leading-[33.6px] text-black pl-2">reformly</h1>
          </div>
          <div className="relative border-t border-gray-200 w-full mb-4" style={{ height: '1px' }}>
            {showProgress && (
              <div className="absolute top-[-1px] left-0 right-0" style={{ paddingLeft: '6%', paddingRight: '6%' }}>
                <ProgressBar 
                  current={currentStep - 2} 
                  total={11} 
                  startPercentage={20}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content - centered for steps > 0, full width for step 0 */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className={`absolute inset-0 ${currentStep === 0 ? '' : 'flex justify-center'}`}
            style={{ zIndex: 1, position: 'relative' }}
          >
            {currentStep === 0 ? (
              <StepComponent onNext={onNext} onBack={onBack} />
            ) : currentStep === 14 ? (
              <StepComponent onNext={onNext} onBack={onBack} />
            ) : (
              <div className="w-full flex justify-center">
                <div className="w-full" style={{ width: '30vw', minWidth: '550px', maxWidth: '690px', margin: '0 auto' }}>
                  <StepComponent onNext={onNext} onBack={onBack} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
