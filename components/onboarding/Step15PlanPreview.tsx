'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Button from '../Button'
import BackButton from '../BackButton'
import { useOnboardingStore } from '@/lib/store'
import { getSubscriptionPlans, createSubscriptionCheckout, SubscriptionPlan } from '@/lib/api'

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

// Helper function to format price
const formatPrice = (amount: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100) // amount is in cents
}

// Helper function to calculate price per week
const calculatePricePerWeek = (amount: number, interval: string, intervalCount: number): string | null => {
  if (interval === 'week') {
    return null // Already per week
  }
  const weeksInInterval = interval === 'month' ? intervalCount * 4 : interval === 'year' ? intervalCount * 52 : intervalCount
  const pricePerWeek = amount / weeksInInterval
  return `${formatPrice(pricePerWeek)}/week`
}

// Static original prices for each plan
const getOriginalPrice = (planName: string): string => {
  const originalPrices: Record<string, string> = {
    'Weekly Plan': '($6.99)',
    '4-Week Plan': '($19.99)',
    'Yearly Plan': '($199.99)',
  }
  return originalPrices[planName] || ''
}

// Helper function to map plan from API to display format
const mapPlanToDisplay = (plan: SubscriptionPlan, index: number) => {
  const badges = ['MOST POPULAR', 'BEST VALUE']
  return {
    id: plan.id, // Use price ID from API
    title: plan.product.name,
    price: formatPrice(plan.amount, plan.currency),
    originalPrice: getOriginalPrice(plan.product.name),
    pricePerWeek: calculatePricePerWeek(plan.amount, plan.interval, plan.intervalCount),
    badge: index === 1 ? badges[0] : index === 2 ? badges[1] : null, // Second plan is most popular, third is best value
    originalPlan: plan, // Keep original for reference
  }
}

