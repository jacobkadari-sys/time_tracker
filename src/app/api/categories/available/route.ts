import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public endpoint to get available categories (for signup form)
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(categories)
    } catch (error) {
        console.error('Fetch available categories error:', error)
        return NextResponse.json([], { status: 200 })
    }
}
