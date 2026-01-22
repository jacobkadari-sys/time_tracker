'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from './Logo'

type User = {
  id: string
  name: string
  email: string
  role: string
}

export function Navigation({ user }: { user: User }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', label: 'LOG TIME' },
    { href: '/dashboard/week', label: 'THIS WEEK' },
    { href: '/dashboard/invoices', label: 'INVOICES' },
  ]

  const adminItems = [
    { href: '/admin/users', label: 'USERS' },
    { href: '/admin/clients', label: 'CLIENTS' },
    { href: '/admin/client-requests', label: 'REQUESTS' },
    { href: '/admin/categories', label: 'CATEGORIES' },
    { href: '/admin/review', label: 'REVIEW' },
  ]

  const displayRole = user.role === 'INTERN' ? 'FELLOW' : user.role

  return (
    <nav className="bg-white border-b-4 border-dog-brown shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold text-dog-brown hidden sm:inline">DoG</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link text-sm ${pathname === item.href ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}

            {user.role === 'ADMIN' && (
              <>
                <span className="text-dog-tan mx-2">|</span>
                {adminItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link text-sm ${pathname === item.href ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-dog-brown">
              {user.name}
              <span className="text-xs opacity-60 ml-1">({displayRole})</span>
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary btn-small"
            >
              LOGOUT
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-dog-brown"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-dog-tan py-2">
            <div className="flex flex-col gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}

              {user.role === 'ADMIN' && (
                <>
                  <div className="border-t border-dog-tan my-2" />
                  <span className="px-3 text-xs text-dog-brown opacity-60">ADMIN</span>
                  {adminItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}

              <div className="border-t border-dog-tan my-2" />
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-dog-brown">
                  {user.name} <span className="text-xs opacity-60">({displayRole})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary btn-small"
                >
                  LOGOUT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
