import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET: Get current user info
export async function GET() {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            defaultHourlyRate: true
        }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        defaultHourlyRate: user.defaultHourlyRate ? parseFloat(user.defaultHourlyRate.toString()) : 50
    })
}

// PATCH: Update current user's hourly rate
export async function PATCH(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { defaultHourlyRate } = await request.json()

        if (defaultHourlyRate === undefined || isNaN(parseFloat(defaultHourlyRate))) {
            return NextResponse.json({ error: 'Invalid hourly rate' }, { status: 400 })
        }

        const rate = Math.max(0, parseFloat(defaultHourlyRate))

        const user = await prisma.user.update({
            where: { id: session.id },
            data: { defaultHourlyRate: rate },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                defaultHourlyRate: true
            }
        })

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            defaultHourlyRate: user.defaultHourlyRate ? parseFloat(user.defaultHourlyRate.toString()) : 50
        })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}
