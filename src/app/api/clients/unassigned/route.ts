import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: Get or create the Unassigned system client
export async function GET() {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Find or create the Unassigned system client
        let unassigned = await prisma.client.findFirst({
            where: {
                name: 'Unassigned / Needs Client',
                isSystem: true
            }
        })

        if (!unassigned) {
            unassigned = await prisma.client.create({
                data: {
                    name: 'Unassigned / Needs Client',
                    isSystem: true
                }
            })
        }

        return NextResponse.json({ client: unassigned })
    } catch (error) {
        console.error('Get unassigned client error:', error)
        return NextResponse.json(
            { error: 'Failed to get unassigned client' },
            { status: 500 }
        )
    }
}
