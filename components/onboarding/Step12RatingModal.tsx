'use client'

import { useMemo } from 'react'
import Button from '../Button'
import { useOnboardingStore } from '@/lib/store'
import Image from 'next/image'

interface Step12RatingModalProps {
  onNext: () => void
  onBack: () => void
}

export default function Step12RatingModal({ onNext }: Step12RatingModalProps) {
  const { metrics } = useOnboardingStore()

  // Calculate dates
  const dates = useMemo(() => {
    const today = new Date()
    const sixWeeksLater = new Date(today)
    sixWeeksLater.setDate(today.getDate() + 42) // 6 weeks = 42 days
    const twelveWeeksLater = new Date(today)
    twelveWeeksLater.setDate(today.getDate() + 84) // 12 weeks = 84 days

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      return `${day}/${month}`
    }

    const formatGoalDate = (date: Date) => {
      const day = date.getDate()
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      return `${day} ${month} ${year}`
    }

    return {
      today: formatDate(today),
      sixWeeks: formatDate(sixWeeksLater),
      twelveWeeks: formatDate(twelveWeeksLater),
      goalDate: formatGoalDate(twelveWeeksLater),
    }
  }, [])

  // Get weight values and unit
  const goalWeight = metrics.goalWeight?.value || 59
  const unit = metrics.goalWeight?.unit === 'lb' ? 'lbs' : 'kg'

  // Convert current weight to same unit as goal weight if needed
  const currentWeightDisplay = useMemo(() => {
    if (!metrics.currentWeight?.value) {
      // Если нет текущего веса, используем goalWeight + 10% как пример
      return goalWeight * 1.1
    }
    if (metrics.currentWeight.unit === metrics.goalWeight?.unit) {
      return metrics.currentWeight.value
    }
    // Convert if units differ
    if (metrics.currentWeight.unit === 'kg' && metrics.goalWeight?.unit === 'lb') {
      return Math.round(metrics.currentWeight.value * 2.20462)
    } else if (metrics.currentWeight.unit === 'lb' && metrics.goalWeight?.unit === 'kg') {
      return Math.round(metrics.currentWeight.value * 0.453592)
    }
    return metrics.currentWeight.value
  }, [metrics.currentWeight, metrics.goalWeight, goalWeight])

  // Graph dimensions - увеличен на 15%
  const graphWidth = 368 // 320 * 1.15
  const graphHeight = 200
  const padding = 40
  const chartWidth = graphWidth - padding * 2
  const chartHeight = graphHeight - padding * 2

  // Calculate points for smooth S-curve (12 weeks progression)
  const points = useMemo(() => {
    const numPoints = 200 // More points for smoother curve
    const pointsArray = []
    const weightRange = Math.abs(currentWeightDisplay - goalWeight)
    const isWeightLoss = currentWeightDisplay > goalWeight // true if losing weight, false if gaining
    
    for (let i = 0; i <= numPoints; i++) {
      const progress = i / numPoints
      
      // Two-arc curve: creates two smooth arcs with clear inflection point
      // First arc (0-0.5): slow start, accelerating
      // Second arc (0.5-1): decelerating, slow end
      let sCurveProgress
      if (progress < 0.5) {
        // First arc: ease-in cubic (slow start, accelerating)
        const t = progress * 2 // normalize to 0-1 for first half
        sCurveProgress = t * t * t * 0.5
      } else {
        // Second arc: ease-out cubic (decelerating, slow end)
        const t = (progress - 0.5) * 2 // normalize to 0-1 for second half
        sCurveProgress = 0.5 + (1 - Math.pow(1 - t, 3)) * 0.5
      }
      
      // Calculate weight based on direction
      const weight = isWeightLoss
        ? currentWeightDisplay - weightRange * sCurveProgress
        : currentWeightDisplay + weightRange * sCurveProgress
      
      const x = padding + (chartWidth * progress)
      
      // Calculate y position: higher weight at top, lower weight at bottom
      // Normalize weight to chart height
      const minWeight = Math.min(currentWeightDisplay, goalWeight)
      const maxWeight = Math.max(currentWeightDisplay, goalWeight)
      const weightRangeForY = maxWeight - minWeight
      const normalizedWeight = weightRangeForY > 0 
        ? (weight - minWeight) / weightRangeForY 
        : 0
      
      // Invert: higher weight = lower y (top), lower weight = higher y (bottom)
      const y = padding + (chartHeight * (1 - normalizedWeight))
      
      pointsArray.push({ x, y, weight })
    }
    
    return pointsArray
  }, [currentWeightDisplay, goalWeight, chartWidth, chartHeight, padding])

  // Create smooth SVG path using cubic bezier curves
  const pathData = useMemo(() => {
    if (points.length < 2) return ''
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    // Use smoother cubic bezier with better tension for more natural curve
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1] || curr
      const prevPrev = points[i - 2] || prev
      
      // Calculate smoother control points with adjusted tension
      const tension = 0.4
      const cp1x = prev.x + (curr.x - (prevPrev.x || prev.x)) * tension
      const cp1y = prev.y + (curr.y - (prevPrev.y || prev.y)) * tension
      const cp2x = curr.x - ((next.x || curr.x) - prev.x) * tension
      const cp2y = curr.y - ((next.y || curr.y) - prev.y) * tension
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }
    
    // Close the area under the curve
    const lastPoint = points[points.length - 1]
    path += ` L ${lastPoint.x} ${padding + chartHeight}`
    path += ` L ${points[0].x} ${padding + chartHeight} Z`
    
    return path
  }, [points, padding, chartHeight])
  
  // Extract just the curve line (without the closed area)
  const curvePath = useMemo(() => {
    if (!pathData) return ''
    // Remove the closing lines (L ... L ... Z)
    const parts = pathData.split(' L ')
    return parts[0] // Just the curve part
  }, [pathData])

  return (
    <div className="flex flex-col h-full px-6 pt-2 pb-8 px-6">
      <div className="flex flex-col justify-start flex-1">
        <h2 className="font-plus-jakarta text-[40px] font-bold leading-[48px] mb-4 text-center text-gray-800">
          Your step-by-step wellness journey
        </h2>
        
        <p className="text-base text-gray-800 mb-6 text-center">
          We&apos;ll create a plan to help you reach your goal of:
        </p>

        {/* Goal weight pill - над графиком */}
        <div className="flex justify-center mb-6">
          <div className="bg-primary-light rounded-full px-6 py-2 inline-block">
            <span className="text-primary font-semibold text-lg">
              {Math.round(goalWeight)} {unit} by {dates.goalDate}
            </span>
          </div>
        </div>

        {/* Graph container */}
        <div className="flex justify-center mb-0 relative mx-auto" style={{ width: `${graphWidth}px`, height: `${graphHeight}px` }}>
          <svg width={graphWidth} height={graphHeight} className="relative">
            {/* Gradient definition */}
            <defs>
              <linearGradient id="weightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FBC7D4" />
                <stop offset="100%" stopColor="#EAE2FF" />
              </linearGradient>
            </defs>
            
            {/* Area under curve */}
            <path
              d={pathData}
              fill="url(#weightGradient)"
              opacity={0.3}
            />
            
            {/* Curve line */}
            <path
              d={curvePath}
              fill="none"
              stroke="#5630B0"
              strokeWidth="2"
            />
            
          </svg>
          
          {/* Left weight label - цифра веса в розовой овальной форме (левая точка графика) */}
          {points.length > 0 && points[0] && (
            <div
              className="absolute bg-pink-accent rounded-full px-3 py-1.5 text-center z-10"
              style={{
                left: `${points[0].x}px`,
                top: `${points[0].y - 30}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                {Math.round(currentWeightDisplay)} {unit}
              </span>
            </div>
          )}
          
          {/* Right check mark - лого галочки в фиолетовом круге (конечная точка графика) */}
          {points.length > 0 && points[points.length - 1] && (
            <div
              className="absolute rounded-full z-10 flex items-center justify-center"
              style={{
                left: `${points[points.length - 1].x}px`,
                top: `${points[points.length - 1].y}px`,
                width: '28px',
                height: '28px',
                backgroundColor: '#5630B0',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Image
                src="/logos/check.png"
                alt="check"
                width={18}
                height={18}
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Date labels - три градации под графиком, выровненные точно под графиком */}
        <div className="relative mb-6 mx-auto" style={{ width: `${graphWidth}px`, height: '24px', marginTop: '2px' }}>
          <div className="absolute text-sm text-gray-600" style={{ left: `${padding}px`, top: '0', transform: 'translateX(-50%)', lineHeight: '24px', height: '24px' }}>
            {dates.today}
          </div>
          <div className="absolute text-sm text-gray-600" style={{ left: `${padding + chartWidth / 2}px`, top: '0', transform: 'translateX(-50%)', lineHeight: '24px', height: '24px' }}>
            {dates.sixWeeks}
          </div>
          <div className="absolute text-sm text-gray-600" style={{ left: `${padding + chartWidth}px`, top: '0', transform: 'translateX(-50%)', lineHeight: '24px', height: '24px' }}>
            {dates.twelveWeeks}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mb-4 px-4">
          *This estimate is based on tracked user progress. Check with your physician before starting. Following exercises, your plan, and meal plan impacts results.
        </p>

        {/* Next button */}
        <div className="mt-auto">
          <div className="flex justify-center px-4">
            <div className="w-full max-w-md">
              <Button
                variant="primary"
                className="w-full py-2.5 text-base min-w-[300px] bg-black-button text-white hover:bg-gray-800"
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
