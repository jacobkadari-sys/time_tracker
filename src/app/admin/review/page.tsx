'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { formatDate, formatHours, formatCurrency } from '@/lib/utils'

type Invoice = {
  id: string
  invoiceNumber: string
  periodStart: string
  periodEnd: string
  status: string
  totalHours: string
  totalAmount: string
  submittedAt: string | null
  user: { id: string; name: string; email: string }
}

export default function ReviewPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('SUBMITTED')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (format: 'summary' | 'detailed', status: string) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (format === 'detailed') params.append('format', 'detailed')

    window.location.href = `/api/admin/export?${params.toString()}`
    setShowExportMenu(false)
  }

  useEffect(() => {
    fetch(`/api/invoices${filter ? `?status=${filter}` : ''}`)
      .then(res => res.json())
      .then(data => {
        setInvoices(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        setInvoices(invoices.filter(inv => inv.id !== id))
      }
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return

    try {
      const res = await fetch(`/api/invoices/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        setInvoices(invoices.filter(inv => inv.id !== id))
      }
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      DRAFT: 'badge-draft',
      SUBMITTED: 'badge-submitted',
      APPROVED: 'badge-approved',
      REJECTED: 'badge-rejected',
      PAID: 'badge-paid'
    }
    return classes[status] || 'badge-draft'
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-dog-brown">▸ Review Invoices</h1>
        <div className="flex gap-2 flex-wrap items-center">
          {['SUBMITTED', 'APPROVED', 'REJECTED', ''].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn-small ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
            >
              {status || 'ALL'}
            </button>
          ))}

          {/* Export Button */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-small btn-secondary flex items-center gap-1"
              title="Export to CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-dog-brown shadow-retro z-50">
                <div className="p-2 border-b border-dog-tan bg-dog-cream">
                  <span className="text-xs font-bold text-dog-brown">EXPORT OPTIONS</span>
                </div>

                <div className="p-2 border-b border-dog-tan">
                  <p className="text-xs text-dog-brown opacity-70 mb-2">Summary (1 row per invoice)</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => handleExport('summary', filter)}
                      className="text-xs px-2 py-1 bg-dog-green text-white hover:bg-green-700"
                    >
                      Current View ({filter || 'All'})
                    </button>
                    <button
                      onClick={() => handleExport('summary', '')}
                      className="text-xs px-2 py-1 bg-dog-cream hover:bg-dog-tan border border-dog-tan"
                    >
                      All Invoices
                    </button>
                  </div>
                </div>

                <div className="p-2">
                  <p className="text-xs text-dog-brown opacity-70 mb-2">Detailed (includes line items)</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => handleExport('detailed', filter)}
                      className="text-xs px-2 py-1 bg-dog-orange text-white hover:bg-orange-600"
                    >
                      Current View ({filter || 'All'})
                    </button>
                    <button
                      onClick={() => handleExport('detailed', '')}
                      className="text-xs px-2 py-1 bg-dog-cream hover:bg-dog-tan border border-dog-tan"
                    >
                      All Invoices
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="card-retro">
          <p className="text-dog-brown opacity-70">
            No {filter.toLowerCase() || ''} invoices to review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map(invoice => (
            <div key={invoice.id} className="card-retro">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg">{invoice.invoiceNumber}</span>
                    <span className={getStatusBadge(invoice.status)}>{invoice.status}</span>
                  </div>
                  <p className="text-dog-brown">
                    <strong>{invoice.user.name}</strong> ({invoice.user.email})
                  </p>
                  <p className="text-sm text-dog-brown opacity-70">
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-dog-green">
                    {formatCurrency(invoice.totalAmount)}
                  </div>
                  <div className="text-sm text-dog-brown opacity-70">
                    {formatHours(parseFloat(invoice.totalHours))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-dog-tan">
                <Link
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="btn-secondary btn-small"
                >
                  VIEW DETAILS
                </Link>

                {invoice.status === 'SUBMITTED' && (
                  <>
                    <button
                      onClick={() => handleApprove(invoice.id)}
                      className="btn-success btn-small"
                    >
                      ✓ APPROVE
                    </button>
                    <button
                      onClick={() => handleReject(invoice.id)}
                      className="btn-danger btn-small"
                    >
                      ✗ REJECT
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
