'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { formatDateISO, formatHours, getWeekRange } from '@/lib/utils'
import { ClientSearch } from '@/components/ClientSearch'

type Client = {
  id: string
  name: string
  isSystem?: boolean
  projects: { id: string; name: string }[]
}

type Category = {
  id: string
  name: string
}

type TimeEntry = {
  id: string
  date: string
  hours: string
  whatDidYouDo: string
  whatGotCompleted: string | null
  status: string
  client: { id: string; name: string }
  project: { id: string; name: string } | null
  category: { id: string; name: string }
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([])
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('CONTRACTOR')

  // Category editing state
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategories, setEditingCategories] = useState<string[]>([])
  const [savingCategories, setSavingCategories] = useState(false)

  // Form state
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [hours, setHours] = useState('0.0')
  const [whatDidYouDo, setWhatDidYouDo] = useState('')
  const [whatGotCompleted, setWhatGotCompleted] = useState('')
  const [saving, setSaving] = useState(false)

  // Memoize date values to prevent unnecessary re-renders
  const { today, weekStartStr, weekEndStr } = useMemo(() => {
    const { start, end } = getWeekRange()
    return {
      today: formatDateISO(new Date()),
      weekStartStr: formatDateISO(start),
      weekEndStr: formatDateISO(end)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [clientsRes, categoriesRes, allCatsRes, entriesRes, userRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/categories'),
        fetch('/api/my-categories'),
        fetch(`/api/time-entries?startDate=${weekStartStr}&endDate=${weekEndStr}`),
        fetch('/api/auth/me')
      ])

      // Safely parse JSON, falling back to sensible defaults
      const safeJson = async (res: Response, fallback: unknown) => {
        if (!res.ok) return fallback
        try {
          return await res.json()
        } catch {
          return fallback
        }
      }

      const [clientsData, categoriesData, allCatsData, entriesData, userData] = await Promise.all([
        safeJson(clientsRes, []),
        safeJson(categoriesRes, []),
        safeJson(allCatsRes, { available: [] }),
        safeJson(entriesRes, []),
        safeJson(userRes, { role: 'CONTRACTOR' })
      ])

      setClients(clientsData)
      setCategories(categoriesData)
      if (allCatsData.available) {
        setAllCategories(allCatsData.available)
      }
      setUserRole(userData.role || 'CONTRACTOR')

      const allEntries = entriesData as TimeEntry[]
      setWeekEntries(allEntries)
      setTodayEntries(allEntries.filter((e: TimeEntry) => e.date.split('T')[0] === today))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [today, weekStartStr, weekEndStr])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addHours = (amount: number) => {
    const current = parseFloat(hours) || 0
    const newValue = Math.max(0, current + amount)
    setHours(newValue.toFixed(1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !selectedCategory || parseFloat(hours) <= 0 || !whatDidYouDo) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          clientId: selectedClient,
          projectId: selectedProject || null,
          categoryId: selectedCategory,
          hours,
          whatDidYouDo,
          whatGotCompleted
        })
      })

      if (res.ok) {
        // Reset form
        setHours('0.0')
        setWhatDidYouDo('')
        setWhatGotCompleted('')
        // Refresh entries
        fetchData()
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const repeatEntry = (entry: TimeEntry) => {
    setSelectedClient(entry.client.id)
    setSelectedProject(entry.project?.id || '')
    setSelectedCategory(entry.category.id)
    setWhatDidYouDo(entry.whatDidYouDo)
    setWhatGotCompleted(entry.whatGotCompleted || '')
  }

  const openCategoryModal = () => {
    setEditingCategories(categories.map(c => c.id))
    setShowCategoryModal(true)
  }

  const toggleEditCategory = (catId: string) => {
    setEditingCategories(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId)
      }
      if (prev.length >= 4) {
        return prev // Max 4
      }
      return [...prev, catId]
    })
  }

  const saveCategories = async () => {
    if (editingCategories.length === 0) return
    setSavingCategories(true)
    try {
      const res = await fetch('/api/my-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: editingCategories })
      })
      if (res.ok) {
        setShowCategoryModal(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to save categories:', error)
    } finally {
      setSavingCategories(false)
    }
  }

  const selectedClientData = clients.find(c => c.id === selectedClient)
  const todayTotal = todayEntries.reduce((sum, e) => sum + parseFloat(e.hours), 0)
  const weekTotal = weekEntries.reduce((sum, e) => sum + parseFloat(e.hours), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-dog-brown">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-dog-brown">⏱ Log Time</h1>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="card-retro text-center px-3 sm:px-4 py-2 flex-1 sm:flex-none">
            <div className="text-xs text-dog-brown opacity-70">TODAY</div>
            <div className="text-lg sm:text-xl font-bold text-dog-orange">{formatHours(todayTotal)}</div>
          </div>
          <div className="card-retro text-center px-3 sm:px-4 py-2 flex-1 sm:flex-none">
            <div className="text-xs text-dog-brown opacity-70">THIS WEEK</div>
            <div className="text-lg sm:text-xl font-bold text-dog-green">{formatHours(weekTotal)}</div>
          </div>
        </div>
      </div>

      {/* Reminder banner */}
      {todayEntries.length === 0 && (
        <div className="bg-dog-orange text-white p-3 border-2 border-dog-brown shadow-retro">
          <strong>⚡ You haven&apos;t logged any time today!</strong> Log your hours to keep track.
        </div>
      )}

      {/* Main logging form */}
      <form onSubmit={handleSubmit} className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ NEW TIME ENTRY
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {/* Client - Searchable */}
            <ClientSearch
              clients={clients}
              selectedClient={selectedClient}
              onClientSelect={(id) => {
                setSelectedClient(id)
                setSelectedProject('')
              }}
              userRole={userRole}
              onClientCreated={fetchData}
            />

            {/* Project (optional) */}
            {selectedClientData && selectedClientData.projects.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-1">PROJECT (optional)</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="select-retro"
                >
                  <option value="">No project</option>
                  {selectedClientData.projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Category - Big buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-dog-brown">CATEGORY *</label>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="text-xs text-dog-orange hover:underline font-bold"
                >
                  ✎ EDIT
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`category-btn ${selectedCategory === cat.id ? 'selected' : ''}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {categories.length === 0 && (
                <p className="text-sm text-dog-red mt-1">
                  No categories assigned.{' '}
                  <button type="button" onClick={openCategoryModal} className="underline hover:text-dog-orange">
                    Set up your categories
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Hours with quick-add */}
            <div>
              <label className="block text-sm font-bold text-dog-brown mb-1">HOURS *</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="input-retro w-24 text-center text-xl font-bold"
                  required
                />
                <span className="text-2xl font-bold text-dog-brown">h</span>
              </div>
              <div className="grid grid-cols-4 gap-1 sm:flex sm:gap-2">
                <button type="button" onClick={() => addHours(0.1)} className="quick-add-btn text-xs sm:text-sm">+0.1h</button>
                <button type="button" onClick={() => addHours(0.25)} className="quick-add-btn text-xs sm:text-sm">+0.25h</button>
                <button type="button" onClick={() => addHours(0.5)} className="quick-add-btn text-xs sm:text-sm">+0.5h</button>
                <button type="button" onClick={() => addHours(1.0)} className="quick-add-btn text-xs sm:text-sm">+1.0h</button>
              </div>
            </div>

            {/* What did you do */}
            <div>
              <label className="block text-sm font-bold text-dog-brown mb-1">WHAT DID YOU DO? *</label>
              <input
                type="text"
                value={whatDidYouDo}
                onChange={(e) => setWhatDidYouDo(e.target.value)}
                className="input-retro"
                placeholder="Brief description of work..."
                required
              />
            </div>

            {/* What got completed */}
            <div>
              <label className="block text-sm font-bold text-dog-brown mb-1">WHAT GOT COMPLETED? (optional)</label>
              <input
                type="text"
                value={whatGotCompleted}
                onChange={(e) => setWhatGotCompleted(e.target.value)}
                className="input-retro"
                placeholder="Deliverable or outcome..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 pt-4 border-t-2 border-dashed border-dog-tan">
          <button
            type="submit"
            disabled={saving || !selectedClient || !selectedCategory || parseFloat(hours) <= 0 || !whatDidYouDo}
            className="btn-primary w-full md:w-auto"
          >
            {saving ? '⏳ SAVING...' : '✓ LOG TIME'}
          </button>
        </div>
      </form>

      {/* Today's entries */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ TODAY&apos;S ENTRIES ({todayEntries.length})
        </h2>

        {todayEntries.length === 0 ? (
          <p className="text-dog-brown opacity-70">No entries yet today.</p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map(entry => (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-dog-cream border border-dog-tan gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="font-bold text-dog-orange">{formatHours(parseFloat(entry.hours))}</span>
                    <span className="text-dog-brown truncate">{entry.client.name}</span>
                    {entry.project && (
                      <span className="text-dog-brown opacity-70 hidden sm:inline">→ {entry.project.name}</span>
                    )}
                    <span className="badge bg-dog-tan text-dog-brown text-xs">{entry.category.name}</span>
                  </div>
                  <p className="text-sm text-dog-brown mt-1 truncate">{entry.whatDidYouDo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => repeatEntry(entry)}
                  className="btn-secondary btn-small self-end sm:self-center"
                  title="Copy to form"
                >
                  ↻ REPEAT
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent entries (for repeat) */}
      {weekEntries.length > todayEntries.length && (
        <div className="card-retro">
          <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
            ▸ RECENT ENTRIES (click to repeat)
          </h2>
          <div className="flex flex-wrap gap-2">
            {/* Get unique client/category combos from this week */}
            {Array.from(new Set(weekEntries.map(e => `${e.client.id}|${e.category.id}`))).slice(0, 6).map(key => {
              const entry = weekEntries.find(e => `${e.client.id}|${e.category.id}` === key)!
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => repeatEntry(entry)}
                  className="quick-add-btn"
                >
                  {entry.client.name} / {entry.category.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {/* Category Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card-retro max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
              ▸ EDIT YOUR CATEGORIES
            </h2>
            <p className="text-sm text-dog-brown mb-4">
              Select up to 4 categories for your time entries. You can change these anytime.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {allCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleEditCategory(cat.id)}
                  className={`p-2 text-center text-sm font-bold border-2 border-dog-brown transition-all ${editingCategories.includes(cat.id)
                    ? 'bg-dog-green text-white shadow-none translate-x-0.5 translate-y-0.5'
                    : 'bg-white text-dog-brown shadow-retro-sm hover:bg-dog-cream'
                    } ${editingCategories.length >= 4 && !editingCategories.includes(cat.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={editingCategories.length >= 4 && !editingCategories.includes(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {allCategories.length === 0 && (
              <p className="text-sm text-dog-brown opacity-70 mb-4">
                No categories available. Contact admin to set up categories.
              </p>
            )}
            <p className="text-xs text-dog-brown mb-4">
              {editingCategories.length}/4 selected
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="btn-secondary flex-1"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={saveCategories}
                disabled={savingCategories || editingCategories.length === 0}
                className="btn-primary flex-1"
              >
                {savingCategories ? '⏳ SAVING...' : '✓ SAVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
