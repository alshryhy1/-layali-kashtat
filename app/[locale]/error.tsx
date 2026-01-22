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
    console.error('Page Error:', error)
  }, [error])

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>Something went wrong!</h2>
      <div style={{ color: 'red', margin: '20px 0' }}>
        {error.message || 'Unknown error'}
      </div>
      <button
        onClick={() => reset()}
        style={{
          padding: '10px 20px',
          background: '#000',
          color: '#fff',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  )
}
