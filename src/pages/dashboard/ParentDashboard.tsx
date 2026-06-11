import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { ChatPanel } from '../../components/ChatPanel'
import { FormField } from '../../components/FormField'
import { Tabs } from '../../components/Tabs'
import { TimetableGrid } from '../../components/TimetableGrid'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useToast } from '../../hooks/useToast'
import { notificationDetailPath } from '../notificationDetailPath'
import { AttendanceTab, MarksTab } from './StudentDashboard'

export function ParentDashboard() {
  const { currentUser, setCurrentUser } = useAuth()
  const { attendance, news, notifications, chatGroups, helplines, users, updateUser } =
    useData()
  const { push } = useToast()

  const child = useMemo(() => {
    if (!currentUser?.childEmail) return null
    return users.find((user) => user.email === currentUser.childEmail) ?? null
  }, [currentUser, users])

  const childEmail = currentUser?.childEmail ?? ''
  const childClassId = child?.classId ?? ''

  const childAttendance = useMemo(
    () => attendance.filter((item) => item.studentEmail === childEmail),
    [attendance, childEmail],
  )
  const myNotifications = useMemo(
    () =>
      notifications.filter(
        (n) =>
          (n.audience === 'parent' && n.target === currentUser?.email) ||
          (n.audience === 'class' && n.target === childClassId),
      ),
    [notifications, currentUser, childClassId],
  )
  const parentChatGroup = useMemo(
    () => chatGroups.find((g) => g.classId === childClassId && g.type === 'parent-teacher'),
    [chatGroups, childClassId],
  )

  const [contact, setContact] = useState({
    email: currentUser?.email ?? '',
    phone: currentUser?.phone ?? '',
  })
  const [contactError, setContactError] = useState('')

  const saveContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (contact.phone && !/^[+\d][\d\s()-]{5,}$/.test(contact.phone)) {
      setContactError('Enter a valid phone number.')
      return
    }
    setContactError('')
    const updated = updateUser(currentUser!.email, { phone: contact.phone.trim() })
    if (updated) {
      setCurrentUser(updated)
      push('success', 'Contact info updated.')
    }
  }

  return (
    <Tabs
      tabs={[
        {
          id: 'contact',
          label: 'My Contact',
          content: (
            <Card
              title="Contact Information"
              description={
                child ? `Linked child: ${child.fullName} (${child.email})` : 'No linked child.'
              }
            >
              <form onSubmit={saveContact} noValidate className="grid sm:grid-cols-2 gap-4">
                <FormField
                  label="Email (login, read-only)"
                  name="parentEmailField"
                  value={contact.email}
                  onChange={() => undefined}
                  disabled
                />
                <FormField
                  label="Phone"
                  name="parentPhone"
                  value={contact.phone}
                  onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                  error={contactError || undefined}
                />
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
                  >
                    Save Contact Info
                  </button>
                </div>
              </form>
            </Card>
          ),
        },
        {
          id: 'timetable',
          label: 'Timetable',
          content: (
            <Card title="Child's Timetable" description={child ? `Class ${childClassId}` : ''}>
              {childClassId ? (
                <TimetableGrid classId={childClassId} />
              ) : (
                <p className="text-sm text-rose-600">No linked child account.</p>
              )}
            </Card>
          ),
        },
        {
          id: 'marks',
          label: 'Marks',
          content: <MarksTab email={childEmail} />,
        },
        {
          id: 'attendance',
          label: 'Attendance',
          content: <AttendanceTab studentAttendance={childAttendance} />,
        },
        {
          id: 'news',
          label: 'School News',
          content: (
            <Card title="School News">
              <ul className="space-y-3">
                {news.map((item) => (
                  <li key={item.id} className="border border-slate-200 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{item.body}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.date} · {item.author}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ),
        },
        {
          id: 'notifications',
          label: 'Notifications',
          content: (
            <Card title="Notifications about my child">
              {myNotifications.length === 0 ? (
                <p className="text-sm text-slate-500">No notifications.</p>
              ) : (
                <ul className="space-y-2">
                  {myNotifications.map((n) => (
                    <li key={n.id} className="border border-slate-200 rounded-lg px-3 py-2">
                      <Link
                        to={notificationDetailPath(n.id)}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {n.title}
                      </Link>
                      <p className="text-sm text-slate-600">{n.body}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {n.date} · {n.sender}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ),
        },
        {
          id: 'chat',
          label: 'Parent Chat',
          content: (
            <Card title="Parent Chat Group" description="Parents & teachers of the class">
              {parentChatGroup ? (
                <ChatPanel groupId={parentChatGroup.id} />
              ) : (
                <p className="text-sm text-slate-500">No parent chat group for this class yet.</p>
              )}
            </Card>
          ),
        },
        {
          id: 'helplines',
          label: 'Helplines',
          content: (
            <Card title="Helplines">
              <ul className="grid sm:grid-cols-3 gap-3">
                {helplines.map((helpline) => (
                  <li
                    key={helpline.phone}
                    className="border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <p className="font-semibold text-slate-900">{helpline.label}</p>
                    <p className="text-sm text-slate-600">{helpline.phone}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ),
        },
      ]}
    />
  )
}
