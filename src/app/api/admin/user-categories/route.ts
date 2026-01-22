import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, categoryIds } = await request.json()

    if (!userId || !Array.isArray(categoryIds)) {
      return NextResponse.json({ error: 'userId and categoryIds required' }, { status: 400 })
    }

    // Limit to 4 categories
    if (categoryIds.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 categories per user' }, { status: 400 })
    }

    // Delete existing user categories
    await prisma.userCategory.deleteMany({
      where: { userId }
    })

    // Create new user categories
    if (categoryIds.length > 0) {
      await prisma.userCategory.createMany({
        data: categoryIds.map((categoryId: string, index: number) => ({
          userId,
          categoryId,
          sortOrder: index
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user categories error:', error)
    return NextResponse.json(
      { error: 'Failed to update categories' },
      { status: 500 }
    )
  }
}
