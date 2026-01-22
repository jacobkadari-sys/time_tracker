'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogoWithText } from '@/components/Logo'

type Category = {
  id: string
  name: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('CONTRACTOR')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch available categories when signup mode is activated
  useEffect(() => {
    if (isSignup && availableCategories.length === 0) {
      setLoadingCategories(true)
      fetch('/api/categories/available')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAvailableCategories(data)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingCategories(false))
    }
  }, [isSignup, availableCategories.length])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      }
      if (prev.length >= 4) {
        return prev // Max 4 categories
      }
      return [...prev, categoryId]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const body = isSignup
        ? {
          name,
          email,
          password,
          role,
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined
        }
        : { email, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || (isSignup ? 'Signup failed' : 'Login failed'))
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignup(!isSignup)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    setRole('CONTRACTOR')
    setSelectedCategories([])
  }

  return (
    <div className="min-h-screen bg-dog-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoWithText size="lg" />
          </div>
          <p className="text-dog-brown opacity-70 font-mono">
            Track time. Generate invoices. Get paid.
          </p>
        </div>

        {/* Login/Signup Card */}
        <div className="card-retro">
          <h2 className="text-xl font-bold text-dog-brown mb-6 text-center border-b-2 border-dog-brown pb-2">
            ▸ {isSignup ? 'SIGN UP' : 'LOGIN'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-1">
                  NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-retro"
                  placeholder="Your full name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-dog-brown mb-1">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-retro"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-dog-brown mb-1">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-retro"
                placeholder={isSignup ? 'Min. 6 characters' : '••••••••'}
                required
                minLength={isSignup ? 6 : undefined}
              />
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-2">
                  I AM A...
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CONTRACTOR')}
                    className={`p-3 text-center font-bold border-2 border-dog-brown transition-all ${role === 'CONTRACTOR'
                        ? 'bg-dog-orange text-white shadow-none translate-x-1 translate-y-1'
                        : 'bg-white text-dog-brown shadow-retro-sm hover:bg-dog-cream'
                      }`}
                  >
                    Contractor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('FELLOW')}
                    className={`p-3 text-center font-bold border-2 border-dog-brown transition-all ${role === 'FELLOW'
                        ? 'bg-dog-orange text-white shadow-none translate-x-1 translate-y-1'
                        : 'bg-white text-dog-brown shadow-retro-sm hover:bg-dog-cream'
                      }`}
                  >
                    Fellow
                  </button>
                </div>
              </div>
            )}

            {/* Category Selection for Signup */}
            {isSignup && (
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-2">
                  SELECT YOUR WORK CATEGORIES (max 4)
                </label>
                {loadingCategories ? (
                  <p className="text-sm text-dog-brown opacity-70">Loading categories...</p>
                ) : availableCategories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-2 text-center text-sm font-bold border-2 border-dog-brown transition-all ${selectedCategories.includes(cat.id)
                            ? 'bg-dog-green text-white shadow-none translate-x-0.5 translate-y-0.5'
                            : 'bg-white text-dog-brown shadow-retro-sm hover:bg-dog-cream'
                          } ${selectedCategories.length >= 4 && !selectedCategories.includes(cat.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={selectedCategories.length >= 4 && !selectedCategories.includes(cat.id)}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dog-brown opacity-70">
                    Default categories will be assigned. You can change them anytime from your dashboard.
                  </p>
                )}
                {selectedCategories.length > 0 && (
                  <p className="text-xs text-dog-brown mt-2">
                    {selectedCategories.length}/4 selected
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="bg-dog-red text-white p-2 text-sm font-bold border-2 border-dog-brown">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center"
            >
              {loading
                ? (isSignup ? '⏳ CREATING ACCOUNT...' : '⏳ LOGGING IN...')
                : (isSignup ? '→ CREATE ACCOUNT' : '→ LOGIN')
              }
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-dog-brown hover:text-dog-orange underline text-sm"
            >
              {isSignup
                ? 'Already have an account? Login'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-dashed border-dog-tan text-center text-sm text-dog-brown opacity-70">
            <p>Department of Growth</p>
            <p className="font-mono text-xs mt-1">v1.0.0 MVP</p>
          </div>
        </div>
      </div>
    </div>
  )
}
