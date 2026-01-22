'use client'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 40, fontFamily: 'system-ui' }}>
          <h2>Something went wrong!</h2>
          <pre style={{ color: 'red', background: '#eee', padding: 20 }}>
            {error.message}
          </pre>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  )
}
