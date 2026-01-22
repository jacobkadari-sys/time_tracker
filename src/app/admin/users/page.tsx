'use client'

import { useState, useEffect } from 'react'

type User = {
  id: string
  name: string
  email: string
  role: string
  defaultHourlyRate: string | null
  active: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CONTRACTOR',
    defaultHourlyRate: '50'
  })

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'CONTRACTOR',
          defaultHourlyRate: '50'
        })
        setShowForm(false)
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to create user:', error)
    } finally {
      setSaving(false)
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dog-brown">👥 Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'CANCEL' : '+ ADD USER'}
        </button>
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="card-retro">
          <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
            ▸ NEW USER
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-1">NAME *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-retro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-1">EMAIL *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-retro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-1">PASSWORD *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-retro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-1">ROLE</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="select-retro"
                >
                  <option value="FELLOW">Fellow</option>
                  <option value="CONTRACTOR">Contractor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-dog-brown mb-1">HOURLY RATE ($)</label>
                <input
                  type="number"
                  value={formData.defaultHourlyRate}
                  onChange={(e) => setFormData({ ...formData, defaultHourlyRate: e.target.value })}
                  className="input-retro"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-success">
              {saving ? '⏳ CREATING...' : '✓ CREATE USER'}
            </button>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ ALL USERS ({users.length})
        </h2>

        {users.length === 0 ? (
          <p className="text-dog-brown opacity-70">No users yet.</p>
        ) : (
          <table className="table-retro">
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th className="text-right">RATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="font-bold">{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${
                      user.role === 'ADMIN' ? 'bg-dog-orange text-white' :
                      user.role === 'CONTRACTOR' ? 'bg-dog-blue text-white' :
                      'bg-dog-tan text-dog-brown'
                    }`}>
                      {user.role === 'INTERN' ? 'FELLOW' : user.role}
                    </span>
                  </td>
                  <td className="text-right">${user.defaultHourlyRate || '50'}/hr</td>
                  <td>
                    <span className={user.active ? 'text-dog-green' : 'text-dog-red'}>
                      {user.active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
