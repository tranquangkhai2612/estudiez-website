import { useMemo, useState } from 'react'
import { Card } from '../../components/Card'
import { FormField } from '../../components/FormField'
import { Tabs } from '../../components/Tabs'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useToast } from '../../hooks/useToast'
import type { Grade, User } from '../../types'

export function AdminDashboard() {
  const { users, registrations } = useData()

  const counts = useMemo(() => {
    return {
      students: users.filter((u) => u.role === 'student').length,
      teachers: users.filter((u) => u.role === 'teacher').length,
      parents: users.filter((u) => u.role === 'parent').length,
    }
  }, [users])

  const pendingCount = registrations.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Students" value={counts.students} />
        <StatCard label="Teachers" value={counts.teachers} />
        <StatCard label="Parents" value={counts.parents} />
      </div>

      <Card title="School Administration">
        <Tabs
          tabs={[
            {
              id: 'requests',
              label: pendingCount > 0 ? `Requests (${pendingCount})` : 'Requests',
              content: <ManageRequests />,
            },
            { id: 'students', label: 'Students', content: <ManageStudents /> },
            { id: 'teachers', label: 'Teachers', content: <ManageTeachers /> },
            { id: 'news', label: 'News', content: <ManageNews /> },
            { id: 'notify', label: 'Notify Teachers', content: <NotifyTeachers /> },
          ]}
        />
      </Card>
    </div>
  )
}

