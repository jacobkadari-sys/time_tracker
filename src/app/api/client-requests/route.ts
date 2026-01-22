import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: Fetch pending client requests (admin only)
export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requests = await prisma.clientRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ requests })
}

// POST: Create a new client request (any authenticated user)
export async function POST(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { name, note } = await request.json()

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: 'Client name required' }, { status: 400 })
        }

        // Check if client already exists
        const existingClient = await prisma.client.findFirst({
            where: { name: { equals: name.trim(), mode: 'insensitive' } }
        })

        if (existingClient) {
            return NextResponse.json({ error: 'A client with this name already exists' }, { status: 409 })
        }

        // Check if there's already a pending request for this name
        const existingRequest = await prisma.clientRequest.findFirst({
            where: {
                name: { equals: name.trim(), mode: 'insensitive' },
                status: 'PENDING'
            }
        })

        if (existingRequest) {
            return NextResponse.json({ error: 'A request for this client already exists' }, { status: 409 })
        }

        const clientRequest = await prisma.clientRequest.create({
            data: {
                name: name.trim(),
                note: note?.trim() || null,
                requestedBy: session.id
            }
        })

        return NextResponse.json({ request: clientRequest })
    } catch (error) {
        console.error('Create client request error:', error)
        return NextResponse.json(
            { error: 'Failed to create client request' },
            { status: 500 }
        )
    }
}
