import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'

interface ChatPanelProps {
  groupId: string
  title?: string
}

export function ChatPanel({ groupId, title }: ChatPanelProps) {
  const { currentUser } = useAuth()
  const { chatGroups, chatMessages, addChatMessage } = useData()
  const [draft, setDraft] = useState('')

  const group = useMemo(() => chatGroups.find((g) => g.id === groupId), [chatGroups, groupId])
  const messages = useMemo(
    () =>
      chatMessages
        .filter((message) => message.groupId === groupId)
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    [chatMessages, groupId],
  )

  if (!group) {
    return <p className="text-sm text-slate-500">No chat group available for this class yet.</p>
  }

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.trim() || !currentUser) return
    addChatMessage({
      groupId,
      senderEmail: currentUser.email,
      senderName: currentUser.fullName,
      body: draft.trim(),
      sentAt: new Date().toISOString().slice(0, 16),
    })
    setDraft('')
  }

  return (
    <div className="flex flex-col h-96 border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-700">
        {title ?? group.name}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
        ) : (
          messages.map((message) => {
            const mine = message.senderEmail === currentUser?.email
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    mine ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {!mine ? (
                    <p className="text-xs font-semibold text-indigo-600 mb-0.5">
                      {message.senderName}
                    </p>
                  ) : null}
                  <p>{message.body}</p>
                  <p
                    className={`text-[10px] mt-0.5 ${mine ? 'text-indigo-100' : 'text-slate-400'}`}
                  >
                    {message.sentAt.replace('T', ' ')}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-2 border-t border-slate-200 bg-slate-50">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  )
}
