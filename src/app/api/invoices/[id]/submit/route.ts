import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id }
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.userId !== session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (invoice.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Invoice already submitted' }, { status: 400 })
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date()
    }
  })

  // Lock associated time entries
  await prisma.timeEntry.updateMany({
    where: { invoiceId: id },
    data: { status: 'LOCKED' }
  })

  return NextResponse.json(updated)
}
