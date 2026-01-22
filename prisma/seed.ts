import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Design' } }),
    prisma.category.create({ data: { name: 'Strategy' } }),
    prisma.category.create({ data: { name: 'Development' } }),
    prisma.category.create({ data: { name: 'Copy' } }),
    prisma.category.create({ data: { name: 'Operations' } }),
    prisma.category.create({ data: { name: 'Research' } }),
    prisma.category.create({ data: { name: 'Marketing' } }),
    prisma.category.create({ data: { name: 'Sales' } }),
    prisma.category.create({ data: { name: 'Analytics' } }),
    prisma.category.create({ data: { name: 'Content' } }),
    prisma.category.create({ data: { name: 'Project Management' } }),
    prisma.category.create({ data: { name: 'Client Communication' } }),
    prisma.category.create({ data: { name: 'Admin' } }),
    prisma.category.create({ data: { name: 'Training' } }),
  ])
  console.log('✓ Created categories')

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Acme Corp',
        projects: {
          create: [
            { name: 'Website Redesign' },
            { name: 'Brand Strategy' },
          ]
        }
      }
    }),
    prisma.client.create({
      data: {
        name: 'TechStart Inc',
        projects: {
          create: [
            { name: 'MVP Development' },
            { name: 'Marketing Launch' },
          ]
        }
      }
    }),
    prisma.client.create({
      data: {
        name: 'GreenGrowth Co',
        projects: {
          create: [
            { name: 'Sustainability Report' },
          ]
        }
      }
    }),
  ])
  console.log('✓ Created clients')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Brian (Admin)',
      email: 'brian@dog.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      defaultHourlyRate: 100,
      userCategories: {
        create: [
          { categoryId: categories[1].id, sortOrder: 0 }, // Strategy
          { categoryId: categories[4].id, sortOrder: 1 }, // Operations
        ]
      }
    }
  })
  console.log('✓ Created admin user')

  // Create contractor user
  const contractorPassword = await bcrypt.hash('contractor123', 10)
  const contractor = await prisma.user.create({
    data: {
      name: 'Alex Designer',
      email: 'alex@contractor.com',
      passwordHash: contractorPassword,
      role: 'CONTRACTOR',
      defaultHourlyRate: 75,
      userCategories: {
        create: [
          { categoryId: categories[0].id, sortOrder: 0 }, // Design
          { categoryId: categories[1].id, sortOrder: 1 }, // Strategy
          { categoryId: categories[3].id, sortOrder: 2 }, // Copy
        ]
      }
    }
  })
  console.log('✓ Created contractor user')

  // Create fellow user
  const fellowPassword = await bcrypt.hash('fellow123', 10)
  const fellow = await prisma.user.create({
    data: {
      name: 'Sam Fellow',
      email: 'sam@fellow.com',
      passwordHash: fellowPassword,
      role: 'FELLOW',
      defaultHourlyRate: 25,
      userCategories: {
        create: [
          { categoryId: categories[5].id, sortOrder: 0 }, // Research
          { categoryId: categories[4].id, sortOrder: 1 }, // Operations
        ]
      }
    }
  })
  console.log('✓ Created fellow user')

  // Create some sample time entries for contractor
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  await prisma.timeEntry.createMany({
    data: [
      {
        userId: contractor.id,
        date: yesterday,
        clientId: clients[0].id,
        categoryId: categories[0].id,
        hours: 2.5,
        whatDidYouDo: 'Created initial wireframes for homepage',
        whatGotCompleted: 'Homepage wireframe v1',
        status: 'DRAFT'
      },
      {
        userId: contractor.id,
        date: yesterday,
        clientId: clients[0].id,
        categoryId: categories[1].id,
        hours: 1.0,
        whatDidYouDo: 'Strategy session with client',
        whatGotCompleted: 'Meeting notes and action items',
        status: 'DRAFT'
      },
      {
        userId: contractor.id,
        date: today,
        clientId: clients[1].id,
        categoryId: categories[0].id,
        hours: 3.0,
        whatDidYouDo: 'Designed UI components for dashboard',
        whatGotCompleted: 'Dashboard component library',
        status: 'DRAFT'
      },
    ]
  })
  console.log('✓ Created sample time entries')

  console.log('')
  console.log('🎉 Seed completed!')
  console.log('')
  console.log('Test accounts:')
  console.log('─────────────────────────────────')
  console.log('Admin:      brian@dog.com / admin123')
  console.log('Contractor: alex@contractor.com / contractor123')
  console.log('Fellow:     sam@fellow.com / fellow123')
  console.log('─────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
