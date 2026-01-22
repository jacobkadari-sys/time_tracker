import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const { reason } = await request.json()

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'Invoice not in submitted state' }, { status: 400 })
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'No reason provided'
      }
    })

    // Unlock time entries so user can edit and resubmit
    await prisma.timeEntry.updateMany({
      where: { invoiceId: id },
      data: { status: 'DRAFT' }
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to reject invoice' }, { status: 500 })
  }
}
