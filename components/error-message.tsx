'use client'

import { useEffect, useState } from 'react'

interface ErrorMessageProps {
  error: string | null
  onDismiss?: () => void
  autoDismiss?: boolean
  autoDismissDelay?: number
}

export function ErrorMessage({ 
  error, 
  onDismiss, 
  autoDismiss = false, 
  autoDismissDelay = 5000 
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      
      if (autoDismiss) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          onDismiss?.()
        }, autoDismissDelay)

        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [error, autoDismiss, autoDismissDelay, onDismiss])

  if (!error || !isVisible) {
    return null
  }

  return (
    <div 
      className="p-4 border border-destructive rounded-md bg-destructive/10"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start justify-between">
        <p className="text-destructive text-sm">{error}</p>
        {onDismiss && (
          <button
            onClick={() => {
              setIsVisible(false)
              onDismiss()
            }}
            className="ml-4 text-destructive hover:text-destructive/80"
            aria-label="Dismiss error message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
