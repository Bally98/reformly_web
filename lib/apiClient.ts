import { getFirebaseIdToken } from './firebase'

// Support both NEXT_PUBLIC_API_BASE_URL and API_BASE_URL for backward compatibility
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || ''

// Warn if using deprecated API_BASE_URL
if (process.env.API_BASE_URL && !process.env.NEXT_PUBLIC_API_BASE_URL && typeof window !== 'undefined') {
  console.warn('Using deprecated API_BASE_URL. Please use NEXT_PUBLIC_API_BASE_URL instead for Next.js client-side access.')
}

export interface ApiError {
  message: string
  status?: number
}

export class ApiClientError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

interface RequestOptions extends RequestInit {
  useFirebaseToken?: boolean
  skipAuth?: boolean
}

// Get backend access token from localStorage
const getBackendAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('backendAccessToken')
    return stored
  } catch (error) {
    console.error('Failed to get backend access token:', error)
    return null
  }
}

// Get backend refresh token from localStorage
const getBackendRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('backendRefreshToken')
    return stored
  } catch (error) {
    console.error('Failed to get backend refresh token:', error)
    return null
  }
}

// Store backend tokens in localStorage
export const setBackendTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('backendAccessToken', accessToken)
    localStorage.setItem('backendRefreshToken', refreshToken)
  } catch (error) {
    console.error('Failed to store backend tokens:', error)
  }
}

// Clear backend tokens
export const clearBackendTokens = (): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('backendAccessToken')
    localStorage.removeItem('backendRefreshToken')
  } catch (error) {
    console.error('Failed to clear backend tokens:', error)
  }
}

// Determine which token to use based on endpoint
const getAuthToken = async (url: string, options: RequestOptions): Promise<string | null> => {
  if (options.skipAuth) {
    return null
  }

  // Use Firebase token for auth endpoints
  if (options.useFirebaseToken || url.includes('/auth/request-otp') || url.includes('/auth/verify-otp')) {
    try {
      return await getFirebaseIdToken(false)
    } catch (error) {
      // If Firebase token fails, continue without it - backend may not require it
      // This prevents Firebase errors from breaking the flow
      console.warn('Failed to get Firebase token, continuing without it:', error)
      return null
    }
  }

  // Use backend access token for other endpoints
  return getBackendAccessToken()
}

export const apiClient = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  if (!API_BASE_URL) {
    console.error('API_BASE_URL is not set. Please check your .env file.')
    throw new ApiClientError('API base URL is not configured')
  }
  
  const url = `${API_BASE_URL}${endpoint}`
  
  const token = await getAuthToken(url, options)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Log request details
  console.log('[apiClient] Request:', {
    method: options.method || 'GET',
    url,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    hasBody: !!options.body,
    bodyPreview: options.body ? (typeof options.body === 'string' ? options.body.substring(0, 200) : 'object') : null,
  })

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })
    
    console.log('[apiClient] Response status:', response.status, response.statusText)

    // Handle 401 - token expired
    if (response.status === 401 && !options.useFirebaseToken) {
      // Try to refresh token if we have a refresh token
      const refreshToken = getBackendRefreshToken()
      if (refreshToken) {
        // Note: If refresh endpoint exists, implement it here
        // For now, just clear tokens and let user re-authenticate
        clearBackendTokens()
        throw new ApiClientError('Session expired. Please sign in again.', 401)
      }
      clearBackendTokens()
      throw new ApiClientError('Unauthorized', 401)
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`
      let errorData: any = null
      try {
        errorData = await response.json()
        console.error('[apiClient] Error response body:', JSON.stringify(errorData, null, 2))
        errorMessage = errorData.message || errorData.error || errorMessage
        // If errorData is an array, join it
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ')
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message
        }
      } catch {
        // If response is not JSON, use status text
        const text = await response.text()
        console.error('[apiClient] Error response (non-JSON):', text)
        errorMessage = response.statusText || errorMessage
      }
      throw new ApiClientError(errorMessage, response.status)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.log('[apiClient] Response is not JSON, returning empty object')
      return {} as T
    }

    const data = await response.json()
    console.log('[apiClient] Response data:', JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }
    throw new ApiClientError(error instanceof Error ? error.message : 'Network error')
  }
}

