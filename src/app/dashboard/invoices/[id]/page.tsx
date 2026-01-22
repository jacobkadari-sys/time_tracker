'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatHours, formatCurrency } from '@/lib/utils'

type LineItem = {
  id: string
  description: string
  hours: string
  rate: string
  amount: string
  client: { name: string }
  project: { name: string } | null
  category: { name: string }
}

type Invoice = {
  id: string
  invoiceNumber: string
  periodStart: string
  periodEnd: string
  status: string
  totalHours: string
  totalAmount: string
  notes: string | null
  rejectionReason: string | null
  submittedAt: string | null
  approvedAt: string | null
  user: { id: string; name: string; email: string }
  lineItems: LineItem[]
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setInvoice(data)
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/invoices/${params.id}/submit`, {
        method: 'POST'
      })
      if (res.ok) {
        fetchInvoice()
      }
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-dog-brown">Loading...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="card-retro">
        <p className="text-dog-red">Invoice not found.</p>
        <Link href="/dashboard/invoices" className="btn-secondary mt-4 inline-block">
          ← Back to Invoices
        </Link>
      </div>
    )
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/invoices" className="text-dog-brown hover:text-dog-orange">
            ← Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-dog-brown mt-2">
            Invoice {invoice.invoiceNumber}
          </h1>
        </div>
        <span className={`${getStatusBadge(invoice.status)} text-lg px-4 py-2`}>
          {invoice.status}
        </span>
      </div>

      {/* Rejection notice */}
      {invoice.rejectionReason && (
        <div className="bg-dog-red text-white p-4 border-2 border-dog-brown shadow-retro">
          <strong>⚠ Rejected:</strong> {invoice.rejectionReason}
        </div>
      )}

      {/* Invoice preview */}
      <div className="card-retro" id="invoice-content">
        {/* Invoice header */}
        <div className="flex justify-between items-start border-b-4 border-dog-brown pb-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-dog-orange">INVOICE</h2>
            <p className="font-mono text-dog-brown">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-dog-brown text-lg">Department of Growth</h3>
            <p className="text-sm text-dog-brown opacity-70">Time Tracking Invoice</p>
          </div>
        </div>

        {/* From/To */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h4 className="text-xs font-bold text-dog-brown opacity-70 mb-1">FROM</h4>
            <p className="font-bold text-dog-brown">{invoice.user.name}</p>
            <p className="text-sm text-dog-brown">{invoice.user.email}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-dog-brown opacity-70 mb-1">TO</h4>
            <p className="font-bold text-dog-brown">Department of Growth</p>
            <p className="text-sm text-dog-brown">Accounts Payable</p>
          </div>
        </div>

        {/* Period */}
        <div className="bg-dog-cream p-3 border-2 border-dog-tan mb-6">
          <span className="text-xs font-bold text-dog-brown opacity-70">PERIOD: </span>
          <span className="font-bold text-dog-brown">
            {formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}
          </span>
        </div>

        {/* Line items */}
        <table className="table-retro mb-6">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>CATEGORY</th>
              <th>DESCRIPTION</th>
              <th className="text-right">HOURS</th>
              <th className="text-right">RATE</th>
              <th className="text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map(item => (
              <tr key={item.id}>
                <td className="font-bold">{item.client.name}</td>
                <td>
                  <span className="badge bg-dog-tan text-dog-brown">{item.category.name}</span>
                </td>
                <td className="text-sm max-w-xs truncate">{item.description}</td>
                <td className="text-right">{formatHours(parseFloat(item.hours))}</td>
                <td className="text-right">{formatCurrency(item.rate)}/hr</td>
                <td className="text-right font-bold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-dog-cream">
              <td colSpan={3} className="font-bold">TOTAL</td>
              <td className="text-right font-bold">{formatHours(parseFloat(invoice.totalHours))}</td>
              <td></td>
              <td className="text-right font-bold text-dog-green text-lg">
                {formatCurrency(invoice.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t-2 border-dashed border-dog-tan pt-4">
            <h4 className="text-xs font-bold text-dog-brown opacity-70 mb-1">NOTES</h4>
            <p className="text-dog-brown">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card-retro no-print">
        <div className="flex gap-4">
          {invoice.status === 'DRAFT' && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-success"
            >
              {submitting ? '⏳ SUBMITTING...' : '→ SUBMIT TO DOG'}
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="btn-secondary"
          >
            🖨 PRINT / PDF
          </button>

          <button
            onClick={() => router.push('/dashboard/invoices')}
            className="btn-secondary"
          >
            ← BACK
          </button>
        </div>
      </div>
    </div>
  )
}
