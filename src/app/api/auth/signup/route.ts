import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { name, email, password, role, categoryIds } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate role (only allow CONTRACTOR or FELLOW for self-signup)
    const validRoles = ['CONTRACTOR', 'FELLOW']
    const userRole = validRoles.includes(role) ? role : 'CONTRACTOR'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)

    // Determine which categories to assign
    let categoriesToAssign: { id: string }[] = []

    if (Array.isArray(categoryIds) && categoryIds.length > 0 && categoryIds.length <= 4) {
      // User provided categories - validate them
      const validCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } }
      })
      if (validCategories.length === categoryIds.length) {
        categoriesToAssign = categoryIds.map((id: string) => ({ id }))
      }
    }

    // Fall back to default categories if none provided or invalid
    if (categoriesToAssign.length === 0) {
      const defaultCategoryNames = ['Operations', 'Client Work', 'Admin', 'General']
      const categories = await Promise.all(
        defaultCategoryNames.map(async (name) => {
          const category = await prisma.category.findFirst({ where: { name } })
          if (category) return category
          return prisma.category.create({ data: { name } })
        })
      )
      categoriesToAssign = categories.slice(0, 4)
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: userRole,
        active: true,
        userCategories: {
          create: categoriesToAssign.map((cat, index) => ({
            categoryId: cat.id,
            sortOrder: index,
            active: true
          }))
        }
      }
    })

    // Create token and set cookie
    const token = await createToken(user.id)
    await setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
