import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/Card'
import { FormField } from '../../components/FormField'
import { Tabs } from '../../components/Tabs'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useToast } from '../../hooks/useToast'
import { userDetailPath } from '../userDetailPath'
import { classDetailPath } from '../classDetailPath'
import type { Grade } from '../../types'

export function AdminDashboard() {
  const { users, classes, registrations } = useData()

  const counts = useMemo(() => {
    return {
      students: users.filter((u) => u.role === 'student').length,
      teachers: users.filter((u) => u.role === 'teacher').length,
      parents: users.filter((u) => u.role === 'parent').length,
      classes: classes.length,
    }
  }, [users, classes])

  const pendingCount = registrations.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Students" value={counts.students} />
        <StatCard label="Teachers" value={counts.teachers} />
        <StatCard label="Parents" value={counts.parents} />
        <StatCard label="Classes" value={counts.classes} />
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
            { id: 'classes', label: 'Classes', content: <ManageClasses /> },
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
  phone: string
  age: string
  classId: string
  parentEmail: string
}

const STUDENT_INITIAL: StudentFormState = {
  email: '',
  fullName: '',
  address: '',
  phone: '',
  age: '',
  classId: '',
  parentEmail: '',
}

function ManageStudents() {
  const { users, classes, addUser, updateUser } = useData()
  const { push } = useToast()
  const navigate = useNavigate()
  const students = users.filter((u) => u.role === 'student')

  const [form, setForm] = useState<StudentFormState>({
    ...STUDENT_INITIAL,
    classId: classes[0]?.id ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormState, string>>>({})

  const update = <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const resetForm = () => {
    setForm({ ...STUDENT_INITIAL, classId: classes[0]?.id ?? '' })
    setErrors({})
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = form.email.trim().toLowerCase()
    const next: Partial<Record<keyof StudentFormState, string>> = {}
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Enter a valid email.'
    else if (users.some((u) => u.email === email)) next.email = 'This email already exists.'
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (!form.phone.trim()) next.phone = 'Phone number is required.'
    else if (!/^[+\d][\d\s().-]{6,}$/.test(form.phone.trim()))
      next.phone = 'Enter a valid phone number.'
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
    const grade = (selectedClass?.grade ?? 10) as Grade

    addUser({
      email,
      fullName: form.fullName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      age: ageNumber,
      password: 'student123',
      role: 'student',
      classId: form.classId,
      grade,
    })

    // Link an existing parent account to this student.
    const nextParentEmail = form.parentEmail.trim().toLowerCase()
    if (nextParentEmail) {
      const parent = users.find((u) => u.email === nextParentEmail && u.role === 'parent')
      if (parent) updateUser(nextParentEmail, { childEmail: email })
    }

    resetForm()
    push('success', `Student added. Login info sent to ${email}.`)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card
        title="Add / Enroll Student"
        description="Login credentials are emailed to the student and parent."
      >
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
            label="Phone Number"
            name="studentPhone"
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            error={errors.phone}
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
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
            >
              Add Student
            </button>
          </div>
        </form>
      </Card>

      <Card title={`Students (${students.length})`}>
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
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 text-slate-500">
                    No students yet.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.email} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-semibold">
                      <button
                        type="button"
                        onClick={() => navigate(userDetailPath(s.email))}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {s.fullName}
                      </button>
                    </td>
                    <td className="py-2 pr-4">{s.classId}</td>
                    <td className="py-2 pr-4 text-slate-600">{s.email}</td>
                  </tr>
                ))
              )}
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
  phone: string
  subject: string
}

const TEACHER_INITIAL: TeacherFormState = {
  email: '',
  fullName: '',
  address: '',
  phone: '',
  subject: '',
}