function ManageRequests() {
  const { registrations, approveRegistration, rejectRegistration } = useData()
  const { push } = useToast()

  const pending = registrations.filter((r) => r.status === 'pending')
  const handled = registrations.filter((r) => r.status !== 'pending')

  const handleApprove = (id: number, email: string) => {
    approveRegistration(id)
    push('success', `Account approved. Login info sent to ${email}.`)
  }

  const handleReject = (id: number, email: string) => {
    rejectRegistration(id)
    push('info', `Registration request from ${email} was rejected.`)
  }

  return (
    <div className="space-y-4">
      <Card
        title="Pending Registration Requests"
        description="New sign-ups must be approved before they can log in."
      >
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">No pending requests.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((request) => (
              <li
                key={request.id}
                className="border border-slate-200 rounded-lg p-4 flex flex-wrap items-start justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {request.fullName}{' '}
                    <span className="ml-1 inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold uppercase">
                      {request.role}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">{request.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {request.address}
                    {request.age ? ` · Age ${request.age}` : ''}
                    {request.childEmail ? ` · Child: ${request.childEmail}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Submitted {request.submittedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(request.id, request.email)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md px-3 py-1.5"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(request.id, request.email)}
                    className="border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-md px-3 py-1.5"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {handled.length > 0 ? (
        <Card title="Reviewed Requests">
          <ul className="divide-y divide-slate-100">
            {handled.map((request) => (
              <li key={request.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-700">
                  {request.fullName} · {request.email}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                    request.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {request.status}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-indigo-600 mt-1">{value}</p>
    </div>
  )
}

interface StudentFormState {
  email: string
  fullName: string
  address: string
  age: string
  classId: string
  parentEmail: string
}

const STUDENT_INITIAL: StudentFormState = {
  email: '',
  fullName: '',
  address: '',
  age: '',
  classId: '',
  parentEmail: '',
}

function ManageStudents() {
  const { users, classes, addUser, updateUser } = useData()
  const { push } = useToast()
  const students = users.filter((u) => u.role === 'student')

  const [form, setForm] = useState<StudentFormState>({
    ...STUDENT_INITIAL,
    classId: classes[0]?.id ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormState, string>>>({})

  const update = <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof StudentFormState, string>> = {}
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Enter a valid email.'
    else if (users.some((u) => u.email === form.email.trim().toLowerCase()))
      next.email = 'This email already exists.'
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (!form.classId) next.classId = 'Assign a class.'
    const ageNumber = Number(form.age)
    if (!form.age) next.age = 'Age is required.'
    else if (Number.isNaN(ageNumber) || ageNumber < 5 || ageNumber > 100)
      next.age = 'Age must be 5-100.'
    if (form.parentEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.parentEmail))
      next.parentEmail = 'Enter a valid parent email or leave blank.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const selectedClass = classes.find((c) => c.id === form.classId)
    const email = form.email.trim().toLowerCase()
    const newStudent: User = {
      email,
      fullName: form.fullName.trim(),
      address: form.address.trim(),
      age: ageNumber,
      password: 'student123',
      role: 'student',
      classId: form.classId,
      grade: (selectedClass?.grade ?? 10) as Grade,
    }
    addUser(newStudent)

    // Link an existing parent account if provided.
    if (form.parentEmail) {
      const parentEmail = form.parentEmail.trim().toLowerCase()
      const parent = users.find((u) => u.email === parentEmail && u.role === 'parent')
      if (parent) updateUser(parentEmail, { childEmail: email })
    }

    setForm({ ...STUDENT_INITIAL, classId: form.classId })
    push('success', `Student added. Login info sent to ${email}${form.parentEmail ? ' and parent' : ''}.`)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Add / Enroll Student" description="Login credentials are emailed to the student and parent.">
        <form onSubmit={submit} noValidate className="space-y-3">
          <FormField
            label="Email"
            name="studentEmail"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
          />
          <FormField
            label="Full Name"
            name="studentName"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            error={errors.fullName}
          />
          <FormField
            label="Address"
            name="studentAddress"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            error={errors.address}
          />
          <FormField
            label="Age"
            name="studentAge"
            type="number"
            min={5}
            max={100}
            value={form.age}
            onChange={(e) => update('age', e.target.value)}
            error={errors.age}
          />
          <FormField
            as="select"
            label="Class"
            name="studentClass"
            value={form.classId}
            onChange={(e) => update('classId', e.target.value)}
            error={errors.classId}
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Grade {c.grade})
              </option>
            ))}
          </FormField>
          <FormField
            label="Parent Email (optional)"
            name="parentEmail"
            type="email"
            value={form.parentEmail}
            onChange={(e) => update('parentEmail', e.target.value)}
            error={errors.parentEmail}
            hint="Links an existing parent account to this student."
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
          >
            Add Student
          </button>
        </form>
      </Card>

      <Card title="Students">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Class</th>
                <th className="py-2 pr-4">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.email} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-semibold">{s.fullName}</td>
                  <td className="py-2 pr-4">{s.classId}</td>
                  <td className="py-2 pr-4 text-slate-600">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

interface TeacherFormState {
  email: string
  fullName: string
  address: string
  subject: string
}

const TEACHER_INITIAL: TeacherFormState = {
  email: '',
  fullName: '',
  address: '',
  subject: '',
}

function ManageTeachers() {
  const { users, subjects, addUser, updateUser } = useData()
  const { push } = useToast()
  const teachers = users.filter((u) => u.role === 'teacher')

  const [form, setForm] = useState<TeacherFormState>({
    ...TEACHER_INITIAL,
    subject: subjects[0]?.name ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof TeacherFormState, string>>>({})

  const update = <K extends keyof TeacherFormState>(key: K, value: TeacherFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof TeacherFormState, string>> = {}
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Enter a valid email.'
    else if (users.some((u) => u.email === form.email.trim().toLowerCase()))
      next.email = 'This email already exists.'
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (!form.subject) next.subject = 'Assign a subject.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    addUser({
      email: form.email.trim().toLowerCase(),
      fullName: form.fullName.trim(),
      address: form.address.trim(),
      password: 'teacher123',
      role: 'teacher',
      subject: form.subject,
    })
    setForm({ ...TEACHER_INITIAL, subject: form.subject })
    push('success', `Teacher added and assigned to ${form.subject}.`)
  }

  const reassign = (email: string, subject: string) => {
    updateUser(email, { subject })
    push('success', 'Subject reassigned.')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Add Subject Teacher">
        <form onSubmit={submit} noValidate className="space-y-3">
          <FormField
            label="Email"
            name="teacherEmail"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
          />
          <FormField
            label="Full Name"
            name="teacherName"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            error={errors.fullName}
          />
          <FormField
            label="Address"
            name="teacherAddress"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            error={errors.address}
          />
          <FormField
            as="select"
            label="Subject"
            name="teacherSubject"
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            error={errors.subject}
          >
            <option value="">Select a subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </FormField>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
          >
            Add Teacher
          </button>
        </form>
      </Card>

      <Card title="Teachers & Subjects">
        <ul className="space-y-2">
          {teachers.map((t) => (
            <li
              key={t.email}
              className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2"
            >
              <div>
                <p className="font-semibold text-slate-900">{t.fullName}</p>
                <p className="text-xs text-slate-500">{t.email}</p>
              </div>
              <select
                value={t.subject ?? ''}
                onChange={(e) => reassign(t.email, e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

interface NewsFormState {
  title: string
  category: string
  body: string
}

const NEWS_INITIAL: NewsFormState = { title: '', category: 'Announcement', body: '' }

function ManageNews() {
  const { news, addNews } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()

  const [form, setForm] = useState<NewsFormState>(NEWS_INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof NewsFormState, string>>>({})

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof NewsFormState, string>> = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.body.trim()) next.body = 'Body is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    addNews({
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category,
      author: currentUser?.fullName ?? 'Admin',
      date: new Date().toISOString().slice(0, 10),
    })
    setForm(NEWS_INITIAL)
    push('success', 'News published.')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Post School News">
        <form onSubmit={submit} noValidate className="space-y-3">
          <FormField
            label="Title"
            name="newsTitle"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            error={errors.title}
          />
          <FormField
            as="select"
            label="Category"
            name="newsCategory"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            <option>Announcement</option>
            <option>Event</option>
            <option>Notice</option>
          </FormField>
          <FormField
            as="textarea"
            label="Body"
            name="newsBody"
            rows={4}
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            error={errors.body}
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
          >
            Publish
          </button>
        </form>
      </Card>

      <Card title="Published News">
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
    </div>
  )
}

function NotifyTeachers() {
  const { addNotification, notifications } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const teacherNotifications = notifications.filter((n) => n.audience === 'teacher')

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required.')
      return
    }
    setError('')
    addNotification({
      title: title.trim(),
      body: body.trim(),
      audience: 'teacher',
      sender: currentUser?.fullName ?? 'Admin',
      date: new Date().toISOString().slice(0, 10),
    })
    setTitle('')
    setBody('')
    push('success', 'Notification sent to all teachers.')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Send Notification to Teachers">
        <form onSubmit={submit} noValidate className="space-y-3">
          <FormField
            label="Title"
            name="notifyTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={error && !title.trim() ? error : undefined}
          />
          <FormField
            as="textarea"
            label="Message"
            name="notifyBody"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            error={error && !body.trim() ? error : undefined}
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
          >
            Send
          </button>
        </form>
      </Card>

      <Card title="Recent Teacher Notifications">
        <ul className="space-y-2">
          {teacherNotifications.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications sent yet.</p>
          ) : (
            teacherNotifications.map((n) => (
              <li key={n.id} className="border border-slate-200 rounded-lg px-3 py-2">
                <p className="font-semibold text-slate-900">{n.title}</p>
                <p className="text-sm text-slate-600">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {n.date} · {n.sender}
                </p>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}
