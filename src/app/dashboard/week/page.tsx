'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDateISO, formatDateShort, formatHours, getWeekRange, formatCurrency } from '@/lib/utils'

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

type DateInfo = {
  weekStart: Date
  weekEnd: Date
  weekStartStr: string
  weekEndStr: string
}

export default function WeekPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null)

  // Calculate dates only on client to avoid SSR timezone issues
  useEffect(() => {
    const { start, end } = getWeekRange()
    setDateInfo({
      weekStart: start,
      weekEnd: end,
      weekStartStr: formatDateISO(start),
      weekEndStr: formatDateISO(end)
    })
  }, [])

  const weekStart = dateInfo?.weekStart || new Date()
  const weekEnd = dateInfo?.weekEnd || new Date()
  const weekStartStr = dateInfo?.weekStartStr || ''
  const weekEndStr = dateInfo?.weekEndStr || ''

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/time-entries?startDate=${weekStartStr}&endDate=${weekEndStr}`
      )
      const data = await res.json()
      setEntries(data)
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }, [weekStartStr, weekEndStr])

  useEffect(() => {
    // Only fetch after dates are calculated on client
    if (dateInfo) {
      fetchEntries()
    }
  }, [fetchEntries, dateInfo])

  const handleSubmitWeek = async () => {
    if (entries.length === 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: weekStartStr,
          periodEnd: weekEndStr
        })
      })

      if (res.ok) {
        const invoice = await res.json()
        window.location.href = `/dashboard/invoices/${invoice.id}`
      }
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = entry.date.split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  // Group by client for summary
  const entriesByClient = entries.reduce((acc, entry) => {
    const clientName = entry.client.name
    if (!acc[clientName]) acc[clientName] = { hours: 0, entries: [] }
    acc[clientName].hours += parseFloat(entry.hours)
    acc[clientName].entries.push(entry)
    return acc
  }, {} as Record<string, { hours: number; entries: TimeEntry[] }>)

  const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours), 0)
  const draftEntries = entries.filter(e => e.status === 'DRAFT')
  const submittedEntries = entries.filter(e => e.status !== 'DRAFT')

  // Generate days of the week
  const weekDays = []
  const d = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    weekDays.push(formatDateISO(d))
    d.setDate(d.getDate() + 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-dog-brown">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dog-brown">▸ This Week</h1>
          <p className="text-dog-brown opacity-70">
            {formatDateShort(weekStart)} - {formatDateShort(weekEnd)}
          </p>
        </div>
        <div className="card-retro text-center px-6 py-3">
          <div className="text-xs text-dog-brown opacity-70">TOTAL HOURS</div>
          <div className="text-3xl font-bold text-dog-green">{formatHours(totalHours)}</div>
        </div>
      </div>

      {/* Week calendar view */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ DAILY BREAKDOWN
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const dayEntries = entriesByDate[day] || []
            const dayTotal = dayEntries.reduce((sum, e) => sum + parseFloat(e.hours), 0)
            const isToday = day === formatDateISO(new Date())
            const dayName = new Date(day).toLocaleDateString('en-US', { weekday: 'short' })

            return (
              <div
                key={day}
                className={`p-3 border-2 ${isToday ? 'border-dog-orange bg-orange-50' : 'border-dog-tan bg-white'}`}
              >
                <div className="text-xs font-bold text-dog-brown">{dayName}</div>
                <div className="text-xs text-dog-brown opacity-70">{formatDateShort(day)}</div>
                <div className={`text-xl font-bold mt-2 ${dayTotal > 0 ? 'text-dog-green' : 'text-gray-300'}`}>
                  {formatHours(dayTotal)}
                </div>
                <div className="text-xs text-dog-brown opacity-70">
                  {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Client summary */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ BY CLIENT
        </h2>
        {Object.keys(entriesByClient).length === 0 ? (
          <p className="text-dog-brown opacity-70">No entries this week.</p>
        ) : (
          <table className="table-retro">
            <thead>
              <tr>
                <th>CLIENT</th>
                <th className="text-right">HOURS</th>
                <th className="text-right">EST. AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(entriesByClient).map(([client, data]) => (
                <tr key={client}>
                  <td className="font-bold">{client}</td>
                  <td className="text-right">{formatHours(data.hours)}</td>
                  <td className="text-right text-dog-green">{formatCurrency(data.hours * 50)}</td>
                </tr>
              ))}
              <tr className="bg-dog-cream font-bold">
                <td>TOTAL</td>
                <td className="text-right">{formatHours(totalHours)}</td>
                <td className="text-right text-dog-green">{formatCurrency(totalHours * 50)}</td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="text-xs text-dog-brown opacity-50 mt-2">* Estimated using your default hourly rate</p>
      </div>

      {/* Submit section */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ SUBMIT TIMESHEET
        </h2>

        {draftEntries.length === 0 && submittedEntries.length > 0 ? (
          <div className="bg-dog-green text-white p-4 border-2 border-dog-brown">
            <strong>✓ All entries for this week have been submitted!</strong>
          </div>
        ) : draftEntries.length === 0 ? (
          <div className="bg-gray-100 p-4 border-2 border-dog-tan">
            <p className="text-dog-brown">No entries to submit. Log some time first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-dog-cream p-4 border-2 border-dog-tan">
              <p className="text-dog-brown">
                <strong>{draftEntries.length}</strong> draft {draftEntries.length === 1 ? 'entry' : 'entries'} ready to submit
                ({formatHours(draftEntries.reduce((sum, e) => sum + parseFloat(e.hours), 0))})
              </p>
            </div>

            <button
              onClick={handleSubmitWeek}
              disabled={submitting}
              className="btn-success"
            >
              {submitting ? '⏳ GENERATING INVOICE...' : '→ SUBMIT THIS WEEK & GENERATE INVOICE'}
            </button>

            <p className="text-xs text-dog-brown opacity-70">
              Submitting will lock these entries and generate a contractor invoice.
            </p>
          </div>
        )}
      </div>

      {/* All entries list */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ ALL ENTRIES THIS WEEK
        </h2>

        {entries.length === 0 ? (
          <p className="text-dog-brown opacity-70">No entries this week.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-white border border-dog-tan"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dog-brown opacity-70">{formatDateShort(entry.date)}</span>
                    <span className="font-bold text-dog-orange">{formatHours(parseFloat(entry.hours))}</span>
                    <span className="text-dog-brown">{entry.client.name}</span>
                    <span className="badge bg-dog-tan text-dog-brown">{entry.category.name}</span>
                    <span className={`badge ${entry.status === 'DRAFT' ? 'badge-draft' : 'badge-submitted'}`}>
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-sm text-dog-brown mt-1">{entry.whatDidYouDo}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
