import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface OnboardingState {
  // Auth
  auth: {
    email: string
    provider: 'email' | 'google' | null
    isVerified: boolean
  }
  
  // About You
  aboutYou: {
    sex: 'male' | 'female' | 'other' | null
    birthday: Date | null
    mainGoal: string | null
    activities: string[]
  }
  
  // Metrics
  metrics: {
    height: {
      value: number | null
      unit: 'cm' | 'in'
    }
    currentWeight: {
      value: number | null
      unit: 'kg' | 'lb'
    }
    bmi: {
      value: number | null
      category: 'underweight' | 'normal' | 'overweight' | 'obese' | null
    }
    goalWeight: {
      value: number | null
      unit: 'kg' | 'lb'
    }
  }
  
  // Rating
  rating: {
    stars: number | null
    dismissed: boolean
  }
  
  // Plan Preview
  planPreview: {
    durationWeeks: number | null
    goalLabel: string | null
    interestsLabel: string | null
    chartData: Array<{ week: number; weight: number; date: string }>
  }
  
  // Subscription
  subscription: {
    selectedPlanId: string | null
    selectedPlanLabel: string | null
    isSubscribed: boolean
  }
  
  // Profile
  profile: {
    username: string
    bio: string
    name: string
  }
  
  // Actions
  setAuth: (auth: Partial<OnboardingState['auth']>) => void
  setAboutYou: (aboutYou: Partial<OnboardingState['aboutYou']>) => void
  setMetrics: (metrics: Partial<OnboardingState['metrics']>) => void
  setRating: (rating: Partial<OnboardingState['rating']>) => void
  setPlanPreview: (planPreview: Partial<OnboardingState['planPreview']>) => void
  setSubscription: (subscription: Partial<OnboardingState['subscription']>) => void
  setProfile: (profile: Partial<OnboardingState['profile']>) => void
  reset: () => void
  getAllData: () => any
}

const initialState = {
  auth: {
    email: '',
    provider: null,
    isVerified: false,
  },
  aboutYou: {
    sex: null,
    birthday: null,
    mainGoal: null,
    activities: [],
  },
  metrics: {
    height: {
      value: null,
      unit: 'cm' as const,
    },
    currentWeight: {
      value: null,
      unit: 'kg' as const,
    },
    bmi: {
      value: null,
      category: null,
    },
    goalWeight: {
      value: null,
      unit: 'kg' as const,
    },
  },
  rating: {
    stars: null,
    dismissed: false,
  },
  planPreview: {
    durationWeeks: null,
    goalLabel: null,
    interestsLabel: null,
    chartData: [],
  },
  subscription: {
    selectedPlanId: null,
    selectedPlanLabel: null,
    isSubscribed: false,
  },
  profile: {
    username: '',
    bio: '',
    name: '',
  },
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setAuth: (auth) => set((state) => ({ auth: { ...state.auth, ...auth } })),
      setAboutYou: (patch) =>
        set((state) => {
          // Handle Date conversion if birthday comes as string from localStorage
          const processedPatch = { ...patch }
          if (processedPatch.birthday && typeof processedPatch.birthday === 'string') {
            processedPatch.birthday = new Date(processedPatch.birthday)
          }
          return {
            aboutYou: { ...state.aboutYou, ...processedPatch },
          }
        }),
      setMetrics: (metrics) => set((state) => ({ 
        metrics: { 
          ...state.metrics, 
          ...metrics,
          height: metrics.height ? { ...state.metrics.height, ...metrics.height } : state.metrics.height,
          currentWeight: metrics.currentWeight ? { ...state.metrics.currentWeight, ...metrics.currentWeight } : state.metrics.currentWeight,
          bmi: metrics.bmi ? { ...state.metrics.bmi, ...metrics.bmi } : state.metrics.bmi,
          goalWeight: metrics.goalWeight ? { ...state.metrics.goalWeight, ...metrics.goalWeight } : state.metrics.goalWeight,
        } 
      })),
      setRating: (rating) => set((state) => ({ rating: { ...state.rating, ...rating } })),
      setPlanPreview: (planPreview) => set((state) => ({ planPreview: { ...state.planPreview, ...planPreview } })),
      setSubscription: (subscription) => set((state) => ({ subscription: { ...state.subscription, ...subscription } })),
      setProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
      
      reset: () => set(initialState),
      
      getAllData: () => {
        const state = get()
        return {
          auth: state.auth,
          aboutYou: {
            ...state.aboutYou,
            birthday: state.aboutYou.birthday?.toISOString() || null,
          },
          metrics: state.metrics,
          rating: state.rating,
          planPreview: state.planPreview,
          subscription: state.subscription,
          profile: state.profile,
        }
      },
    }),
    {
      name: 'onboarding-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      // Handle Date serialization/deserialization
      partialize: (state) => {
        // Convert Date to ISO string for storage
        const serialized = { ...state }
        if (serialized.aboutYou?.birthday instanceof Date) {
          return {
            ...serialized,
            aboutYou: {
              ...serialized.aboutYou,
              birthday: serialized.aboutYou.birthday.toISOString(),
            },
          }
        }
        return serialized
      },
      // Restore Date objects from ISO strings
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[OnboardingStore] Error rehydrating from storage:', error)
          return
        }
        if (state?.aboutYou?.birthday && typeof state.aboutYou.birthday === 'string') {
          console.log('[OnboardingStore] Converting birthday string to Date:', state.aboutYou.birthday)
          state.aboutYou.birthday = new Date(state.aboutYou.birthday)
        }
        console.log('[OnboardingStore] Rehydrated state:', {
          hasMainGoal: !!state?.aboutYou?.mainGoal,
          hasHeight: !!state?.metrics?.height?.value,
          hasName: !!state?.profile?.name,
          hasWeight: !!state?.metrics?.currentWeight?.value,
        })
      },
    }
  )
)
