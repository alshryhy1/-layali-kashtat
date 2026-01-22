'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div style={{ 
      padding: 40, 
      textAlign: 'center', 
      minHeight: '50vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong!</h2>
      <div style={{ 
        padding: 16, 
        background: '#fee2e2', 
        border: '1px solid #ef4444', 
        borderRadius: 8, 
        color: '#b91c1c',
        marginBottom: 24,
        maxWidth: 600
      }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{error.message || 'Unknown error occurred'}</p>
        {error.digest && (
          <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.8 }}>
            Error Digest: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        style={{
            padding: '12px 24px',
            background: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14
        }}
      >
        Try again
      </button>
    </div>
  )
}
