'use client'

import { useEffect } from 'react'
import Button from '../Button'
import { useOnboardingStore } from '@/lib/store'
import { motion } from 'framer-motion'

interface Step13PlanPreviewProps {
  onNext: () => void
  onBack: () => void
}

export default function Step13PlanPreview({ onNext }: Step13PlanPreviewProps) {
  const { aboutYou, metrics, setPlanPreview } = useOnboardingStore()
  
  useEffect(() => {
    // Generate mock data for the chart
    const durationWeeks = 12
    const startWeight = metrics.currentWeight?.value || 66
    const goalWeight = metrics.goalWeight.value || 59
    
    // Convert weights to same unit for calculation
    let startWeightKg = startWeight
    let goalWeightKg = goalWeight
    
    if (metrics.currentWeight?.unit === 'lb') {
      startWeightKg = startWeight * 0.453592
    }
    if (metrics.goalWeight.unit === 'lb') {
      goalWeightKg = goalWeight * 0.453592
    }
    
    const chartData = Array.from({ length: durationWeeks + 1 }, (_, i) => ({
      week: i,
      weight: startWeightKg - ((startWeightKg - goalWeightKg) * i) / durationWeeks,
      date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }))
    
    setPlanPreview({
      durationWeeks,
      goalLabel: aboutYou.mainGoal || 'Lose Weight',
      interestsLabel: aboutYou.activities.slice(0, 2).join(' & ') || 'General Fitness',
      chartData,
    })
  }, [aboutYou, metrics, setPlanPreview])
  
  const { planPreview } = useOnboardingStore()
  
  const chartData = planPreview.chartData.length > 0 ? planPreview.chartData : [
    { week: 0, weight: 66, date: 'Today' },
    { week: 12, weight: 59, date: '12 weeks' },
  ]
  
  const maxWeight = Math.max(...chartData.map(d => d.weight))
  const minWeight = Math.min(...chartData.map(d => d.weight))
  const range = maxWeight - minWeight || 1
  
  // Create wavy path with 2 waves
  const createWavyPath = (points: Array<{ x: number; y: number; weight: number; date: string }>) => {
    if (points.length < 2) return ''
    
    const totalWidth = 400
    const waveAmplitude = 15 // Height of waves
    const numWaves = 2
    
    // Create points with waves
    const wavyPoints = points.map((point, i) => {
      const progress = i / (points.length - 1)
      
      // Add 2 waves to the y position
      let waveOffset = 0
      if (progress < 0.5) {
        // First wave in first half
        const waveProgress = progress * 2 // 0 to 1 for first half
        waveOffset = Math.sin(waveProgress * Math.PI * numWaves) * waveAmplitude
      } else {
        // Second wave in second half
        const waveProgress = (progress - 0.5) * 2 // 0 to 1 for second half
        waveOffset = Math.sin(waveProgress * Math.PI * numWaves) * waveAmplitude
      }
      
      return {
        x: point.x,
        y: point.y + waveOffset,
        weight: point.weight,
        date: point.date
      }
    })
    
    // Create smooth path through wavy points
    let path = `M ${wavyPoints[0].x},${wavyPoints[0].y}`
    
    for (let i = 0; i < wavyPoints.length - 1; i++) {
      const p0 = wavyPoints[i]
      const p1 = wavyPoints[i + 1]
      
      // Control points for smooth curve
      const cp1x = p0.x + (p1.x - p0.x) / 3
      const cp1y = p0.y
      const cp2x = p1.x - (p1.x - p0.x) / 3
      const cp2y = p1.y
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`
    }
    
    return path
  }
  
  const chartPoints = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * 400
    const y = 200 - ((d.weight - minWeight) / range) * 180
    return { x, y, weight: d.weight, date: d.date }
  })
  
  const smoothPath = createWavyPath(chartPoints)
  const areaPath = `${smoothPath} L 400,200 L 0,200 Z`
  
  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex flex-col justify-start" style={{ paddingTop: '29.76px' }}>
        <h2 className="font-plus-jakarta text-[40px] font-bold leading-[48px] mb-2 text-center text-gray-800">
          Your step-by-step wellness journey
        </h2>
        <p className="text-sm text-gray-600 text-center mb-8">
          We&apos;ll create a plan to help you reach your goal of: {planPreview.goalLabel}
        </p>
        
        <div className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-100">
          <div className="h-48 relative">
            {/* Chart */}
            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FBC7D4" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#CAB7FA" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#5630B0" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FBC7D4" />
                  <stop offset="50%" stopColor="#CAB7FA" />
                  <stop offset="100%" stopColor="#5630B0" />
                </linearGradient>
              </defs>
              
              {/* Area under the chart */}
              <path
                d={areaPath}
                fill="url(#areaGradient)"
              />
              
              {/* Smooth chart line */}
              <path
                d={smoothPath}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* Weight labels */}
            {chartPoints.filter((_, i) => i === 0 || i === chartPoints.length - 1).map((point, idx) => {
              const i = idx === 0 ? 0 : chartPoints.length - 1
              return (
                <div
                  key={i}
                  className="absolute bg-primary text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap"
                  style={{
                    left: `${(point.x / 400) * 100}%`,
                    top: `${(point.y / 200) * 100}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  {point.weight.toFixed(1)} kg by {point.date}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Disclaimer text */}
        <div className="mb-4">
          <p className="text-xs text-gray-600 text-center leading-relaxed px-4">
            *This estimate is based on tracked user progress. Check with your physician before starting. Following exercises, your plan, and meal plan impacts results.
          </p>
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