function ManageTeachers() {
  const { users, subjects, addUser } = useData()
  const { push } = useToast()
  const navigate = useNavigate()
  const teachers = users.filter((u) => u.role === 'teacher')

  const [form, setForm] = useState<TeacherFormState>({
    ...TEACHER_INITIAL,
    subject: subjects[0]?.name ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof TeacherFormState, string>>>({})

  const update = <K extends keyof TeacherFormState>(key: K, value: TeacherFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const resetForm = () => {
    setForm({ ...TEACHER_INITIAL, subject: subjects[0]?.name ?? '' })
    setErrors({})
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = form.email.trim().toLowerCase()
    const next: Partial<Record<keyof TeacherFormState, string>> = {}
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Enter a valid email.'
    else if (users.some((u) => u.email === email)) next.email = 'This email already exists.'
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (!form.phone.trim()) next.phone = 'Phone number is required.'
    else if (!/^[+\d][\d\s().-]{6,}$/.test(form.phone.trim()))
      next.phone = 'Enter a valid phone number.'
    if (!form.subject) next.subject = 'Assign a subject.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    addUser({
      email,
      fullName: form.fullName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      password: 'teacher123',
      role: 'teacher',
      subject: form.subject,
    })
    resetForm()
    push('success', `Teacher added and assigned to ${form.subject}.`)
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
            label="Phone Number"
            name="teacherPhone"
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            error={errors.phone}
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
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
            >
              Add Teacher
            </button>
          </div>
        </form>
      </Card>

      <Card title={`Teachers & Subjects (${teachers.length})`}>
        {teachers.length === 0 ? (
          <p className="text-sm text-slate-500">No teachers yet.</p>
        ) : (
          <ul className="space-y-2">
            {teachers.map((t) => (
              <li
                key={t.email}
                className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => navigate(userDetailPath(t.email))}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {t.fullName}
                  </button>
                  <p className="text-xs text-slate-500">{t.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">
                    {t.subject}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

interface ClassFormState {
  id: string
  name: string
  grade: string
  year: string
  homeroomTeacher: string
}

const CLASS_INITIAL: ClassFormState = {
  id: '',
  name: '',
  grade: '10',
  year: '2025-2026',
  homeroomTeacher: '',
}

function ManageClasses() {
  const { classes, users, addClass } = useData()
  const { push } = useToast()
  const navigate = useNavigate()
  const teachers = users.filter((u) => u.role === 'teacher')

  const studentsByClass = useMemo(() => {
    const map = new Map<string, number>()
    for (const u of users) {
      if (u.role === 'student' && u.classId) {
        map.set(u.classId, (map.get(u.classId) ?? 0) + 1)
      }
    }
    return map
  }, [users])

  const [form, setForm] = useState<ClassFormState>(CLASS_INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof ClassFormState, string>>>({})

  const update = <K extends keyof ClassFormState>(key: K, value: ClassFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const resetForm = () => {
    setForm(CLASS_INITIAL)
    setErrors({})
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const id = form.id.trim()
    const next: Partial<Record<keyof ClassFormState, string>> = {}
    if (!id) next.id = 'Class ID is required.'
    else if (classes.some((c) => c.id.toLowerCase() === id.toLowerCase()))
      next.id = 'This class ID already exists.'
    if (!form.name.trim()) next.name = 'Class name is required.'
    if (!form.year.trim()) next.year = 'Academic year is required.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const grade = Number(form.grade) as Grade
    addClass({
      id,
      name: form.name.trim(),
      grade,
      year: form.year.trim(),
      homeroomTeacher: form.homeroomTeacher || undefined,
    })
    resetForm()
    push('success', `Class ${id} created.`)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Create Class">
        <form onSubmit={submit} noValidate className="space-y-3">
          <FormField
            label="Class ID"
            name="classId"
            value={form.id}
            onChange={(e) => update('id', e.target.value)}
            error={errors.id}
            hint="Short code, e.g. 10A1."
          />
          <FormField
            label="Class Name"
            name="className"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            error={errors.name}
          />
          <FormField
            as="select"
            label="Grade"
            name="classGrade"
            value={form.grade}
            onChange={(e) => update('grade', e.target.value)}
          >
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </FormField>
          <FormField
            label="Academic Year"
            name="classYear"
            value={form.year}
            onChange={(e) => update('year', e.target.value)}
            error={errors.year}
          />
          <FormField
            as="select"
            label="Homeroom Teacher (optional)"
            name="classHomeroom"
            value={form.homeroomTeacher}
            onChange={(e) => update('homeroomTeacher', e.target.value)}
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.email} value={t.email}>
                {t.fullName} ({t.subject})
              </option>
            ))}
          </FormField>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
            >
              Create Class
            </button>
          </div>
        </form>
      </Card>

      <Card title={`Classes (${classes.length})`}>
        {classes.length === 0 ? (
          <p className="text-sm text-slate-500">No classes yet.</p>
        ) : (
          <ul className="space-y-2">
            {classes.map((c) => {
              const homeroom = users.find((u) => u.email === c.homeroomTeacher)
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-start justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <div>
                    <p>
                      <button
                        type="button"
                        onClick={() => navigate(classDetailPath(c.id))}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {c.name}
                      </button>{' '}
                      <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">
                        Grade {c.grade}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.id} · {c.year} · {studentsByClass.get(c.id) ?? 0} student(s)
                    </p>
                    <p className="text-xs text-slate-500">
                      Homeroom: {homeroom ? homeroom.fullName : 'Unassigned'}
                    </p>
                  </div>
                  <span aria-hidden className="text-slate-400">→</span>
                </li>
              )
            })}
          </ul>
        )}
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
