import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { ChatPanel } from '../../components/ChatPanel'
import { FormField } from '../../components/FormField'
import { Tabs } from '../../components/Tabs'
import { useData } from '../../hooks/useData'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { notificationDetailPath } from '../notificationDetailPath'
import type { AttendanceStatus, DayOfWeek, Resource, TimetableSlot, User } from '../../types'

const ATTENDANCE_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_OFFSET: Record<DayOfWeek, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 }

/** Period number → start–end time label */
const PERIOD_TIME: Record<number, string> = {
  1: '07:00–07:45',
  2: '07:50–08:35',
  3: '08:40–09:25',
  4: '09:35–10:20',
  5: '10:25–11:10',
  6: '13:00–13:45',
  7: '13:50–14:35',
  8: '14:40–15:25',
  9: '15:30–16:15',
  10: '16:20–17:05',
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

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
              <AttendanceTab
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

interface AttendanceTabProps {
  subject: string
  classIds: string[]
  studentsByClass: Map<string, User[]>
}

function AttendanceTab({ subject, classIds, studentsByClass }: AttendanceTabProps) {
  const { timetable, attendance, addAttendance } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [activeSlot, setActiveSlot] = useState<TimetableSlot | null>(null)
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})

  const mySlots = useMemo(
    () => timetable.filter((s) => s.subject === subject && classIds.includes(s.classId)),
    [timetable, subject, classIds],
  )

  /** All distinct periods that appear in the teacher's timetable, sorted */
  const periods = useMemo(
    () => Array.from(new Set(mySlots.map((s) => s.period))).sort((a, b) => a - b),
    [mySlots],
  )

  /** Quick lookup: `${day}-${period}` → slot */
  const slotIndex = useMemo(() => {
    const map = new Map<string, TimetableSlot>()
    for (const s of mySlots) map.set(`${s.day}-${s.period}`, s)
    return map
  }, [mySlots])

  const dateForDay = (day: DayOfWeek): string => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + DAY_OFFSET[day])
    return d.toISOString().slice(0, 10)
  }

  const isAlreadyTaken = (slot: TimetableSlot): boolean => {
    const date = dateForDay(slot.day)
    return attendance.some(
      (r) =>
        r.classId === slot.classId &&
        r.subject === subject &&
        r.date === date &&
        r.period === slot.period,
    )
  }

  const openSlot = (slot: TimetableSlot) => {
    setActiveSlot(slot)
    setStatuses({})
  }

  const saveAttendance = () => {
    if (!activeSlot) return
    const date = dateForDay(activeSlot.day)
    const students = studentsByClass.get(activeSlot.classId) ?? []
    if (students.length === 0) {
      push('error', 'No students found in this class.')
      return
    }
    students.forEach((student) => {
      addAttendance({
        studentEmail: student.email,
        classId: activeSlot.classId,
        subject,
        date,
        period: activeSlot.period,
        status: statuses[student.email] ?? 'present',
        teacher: currentUser?.fullName ?? 'Teacher',
      })
    })
    setStatuses({})
    setActiveSlot(null)
    push('success', `Attendance saved for ${students.length} student(s).`)
  }

  // Generate dropdown options: 4 weeks back → 4 weeks forward (9 total)
  const weekOptions = useMemo(() => {
    const today = getMonday(new Date())
    const fmtOpt = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    return Array.from({ length: 9 }, (_, i) => {
      const mon = new Date(today)
      mon.setDate(mon.getDate() + (i - 4) * 7)
      const sat = new Date(mon)
      sat.setDate(sat.getDate() + 5)
      return { value: mon.toISOString().slice(0, 10), label: `${fmtOpt(mon)} – ${fmtOpt(sat)}` }
    })
  }, [])

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setActiveSlot(null)
            setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
          }}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1.5 rounded hover:bg-indigo-50 border border-slate-200"
        >
          ←
        </button>
        <select
          value={weekStart.toISOString().slice(0, 10)}
          onChange={(e) => {
            setActiveSlot(null)
            setWeekStart(new Date(e.target.value + 'T00:00:00'))
          }}
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 bg-white"
        >
          {weekOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setActiveSlot(null)
            setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
          }}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1.5 rounded hover:bg-indigo-50 border border-slate-200"
        >
          →
        </button>
      </div>

      {/* Weekly timetable grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-20 text-left px-2 py-1.5 text-slate-500 font-medium border-b border-slate-200">
                Period
              </th>
              {DAYS.map((day) => {
                const dateStr = dateForDay(day)
                const [, mm, dd] = dateStr.split('-')
                return (
                  <th
                    key={day}
                    className="text-center px-2 py-1.5 font-bold text-slate-600 uppercase border-b border-slate-200"
                  >
                    <div>{day}</div>
                    <div className="font-normal text-slate-400">{dd}/{mm}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {periods.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-400 py-6">
                  No timetable slots found for your subject.
                </td>
              </tr>
            ) : (
              periods.map((period) => (
                <tr key={period} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-2 text-slate-500 whitespace-nowrap align-middle">
                    <div className="font-semibold text-slate-700">P{period}</div>
                    <div className="text-slate-400">{PERIOD_TIME[period] ?? ''}</div>
                  </td>
                  {DAYS.map((day) => {
                    const slot = slotIndex.get(`${day}-${period}`)
                    if (!slot) {
                      return <td key={day} className="px-1 py-2" />
                    }
                    const taken = isAlreadyTaken(slot)
                    const active = activeSlot?.id === slot.id
                    return (
                      <td key={day} className="px-1 py-2 align-top">
                        <button
                          onClick={() => openSlot(slot)}
                          className={`w-full text-left rounded-lg px-2 py-1.5 border transition-colors ${
                            active
                              ? 'border-indigo-500 bg-indigo-100 ring-1 ring-indigo-400'
                              : taken
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          <div className="font-semibold leading-tight">{slot.classId}</div>
                          <div className="text-slate-400">{slot.room}</div>
                          {taken && (
                            <div className="text-emerald-600 font-medium text-[10px] mt-0.5">✓ Done</div>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance modal */}
      {activeSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setActiveSlot(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Take Attendance — {activeSlot.classId}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeSlot.subject} · Period {activeSlot.period} ({PERIOD_TIME[activeSlot.period] ?? ''}) · {dateForDay(activeSlot.day)} · {activeSlot.room}
                </p>
              </div>
              <button
                onClick={() => setActiveSlot(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none mt-0.5"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {(studentsByClass.get(activeSlot.classId) ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No students in this class.</p>
              ) : (
                <ul className="space-y-2">
                  {(studentsByClass.get(activeSlot.classId) ?? []).map((student) => (
                    <li
                      key={student.email}
                      className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <span className="font-medium text-slate-800 text-sm">{student.fullName}</span>
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
                        {ATTENDANCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-2 px-5 py-4 border-t border-slate-200">
              <button
                onClick={saveAttendance}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2 text-sm"
              >
                Save Attendance
              </button>
              <button
                onClick={() => setActiveSlot(null)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
                  <Link
                    to={notificationDetailPath(n.id)}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {n.title}
                  </Link>
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
