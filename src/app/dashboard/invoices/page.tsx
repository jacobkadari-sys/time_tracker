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
  approvedAt: string | null
  rejectionReason: string | null
  user: { name: string }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => {
        setInvoices(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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
        <h1 className="text-2xl font-bold text-dog-brown">▸ My Invoices</h1>
      </div>

      {invoices.length === 0 ? (
        <div className="card-retro">
          <p className="text-dog-brown opacity-70">No invoices yet. Submit your first week to generate one!</p>
        </div>
      ) : (
        <div className="card-retro">
          <table className="table-retro">
            <thead>
              <tr>
                <th>INVOICE #</th>
                <th>PERIOD</th>
                <th className="text-right">HOURS</th>
                <th className="text-right">AMOUNT</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className="font-mono font-bold">{invoice.invoiceNumber}</td>
                  <td className="text-sm">
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </td>
                  <td className="text-right">{formatHours(parseFloat(invoice.totalHours))}</td>
                  <td className="text-right font-bold text-dog-green">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td>
                    <span className={getStatusBadge(invoice.status)}>{invoice.status}</span>
                    {invoice.rejectionReason && (
                      <span className="text-xs text-dog-red ml-2" title={invoice.rejectionReason}>⚠</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="btn-secondary btn-small"
                    >
                      VIEW
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
