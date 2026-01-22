# DoG Time Tracker

**Time Tracking + Invoicing System MVP** for Department of Growth

A dead-simple hours tracker that eliminates contractor invoicing pain.

```
   ╔═══════════════════════════════════════╗
   ║     🐕 DoG TIME TRACKER v1.0.0        ║
   ║     Track time. Generate invoices.    ║
   ║              Get paid.                ║
   ╚═══════════════════════════════════════╝
```

## Quick Start

```bash
# Install dependencies
npm install

# Set up the database
npx prisma db push

# Seed with test data
npm run db:seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Accounts

| Role       | Email                  | Password       |
|------------|------------------------|----------------|
| Admin      | brian@dog.com          | admin123       |
| Contractor | alex@contractor.com    | contractor123  |
| Intern     | sam@intern.com         | intern123      |

## Features

### For Contractors/Interns

- **⏱ Log Time** - Daily time logging with <10 second entry time
  - Quick add buttons (+0.1h, +0.25h, +0.5h, +1.0h)
  - Big category buttons (3-4 per user)
  - Recent entries for quick repeat
  - "Repeat yesterday" functionality

- **📅 Weekly View** - See your week at a glance
  - Daily breakdown calendar
  - Hours by client summary
  - One-click weekly submission

- **📄 Invoices** - Standardized contractor invoices
  - Auto-generated from time entries
  - Professional PDF format (print to save)
  - Track status: Draft → Submitted → Approved → Paid

### For Admins (Brian)

- **✓ Review** - Approve/reject submitted invoices
  - See all pending invoices
  - View time entry details
  - One-click approve/reject with reasons

- **👥 Users** - Manage team members
  - Add contractors and interns
  - Set hourly rates
  - Assign roles

- **🏢 Clients** - Manage clients and projects
  - Add/edit clients
  - Create projects per client

- **🏷 Categories** - Configure work categories
  - Create global categories
  - Assign 3-4 categories per user

## Core Workflows

### Daily Contractor Flow
1. Log in → Dashboard shows "Log Time"
2. Select client → Select category (big buttons)
3. Use quick-add for hours → Describe work
4. Save (< 10 seconds!)

### Weekly Submission
1. Go to "This Week" tab
2. Review hours by day and client
3. Click "Submit This Week"
4. Invoice is generated and sent to admin

### Admin Review
1. Admin goes to "Review" page
2. Sees all submitted invoices
3. Views details and approves/rejects
4. Approved invoices can be exported

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **SQLite** - Database (Postgres-ready)
- **Tailwind CSS** - Retro styling

## Database Schema

```
User
├── TimeEntry[] (many)
├── Invoice[] (many)
└── UserCategory[] (3-4 categories)

Client
├── Project[] (many)
└── TimeEntry[] (many)

Category
├── UserCategory[] (many)
└── TimeEntry[] (many)

Invoice
├── InvoiceLineItem[] (many)
└── TimeEntry[] (many)
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema to database
npm run db:seed      # Seed test data
npm run db:studio    # Open Prisma Studio
```

## Environment Variables

Create `.env` file (optional):

```
JWT_SECRET=your-secret-key
```

## Future Integration

Designed to integrate with Project Delivery OS:
- Compatible entity IDs (Client, Project, User)
- TimeEntry can link to Deliverables/Tasks
- Clear extension points for growth

---

Built with 🧡 for Department of Growth
