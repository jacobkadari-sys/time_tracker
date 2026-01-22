'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function ChatHelper() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your DoG Time Tracker assistant. Ask me anything about logging time, submitting invoices, or using the app!"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await res.json()

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    'How do I log time?',
    'How do I submit my week?',
    'What are categories?',
  ]

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white border-2 border-dog-brown shadow-retro-lg flex flex-col max-w-sm"
             style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {/* Header */}
          <div className="bg-dog-orange text-white p-3 border-b-2 border-dog-brown flex items-center justify-between">
            <span className="font-bold">DoG Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-dog-cream text-xl leading-none"
            >
              x
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-dog-cream"
               style={{ minHeight: '200px', maxHeight: '300px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user'
                    ? 'ml-auto bg-dog-orange text-white'
                    : 'mr-auto bg-white text-dog-brown border border-dog-tan'
                } p-2 max-w-[85%] text-sm whitespace-pre-wrap`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-white text-dog-brown border border-dog-tan p-2 text-sm">
                <span className="animate-pulse">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="p-2 border-t border-dog-tan bg-white">
              <p className="text-xs text-dog-brown opacity-70 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(q)
                    }}
                    className="text-xs px-2 py-1 bg-dog-cream hover:bg-dog-tan border border-dog-tan text-dog-brown"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-2 border-t-2 border-dog-brown bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-2 py-1 text-sm border-2 border-dog-brown focus:outline-none focus:border-dog-orange"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-1 bg-dog-orange text-white font-bold text-sm border-2 border-dog-brown hover:bg-orange-600 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-dog-orange text-white border-2 border-dog-brown shadow-retro flex items-center justify-center hover:bg-orange-600 transition-colors"
        title="Need help?"
      >
        {isOpen ? (
          <span className="text-2xl">x</span>
        ) : (
          <span className="text-2xl">?</span>
        )}
      </button>
    </div>
  )
}
