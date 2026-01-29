import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const format = searchParams.get('format') || 'csv'

  try {
    // Fetch invoices with user info and line items
    const invoices = await prisma.invoice.findMany({
      where: status ? { status } : {},
      include: {
        user: {
          select: {
            name: true,
            email: true,
            defaultHourlyRate: true
          }
        },
        lineItems: {
          include: {
            client: { select: { name: true } },
            category: { select: { name: true } },
            project: { select: { name: true } }
          }
        }
      },
      orderBy: [
        { submittedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    if (format === 'detailed') {
      // Detailed CSV with line items
      const rows = [
        ['Invoice #', 'User', 'Email', 'Status', 'Period Start', 'Period End',
         'Client', 'Project', 'Category', 'Description', 'Hours', 'Rate', 'Amount',
         'Submitted', 'Approved']
      ]

      for (const inv of invoices) {
        const baseRow = [
          inv.invoiceNumber,
          inv.user.name,
          inv.user.email,
          inv.status,
          inv.periodStart.toISOString().split('T')[0],
          inv.periodEnd.toISOString().split('T')[0]
        ]

        if (inv.lineItems.length > 0) {
          for (const item of inv.lineItems) {
            rows.push([
              ...baseRow,
              item.client.name,
              item.project?.name || '',
              item.category.name,
              item.description,
              parseFloat(item.hours.toString()).toFixed(2),
              parseFloat(item.rate.toString()).toFixed(2),
              parseFloat(item.amount.toString()).toFixed(2),
              inv.submittedAt?.toISOString().split('T')[0] || '',
              inv.approvedAt?.toISOString().split('T')[0] || ''
            ])
          }
        } else {
          // Invoice without line items (shouldn't happen, but handle it)
          rows.push([
            ...baseRow,
            '', '', '', '',
            parseFloat(inv.totalHours.toString()).toFixed(2),
            inv.user.defaultHourlyRate ? parseFloat(inv.user.defaultHourlyRate.toString()).toFixed(2) : '',
            parseFloat(inv.totalAmount.toString()).toFixed(2),
            inv.submittedAt?.toISOString().split('T')[0] || '',
            inv.approvedAt?.toISOString().split('T')[0] || ''
          ])
        }
      }

      const csv = rows.map(row => row.map(escapeCSV).join(',')).join('\n')

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="invoices-detailed-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Summary CSV (one row per invoice)
    const rows = [
      ['Invoice #', 'User', 'Email', 'Status', 'Period Start', 'Period End',
       'Total Hours', 'Hourly Rate', 'Total Amount', 'Submitted', 'Approved']
    ]

    for (const inv of invoices) {
      const hourlyRate = inv.lineItems.length > 0
        ? parseFloat(inv.lineItems[0].rate.toString())
        : (inv.user.defaultHourlyRate ? parseFloat(inv.user.defaultHourlyRate.toString()) : 0)

      rows.push([
        inv.invoiceNumber,
        inv.user.name,
        inv.user.email,
        inv.status,
        inv.periodStart.toISOString().split('T')[0],
        inv.periodEnd.toISOString().split('T')[0],
        parseFloat(inv.totalHours.toString()).toFixed(2),
        hourlyRate.toFixed(2),
        parseFloat(inv.totalAmount.toString()).toFixed(2),
        inv.submittedAt?.toISOString().split('T')[0] || '',
        inv.approvedAt?.toISOString().split('T')[0] || ''
      ])
    }

    const csv = rows.map(row => row.map(escapeCSV).join(',')).join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="invoices-${status || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function escapeCSV(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
