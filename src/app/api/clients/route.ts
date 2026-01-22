import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clients = await prisma.client.findMany({
    where: { active: true },
    include: {
      projects: {
        where: { active: true },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: [
      { isSystem: 'asc' }, // System clients (like Unassigned) at the end
      { name: 'asc' }
    ]
  })

  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: { name }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
