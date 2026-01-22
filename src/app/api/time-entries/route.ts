import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const userId = searchParams.get('userId')

  const where: Record<string, unknown> = {}

  // Non-admins can only see their own entries
  if (session.role !== 'ADMIN') {
    where.userId = session.id
  } else if (userId) {
    where.userId = userId
  }

  if (startDate && endDate) {
    // Parse dates in local timezone to avoid timezone issues
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T23:59:59')
    where.date = {
      gte: start,
      lte: end
    }
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      client: true,
      project: true,
      category: true,
      user: { select: { id: true, name: true } }
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
  })

  return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { date, clientId, projectId, categoryId, hours, whatDidYouDo, whatGotCompleted } = body

    if (!date || !clientId || !categoryId || !hours || !whatDidYouDo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: session.id,
        date: new Date(date + 'T12:00:00'), // Use noon to avoid timezone edge cases
        clientId,
        projectId: projectId || null,
        categoryId,
        hours: parseFloat(hours),
        whatDidYouDo,
        whatGotCompleted: whatGotCompleted || null,
        status: 'DRAFT'
      },
      include: {
        client: true,
        project: true,
        category: true
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Create time entry error:', error)
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    )
  }
}
