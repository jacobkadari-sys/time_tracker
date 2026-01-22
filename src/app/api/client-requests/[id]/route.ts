import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST: Approve or reject a client request (admin only)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const { action } = await request.json()

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const clientRequest = await prisma.clientRequest.findUnique({
            where: { id }
        })

        if (!clientRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        if (clientRequest.status !== 'PENDING') {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
        }

        if (action === 'approve') {
            // Create the client
            const client = await prisma.client.create({
                data: { name: clientRequest.name }
            })

            // Update the request status
            await prisma.clientRequest.update({
                where: { id },
                data: { status: 'APPROVED' }
            })

            return NextResponse.json({ client, message: 'Client created successfully' })
        } else {
            // Reject the request
            await prisma.clientRequest.update({
                where: { id },
                data: { status: 'REJECTED' }
            })

            return NextResponse.json({ message: 'Request rejected' })
        }
    } catch (error) {
        console.error('Process client request error:', error)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }
}
