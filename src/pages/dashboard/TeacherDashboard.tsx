import { useMemo, useState } from 'react'
import { Card } from '../../components/Card'
import { ChatPanel } from '../../components/ChatPanel'
import { FormField } from '../../components/FormField'
import { Tabs } from '../../components/Tabs'
import { useData } from '../../hooks/useData'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import type { AttendanceStatus, Resource, User } from '../../types'

const ATTENDANCE_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

export function TeacherDashboard() {
  const { currentUser } = useAuth()
  const { timetable, users, chatGroups } = useData()

  const subject = currentUser?.subject ?? ''

  // Classes this teacher teaches, derived from the timetable for their subject.
  const teacherClassIds = useMemo(() => {
    const ids = new Set(
      timetable.filter((slot) => slot.subject === subject).map((slot) => slot.classId),
    )
    return Array.from(ids)
  }, [timetable, subject])

  const studentsByClass = useMemo(() => {
    const map = new Map<string, User[]>()
    for (const classId of teacherClassIds) {
      map.set(
        classId,
        users.filter((u) => u.role === 'student' && u.classId === classId),
      )
    }
    return map
  }, [teacherClassIds, users])

  const myStudents = useMemo(
    () => users.filter((u) => u.role === 'student' && teacherClassIds.includes(u.classId ?? '')),
    [users, teacherClassIds],
  )

  const studentChatGroup = useMemo(
    () =>
      chatGroups.find(
        (g) => teacherClassIds.includes(g.classId) && g.type === 'student-teacher',
      ),
    [chatGroups, teacherClassIds],
  )

  return (
    <div className="space-y-4">
      <Card title="My Teaching" description={`Subject: ${subject || '—'}`}>
        <p className="text-sm text-slate-600">
          You teach{' '}
          <span className="font-semibold">
            {teacherClassIds.length > 0 ? teacherClassIds.join(', ') : 'no classes yet'}
          </span>
          .
        </p>
      </Card>

      <Tabs
        tabs={[
          {
            id: 'attendance',
            label: 'Attendance',
            content: (
              <AttendanceForm
                subject={subject}
                classIds={teacherClassIds}
                studentsByClass={studentsByClass}
              />
            ),
          },
          {
            id: 'marks',
            label: 'Marks',
            content: <ScoreForm subject={subject} students={myStudents} />,
          },
          {
            id: 'evaluation',
            label: 'Evaluation + AI',
            content: <EvaluationForm subject={subject} students={myStudents} />,
          },
          {
            id: 'resources',
            label: 'Resources',
            content: <ResourceForm subject={subject} classIds={teacherClassIds} />,
          },
          {
            id: 'revision',
            label: 'Revision',
            content: <RevisionForm subject={subject} classIds={teacherClassIds} />,
          },
          {
            id: 'notify',
            label: 'Notify Class',
            content: <NotifyClassForm classIds={teacherClassIds} />,
          },
          {
            id: 'chat',
            label: 'Class Chat',
            content: (
              <Card title="Class Chat Group">
                {studentChatGroup ? (
                  <ChatPanel groupId={studentChatGroup.id} />
                ) : (
                  <p className="text-sm text-slate-500">No chat group for your classes yet.</p>
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  )
}

interface AttendanceFormProps {
  subject: string
  classIds: string[]
  studentsByClass: Map<string, User[]>
}

function AttendanceForm({ subject, classIds, studentsByClass }: AttendanceFormProps) {
  const { addAttendance } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()

  const [classId, setClassId] = useState(classIds[0] ?? '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [period, setPeriod] = useState('1')
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})

  const students = studentsByClass.get(classId) ?? []

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!classId) {
      push('error', 'Select a class.')
      return
    }
    students.forEach((student) => {
      addAttendance({
        studentEmail: student.email,
        classId,
        subject,
        date,
        period: Number(period),
        status: statuses[student.email] ?? 'present',
        teacher: currentUser?.fullName ?? 'Teacher',
      })
    })
    setStatuses({})
    push('success', `Attendance saved for ${students.length} student(s).`)
  }

  return (
    <Card title="Take Attendance" description={`Subject: ${subject}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <FormField
            as="select"
            label="Class"
            name="attClass"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </FormField>
          <FormField
            label="Date"
            name="attDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <FormField
            label="Period"
            name="attPeriod"
            type="number"
            min={1}
            max={10}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-slate-500">No students in this class.</p>
        ) : (
          <ul className="space-y-2">
            {students.map((student) => (
              <li
                key={student.email}
                className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-3 py-2"
              >
                <span className="font-medium text-slate-800">{student.fullName}</span>
                <select
                  value={statuses[student.email] ?? 'present'}
                  onChange={(e) =>
                    setStatuses((prev) => ({
                      ...prev,
                      [student.email]: e.target.value as AttendanceStatus,
                    }))
                  }
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm capitalize"
                >
                  {ATTENDANCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
        >
          Save Attendance
        </button>
      </form>
    </Card>
  )
}

interface ScoreFormState {
  studentEmail: string
  testId: string
  description: string
  date: string
  scoreReceived: string
}

const SCORE_INITIAL: ScoreFormState = {
  studentEmail: '',
  testId: '',
  description: '',
  date: '',
  scoreReceived: '',
}

function ScoreForm({ subject, students }: { subject: string; students: User[] }) {
  const { addScore } = useData()
  const { push } = useToast()
  const [form, setForm] = useState<ScoreFormState>({
    ...SCORE_INITIAL,
    studentEmail: students[0]?.email ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ScoreFormState, string>>>({})

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof ScoreFormState, string>> = {}
    if (!form.studentEmail) next.studentEmail = 'Select a student.'
    if (!form.testId.trim()) next.testId = 'Test ID is required.'
    if (!form.description.trim()) next.description = 'Description is required.'
    if (!form.date) next.date = 'Date is required.'
    const scoreNumber = Number(form.scoreReceived)
    if (!form.scoreReceived) next.scoreReceived = 'Score is required.'
    else if (Number.isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 100)
      next.scoreReceived = 'Score must be between 0 and 100.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const student = students.find((s) => s.email === form.studentEmail)
    addScore({
      studentEmail: form.studentEmail,
      classId: student?.classId ?? '',
      subject,
      testId: form.testId,
      description: form.description,
      date: form.date,
      scoreReceived: scoreNumber,
    })
    setForm({ ...SCORE_INITIAL, studentEmail: form.studentEmail })
    push('success', 'Mark saved.')
  }

  return (
    <Card title="Update Mark Report" description={`Subject: ${subject}`}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField
          as="select"
          label="Student"
          name="scoreStudent"
          value={form.studentEmail}
          onChange={(e) => setForm((p) => ({ ...p, studentEmail: e.target.value }))}
          error={errors.studentEmail}
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.email} value={student.email}>
              {student.fullName} · {student.classId}
            </option>
          ))}
        </FormField>
        <FormField
          label="Test ID"
          name="scoreTestId"
          value={form.testId}
          onChange={(e) => setForm((p) => ({ ...p, testId: e.target.value }))}
          error={errors.testId}
        />
        <FormField
          label="Description"
          name="scoreDescription"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          error={errors.description}
        />
        <FormField
          label="Date"
          name="scoreDate"
          type="date"
          value={form.date}
          onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
          error={errors.date}
        />
        <FormField
          label="Score"
          name="scoreValue"
          type="number"
          min={0}
          max={100}
          value={form.scoreReceived}
          onChange={(e) => setForm((p) => ({ ...p, scoreReceived: e.target.value }))}
          error={errors.scoreReceived}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
        >
          Save Mark
        </button>
      </form>
    </Card>
  )
}

interface EvaluationFormState {
  studentEmail: string
  testId: string
  strengths: string
  weaknesses: string
}

const EVALUATION_INITIAL: EvaluationFormState = {
  studentEmail: '',
  testId: '',
  strengths: '',
  weaknesses: '',
}

function EvaluationForm({ subject, students }: { subject: string; students: User[] }) {
  const { addEvaluation } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()
  const [form, setForm] = useState<EvaluationFormState>({
    ...EVALUATION_INITIAL,
    studentEmail: students[0]?.email ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof EvaluationFormState, string>>>({})

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof EvaluationFormState, string>> = {}
    if (!form.studentEmail) next.studentEmail = 'Select a student.'
    if (!form.testId.trim()) next.testId = 'Test ID is required.'
    if (!form.strengths.trim()) next.strengths = 'Describe the strengths.'
    if (!form.weaknesses.trim()) next.weaknesses = 'Describe the weaknesses.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    // Mock "AI" suggestion derived from the teacher's evaluation.
    const suggestedPath = `AI suggestion: Focus on "${form.weaknesses.trim()}". Practice 4-5 targeted exercises daily for 2 weeks, reinforce "${form.strengths.trim()}", then re-test.`

    addEvaluation({
      studentEmail: form.studentEmail,
      subject,
      testId: form.testId.trim(),
      strengths: form.strengths.trim(),
      weaknesses: form.weaknesses.trim(),
      suggestedPath,
      teacher: currentUser?.fullName ?? 'Teacher',
    })
    setForm({ ...EVALUATION_INITIAL, studentEmail: form.studentEmail })
    push('success', 'Evaluation saved. AI learning path generated for the student.')
  }

  return (
    <Card
      title="Detailed Test Evaluation"
      description="Your evaluation generates an AI-suggested learning path for the student."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField
          as="select"
          label="Student"
          name="evalStudent"
          value={form.studentEmail}
          onChange={(e) => setForm((p) => ({ ...p, studentEmail: e.target.value }))}
          error={errors.studentEmail}
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.email} value={student.email}>
              {student.fullName} · {student.classId}
            </option>
          ))}
        </FormField>
        <FormField
          label="Test ID"
          name="evalTestId"
          value={form.testId}
          onChange={(e) => setForm((p) => ({ ...p, testId: e.target.value }))}
          error={errors.testId}
        />
        <FormField
          as="textarea"
          label="Strengths"
          name="evalStrengths"
          rows={2}
          value={form.strengths}
          onChange={(e) => setForm((p) => ({ ...p, strengths: e.target.value }))}
          error={errors.strengths}
        />
        <FormField
          as="textarea"
          label="Weaknesses"
          name="evalWeaknesses"
          rows={2}
          value={form.weaknesses}
          onChange={(e) => setForm((p) => ({ ...p, weaknesses: e.target.value }))}
          error={errors.weaknesses}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
        >
          Save & Generate AI Path
        </button>
      </form>
    </Card>
  )
}

interface ResourceFormState {
  title: string
  type: Resource['type']
  url: string
  classId: string
  system: Resource['system']
}

function ResourceForm({ subject, classIds }: { subject: string; classIds: string[] }) {
  const { addResource } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()
  const [form, setForm] = useState<ResourceFormState>({
    title: '',
    type: 'external-link',
    url: '',
    classId: classIds[0] ?? '',
    system: 'regular',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ResourceFormState, string>>>({})

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof ResourceFormState, string>> = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.url.trim()) next.url = 'URL is required.'
    else {
      try {
        new URL(form.url)
      } catch {
        next.url = 'Enter a valid URL.'
      }
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    addResource({
      title: form.title.trim(),
      type: form.type,
      url: form.url.trim(),
      subject,
      classId: form.classId || undefined,
      system: form.system,
      addedBy: currentUser?.fullName ?? 'Teacher',
    })
    setForm((p) => ({ ...p, title: '', url: '' }))
    push('success', 'Resource added.')
  }

  return (
    <Card title="Upload Study Resource" description={`Subject: ${subject}`}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField
          label="Title"
          name="resTitle"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          error={errors.title}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            as="select"
            label="Type"
            name="resType"
            value={form.type}
            onChange={(e) =>
              setForm((p) => ({ ...p, type: e.target.value as Resource['type'] }))
            }
          >
            <option value="video">Video</option>
            <option value="document">Document / PDF</option>
            <option value="external-link">External Link</option>
          </FormField>
          <FormField
            as="select"
            label="Training System"
            name="resSystem"
            value={form.system}
            onChange={(e) =>
              setForm((p) => ({ ...p, system: e.target.value as Resource['system'] }))
            }
          >
            <option value="regular">Regular</option>
            <option value="revision">Revision</option>
          </FormField>
        </div>
        <FormField
          as="select"
          label="Class"
          name="resClass"
          value={form.classId}
          onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))}
        >
          {classIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </FormField>
        <FormField
          label="URL"
          name="resUrl"
          type="url"
          value={form.url}
          onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          error={errors.url}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
        >
          Add Resource
        </button>
      </form>
    </Card>
  )
}

interface RevisionFormState {
  topic: string
  dateTime: string
  classId: string
}

function RevisionForm({ subject, classIds }: { subject: string; classIds: string[] }) {
  const { addRevisionClass } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()
  const [form, setForm] = useState<RevisionFormState>({
    topic: '',
    dateTime: '',
    classId: classIds[0] ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RevisionFormState, string>>>({})

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof RevisionFormState, string>> = {}
    if (!form.topic.trim()) next.topic = 'Topic is required.'
    if (!form.dateTime) next.dateTime = 'Date and time are required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    addRevisionClass({
      topic: form.topic.trim(),
      subject,
      classId: form.classId || undefined,
      dateTime: form.dateTime,
      teacher: currentUser?.fullName ?? 'Teacher',
    })
    setForm((p) => ({ ...p, topic: '', dateTime: '' }))
    push('success', 'Revision class scheduled.')
  }

  return (
    <Card title="Schedule Revision Class" description={`Subject: ${subject}`}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField
          label="Topic"
          name="revTopic"
          value={form.topic}
          onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
          error={errors.topic}
        />
        <FormField
          as="select"
          label="Class"
          name="revClass"
          value={form.classId}
          onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))}
        >
          {classIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </FormField>
        <FormField
          label="Date & Time"
          name="revDateTime"
          type="datetime-local"
          value={form.dateTime}
          onChange={(e) => setForm((p) => ({ ...p, dateTime: e.target.value }))}
          error={errors.dateTime}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
        >
          Add Revision Slot
        </button>
      </form>
    </Card>
  )
}

function NotifyClassForm({ classIds }: { classIds: string[] }) {
  const { addNotification, notifications } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()
  const [classId, setClassId] = useState(classIds[0] ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const myNotifications = notifications.filter(
    (n) => n.audience === 'class' && classIds.includes(n.target ?? ''),
  )

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
      audience: 'class',
      target: classId,
      sender: currentUser?.fullName ?? 'Teacher',
      date: new Date().toISOString().slice(0, 10),
    })
    setTitle('')
    setBody('')
    push('success', `Notification sent to ${classId}.`)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Send Notification to Class">
        <form onSubmit={submit} noValidate className="space-y-3">
          <FormField
            as="select"
            label="Class"
            name="notifyClass"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </FormField>
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

      <Card title="Recent Class Notifications">
        {myNotifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {myNotifications.map((n) => (
              <li key={n.id} className="border border-slate-200 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">
                    {n.target}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {n.date} · {n.sender}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
