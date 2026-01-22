'use client'

import { useState, useEffect } from 'react'

type Project = {
  id: string
  name: string
  active: boolean
}

type Client = {
  id: string
  name: string
  active: boolean
  projects: Project[]
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [newClientName, setNewClientName] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchClients = async () => {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientName.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName })
      })
      if (res.ok) {
        setNewClientName('')
        fetchClients()
      }
    } catch (error) {
      console.error('Failed to add client:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim() || !selectedClient) return

    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, clientId: selectedClient })
      })
      if (res.ok) {
        setNewProjectName('')
        setSelectedClient(null)
        fetchClients()
      }
    } catch (error) {
      console.error('Failed to add project:', error)
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
      <h1 className="text-2xl font-bold text-dog-brown">🏢 Clients & Projects</h1>

      {/* Add client form */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ ADD CLIENT
        </h2>
        <form onSubmit={handleAddClient} className="flex gap-4">
          <input
            type="text"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            placeholder="Client name..."
            className="input-retro flex-1"
          />
          <button type="submit" disabled={saving} className="btn-primary">
            + ADD CLIENT
          </button>
        </form>
      </div>

      {/* Clients list */}
      <div className="card-retro">
        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
          ▸ ALL CLIENTS ({clients.length})
        </h2>

        {clients.length === 0 ? (
          <p className="text-dog-brown opacity-70">No clients yet.</p>
        ) : (
          <div className="space-y-4">
            {clients.map(client => (
              <div key={client.id} className="border-2 border-dog-tan p-4 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-dog-brown text-lg">{client.name}</h3>
                  <button
                    onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                    className="btn-secondary btn-small"
                  >
                    {selectedClient === client.id ? 'CANCEL' : '+ PROJECT'}
                  </button>
                </div>

                {/* Projects */}
                {client.projects.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-dog-tan">
                    {client.projects.map(project => (
                      <div key={project.id} className="py-1 text-dog-brown">
                        → {project.name}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add project form */}
                {selectedClient === client.id && (
                  <form onSubmit={handleAddProject} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name..."
                      className="input-retro flex-1"
                      autoFocus
                    />
                    <button type="submit" disabled={saving} className="btn-success btn-small">
                      ADD
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
