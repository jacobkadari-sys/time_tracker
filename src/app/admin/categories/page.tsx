'use client'

import { useState, useEffect } from 'react'

type Category = {
  id: string
  name: string
}

type User = {
  id: string
  name: string
  email: string
  role: string
}

type UserCategory = {
  categoryId: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userCategories, setUserCategories] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    const [catRes, usersRes] = await Promise.all([
      fetch('/api/admin/categories'),
      fetch('/api/admin/users')
    ])
    const [catData, usersData] = await Promise.all([
      catRes.json(),
      usersRes.json()
    ])
    setCategories(catData.categories || [])
    setUsers(usersData.users || [])

    // Build user categories map
    const ucMap: Record<string, string[]> = {}
    for (const user of usersData.users || []) {
      ucMap[user.id] = user.userCategories?.map((uc: UserCategory) => uc.categoryId) || []
    }
    setUserCategories(ucMap)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      })
      if (res.ok) {
        setNewCategoryName('')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add category:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleUserCategory = async (userId: string, categoryId: string) => {
    const currentCategories = userCategories[userId] || []
    const hasCategory = currentCategories.includes(categoryId)

    // Limit to 4 categories
    if (!hasCategory && currentCategories.length >= 4) {
      alert('Maximum 4 categories per user. Remove one first.')
      return
    }

    const newCategories = hasCategory
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId]

    try {
      await fetch('/api/admin/user-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, categoryIds: newCategories })
      })

      setUserCategories({
        ...userCategories,
        [userId]: newCategories
      })
    } catch (error) {
      console.error('Failed to update categories:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-dog-brown">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dog-brown">🏷 Categories</h1>

      {/* Add category form */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ ADD CATEGORY
        </h2>
        <form onSubmit={handleAddCategory} className="flex gap-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name (e.g. Design, Strategy)..."
            className="input-retro flex-1"
          />
          <button type="submit" disabled={saving} className="btn-primary">
            + ADD CATEGORY
          </button>
        </form>
      </div>

      {/* Categories list */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ ALL CATEGORIES ({categories.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <span key={cat.id} className="badge bg-dog-tan text-dog-brown px-3 py-1">
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Assign categories to users */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ ASSIGN CATEGORIES TO USERS (max 4 each)
        </h2>

        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="border-2 border-dog-tan p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-dog-brown">{user.name}</span>
                  <span className="text-sm text-dog-brown opacity-70 ml-2">({user.role})</span>
                </div>
                <span className="text-sm text-dog-brown">
                  {(userCategories[user.id] || []).length}/4 categories
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const isAssigned = (userCategories[user.id] || []).includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleUserCategory(user.id, cat.id)}
                      className={`category-btn text-sm ${isAssigned ? 'selected' : ''}`}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
