'use client'

import { useState, useRef, useEffect } from 'react'

type Client = {
    id: string
    name: string
    isSystem?: boolean
    projects?: { id: string; name: string }[]
}

type ClientSearchProps = {
    clients: Client[]
    selectedClient: string
    onClientSelect: (clientId: string) => void
    userRole: string
    onClientCreated: () => void
}

export function ClientSearch({
    clients,
    selectedClient,
    onClientSelect,
    userRole,
    onClientCreated
}: ClientSearchProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [requestNote, setRequestNote] = useState('')
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
    const [isCreatingClient, setIsCreatingClient] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const isAdmin = userRole === 'ADMIN'
    const selectedClientObj = clients.find(c => c.id === selectedClient)

    // Filter clients based on search query
    const filteredClients = searchQuery.trim()
        ? clients.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : clients

    // Check if query matches any existing client
    const exactMatch = clients.some(c =>
        c.name.toLowerCase() === searchQuery.toLowerCase()
    )
    const showCreateOption = searchQuery.trim() && !exactMatch

    // Find the Unassigned client
    const unassignedClient = clients.find(c => c.isSystem && c.name.includes('Unassigned'))

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Clear feedback after 3 seconds
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [feedback])

    const handleCreateClientAdmin = async () => {
        if (!searchQuery.trim()) return
        setIsCreatingClient(true)
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: searchQuery.trim() })
            })
            const data = await res.json()
            if (res.ok) {
                setFeedback({ type: 'success', message: `Created "${data.name}"` })
                setSearchQuery('')
                setIsOpen(false)
                onClientCreated()
                // Auto-select the new client
                setTimeout(() => onClientSelect(data.id), 100)
            } else {
                setFeedback({ type: 'error', message: data.error || 'Failed to create client' })
            }
        } catch {
            setFeedback({ type: 'error', message: 'Failed to create client' })
        } finally {
            setIsCreatingClient(false)
        }
    }

    const handleRequestClient = async () => {
        if (!searchQuery.trim()) return
        setIsSubmittingRequest(true)
        try {
            const res = await fetch('/api/client-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: searchQuery.trim(), note: requestNote.trim() || null })
            })
            const data = await res.json()
            if (res.ok) {
                setFeedback({ type: 'success', message: `Requested "${searchQuery.trim()}"` })
                setShowRequestModal(false)
                setSearchQuery('')
                setRequestNote('')
                setIsOpen(false)
            } else {
                setFeedback({ type: 'error', message: data.error || 'Failed to submit request' })
            }
        } catch {
            setFeedback({ type: 'error', message: 'Failed to submit request' })
        } finally {
            setIsSubmittingRequest(false)
        }
    }

    const handleUseUnassigned = async () => {
        // Ensure Unassigned client exists
        if (unassignedClient) {
            onClientSelect(unassignedClient.id)
            setSearchQuery('')
            setIsOpen(false)
        } else {
            // Create it on-demand
            try {
                const res = await fetch('/api/clients/unassigned')
                const data = await res.json()
                if (res.ok && data.client) {
                    onClientCreated()
                    setTimeout(() => onClientSelect(data.client.id), 100)
                }
            } catch {
                setFeedback({ type: 'error', message: 'Failed to get Unassigned client' })
            }
        }
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-dog-brown mb-1">CLIENT *</label>

            {/* Search input */}
            <input
                ref={inputRef}
                type="text"
                value={isOpen ? searchQuery : (selectedClientObj?.name || searchQuery)}
                onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (!isOpen) setIsOpen(true)
                }}
                onFocus={() => {
                    setIsOpen(true)
                    if (selectedClientObj) setSearchQuery('')
                }}
                placeholder="Search or type new client..."
                className="input-retro"
                autoComplete="off"
            />

            {/* Feedback toast */}
            {feedback && (
                <div className={`absolute top-0 right-0 px-2 py-1 text-xs font-bold border-2 border-dog-brown ${feedback.type === 'success' ? 'bg-dog-green text-white' : 'bg-dog-red text-white'
                    }`}>
                    {feedback.message}
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-dog-brown shadow-retro max-h-64 overflow-y-auto">
                    {/* Create/Request option when typing something new */}
                    {showCreateOption && (
                        <div className="border-b-2 border-dashed border-dog-tan p-2 bg-dog-cream">
                            {isAdmin ? (
                                <button
                                    type="button"
                                    onClick={handleCreateClientAdmin}
                                    disabled={isCreatingClient}
                                    className="w-full text-left p-2 font-bold text-dog-green hover:bg-dog-tan transition-colors"
                                >
                                    {isCreatingClient ? '⏳ Creating...' : `+ Create "${searchQuery}"`}
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowRequestModal(true)}
                                        className="w-full text-left p-2 font-bold text-dog-orange hover:bg-dog-tan transition-colors"
                                    >
                                        📝 Request &quot;{searchQuery}&quot;
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUseUnassigned}
                                        className="w-full text-left p-2 font-bold text-dog-brown opacity-70 hover:bg-dog-tan transition-colors text-sm"
                                    >
                                        📦 Use &quot;Unassigned / Needs Client&quot;
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Client list */}
                    {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                            <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                    onClientSelect(client.id)
                                    setSearchQuery('')
                                    setIsOpen(false)
                                }}
                                className={`w-full text-left p-3 hover:bg-dog-cream transition-colors border-b border-dog-tan last:border-b-0 ${selectedClient === client.id ? 'bg-dog-orange text-white' : ''
                                    } ${client.isSystem ? 'italic opacity-70' : ''}`}
                            >
                                {client.name}
                            </button>
                        ))
                    ) : (
                        !showCreateOption && (
                            <div className="p-3 text-dog-brown opacity-70 text-center">
                                No clients found
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="card-retro max-w-md w-full">
                        <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
                            ▸ REQUEST NEW CLIENT
                        </h2>
                        <p className="text-sm text-dog-brown mb-4">
                            Request &quot;<strong>{searchQuery}</strong>&quot; to be added. Admin will review.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-dog-brown mb-1">
                                NOTE (optional)
                            </label>
                            <textarea
                                value={requestNote}
                                onChange={(e) => setRequestNote(e.target.value)}
                                className="input-retro h-20 resize-none"
                                placeholder="Any additional details..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowRequestModal(false)}
                                className="btn-secondary flex-1"
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                onClick={handleRequestClient}
                                disabled={isSubmittingRequest}
                                className="btn-primary flex-1"
                            >
                                {isSubmittingRequest ? '⏳ SUBMITTING...' : '→ SUBMIT REQUEST'}
                            </button>
                        </div>
                        <div className="mt-4 pt-4 border-t-2 border-dashed border-dog-tan">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRequestModal(false)
                                    handleUseUnassigned()
                                }}
                                className="w-full text-center text-sm text-dog-brown opacity-70 hover:opacity-100"
                            >
                                Or log under &quot;Unassigned&quot; and continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
