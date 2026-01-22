import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Navigation } from '@/components/Navigation'
import { ChatHelper } from '@/components/ChatHelper'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-dog-cream">
      <Navigation user={session} />
      <main className="max-w-6xl mx-auto p-4">
        {children}
      </main>
      <ChatHelper />
    </div>
  )
}
