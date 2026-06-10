import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { FormField } from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { useToast } from '../hooks/useToast'
import type { NotificationAudience, NotificationItem, User } from '../types'

const AUDIENCES: NotificationAudience[] = ['class', 'student', 'parent', 'teacher']

const AUDIENCE_BADGE: Record<NotificationAudience, string> = {
  class: 'bg-indigo-100 text-indigo-700',
  student: 'bg-emerald-100 text-emerald-700',
  parent: 'bg-amber-100 text-amber-700',
  teacher: 'bg-slate-200 text-slate-700',
}

interface NotificationEditFormState {
  title: string
  body: string
  date: string
  sender: string
  audience: NotificationAudience
  target: string
}

type NotificationEditErrors = Partial<Record<keyof NotificationEditFormState, string>>

function canViewNotification(
  notification: NotificationItem,
  currentUser: User,
  users: User[],
  timetable: ReturnType<typeof useData>['timetable'],
) {
  if (currentUser.role === 'admin') return true

  if (currentUser.role === 'student') {
    const classId = currentUser.classId ?? ''
    return (
      (notification.audience === 'student' && notification.target === currentUser.email) ||
      (notification.audience === 'class' && notification.target === classId)
    )
  }

  if (currentUser.role === 'parent') {
    const child = users.find((u) => u.email === currentUser.childEmail)
    const childClassId = child?.classId ?? ''
    return (
      (notification.audience === 'parent' && notification.target === currentUser.email) ||
      (notification.audience === 'class' && notification.target === childClassId)
    )
  }

  const subject = currentUser.subject ?? ''
  const classIds = Array.from(
    new Set(timetable.filter((slot) => slot.subject === subject).map((slot) => slot.classId)),
  )
  return (
    notification.audience === 'teacher' ||
    (notification.audience === 'class' && classIds.includes(notification.target ?? ''))
  )
}

export function NotificationDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { notifications, users, classes, timetable, updateNotification, deleteNotification } = useData()
  const { push } = useToast()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<NotificationEditFormState | null>(null)
  const [errors, setErrors] = useState<NotificationEditErrors>({})

  const notificationId = Number(idParam ? decodeURIComponent(idParam) : NaN)
  const notification = notifications.find((item) => item.id === notificationId)

  const allowedToView = useMemo(() => {
    if (!notification || !currentUser) return false
    return canViewNotification(notification, currentUser, users, timetable)
  }, [notification, currentUser, users, timetable])

  const canEdit = Boolean(
    notification && currentUser && (currentUser.role === 'admin' || notification.sender === currentUser.fullName),
  )

  if (!notification || !allowedToView) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back
        </button>
        <Card title="Notification not found" description="You do not have access to this notification.">
          <Link to="/dashboard" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Return to dashboard
          </Link>
        </Card>
      </div>
    )
  }

  const beginEdit = () => {
    setForm({
      title: notification.title,
      body: notification.body,
      date: notification.date,
      sender: notification.sender,
      audience: notification.audience,
      target: notification.target ?? '',
    })
    setErrors({})
    setEditing(true)
  }

  const updateField = <K extends keyof NotificationEditFormState>(
    key: K,
    value: NotificationEditFormState[K],
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const saveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return

    const next: NotificationEditErrors = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.body.trim()) next.body = 'Message is required.'
    if (!form.sender.trim()) next.sender = 'Sender is required.'
    if (!form.date.trim()) next.date = 'Date is required.'
    if (form.audience !== 'teacher' && !form.target.trim()) {
      next.target = 'Target is required for this audience.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    updateNotification(notification.id, {
      title: form.title.trim(),
      body: form.body.trim(),
      sender: form.sender.trim(),
      date: form.date.trim(),
      audience: form.audience,
      target: form.audience === 'teacher' ? undefined : form.target.trim(),
    })
    setEditing(false)
    push('success', 'Notification updated.')
  }

  const handleDelete = () => {
    if (!window.confirm(`Delete notification "${notification.title}"? This cannot be undone.`)) return
    deleteNotification(notification.id)
    push('info', 'Notification removed.')
    navigate('/dashboard')
  }

  const targetOptions =
    form?.audience === 'class'
      ? classes.map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }))
      : form?.audience === 'student'
        ? users
            .filter((u) => u.role === 'student')
            .map((u) => ({ value: u.email, label: `${u.fullName} (${u.email})` }))
        : form?.audience === 'parent'
          ? users
              .filter((u) => u.role === 'parent')
              .map((u) => ({ value: u.email, label: `${u.fullName} (${u.email})` }))
          : []

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        ← Back
      </button>

      <header className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{notification.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {notification.date} · {notification.sender}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${AUDIENCE_BADGE[notification.audience]}`}
        >
          {notification.audience}
        </span>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (editing ? setEditing(false) : beginEdit())}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {editing ? 'Close Editor' : 'Edit'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Delete
            </button>
          </div>
        ) : null}
      </header>

      {editing && form ? (
        <Card title="Edit Notification" description="Full edit rights on notification fields.">
          <form onSubmit={saveEdit} noValidate className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Title"
              name="notificationTitle"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              error={errors.title}
            />
            <FormField
              type="date"
              label="Date"
              name="notificationDate"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              error={errors.date}
            />
            <FormField
              as="select"
              label="Audience"
              name="notificationAudience"
              value={form.audience}
              onChange={(e) => {
                const nextAudience = e.target.value as NotificationAudience
                updateField('audience', nextAudience)
                if (nextAudience === 'teacher') {
                  updateField('target', '')
                }
              }}
            >
              {AUDIENCES.map((audience) => (
                <option key={audience} value={audience}>
                  {audience}
                </option>
              ))}
            </FormField>
            <FormField
              label="Sender"
              name="notificationSender"
              value={form.sender}
              onChange={(e) => updateField('sender', e.target.value)}
              error={errors.sender}
            />
            <div className="sm:col-span-2">
              <FormField
                as="textarea"
                label="Message"
                name="notificationBody"
                rows={4}
                value={form.body}
                onChange={(e) => updateField('body', e.target.value)}
                error={errors.body}
              />
            </div>
            {form.audience !== 'teacher' ? (
              <div className="sm:col-span-2">
                <FormField
                  as="select"
                  label="Target"
                  name="notificationTarget"
                  value={form.target}
                  onChange={(e) => updateField('target', e.target.value)}
                  error={errors.target}
                >
                  <option value="">Select target</option>
                  {targetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormField>
              </div>
            ) : null}
            <div className="sm:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card title="Notification Details">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Title" value={notification.title} />
          <Detail label="Audience" value={notification.audience} />
          <Detail label="Sender" value={notification.sender} />
          <Detail label="Date" value={notification.date} />
          <Detail label="Target" value={notification.target ?? 'All teachers'} />
          <Detail label="Message" value={notification.body} className="sm:col-span-2" />
        </dl>
      </Card>
    </div>
  )
}

function Detail({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800">
        {value}
      </dd>
    </div>
  )
}
