import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { ChatPanel } from '../components/ChatPanel'
import { FormField } from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { useToast } from '../hooks/useToast'
import type { ChatGroupType } from '../types'

const GROUP_TYPE_LABELS: Record<ChatGroupType, string> = {
  'student-teacher': 'Students & Teachers',
  'parent-teacher': 'Parents & Teachers',
}

const GROUP_TYPE_BADGE: Record<ChatGroupType, string> = {
  'student-teacher': 'bg-indigo-100 text-indigo-700',
  'parent-teacher': 'bg-amber-100 text-amber-700',
}

function canAccessGroup(
  currentUserRole: string,
  currentUserClassId: string | undefined,
  childClassId: string | undefined,
  teacherClassIds: string[],
  groupClassId: string,
  groupType: ChatGroupType,
): boolean {
  if (currentUserRole === 'admin') return true
  if (currentUserRole === 'student') {
    return groupType === 'student-teacher' && groupClassId === currentUserClassId
  }
  if (currentUserRole === 'parent') {
    return groupType === 'parent-teacher' && groupClassId === childClassId
  }
  if (currentUserRole === 'teacher') {
    return teacherClassIds.includes(groupClassId)
  }
  return false
}

export function ChatGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { currentUser } = useAuth()
  const { chatGroups, users, timetable, updateChatGroup, deleteChatGroup } = useData()
  const { push } = useToast()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const group = chatGroups.find((g) => g.id === groupId)

  if (!group || !currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-slate-500">Chat group not found.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const childClassId = (() => {
    if (currentUser.role !== 'parent') return undefined
    const child = users.find((u) => u.email === currentUser.childEmail)
    return child?.classId
  })()

  const teacherClassIds = (() => {
    if (currentUser.role !== 'teacher') return []
    return Array.from(
      new Set(
        timetable
          .filter((slot) => slot.teacher === currentUser.email)
          .map((slot) => slot.classId),
      ),
    )
  })()

  const hasAccess = canAccessGroup(
    currentUser.role,
    currentUser.classId,
    childClassId,
    teacherClassIds,
    group.classId,
    group.type,
  )

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-slate-500">You do not have access to this chat group.</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const startEdit = () => {
    setEditName(group.name)
    setEditError('')
    setConfirmingDelete(false)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditError('')
  }

  const submitEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editName.trim()) {
      setEditError('Group name is required.')
      return
    }
    updateChatGroup(group.id, { name: editName.trim() })
    push('success', 'Chat group renamed.')
    setEditing(false)
  }

  const handleDelete = () => {
    deleteChatGroup(group.id)
    push('info', `Chat group "${group.name}" deleted.`)
    navigate(-1)
  }

  const isAdmin = currentUser.role === 'admin'

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Back
      </button>

      <Card
        title={group.name}
        actions={
          isAdmin && !editing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startEdit}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 border border-slate-300 rounded-md px-3 py-1.5"
              >
                Edit
              </button>
              {confirmingDelete ? (
                <>
                  <span className="text-sm text-slate-500">Delete this group?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md px-3 py-1.5"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-md px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 rounded-md px-3 py-1.5"
                >
                  Delete
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        {editing ? (
          <form onSubmit={submitEdit} noValidate className="space-y-3 mb-4">
            <FormField
              label="Group Name"
              name="editGroupName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              error={editError || undefined}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-md px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${GROUP_TYPE_BADGE[group.type]}`}
            >
              {GROUP_TYPE_LABELS[group.type]}
            </span>
            <span className="text-xs text-slate-500">
              Class: {group.classId} · {group.year}
            </span>
          </div>
        )}
        <ChatPanel groupId={group.id} />
      </Card>
    </div>
  )
}

