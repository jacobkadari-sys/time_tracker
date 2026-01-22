import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateInvoiceNumber } from '@/lib/utils'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}

  // Non-admins can only see their own invoices
  if (session.role !== 'ADMIN') {
    where.userId = session.id
  }

  if (status) {
    where.status = status
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      lineItems: {
        include: {
          client: true,
          category: true,
          project: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(invoices)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { periodStart, periodEnd } = await request.json()

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Period start and end required' },
        { status: 400 }
      )
    }

    // Get user's hourly rate
    const user = await prisma.user.findUnique({
      where: { id: session.id }
    })

    const hourlyRate = user?.defaultHourlyRate ? parseFloat(user.defaultHourlyRate.toString()) : 50

    // Get draft entries for this period
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: session.id,
        status: 'DRAFT',
        date: {
          gte: new Date(periodStart + 'T00:00:00'),
          lte: new Date(periodEnd + 'T23:59:59')
        }
      },
      include: {
        client: true,
        project: true,
        category: true
      }
    })

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No draft entries found for this period' },
        { status: 400 }
      )
    }

    // Group entries by client/project/category for line items
    const groupedEntries: Record<string, {
      clientId: string
      projectId: string | null
      categoryId: string
      hours: number
      descriptions: string[]
    }> = {}

    entries.forEach(entry => {
      const key = `${entry.clientId}-${entry.projectId || 'none'}-${entry.categoryId}`
      if (!groupedEntries[key]) {
        groupedEntries[key] = {
          clientId: entry.clientId,
          projectId: entry.projectId,
          categoryId: entry.categoryId,
          hours: 0,
          descriptions: []
        }
      }
      groupedEntries[key].hours += parseFloat(entry.hours.toString())
      groupedEntries[key].descriptions.push(entry.whatDidYouDo)
    })

    const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours.toString()), 0)
    const totalAmount = totalHours * hourlyRate

    // Create invoice with line items
    const invoice = await prisma.invoice.create({
      data: {
        userId: session.id,
        periodStart: new Date(periodStart + 'T00:00:00'),
        periodEnd: new Date(periodEnd + 'T23:59:59'),
        invoiceNumber: generateInvoiceNumber(session.id, new Date(periodStart + 'T12:00:00')),
        status: 'DRAFT',
        totalHours,
        totalAmount,
        lineItems: {
          create: Object.values(groupedEntries).map(group => ({
            clientId: group.clientId,
            projectId: group.projectId,
            categoryId: group.categoryId,
            description: group.descriptions.join('; '),
            hours: group.hours,
            rate: hourlyRate,
            amount: group.hours * hourlyRate
          }))
        }
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        lineItems: {
          include: {
            client: true,
            category: true,
            project: true
          }
        }
      }
    })

    // Link time entries to invoice and mark as submitted
    await prisma.timeEntry.updateMany({
      where: {
        id: { in: entries.map(e => e.id) }
      },
      data: {
        status: 'SUBMITTED',
        invoiceId: invoice.id
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
