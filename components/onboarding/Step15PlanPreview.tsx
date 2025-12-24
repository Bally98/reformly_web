'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Button from '../Button'
import BackButton from '../BackButton'
import { useOnboardingStore } from '@/lib/store'

interface Step15PlanPreviewProps {
  onNext: () => void
  onBack: () => void
}

const goalsMap: Record<string, string> = {
  'lose-weight': 'Lose weight',
  'find-self-love': 'Find Self-Love',
  'build-muscle': 'Build Muscle',
  'keep-fit': 'Keep fit',
}

const activityIcons: Record<string, string> = {
  'Pilates': '/logos/pilates.png',
  'General Fitness': '/logos/fitness.png',
  'Yoga': '/logos/yoga.png',
  'Walking': '/logos/walk.png',
  'Stretching': '/logos/stretching.png',
}

const plans = [
  {
    id: 'weekly',
    title: 'Weekly Plan',
    price: '$6.99',
    pricePerWeek: null,
    badge: null,
  },
  {
    id: '4-week',
    title: '4-Week Plan',
    price: '$19.99',
    pricePerWeek: '$4.99/week',
    badge: 'MOST POPULAR',
  },
  {
    id: 'yearly',
    title: 'Yearly Plan',
    price: '$119.99',
    pricePerWeek: '$2.30/week',
    badge: 'BEST VALUE',
  },
]

