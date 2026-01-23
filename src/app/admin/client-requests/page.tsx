'use client'

import { useState, useEffect } from 'react'

type ClientRequest = {
    id: string
    name: string
    note: string | null
    status: string
    createdAt: string
    user: {
        name: string
        email: string
    }
}

export default function ClientRequestsPage() {
    const [requests, setRequests] = useState<ClientRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/client-requests')
            const data = await res.json()
            setRequests(data.requests || [])
        } catch (error) {
            console.error('Failed to fetch requests:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessing(id)
        try {
            const res = await fetch(`/api/client-requests/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })

            if (res.ok) {
                fetchRequests()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to process request')
            }
        } catch (error) {
            console.error('Failed to process request:', error)
        } finally {
            setProcessing(null)
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
            <h1 className="text-2xl font-bold text-dog-brown">▸ Client Requests</h1>

            {requests.length === 0 ? (
                <div className="card-retro">
                    <p className="text-dog-brown opacity-70 text-center py-8">
                        No pending client requests
                    </p>
                </div>
            ) : (
                <div className="card-retro">
                    <h2 className="text-lg font-bold text-dog-brown mb-4 border-b-2 border-dog-brown pb-2">
                        ▸ PENDING REQUESTS ({requests.length})
                    </h2>
                    <div className="space-y-4">
                        {requests.map(request => (
                            <div
                                key={request.id}
                                className="p-4 bg-dog-cream border-2 border-dog-tan"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="font-bold text-lg text-dog-brown">
                                            &quot;{request.name}&quot;
                                        </div>
                                        <div className="text-sm text-dog-brown opacity-70">
                                            Requested by {request.user.name} ({request.user.email})
                                        </div>
                                        {request.note && (
                                            <div className="text-sm text-dog-brown mt-2 italic">
                                                Note: {request.note}
                                            </div>
                                        )}
                                        <div className="text-xs text-dog-brown opacity-50 mt-1">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(request.id, 'approve')}
                                            disabled={processing === request.id}
                                            className="btn-success"
                                        >
                                            {processing === request.id ? '⏳' : '✓'} APPROVE
                                        </button>
                                        <button
                                            onClick={() => handleAction(request.id, 'reject')}
                                            disabled={processing === request.id}
                                            className="btn-secondary"
                                        >
                                            ✕ REJECT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
