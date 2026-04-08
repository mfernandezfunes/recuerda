import { useRef, useState, useCallback, useEffect } from 'react'

export function useActivityTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const accumulatedRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)

  const tick = useCallback(() => {
    if (!runningRef.current || startTimeRef.current === null) return
    const now = Date.now()
    const elapsed = Math.floor((now - startTimeRef.current + accumulatedRef.current * 1000) / 1000)
    setElapsedSeconds(elapsed)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const startTimer = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true
    startTimeRef.current = Date.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stopTimer = useCallback((): number => {
    if (!runningRef.current) return elapsedSeconds
    runningRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (startTimeRef.current !== null) {
      accumulatedRef.current += (Date.now() - startTimeRef.current) / 1000
      startTimeRef.current = null
    }
    const total = Math.floor(accumulatedRef.current)
    setElapsedSeconds(total)
    return total
  }, [elapsedSeconds])

  // Pause when tab goes to background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (runningRef.current && startTimeRef.current !== null) {
          accumulatedRef.current += (Date.now() - startTimeRef.current) / 1000
          startTimeRef.current = null
          if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
          }
        }
      } else {
        if (runningRef.current) {
          startTimeRef.current = Date.now()
          rafRef.current = requestAnimationFrame(tick)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [tick])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return { startTimer, stopTimer, elapsedSeconds }
}