export default function Step15PlanPreview({ onNext, onBack }: Step15PlanPreviewProps) {
  const { aboutYou, subscription, setSubscription, profile } = useOnboardingStore()
  const [selectedPlan, setSelectedPlan] = useState<string>(subscription.selectedPlanId || '4-week')
  const [titleWidth, setTitleWidth] = useState<number>(0)
  const titleRef = useRef<HTMLHeadingElement>(null)
  
  // Get username from profile or use default
  const username = profile.username || 'Mex'
  
  const mainGoal = aboutYou.mainGoal ? goalsMap[aboutYou.mainGoal] || aboutYou.mainGoal : 'Lose weight'
  const activities = aboutYou.activities || []
  const displayActivities = activities.slice(0, 2) // Take first 2 activities
  
  useEffect(() => {
    setSubscription({ selectedPlanId: selectedPlan })
  }, [selectedPlan, setSubscription])
  
  // Measure title width and sync container width
  useEffect(() => {
    const updateTitleWidth = () => {
      if (titleRef.current) {
        setTitleWidth(titleRef.current.offsetWidth)
      }
    }
    
    updateTitleWidth()
    window.addEventListener('resize', updateTitleWidth)
    
    return () => window.removeEventListener('resize', updateTitleWidth)
  }, [username])
  
  // X-axis labels for the 4 gradations
  const xAxisLabels = [
    { week: 1, label: 'Week 1' },
    { week: 4, label: 'Week 4' },
    { week: 8, label: 'Week 8' },
    { week: 12, label: 'Week 12' },
  ]
  
  // Graph SVG dimensions
  const graphWidth = 287
  const graphHeight = 127
  const graphStartX = 6.5 // Starting point X coordinate (left circle position)
  const graphStartY = 113.5 // Starting point Y coordinate (left circle position)
  
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }
  
  const handleGetPlan = () => {
    // Stub for now - will navigate to payment later
    console.log('Get plan clicked for:', selectedPlan)
    // onNext() // Uncomment when ready to proceed
  }
  
  return (
    <div className="min-h-screen bg-white w-full">
      {/* Header */}
      <div className="w-full px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <BackButton onClick={onBack} />
          <h1 className="font-plus-jakarta text-[28px] font-bold leading-[33.6px] text-black pl-2">reformly</h1>
        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="px-6 pb-12">
        {/* Title and Plan Summary Container */}
        <div className="mb-12 flex flex-col items-center">
          {/* Title */}
          <h2 
            ref={titleRef}
            className="font-plus-jakarta text-[40px] font-bold leading-[48px] mb-8 text-center text-gray-800"
          >
            {username}, your personalized plan is ready!
          </h2>
          
          {/* Plan Summary Section - matches title width */}
          <div 
            className="flex flex-col lg:flex-row items-start justify-between" 
            style={{ width: titleWidth > 0 ? `${titleWidth}px` : 'auto' }}
          >
            {/* Left: Chart */}
            <div className="flex-shrink-0">
              <div className="bg-white rounded-2xl py-12 px-2 relative" style={{ minHeight: '255px' }}>
                <div className="relative flex flex-col items-center justify-center" style={{ width: `${graphWidth}px` }}>
                {/* Graph SVG */}
                <div className="relative" style={{ width: `${graphWidth}px`, height: `${graphHeight}px` }}>
                  <Image
                    src="/logos/graph.svg"
                    alt="Progress Graph"
                    width={graphWidth}
                    height={graphHeight}
                    className="object-contain"
                  />
                  
                  {/* "New" label above the starting point */}
                  <div
                    className="absolute text-xs text-gray-600 font-medium"
                    style={{
                      left: `${graphStartX}px`,
                      top: `${graphStartY - 25}px`,
                      transform: 'translateX(-50%)',
                      fontFamily: 'var(--font-plus-jakarta-sans)',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  ><strong>Now</strong>
                  </div>
                </div>
                
                {/* Week gradation below the graph */}
                <div className="relative mt-4" style={{ width: `${graphWidth}px`, height: '20px' }}>
                  {xAxisLabels.map((label, index) => {
                    // Calculate x position for each week label
                    // Week 1 at start (0%), Week 4 at 33%, Week 8 at 66%, Week 12 at end (100%)
                    const positions = [0, 0.33, 0.66, 1]
                    const x = positions[index] * graphWidth
                    
                    return (
                      <div
                        key={index}
                        className="absolute text-xs text-gray-600 font-medium whitespace-nowrap"
                        style={{
                          left: `${x}px`,
                          transform: 'translateX(-50%)',
                          fontFamily: 'var(--font-plus-jakarta-sans)',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {label.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          
            {/* Right: Info Card and Image */}
            <div className="flex flex-col lg:flex-row gap-0 items-start flex-shrink-0 relative">
            {/* Info Card */}
            <div className="bg-[#EAE2FF] rounded-2xl p-6 w-full lg:w-auto relative" style={{ minWidth: '330px', height: '210px' }}>
              <div className="h-full flex flex-col justify-between py-2">
                {/* Duration */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
                    <Image
                      src="/logos/duration.svg"
                      alt="Duration"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-gray-800 text-sm font-bold mb-0.5" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>12 weeks</div>
                    <div className="text-gray-600 font-medium" style={{ fontFamily: 'var(--font-plus-jakarta-sans)', fontSize: '11px' }}>Duration</div>
                  </div>
                </div>
                
                {/* Goal */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
                    <Image
                      src="/logos/goal.svg"
                      alt="Goal"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-gray-800 text-sm font-bold mb-0.5" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>{mainGoal}</div>
                    <div className="text-gray-600 font-medium" style={{ fontFamily: 'var(--font-plus-jakarta-sans)', fontSize: '11px' }}>Goal</div>
                  </div>
                </div>
                
                {/* Interests */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 relative pt-1" style={{ width: '32px', height: '32px' }}>
                    <Image
                      src="/logos/self_love.svg"
                      alt="Interests"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="space-y-1 mb-1">
                      {displayActivities.length > 0 ? (
                        displayActivities.map((activity, idx) => (
                          <div key={idx} className="text-gray-800 text-sm font-bold" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                            {activity}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-800 text-sm font-bold" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                          Get lean and strong
                        </div>
                      )}
                    </div>
                    <div className="text-gray-600 font-medium" style={{ fontFamily: 'var(--font-plus-jakarta-sans)', fontSize: '11px' }}>Interests</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Woman Image - positioned over the card from right side, height matches card */}
            <div className="flex-shrink-0 hidden lg:block absolute" style={{ right: '-30px', bottom: '0', zIndex: 10 }}>
              <div className="relative" style={{ width: '230px', height: '230px' }}>
                <Image
                  src="/images/women.png"
                  alt="Woman"
                  fill
                  className="object-contain object-bottom"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        </div>
        
        {/* Payment Plans */}
        <div className="mb-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id
              const isPopular = plan.id === '4-week'
              
              return (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`
                    relative rounded-2xl p-6 border-2 cursor-pointer transition-all
                    ${isSelected && isPopular
                      ? 'bg-[#5630B0] border-[#5630B0]'
                      : isSelected
                      ? 'bg-white border-black'
                      : 'bg-white border-gray-200'
                    }
                  `}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`
                      text-xs font-bold mb-2
                      ${isPopular && isSelected 
                        ? 'text-white' 
                        : isPopular 
                        ? 'text-white' 
                        : 'text-[#5630B0]'
                      }
                    `} style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      {plan.badge}
                    </div>
                  )}
                  
                  {/* Title */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`
                      text-lg font-bold
                      ${isPopular && isSelected ? 'text-white' : 'text-gray-800'}
                    `} style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      {plan.title}
                    </h3>
                    
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center
                          ${isPopular ? 'bg-black' : 'bg-black'}
                        `}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M5 13l4 4L19 7"
                              stroke="#ffffff"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                      )}
                    </div>
                  </div>
                  
                  {/* Trial Button */}
                  <div className={`
                    rounded-lg px-4 py-2 mb-4 text-center
                    ${isPopular && isSelected
                      ? 'bg-white/20'
                      : 'bg-[#EAE2FF]'
                    }
                  `}>
                    <span className={`
                      text-sm font-medium
                      ${isPopular && isSelected ? 'text-white' : 'text-[#5630B0]'}
                    `} style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      7-day free trial
                    </span>
                  </div>
                  
                  {/* Price */}
                  <div className={`
                    ${isPopular && isSelected ? 'bg-white/10' : 'bg-gray-50'}
                    rounded-lg p-4
                  `}>
                    <div className={`
                      text-2xl font-bold
                      ${isPopular && isSelected ? 'text-white' : 'text-gray-800'}
                    `} style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      {plan.price}
                    </div>
                    {plan.pricePerWeek && (
                      <div className={`
                        text-sm mt-1
                        ${isPopular && isSelected ? 'text-white/80' : 'text-gray-600'}
                      `} style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                        ({plan.pricePerWeek})
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Get My Plan Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            className="w-full max-w-md py-4 text-lg font-bold"
            onClick={handleGetPlan}
          >
            GET MY PLAN
          </Button>
        </div>
      </div>
    </div>
  )
}

