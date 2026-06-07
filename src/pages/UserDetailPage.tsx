import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { FormField } from '../components/FormField'
import { useData } from '../hooks/useData'
import { useToast } from '../hooks/useToast'
import { classDetailPath } from './classDetailPath'
import { userDetailPath } from './userDetailPath'
import type { AttendanceStatus, Grade, Role, User } from '../types'

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-slate-200 text-slate-700',
  teacher: 'bg-indigo-100 text-indigo-700',
  student: 'bg-emerald-100 text-emerald-700',
  parent: 'bg-amber-100 text-amber-700',
}

const ATTENDANCE_BADGE: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-rose-100 text-rose-700',
  late: 'bg-amber-100 text-amber-700',
  excused: 'bg-slate-200 text-slate-600',
}

const PHONE_PATTERN = /^[+\d][\d\s().-]{6,}$/
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

interface EditFormState {
  fullName: string
  address: string
  phone: string
  age: string
  classId: string
  parentEmail: string
  subject: string
  childEmail: string
}

type EditErrors = Partial<Record<keyof EditFormState, string>>

export function UserDetailPage() {
  const { email: emailParam } = useParams<{ email: string }>()
  const navigate = useNavigate()
  const { users, classes, scores, attendance, progress, evaluations, updateUser, deleteUser } =
    useData()
  const { push } = useToast()

  const [editing, setEditing] = useState(false)

  const email = (emailParam ? decodeURIComponent(emailParam) : '').toLowerCase()
  const user = users.find((u) => u.email.toLowerCase() === email)

  if (!user) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back
        </button>
        <Card title="User not found" description="No account is registered with that email.">
          <Link to="/dashboard" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Return to dashboard
          </Link>
        </Card>
      </div>
    )
  }

  const linkedParent = users.find((u) => u.role === 'parent' && u.childEmail === user.email)

  const handleDelete = () => {
    if (user.role === 'teacher') {
      const homeroomOf = classes.find((c) => c.homeroomTeacher === user.email)
      if (homeroomOf) {
        push(
          'error',
          `${user.fullName} is homeroom teacher of ${homeroomOf.name}. Reassign the class first.`,
        )
        return
      }
    }
    if (!window.confirm(`Delete ${user.fullName}? This cannot be undone.`)) return
    if (user.role === 'student' && linkedParent) {
      updateUser(linkedParent.email, { childEmail: undefined })
    }
    deleteUser(user.email)
    push('info', `${user.fullName} was removed.`)
    navigate('/dashboard')
  }

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
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${ROLE_BADGE[user.role]}`}
          >
            {user.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
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
      </header>

      {editing ? (
        <EditUserForm user={user} linkedParent={linkedParent} onDone={() => setEditing(false)} />
      ) : null}

      <Card title="Account Details">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <Detail label="Email" value={user.email} />
          <Detail label="Phone" value={user.phone ?? '—'} />
          <Detail label="Address" value={user.address || '—'} />
          {user.age ? <Detail label="Age" value={String(user.age)} /> : null}
        </dl>
      </Card>

      {user.role === 'student' ? (
        <StudentDetail
          user={user}
          classes={classes}
          scores={scores}
          attendance={attendance}
          progress={progress}
          evaluations={evaluations}
          parent={linkedParent}
        />
      ) : null}

      {user.role === 'teacher' ? <TeacherDetail user={user} /> : null}

      {user.role === 'parent' ? (
        <ParentDetail
          user={user}
          child={users.find((u) => u.role === 'student' && u.email === user.childEmail)}
        />
      ) : null}
    </div>
  )
}

function EditUserForm({
  user,
  linkedParent,
  onDone,
}: {
  user: User
  linkedParent?: User
  onDone: () => void
}) {
  const { users, classes, subjects, updateUser } = useData()
  const { push } = useToast()

  const [form, setForm] = useState<EditFormState>({
    fullName: user.fullName,
    address: user.address,
    phone: user.phone ?? '',
    age: user.age ? String(user.age) : '',
    classId: user.classId ?? '',
    parentEmail: linkedParent?.email ?? '',
    subject: user.subject ?? '',
    childEmail: user.childEmail ?? '',
  })
  const [errors, setErrors] = useState<EditErrors>({})

  const update = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: EditErrors = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (!form.phone.trim()) next.phone = 'Phone number is required.'
    else if (!PHONE_PATTERN.test(form.phone.trim())) next.phone = 'Enter a valid phone number.'

    if (user.role === 'student') {
      const ageNumber = Number(form.age)
      if (!form.age) next.age = 'Age is required.'
      else if (Number.isNaN(ageNumber) || ageNumber < 5 || ageNumber > 100)
        next.age = 'Age must be 5-100.'
      if (!form.classId) next.classId = 'Assign a class.'
      if (form.parentEmail && !EMAIL_PATTERN.test(form.parentEmail))
        next.parentEmail = 'Enter a valid parent email or leave blank.'
    }
    if (user.role === 'teacher' && !form.subject) next.subject = 'Assign a subject.'
    if (user.role === 'parent' && form.childEmail) {
      if (!EMAIL_PATTERN.test(form.childEmail))
        next.childEmail = 'Enter a valid student email or leave blank.'
      else if (
        !users.some(
          (u) => u.email === form.childEmail.trim().toLowerCase() && u.role === 'student',
        )
      )
        next.childEmail = 'No student account is registered with that email.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const patch: Parameters<typeof updateUser>[1] = {
      fullName: form.fullName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
    }

    if (user.role === 'student') {
      const selectedClass = classes.find((c) => c.id === form.classId)
      patch.age = Number(form.age)
      patch.classId = form.classId
      patch.grade = (selectedClass?.grade ?? 10) as Grade
    }
    if (user.role === 'teacher') patch.subject = form.subject
    if (user.role === 'parent')
      patch.childEmail = form.childEmail ? form.childEmail.trim().toLowerCase() : undefined

    updateUser(user.email, patch)

    // Sync the parent → child link for students.
    if (user.role === 'student') {
      const nextParentEmail = form.parentEmail.trim().toLowerCase()
      if (linkedParent && linkedParent.email !== nextParentEmail) {
        updateUser(linkedParent.email, { childEmail: undefined })
      }
      if (nextParentEmail) {
        const parent = users.find((u) => u.email === nextParentEmail && u.role === 'parent')
        if (parent) updateUser(nextParentEmail, { childEmail: user.email })
      }
    }

    push('success', 'Profile updated.')
    onDone()
  }

  return (
    <Card
      title={`Edit ${user.fullName}`}
      description="Email and role are fixed and cannot be changed."
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Full Name"
          name="editFullName"
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          error={errors.fullName}
        />
        <FormField
          label="Phone Number"
          name="editPhone"
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          error={errors.phone}
        />
        <FormField
          label="Address"
          name="editAddress"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          error={errors.address}
        />

        {user.role === 'student' ? (
          <>
            <FormField
              label="Age"
              name="editAge"
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
              name="editClass"
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
              name="editParentEmail"
              type="email"
              value={form.parentEmail}
              onChange={(e) => update('parentEmail', e.target.value)}
              error={errors.parentEmail}
              hint="Links an existing parent account to this student."
            />
          </>
        ) : null}

        {user.role === 'teacher' ? (
          <FormField
            as="select"
            label="Subject"
            name="editSubject"
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
        ) : null}

        {user.role === 'parent' ? (
          <FormField
            label="Child's Email (optional)"
            name="editChildEmail"
            type="email"
            value={form.childEmail}
            onChange={(e) => update('childEmail', e.target.value)}
            error={errors.childEmail}
            hint="Link this parent to a student account."
          />
        ) : null}

        <div className="sm:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800">{value}</dd>
    </div>
  )
}

interface StudentDetailProps {
  user: User
  classes: ReturnType<typeof useData>['classes']
  scores: ReturnType<typeof useData>['scores']
  attendance: ReturnType<typeof useData>['attendance']
  progress: ReturnType<typeof useData>['progress']
  evaluations: ReturnType<typeof useData>['evaluations']
  parent?: User
}

function StudentDetail({
  user,
  classes,
  scores,
  attendance,
  progress,
  evaluations,
  parent,
}: StudentDetailProps) {
  const studentClass = classes.find((c) => c.id === user.classId)
  const studentScores = scores.filter((s) => s.studentEmail === user.email)
  const studentAttendance = attendance.filter((a) => a.studentEmail === user.email)
  const studentProgress = progress.filter((p) => p.studentEmail === user.email)
  const studentEvaluations = evaluations.filter((e) => e.studentEmail === user.email)

  const attendanceSummary = useMemo(() => {
    const summary: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    }
    for (const record of studentAttendance) summary[record.status] += 1
    return summary
  }, [studentAttendance])

  return (
    <>
      <Card title="Enrollment">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <Detail label="Class" value={studentClass ? studentClass.name : user.classId ?? '—'} />
          <Detail label="Grade" value={user.grade ? String(user.grade) : '—'} />
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Parent / Guardian</dt>
            <dd className="mt-1 font-medium text-slate-800">
              {parent ? (
                <Link
                  to={userDetailPath(parent.email)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {parent.fullName}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title={`Marks (${studentScores.length})`}>
        {studentScores.length === 0 ? (
          <p className="text-sm text-slate-500">No marks recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Test</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {studentScores.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-semibold">{s.subject}</td>
                    <td className="py-2 pr-4 text-slate-600">{s.description}</td>
                    <td className="py-2 pr-4 text-slate-600">{s.date}</td>
                    <td className="py-2 pr-2 text-right font-semibold">{s.scoreReceived}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Attendance Summary">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(attendanceSummary) as AttendanceStatus[]).map((status) => (
            <span
              key={status}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${ATTENDANCE_BADGE[status]}`}
            >
              <span className="capitalize">{status}</span>
              <span>{attendanceSummary[status]}</span>
            </span>
          ))}
        </div>
      </Card>

      {studentProgress.length > 0 ? (
        <Card title={`Progress (${studentProgress.length})`}>
          <ul className="space-y-2">
            {studentProgress.map((p) => (
              <li key={p.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <p className="font-semibold text-slate-900">
                  {p.subject} · {p.testName}{' '}
                  <span className="ml-1 text-indigo-600">{p.score}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {p.term} · {p.remark}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {studentEvaluations.length > 0 ? (
        <Card title={`Teacher Evaluations (${studentEvaluations.length})`}>
          <ul className="space-y-2">
            {studentEvaluations.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <p className="font-semibold text-slate-900">{e.subject}</p>
                <p className="text-xs text-emerald-700">Strengths: {e.strengths}</p>
                <p className="text-xs text-rose-700">Weaknesses: {e.weaknesses}</p>
                <p className="mt-1 text-xs text-slate-600">Path: {e.suggestedPath}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  )
}

function TeacherDetail({ user }: { user: User }) {
  const { classes, timetable } = useData()
  const homeroomClasses = classes.filter((c) => c.homeroomTeacher === user.email)

  const taughtClasses = useMemo(() => {
    const ids = Array.from(
      new Set(timetable.filter((s) => s.teacher === user.fullName).map((s) => s.classId)),
    )
    return ids
      .map((id) => classes.find((c) => c.id === id))
      .filter((c): c is (typeof classes)[number] => Boolean(c))
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [timetable, classes, user.fullName])

  return (
    <Card title="Teaching">
      <dl className="grid gap-4 sm:grid-cols-2 text-sm">
        <Detail label="Subject" value={user.subject ?? '—'} />
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-500">Homeroom Classes</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {homeroomClasses.length === 0
              ? '—'
              : homeroomClasses.map((c) => c.name).join(', ')}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Classes Teaching</p>
        {taughtClasses.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">No scheduled classes.</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {taughtClasses.map((c) => (
              <li key={c.id}>
                <Link
                  to={classDetailPath(c.id, user.subject)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  <span>
                    <span className="block font-semibold text-indigo-600">{c.name}</span>
                    <span className="block text-xs text-slate-500">
                      {c.id} · Grade {c.grade}
                    </span>
                  </span>
                  <span aria-hidden className="text-slate-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

function ParentDetail({ user, child }: { user: User; child?: User }) {
  return (
    <Card title="Linked Child">
      {child ? (
        <Link
          to={userDetailPath(child.email)}
          className="inline-flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
            {child.fullName.charAt(0).toUpperCase()}
          </span>
          <span>
            <span className="block font-semibold text-slate-900">{child.fullName}</span>
            <span className="block text-xs text-slate-500">{child.email}</span>
          </span>
        </Link>
      ) : (
        <p className="text-sm text-slate-500">
          {user.childEmail
            ? `No student account found for ${user.childEmail}.`
            : 'No child account linked.'}
        </p>
      )}
    </Card>
  )
}
