'use client'

import { useState, useEffect } from 'react'
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dog-brown">✓ Review Invoices</h1>
        <div className="flex gap-2">
          {['SUBMITTED', 'APPROVED', 'REJECTED', ''].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn-small ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
            >
              {status || 'ALL'}
            </button>
          ))}
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