export default function Step15PlanPreview({ onNext, onBack }: Step15PlanPreviewProps) {
  const { aboutYou, subscription, setSubscription, profile, metrics } = useOnboardingStore()
  const [plans, setPlans] = useState<Array<{
    id: string
    title: string
    price: string
    originalPrice: string
    pricePerWeek: string | null
    badge: string | null
    originalPlan: SubscriptionPlan
  }>>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  
  // Initialize selected plan - use first plan's ID if available, or default to empty
  const [selectedPlan, setSelectedPlan] = useState<string>(subscription?.selectedPlanId || '')
  const [titleWidth, setTitleWidth] = useState<number>(0)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set([0])) // First FAQ open by default
  
  // Get name from profile (from /auth/me) or use default
  const name = profile.name || profile.username || 'Hello'
  
  // Calculate dynamic goal based on current weight vs goal weight
  const calculateGoal = (): string => {
    const currentWeight = metrics.currentWeight?.value
    const goalWeight = metrics.goalWeight?.value
    
    if (!currentWeight || !goalWeight) {
      // Fallback to mainGoal if weights are not available
      return aboutYou.mainGoal ? goalsMap[aboutYou.mainGoal] || aboutYou.mainGoal : 'Lose weight'
    }
    
    // Convert both to kg for comparison
    let currentWeightInKg = currentWeight
    if (metrics.currentWeight?.unit === 'lb') {
      currentWeightInKg = currentWeight * 0.453592
    }
    
    let goalWeightInKg = goalWeight
    if (metrics.goalWeight?.unit === 'lb') {
      goalWeightInKg = goalWeight * 0.453592
    }
    
    // Determine goal based on comparison
    if (currentWeightInKg > goalWeightInKg) {
      return 'Lose weight'
    } else if (currentWeightInKg < goalWeightInKg) {
      return 'Gain weight'
    } else {
      return 'Consistency'
    }
  }
  
  const mainGoal = calculateGoal()
  const activities = aboutYou.activities || []
  const displayActivities = activities.slice(0, 2) // Take first 2 activities
  
  // Determine which graph to display based on goal
  const graphSrc = mainGoal === 'Lose weight' ? '/logos/graph_down.svg' : '/logos/graph_up.svg'
  
  // Load subscription plans on mount
  useEffect(() => {
    const loadPlans = async () => {
      setIsLoadingPlans(true)
      try {
        const result = await getSubscriptionPlans(3)
        if (result.ok && result.data) {
          const mappedPlans = result.data.map(mapPlanToDisplay)
          setPlans(mappedPlans)
          
          // Set default selected plan to the second one (most popular) if no plan is selected
          const currentSelected = subscription?.selectedPlanId || selectedPlan
          if (!currentSelected && mappedPlans.length > 1) {
            const defaultPlanId = mappedPlans[1].id
            setSelectedPlan(defaultPlanId)
            setSubscription({ selectedPlanId: defaultPlanId })
          } else if (!currentSelected && mappedPlans.length > 0) {
            // If only one plan or no second plan, select first
            const defaultPlanId = mappedPlans[0].id
            setSelectedPlan(defaultPlanId)
            setSubscription({ selectedPlanId: defaultPlanId })
          } else if (currentSelected) {
            // Ensure selected plan is set
            setSelectedPlan(currentSelected)
          }
        } else {
          console.error('[Step15] Failed to load plans:', result.error)
        }
      } catch (error) {
        console.error('[Step15] Error loading plans:', error)
      } finally {
        setIsLoadingPlans(false)
      }
    }
    
    loadPlans()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
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
  }, [name])
  
  // X-axis labels for the 4 gradations
  const xAxisLabels = [
    { week: 1, label: 'Week 1' },
    { week: 4, label: 'Week 4' },
    { week: 8, label: 'Week 8' },
    { week: 12, label: 'Week 12' },
  ]
  
  // Graph SVG dimensions
  const graphWidth = 327
  const graphHeight = 157
  const graphStartX = 6.5 // Starting point X coordinate (left circle position)
  const graphStartY = 113.5 // Starting point Y coordinate (left circle position)
  
  const handlePlanSelect = (planId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    console.log('[Step15] handlePlanSelect called with planId:', planId, 'current selectedPlan:', selectedPlan)
    setSelectedPlan(planId)
    setSubscription({ selectedPlanId: planId })
    // Verify state update
    setTimeout(() => {
      console.log('[Step15] After update, selectedPlan should be:', planId)
    }, 0)
  }
  
  const handleGetPlan = async () => {
    if (!selectedPlan) {
      setCheckoutError('Please select a plan')
      return
    }
    
    setIsProcessingCheckout(true)
    setCheckoutError(null)
    
    try {
      console.log('[Step15] Creating checkout session for priceId:', selectedPlan)
      const result = await createSubscriptionCheckout(selectedPlan)
      
      if (result.ok && result.data?.url) {
        console.log('[Step15] Checkout URL received, redirecting:', result.data.url)
        // Open checkout URL in the same window
        window.location.href = result.data.url
      } else {
        console.error('[Step15] Failed to create checkout session:', result.error)
        setCheckoutError(result.error || 'Failed to create checkout session. Please try again.')
        setIsProcessingCheckout(false)
      }
    } catch (error) {
      console.error('[Step15] Error creating checkout session:', error)
      setCheckoutError('An error occurred. Please try again.')
      setIsProcessingCheckout(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-white w-full">
      <div className="w-full px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <BackButton onClick={onBack} />
          <h1 className="font-plus-jakarta text-xl sm:text-2xl md:text-[28px] font-bold leading-tight sm:leading-[33.6px] text-black pl-2">reformly</h1>
        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="px-4 sm:px-6 pb-8 sm:pb-12">
        {/* Title and Plan Summary Container */}
        <div className="mb-0 lg:mb-8 flex flex-col items-center">
          {/* Title */}
          <h2 
            ref={titleRef}
            className="font-plus-jakarta text-2xl sm:text-3xl md:text-[40px] font-bold leading-tight sm:leading-[48px] mb-6 sm:mb-8 text-center text-gray-800 px-2"
          >
            {name}, your personalized plan is ready!
          </h2>
          
          {/* Plan Summary Section - two equal columns */}
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row items-stretch gap-0">
              {/* Left: Chart - 50% width */}
              <div className="w-full lg:w-1/2 flex items-center justify-center">
                <div className="bg-white rounded-2xl py-6 sm:py-8 md:py-12 px-4 w-full h-full flex items-center justify-center">
                  <div className="relative w-full" style={{ maxWidth: `${graphWidth}px`, aspectRatio: `${graphWidth}/${graphHeight}` }}>
                    <Image
                      src={graphSrc}
                      alt="Progress Graph"
                      width={graphWidth}
                      height={graphHeight}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Right: Info Card and Image - 50% width */}
              <div className="w-full lg:w-1/2 relative">
                {/* Info Card */}
                <div className="bg-[#EAE2FF] rounded-2xl p-4 sm:p-5 md:p-6 w-full h-full flex items-center" style={{ minHeight: '200px' }}>
                  <div className="flex flex-col gap-3 py-2 w-full">
                    {/* Duration */}
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 relative" style={{ width: '42px', height: '42px' }}>
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
                      <div className="flex-shrink-0 relative" style={{ width: '42px', height: '42px' }}>
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
                      <div className="flex-shrink-0 relative pt-1" style={{ width: '42px', height: '42px' }}>
                        <Image
                          src="/logos/self_love_2.svg"
                          alt="Interests"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1">
                          {displayActivities.length === 1 ? (
                            <div className="text-gray-800 text-sm font-bold" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                              {displayActivities[0]}
                            </div>
                          ) : displayActivities.length === 2 ? (
                            <div className="text-gray-800 text-sm font-bold" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                              {displayActivities[0]} and {displayActivities[1]}
                            </div>
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
                
                {/* Woman Image - positioned to overlap the right edge of the card */}
                <div className="hidden lg:block absolute" style={{ right: '-120px', bottom: '0', zIndex: 10 }}>
                  <div className="relative" style={{ width: '180px', height: '250px' }}>
                    <Image
                      src="/images/woman.png" 
                      alt="Woman"
                      fill
                      className="object-contain object-bottom"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile: Show image below cards - positioned to touch the plans section */}
            <div className="lg:hidden w-full flex justify-center -mb-4">
              <div className="relative" style={{ width: '200px', height: '160px' }}>
                <Image
                  src="/images/woman.png" 
                  alt="Woman"
                  fill
                  className="object-contain object-bottom"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Container for Payment Plans and all content below - sets consistent width */}
        <div className="max-w-7xl mx-auto">
        {/* Payment Plans */}
          <div className="mb-6 sm:mb-8 pt-4 lg:pt-0">
          {isLoadingPlans ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-600">Loading plans...</div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-red-600">Failed to load plans. Please refresh the page.</div>
            </div>
          ) : (
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-end">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id
              
              // Debug: verify selection state
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                if (isSelected) {
                  console.log(`[Step15] Plan ${plan.id} is SELECTED. selectedPlan=${selectedPlan}, isSelected=${isSelected}`)
                }
              }
              
              return (
                <motion.div
                  key={`${plan.id}-${isSelected}`}
                  onClick={(e) => handlePlanSelect(plan.id, e)}
                  whileTap={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  initial={false}
                  className={`
                    relative rounded-xl border-2 cursor-pointer overflow-hidden flex flex-col w-full md:flex-1
                    ${isSelected
                      ? 'bg-[#EAE2FF] border-[#5630B0]'
                      : 'bg-white border-gray-200'
                    }
                  `}
                >
                  {/* Badge at top */}
                  {plan.badge && (
                    <div className={`
                      text-xs font-bold uppercase px-4 py-2 rounded-t-l
                      ${isSelected
                        ? 'bg-[#5630B0] text-white'
                        : 'bg-[#EAE2FF] text-[#5630B0]'
                      }
                    `} style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      {plan.badge}
                    </div>
                  )}
                  
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Title and Checkbox */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                        {plan.title}
                      </h3>
                      
                      {/* Checkbox */}
                      <div 
                        className="flex-shrink-0" 
                        style={{ 
                          flexShrink: 0, 
                          width: '24px', 
                          height: '24px', 
                          position: 'relative', 
                          zIndex: 100 
                        }}
                      >
                        {isSelected ? (
                          <div 
                            style={{ 
                              width: '24px', 
                              height: '24px',
                              borderRadius: '50%',
                              border: '2px solid #5630B0',
                              backgroundColor: '#5630B0',
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
                              border: '2px solid #D1D5DB',
                              backgroundColor: '#FFFFFF',
                              boxSizing: 'border-box'
                            }}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Trial Button - Purple pill */}
                    <div className="bg-[#5630B0] rounded-full px-4 py-2 mb-4 text-left" style={{ width: '135px' }}>
                      <span className="text-sm font-medium text-white" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                        7-day free trial
                      </span>
                    </div>
                    
                    {/* Price section with 50% off badge */}
                    <div className="flex items-center justify-between gap-4 mt-auto">
                      <div className="flex flex-col gap-1">
                        <div className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                          {plan.price}
                        </div>
                        <div className="text-xl font-bold text-black-500 line-through" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                          {plan.originalPrice}
                        </div>
                      </div>
                      {/* 50% off badge - positioned to the right, vertically centered */}
                      <div className="flex-shrink-0">
                        <div
                          className="border border-[#5630B0] rounded-full px-3 py-1"
                          style={{ borderWidth: '2px' }} // Thicker oval border
                        >
                          <span
                            className="text-sm font-extrabold text-[#5630B0]"
                            style={{
                              fontFamily: 'var(--font-plus-jakarta-sans)',
                            }}
                          >
                            50% off
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          )}
        </div>
        
        {/* Get My Plan Button */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <Button
              variant="primary"
              size="md"
              className="w-full max-w-[340px] py-3 sm:py-[13.6px] text-sm sm:text-base md:text-[17px] font-bold"
              onClick={handleGetPlan}
              isLoading={isProcessingCheckout}
              disabled={isProcessingCheckout || !selectedPlan || isLoadingPlans}
            >
              {isProcessingCheckout ? 'Processing...' : 'GET MY PLAN'}
            </Button>
            {checkoutError && (
              <p className="text-xs text-red-500 mt-2 text-center max-w-[340px]">{checkoutError}</p>
            )}
          </div>
          
          {/* Features Section */}
          <div className="bg-[#F6F2FF] rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
            
            
            {/* Features List */}
            <div className="w-full lg:w-1/2 space-y-4">
              {/* Feature 1 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
                  <Image
                    src="/logos/muscle_plan.svg"
                    alt="Build Muscle"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    <span className="font-bold">Build strength and sculpt your body</span>
                    <br />
                    with elegant, low-impact Pilates workouts
                  </p>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
                  <Image
                    src="/logos/up.svg"
                    alt="Progress"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    <span className="font-bold">Beginner to advanced friendly</span>
                    <br />
                    clear guidance to improve posture, flexibility and control
                  </p>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
                  <Image
                    src="/logos/time_plan.svg"
                    alt="Duration"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    <span className="font-bold">20 min workouts from home</span>
                    <br />
                    designed to fit effortlessly into your day
                  </p>
                </div>
              </div>
              
              {/* Feature 4 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
                  <Image
                    src="/logos/goal_plan.svg"
                    alt="Goals"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    <span className="font-bold">New programs, challenges & more</span>
                    <br />
                    stronger workouts, bolder challenges, bigger results
                  </p>
                </div>
              </div>
              
              {/* Feature 5 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
                  <Image
                    src="/logos/heart_plan.svg"
                    alt="Community"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    <span className="font-bold">A supportive community</span>
                    <br />
                    connect, share progress, stay accountable and feel supported
                  </p>
                </div>
              </div>
              
              {/* Feature 6 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
                  <Image
                    src="/logos/flower_plan.svg"
                    alt="Wellness"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    <span className="font-bold">Wellness beyond workouts</span>
                    <br />
                    expert guidance, routines and habits for long-term results
                  </p>
                </div>
              </div>
            </div>

            {/* Phones Image */}
            <div className="w-full lg:w-1/2 flex justify-center items-center mt-4 lg:mt-0">
              <div className="relative w-fit max-w-full flex justify-center items-center" style={{ aspectRatio: 'auto', position: 'relative' }}>
                <Image
                  src="/images/phones.png"
                  alt="Reformly App Preview"
                  width={400}
                  height={500}
                  className="object-contain mx-auto w-full max-w-[300px] sm:max-w-[400px]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Logos Section */}
        <div className="flex justify-center items-center mb-6 sm:mb-8 px-2">
          <div className="relative w-full max-w-[700px]" style={{ height: '150px', maxHeight: '200px' }}>
            <Image
              src="/logos/logos_plan.svg"
              alt="Featured in"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Results Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-8 sm:mb-12 md:mb-16 mt-8 sm:mt-12 md:mt-16 px-2" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
            Results we&apos;re proud of
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Rachel Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative w-full">
                <Image
                  src="/photos/woman_1_plan.png"
                  alt="Rachel Transformation"
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="p-4">
                {/* Name and Age with Checkmark */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>Rachel, 27</span>
                  <div className="relative" style={{ width: '16px', height: '16px' }}>
                    <Image
                      src="/logos/check_woman_plan.svg"
                      alt="Verified"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                {/* Testimonial */}
                <p className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                  Consistency came easy! You work out from home, just 20 minutes a day, and it&apos;s actually fun
                </p>
              </div>
            </div>
            
            {/* Kate Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative w-full">
                <Image
                  src="/photos/woman_2_plan.png"
                  alt="Kate Transformation"
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="p-4">
                {/* Name and Age with Checkmark */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>Kate, 42</span>
                  <div className="relative" style={{ width: '16px', height: '16px' }}>
                    <Image
                      src="/logos/check_woman_plan.svg"
                      alt="Verified"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                {/* Testimonial */}
                <p className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                  I went from 187 lbs, the heaviest I&apos;ve ever been, to just over 145 lbs in only 60 days. Reformly gave me back my confidence
                </p>
              </div>
            </div>
            
            {/* Amanda Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative w-full">
                <Image
                  src="/photos/woman_3_plan.png"
                  alt="Amanda Transformation"
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="p-4">
                {/* Name and Age with Checkmark */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>Amanda, 39</span>
                  <div className="relative" style={{ width: '16px', height: '16px' }}>
                    <Image
                      src="/logos/check_woman_plan.svg"
                      alt="Verified"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                {/* Testimonial */}
                <p className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                  I&apos;m almost 100 lbs down. Before starting this program, I didn&apos;t think I had the consistency in me to get this far.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-[#F6F2FF] rounded-2xl p-4 sm:p-6 md:p-8">
            <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6 sm:mb-8 px-2" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
              People often ask
            </h2>
            
            <div className="space-y-0">
              {/* FAQ Item 1 */}
              <div className="border-b border-gray-300 last:border-b-0">
                <button
                  onClick={() => {
                    const newOpenFaqs = new Set(openFaqs)
                    if (newOpenFaqs.has(0)) {
                      newOpenFaqs.delete(0)
                    } else {
                      newOpenFaqs.add(0)
                    }
                    setOpenFaqs(newOpenFaqs)
                  }}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-bold text-gray-800 text-lg pr-4" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    How does the Reformly app help me get results?
                  </span>
                  <motion.div
                    animate={{ rotate: openFaqs.has(0) ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#5630B0]"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                </button>
                {openFaqs.has(0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-gray-700 text-base leading-relaxed pl-0" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      The Reformly app combines guided Pilates workouts, structured programs and progress tracking to help you build strength, improve posture and stay consistent. Short, effective sessions make it easy to see results without overwhelming your schedule.
                    </p>
                  </motion.div>
                )}
              </div>
              
              {/* FAQ Item 2 */}
              <div className="border-b border-gray-300 last:border-b-0">
                <button
                  onClick={() => {
                    const newOpenFaqs = new Set(openFaqs)
                    if (newOpenFaqs.has(1)) {
                      newOpenFaqs.delete(1)
                    } else {
                      newOpenFaqs.add(1)
                    }
                    setOpenFaqs(newOpenFaqs)
                  }}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-bold text-gray-800 text-lg pr-4" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    Is it okay that I&apos;m a beginner?
                  </span>
                  <motion.div
                    animate={{ rotate: openFaqs.has(1) ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#5630B0]"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                </button>
                {openFaqs.has(1) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-gray-700 text-base leading-relaxed pl-0" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      Our plans are suitable for different skill levels. You&apos;ll find something for yourself whether you are a beginner or an advanced &quot;Pilates Girlie&quot;!
                    </p>
                  </motion.div>
                )}
              </div>
              
              {/* FAQ Item 3 */}
              <div className="border-b border-gray-300 last:border-b-0">
                <button
                  onClick={() => {
                    const newOpenFaqs = new Set(openFaqs)
                    if (newOpenFaqs.has(2)) {
                      newOpenFaqs.delete(2)
                    } else {
                      newOpenFaqs.add(2)
                    }
                    setOpenFaqs(newOpenFaqs)
                  }}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-bold text-gray-800 text-lg pr-4" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                    How will I access my plan?
                  </span>
                  <motion.div
                    animate={{ rotate: openFaqs.has(2) ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#5630B0]"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                </button>
                {openFaqs.has(2) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-gray-700 text-base leading-relaxed pl-0" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      After starting your free trial, you get access to the upgraded Reformly mobile app with your plan. Available both on iOS and Android. Everything is set up already. We are going to guide and support you through the whole process.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Community Testimonials Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-8 sm:mb-12 md:mb-16 mt-8 sm:mt-12 md:mt-16 px-2" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
            What our community says
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Sophie Card */}
            <div className="bg-[#F6F2FF] rounded-2xl p-6 shadow-sm">
              <div className="mb-3">
                <span className="font-bold text-gray-800 text-lg" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>Sophie</span>
              </div>
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#FFC400" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                This is the first workout plan I&apos;ve actually stuck with. Even after a long day of work the 20 min sessions make it easy to stay consistent!
              </p>
            </div>
            
            {/* Jane Card */}
            <div className="bg-[#F6F2FF] rounded-2xl p-6 shadow-sm">
              <div className="mb-3">
                <span className="font-bold text-gray-800 text-lg" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>Jane</span>
              </div>
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#FFC400" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                Best purchase I&apos;ve made all year. I wasted so much money on gym memberships I never used.
              </p>
            </div>
            
            {/* Cheryl Card */}
            <div className="bg-[#F6F2FF] rounded-2xl p-6 shadow-sm">
              <div className="mb-3">
                <span className="font-bold text-gray-800 text-lg" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>Cheryl</span>
              </div>
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#FFC400" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-base leading-relaxed" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                After pregnancy, I didn&apos;t feel like myself anymore. Reformly is so easy to fit in my routine, the program helped me feel confident again.
              </p>
            </div>
          </div>
        </div>
        
        {/* Duplicate Payment Plans */}
        <div className="mb-6 sm:mb-8">
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-8 sm:mb-12 md:mb-16 mt-8 sm:mt-12 md:mt-16 px-2" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
          Get visible results in 4 weeks!
            </h2>
          {isLoadingPlans ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-600">Loading plans...</div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-red-600">Failed to load plans. Please refresh the page.</div>
            </div>
          ) : (
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-end">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id
              
              return (
                <motion.div
                  key={`duplicate-${plan.id}-${isSelected}`}
                  onClick={(e) => handlePlanSelect(plan.id, e)}
                  whileTap={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  initial={false}
                  className={`
                    relative rounded-xl border-2 cursor-pointer overflow-hidden flex flex-col w-full md:flex-1
                    ${isSelected
                      ? 'bg-[#EAE2FF] border-[#5630B0]'
                      : 'bg-white border-gray-200'
                    }
                  `}
                >
                  {/* Badge at top */}
                  {plan.badge && (
                    <div className={`
                      text-xs font-bold uppercase px-4 py-2 rounded-t-l
                      ${isSelected
                        ? 'bg-[#5630B0] text-white'
                        : 'bg-[#EAE2FF] text-[#5630B0]'
                      }
                    `} style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                      {plan.badge}
                    </div>
                  )}
                  
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Title and Checkbox */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                        {plan.title}
                      </h3>
                      
                      {/* Checkbox */}
                      <div 
                        className="flex-shrink-0" 
                        style={{ 
                          flexShrink: 0, 
                          width: '24px', 
                          height: '24px', 
                          position: 'relative', 
                          zIndex: 100 
                        }}
                      >
                        {isSelected ? (
                          <div 
                            style={{ 
                              width: '24px', 
                              height: '24px',
                              borderRadius: '50%',
                              border: '2px solid #5630B0',
                              backgroundColor: '#5630B0',
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
                              border: '2px solid #D1D5DB',
                              backgroundColor: '#FFFFFF',
                              boxSizing: 'border-box'
                            }}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Trial Button - Purple pill */}
                    <div className="bg-[#5630B0] rounded-full px-4 py-2 mb-4 text-left" style={{ width: '135px' }}>
                      <span className="text-sm font-medium text-white" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                        7-day free trial
                      </span>
                    </div>
                    
                    {/* Price section with 50% off badge */}
                    <div className="flex items-center justify-between gap-4 mt-auto">
                      <div className="flex flex-col gap-1">
                        <div className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                          {plan.price}
                        </div>
                        <div className="text-xl font-bold text-black-500 line-through" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
                          {plan.originalPrice}
                        </div>
                      </div>
                      {/* 50% off badge - positioned to the right, vertically centered */}
                      <div className="flex-shrink-0">
                        <div
                          className="border border-[#5630B0] rounded-full px-3 py-1"
                          style={{ borderWidth: '2px' }} // Thicker oval border
                        >
                          <span
                            className="text-sm font-extrabold text-[#5630B0]"
                            style={{
                              fontFamily: 'var(--font-plus-jakarta-sans)',
                            }}
                          >
                            50% off
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          )}
        </div>
        
        {/* Duplicate Get My Plan Button */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <Button
            variant="primary"
            size="md"
            className="w-full max-w-[340px] py-3 sm:py-[13.6px] text-sm sm:text-base md:text-[17px] font-bold"
            onClick={handleGetPlan}
            isLoading={isProcessingCheckout}
            disabled={isProcessingCheckout || !selectedPlan || isLoadingPlans}
          >
            {isProcessingCheckout ? 'Processing...' : 'GET MY PLAN'}
          </Button>
          {checkoutError && (
            <p className="text-xs text-red-500 mt-2 text-center max-w-[340px]">{checkoutError}</p>
          )}
        </div>
        
        {/* Money-Back Guarantee Section */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-[#F6F2FF] rounded-2xl p-4 sm:p-6 md:p-8 text-center">
            {/* Shield Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative" style={{ width: '64px', height: '64px' }}>
                <Image
                  src="/logos/shield_plan.svg"
                  alt="Money-back guarantee"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            
            {/* Heading */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 px-2" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
              30-day money-back guarantee
            </h2>
            
            {/* Body Text */}
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 max-w-2xl mx-auto px-2" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
              We believe that our plan may work for you and you&apos;ll get visible results in 4 weeks! We even are ready to return your money back if you don&apos;t see visible results and can demonstrate that you followed our plan.
            </p>
            
            {/* Link */}
            <p className="text-gray-700 text-sm sm:text-base px-2" style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}>
              Find more about applicable limitations in our{' '}
              <a 
                href="https://reformly.com/policies/refund-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#5630B0] hover:underline font-medium"
              >
                money-back policy
              </a>
              .
            </p>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="fixed bottom-0 left-0 w-full bg-transparent z-50">
          <div className="w-full h-px" style={{ backgroundColor: '#D7DCDF' }}></div>
          <div 
            className="pl-4 sm:pl-6 md:pl-8 pb-3 sm:pb-4 pt-2 text-gray-600 text-xs sm:text-sm font-bold text-left" 
            style={{ fontFamily: 'var(--font-plus-jakarta-sans)' }}
          >
            ©2025. reformly
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

