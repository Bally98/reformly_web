'use client'

import { useState, useRef, useEffect } from 'react'
import Button from '../Button'
import { useOnboardingStore } from '@/lib/store'
import { verifyEmailOtp, getAuthMe, sendEmailOtp } from '@/lib/api'
import { ensureFirebaseUser } from '@/lib/firebase'

interface Step2OTPProps {
  onNext: () => void
  onBack: () => void
}

export default function Step2OTP({ onNext }: Step2OTPProps) {
  const [codes, setCodes] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(90) // 90 seconds = 1:30
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { auth, setAuth, setProfile } = useOnboardingStore()
  
  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return
    
    const newCodes = [...codes]
    newCodes[index] = value
    setCodes(newCodes)
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }
  
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pasted)) {
      const newCodes = pasted.split('').concat(Array(6 - pasted.length).fill(''))
      setCodes(newCodes.slice(0, 6))
      inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }
  
  const handleContinue = async () => {
    const code = codes.join('')
    if (code.length !== 6) return
    
    setError(null)
    setIsLoading(true)
    
    try {
      console.log('[Step2OTP] Starting OTP verification for email:', auth.email)
      
      // Verify OTP - Firebase errors are handled gracefully, won't break the flow
      const result = await verifyEmailOtp(auth.email, code)
      
      console.log('[Step2OTP] OTP verification result:', { ok: result.ok, hasData: !!result.data, error: result.error })
      
      if (result.ok && result.data) {
        console.log('[Step2OTP] OTP verified successfully, updating auth state')
        
        // Mark as verified FIRST - this is critical for navigation
        setAuth({ isVerified: true })
        
        // Fetch user data from /auth/me (optional, don't block on errors)
        try {
          const meResult = await getAuthMe()
          if (meResult.ok && meResult.data) {
            console.log('[Step2OTP] User data fetched successfully')
            setProfile({
              username: meResult.data.username || '',
              bio: meResult.data.bio || '',
              name: meResult.data.name || '',
            })
          }
        } catch (meError) {
          // Non-critical error, log but continue
          console.warn('[Step2OTP] Failed to fetch user data, continuing:', meError)
        }
        
        // Proceed to next step - use setTimeout to ensure state update is processed
        // React state updates are asynchronous, so we need to wait a bit
        console.log('[Step2OTP] Calling onNext() to proceed to next step')
        setTimeout(() => {
          onNext()
        }, 0)
      } else {
        console.error('[Step2OTP] OTP verification failed:', result.error)
        setError(result.error || 'Invalid verification code')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('[Step2OTP] Exception during OTP verification:', error)
      setError('Failed to verify code. Please try again.')
      setIsLoading(false)
    }
  }
  
  const handleResend = async () => {
    if (resendTimer > 0) return
    
    setError(null)
    setIsLoading(true)
    try {
      await ensureFirebaseUser()
      const result = await sendEmailOtp(auth.email)
      if (result.ok) {
        setResendTimer(90) // Reset timer to 90 seconds
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (error) {
      console.error('Failed to resend OTP:', error)
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="flex flex-col h-full px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col justify-start" style={{ paddingTop: '29.76px' }}>
        <h2 className="font-plus-jakarta text-2xl sm:text-3xl md:text-[40px] font-bold leading-tight sm:leading-[48px] mb-6 sm:mb-8 text-center text-gray-800 px-2">
          Verification code
        </h2>
        
        <div className="flex gap-2 sm:gap-3 justify-center mb-6 sm:mb-8 px-2">
          {codes.map((code, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        <div className="text-center text-sm text-gray-600 mb-4">
          {resendTimer > 0 ? (
            <span>Resend Code in {formatTimer(resendTimer)}</span>
          ) : (
            <button
              className="text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleResend}
              disabled={isLoading}
            >
              Resend Code
            </button>
          )}
        </div>
        
        {error && (
          <p className="text-xs text-red-500 mb-4 text-center">{error}</p>
        )}
        
        <div className="mt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleContinue}
            isLoading={isLoading}
            disabled={codes.join('').length !== 6}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
