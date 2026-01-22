import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: Fetch all system categories (for selection UI)
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all available categories in the system
  const allCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  // Get user's currently assigned categories
  const userCategories = await prisma.userCategory.findMany({
    where: {
      userId: session.id,
      active: true
    },
    include: { category: true },
    orderBy: { sortOrder: 'asc' }
  })

  return NextResponse.json({
    available: allCategories,
    assigned: userCategories.map(uc => uc.category)
  })
}

// POST: Update current user's categories
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { categoryIds } = await request.json()

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ error: 'categoryIds must be an array' }, { status: 400 })
    }

    // Limit to 4 categories
    if (categoryIds.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 categories allowed' }, { status: 400 })
    }

    if (categoryIds.length === 0) {
      return NextResponse.json({ error: 'At least 1 category required' }, { status: 400 })
    }

    // Verify all category IDs exist
    const validCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    })

    if (validCategories.length !== categoryIds.length) {
      return NextResponse.json({ error: 'One or more invalid category IDs' }, { status: 400 })
    }

    // Delete existing user categories
    await prisma.userCategory.deleteMany({
      where: { userId: session.id }
    })

    // Create new user categories
    await prisma.userCategory.createMany({
      data: categoryIds.map((categoryId: string, index: number) => ({
        userId: session.id,
        categoryId,
        sortOrder: index,
        active: true
      }))
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update my categories error:', error)
    return NextResponse.json(
      { error: 'Failed to update categories' },
      { status: 500 }
    )
  }
}
