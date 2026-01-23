// Parse date string as LOCAL time (not UTC)
// "2025-01-22" should mean Jan 22 in user's timezone, not UTC
function parseLocalDate(date: Date | string): Date {
  if (date instanceof Date) return date
  // If it's an ISO date string like "2025-01-22", parse as local
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  // If it has time component, parse normally
  return new Date(date)
}

// Date utilities
export function formatDate(date: Date | string): string {
  const d = parseLocalDate(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateShort(date: Date | string): string {
  const d = parseLocalDate(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateISO(date: Date | string): string {
  const d = new Date(date)
  // Use local date components to avoid timezone issues
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const start = new Date(d)
  start.setDate(d.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Invoice number generator
export function generateInvoiceNumber(userId: string, periodStart: Date): string {
  const year = periodStart.getFullYear()
  const week = getWeekNumber(periodStart)
  const shortId = userId.slice(-4).toUpperCase()
  return `INV-${year}-W${week.toString().padStart(2, '0')}-${shortId}`
}

// Currency formatting
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num)
}

// Hours formatting
export function formatHours(hours: number | string): string {
  const num = typeof hours === 'string' ? parseFloat(hours) : hours
  return num.toFixed(1) + 'h'
}

// Class name utility
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
