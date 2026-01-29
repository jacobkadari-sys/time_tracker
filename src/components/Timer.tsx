'use client'

import { useState, useEffect, useCallback } from 'react'

type TimerState = {
  isRunning: boolean
  startTime: number | null
  clientId: string
  clientName: string
  categoryId: string
  categoryName: string
}

type Client = {
  id: string
  name: string
}

type Category = {
  id: string
  name: string
}

type TimerProps = {
  clients: Client[]
  categories: Category[]
  onTimerStop: (hours: number, clientId: string, categoryId: string) => void
}

const STORAGE_KEY = 'dog-timer-state'
const LONG_TIMER_WARNING_MS = 4 * 60 * 60 * 1000 // 4 hours

export function Timer({ clients, categories, onTimerStop }: TimerProps) {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    clientId: '',
    clientName: '',
    categoryId: '',
    categoryName: ''
  })
  const [elapsed, setElapsed] = useState(0)
  const [showSetup, setShowSetup] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showWarning, setShowWarning] = useState(false)

  // Load timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TimerState
        if (parsed.isRunning && parsed.startTime) {
          setTimerState(parsed)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save timer state to localStorage
  useEffect(() => {
    if (timerState.isRunning) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [timerState])

  // Update elapsed time every second
  useEffect(() => {
    if (!timerState.isRunning || !timerState.startTime) return

    const interval = setInterval(() => {
      const now = Date.now()
      const newElapsed = now - timerState.startTime!
      setElapsed(newElapsed)

      // Show warning if timer is running too long
      if (newElapsed > LONG_TIMER_WARNING_MS && !showWarning) {
        setShowWarning(true)
      }
    }, 1000)

    // Set initial elapsed
    setElapsed(Date.now() - timerState.startTime)

    return () => clearInterval(interval)
  }, [timerState.isRunning, timerState.startTime, showWarning])

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  const formatHours = useCallback((ms: number) => {
    return (ms / (1000 * 60 * 60)).toFixed(2)
  }, [])

  const handleStartTimer = () => {
    if (!selectedClient || !selectedCategory) return

    const client = clients.find(c => c.id === selectedClient)
    const category = categories.find(c => c.id === selectedCategory)

    if (!client || !category) return

    setTimerState({
      isRunning: true,
      startTime: Date.now(),
      clientId: selectedClient,
      clientName: client.name,
      categoryId: selectedCategory,
      categoryName: category.name
    })
    setShowSetup(false)
    setShowWarning(false)
  }

  const handleStopTimer = () => {
    if (!timerState.startTime) return

    const hours = parseFloat(formatHours(elapsed))
    onTimerStop(hours, timerState.clientId, timerState.categoryId)

    setTimerState({
      isRunning: false,
      startTime: null,
      clientId: '',
      clientName: '',
      categoryId: '',
      categoryName: ''
    })
    setElapsed(0)
    setShowWarning(false)
  }

  const handleCancelTimer = () => {
    setTimerState({
      isRunning: false,
      startTime: null,
      clientId: '',
      clientName: '',
      categoryId: '',
      categoryName: ''
    })
    setElapsed(0)
    setShowWarning(false)
  }

  // Timer is running - show timer display
  if (timerState.isRunning) {
    return (
      <div className="card-retro bg-dog-green text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-80">TIMER RUNNING</div>
            <div className="text-3xl font-mono font-bold">{formatTime(elapsed)}</div>
            <div className="text-sm mt-1">
              {timerState.clientName} / {timerState.categoryName}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStopTimer}
              className="px-4 py-2 bg-white text-dog-green font-bold border-2 border-dog-brown hover:bg-dog-cream"
            >
              STOP
            </button>
            <button
              onClick={handleCancelTimer}
              className="px-3 py-2 bg-transparent text-white font-bold border-2 border-white hover:bg-white hover:text-dog-green"
              title="Cancel without saving"
            >
              ✕
            </button>
          </div>
        </div>
        {showWarning && (
          <div className="mt-3 p-2 bg-dog-orange text-white text-sm border-2 border-dog-brown">
            Timer has been running for over 4 hours. Remember to stop it!
          </div>
        )}
      </div>
    )
  }

  // Setup mode - choosing client and category
  if (showSetup) {
    return (
      <div className="card-retro p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-dog-brown">Start Timer</h3>
          <button
            onClick={() => setShowSetup(false)}
            className="text-dog-brown hover:text-dog-orange"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-dog-brown mb-1">CLIENT</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="select-retro w-full"
            >
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-dog-brown mb-1">CATEGORY</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2 text-sm font-bold border-2 border-dog-brown transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-dog-orange text-white shadow-none'
                      : 'bg-white text-dog-brown shadow-retro-sm hover:bg-dog-cream'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartTimer}
            disabled={!selectedClient || !selectedCategory}
            className="btn-primary w-full disabled:opacity-50"
          >
            START TIMER
          </button>
        </div>
      </div>
    )
  }

  // Default - show start button
  return (
    <button
      onClick={() => setShowSetup(true)}
      className="card-retro p-3 w-full text-center hover:bg-dog-cream transition-colors group"
    >
      <span className="text-dog-brown group-hover:text-dog-orange font-bold">
        + START TIMER
      </span>
      <span className="block text-xs text-dog-brown opacity-60 mt-1">
        Track time automatically
      </span>
    </button>
  )
}
