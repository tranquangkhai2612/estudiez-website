import { useMemo, useRef, useState } from 'react'
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

interface SubjectMeta {
  icon: string
  emoji: string
  color: string
  bg: string
  border: string
  desc: string
}

const SUBJECT_META: Record<string, SubjectMeta> = {
  Mathematics: {
    icon: '📐',
    emoji: '📐',
    color: 'text-indigo-700',
    bg: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-200',
    desc: 'Algebra, Calculus & Geometry',
  },
  Physics: {
    icon: '⚛️',
    emoji: '⚛️',
    color: 'text-violet-700',
    bg: 'from-violet-50 to-purple-50',
    border: 'border-violet-200',
    desc: 'Mechanics, Waves & Thermodynamics',
  },
  Chemistry: {
    icon: '🧪',
    emoji: '🧪',
    color: 'text-emerald-700',
    bg: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    desc: 'Organic, Inorganic & Physical Chemistry',
  },
  Biology: {
    icon: '🌿',
    emoji: '🌿',
    color: 'text-green-700',
    bg: 'from-green-50 to-lime-50',
    border: 'border-green-200',
    desc: 'Cells, Genetics & Ecology',
  },
  English: {
    icon: '🌐',
    emoji: '🌐',
    color: 'text-sky-700',
    bg: 'from-sky-50 to-cyan-50',
    border: 'border-sky-200',
    desc: 'Grammar, Reading & Communication',
  },
  Literature: {
    icon: '📖',
    emoji: '📖',
    color: 'text-rose-700',
    bg: 'from-rose-50 to-pink-50',
    border: 'border-rose-200',
    desc: 'Poetry, Prose & Literary Analysis',
  },
  History: {
    icon: '🏛️',
    emoji: '🏛️',
    color: 'text-amber-700',
    bg: 'from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    desc: 'Ancient to Modern World History',
  },
}

const DEFAULT_META: SubjectMeta = {
  icon: '📚',
  emoji: '📚',
  color: 'text-slate-700',
  bg: 'from-slate-50 to-slate-100',
  border: 'border-slate-200',
  desc: 'Academic Subject',
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Format a Date as YYYY-MM-DD using LOCAL time (avoids UTC offset shifting the date). */
function localDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function TeacherDashboard() {
  const { currentUser } = useAuth()
  const { timetable, users } = useData()

  // Always resolve subject from the live users array so a stale currentUser
  // snapshot (missing the subject field) never silently breaks the dashboard.
  const subject = useMemo(
    () =>
      users.find((u) => u.email === currentUser?.email)?.subject ??
      currentUser?.subject ??
      '',
    [users, currentUser],
  )

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

  const meta = SUBJECT_META[subject] ?? DEFAULT_META
  const totalStudents = myStudents.length

  return (
    <div className="space-y-4">
      {/* Subject hero banner */}
      <div className={`rounded-xl border ${meta.border} bg-gradient-to-r ${meta.bg} px-5 py-4 flex items-center gap-4`}>
        <div className="text-5xl select-none">{meta.emoji}</div>
        <div className="flex-1 min-w-0">
          <h2 className={`text-xl font-bold ${meta.color}`}>{subject || '—'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{meta.desc}</p>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/70 border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-700">
              🏫 {teacherClassIds.length > 0 ? teacherClassIds.join(', ') : 'No classes'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/70 border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-700">
              👥 {totalStudents} student{totalStudents !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/70 border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-700">
              👤 {currentUser?.fullName ?? '—'}
            </span>
          </div>
        </div>
      </div>

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
            label: 'Marks & Evaluation',
            content: (
              <MarksEvalTab
                subject={subject}
                classIds={teacherClassIds}
                studentsByClass={studentsByClass}
              />
            ),
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
            content: <ChatTab classIds={teacherClassIds} />,
          },
        ]}
      />
    </div>
  )
}

function ChatTab({ classIds }: { classIds: string[] }) {
  const { chatGroups } = useData()

  const myGroups = useMemo(
    () => chatGroups.filter((g) => classIds.includes(g.classId)),
    [chatGroups, classIds],
  )

  const [selectedId, setSelectedId] = useState<string>(() => myGroups[0]?.id ?? '')

  const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
    'student-teacher': { label: 'Students', icon: '👨‍🎓', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    'parent-teacher':  { label: 'Parents',  icon: '👨‍👩‍👦', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }

  if (myGroups.length === 0) {
    return <p className="text-sm text-slate-500">No chat groups for your classes yet.</p>
  }

  return (
    <div className="flex border border-slate-200 rounded-xl overflow-hidden min-h-[480px]">
      {/* Group list */}
      <div className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">
          Groups
        </p>
        <ul className="flex-1 overflow-y-auto">
          {myGroups.map((g) => {
            const meta = TYPE_META[g.type] ?? { label: g.type, icon: '💬', color: 'bg-slate-50 text-slate-700 border-slate-200' }
            const active = g.id === selectedId
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  className={[
                    'w-full text-left px-3 py-3 border-b border-slate-100 transition-colors',
                    active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700',
                  ].join(' ')}
                >
                  <p className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-800'}`}>
                    {g.classId}
                  </p>
                  <span className={`mt-1 inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border ${
                    active ? 'bg-white/20 text-white border-white/30' : meta.color
                  }`}>
                    {meta.icon} {meta.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Chat panel */}
      <div className="flex-1 min-w-0">
        {selectedId
          ? <ChatPanel groupId={selectedId} />
          : <p className="text-sm text-slate-400 p-6">Select a group to start chatting.</p>
        }
      </div>
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
    return localDateStr(d)
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
      return { value: localDateStr(mon), label: `${fmtOpt(mon)} – ${fmtOpt(sat)}` }
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
          value={localDateStr(weekStart)}
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
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{(SUBJECT_META[slot.subject] ?? DEFAULT_META).emoji}</span>
                            <span className="font-semibold leading-tight text-xs">{slot.classId}</span>
                          </div>
                          <div className="text-slate-400 text-[10px]">{slot.room}</div>
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
              <div className="flex items-center gap-3">
                <div className="text-3xl select-none">{(SUBJECT_META[activeSlot.subject] ?? DEFAULT_META).emoji}</div>
                <div>
                  <h2 className="font-semibold text-slate-800">
                    Take Attendance — {activeSlot.classId}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeSlot.subject} · Period {activeSlot.period} ({PERIOD_TIME[activeSlot.period] ?? ''}) · {dateForDay(activeSlot.day)} · {activeSlot.room}
                  </p>
                </div>
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

interface StudentEntry {
  score: string
  performanceLevel: string
  topicsMastered: string
  topicsToImprove: string
  strengths: string
  weaknesses: string
  studyHabits: string
  teacherNotes: string
}

const ENTRY_INITIAL: StudentEntry = {
  score: '',
  performanceLevel: 'average',
  topicsMastered: '',
  topicsToImprove: '',
  strengths: '',
  weaknesses: '',
  studyHabits: 'consistent',
  teacherNotes: '',
}

const PERFORMANCE_LEVELS: { value: string; label: string }[] = [
  { value: 'excellent', label: 'Excellent (9–10)' },
  { value: 'good', label: 'Good (7–8.9)' },
  { value: 'average', label: 'Average (5–6.9)' },
  { value: 'below-average', label: 'Below Average (3.5–4.9)' },
  { value: 'poor', label: 'Poor (< 3.5)' },
]

const STUDY_HABITS_OPTIONS: { value: string; label: string }[] = [
  { value: 'consistent', label: 'Consistent — regular homework & attendance' },
  { value: 'irregular', label: 'Irregular — sometimes misses work or class' },
  { value: 'needs-work', label: 'Needs Work — rarely completes assignments' },
]


function buildAIPath(f: StudentEntry, examName: string): string {
  const perf = PERFORMANCE_LEVELS.find((p) => p.value === f.performanceLevel)?.label ?? f.performanceLevel
  const habits = STUDY_HABITS_OPTIONS.find((h) => h.value === f.studyHabits)?.label ?? f.studyHabits
  const scoreStr = f.score ? ` | Score: ${f.score}/10` : ''
  return [
    `📊 Performance: ${perf}${scoreStr} | Exam: ${examName}`,
    '',
    `✅ Strengths: ${f.strengths}`,
    f.topicsMastered ? `🎯 Topics mastered: ${f.topicsMastered}` : '',
    '',
    `⚠️ Areas to improve: ${f.weaknesses}`,
    f.topicsToImprove ? `📌 Priority topics: ${f.topicsToImprove}` : '',
    '',
    `📚 Recommended study plan:`,
    `  • Week 1–2: Focused daily practice on "${f.topicsToImprove || f.weaknesses}" (30 min/day)`,
    `  • Week 3–4: Mixed exercises reinforcing "${f.topicsMastered || f.strengths}"`,
    `  • End of month: Re-test on priority topics`,
    '',
    `🧑‍💼 Study habits: ${habits}`,
    f.studyHabits !== 'consistent'
      ? `  → Recommendation: Set a fixed daily study schedule and track completion.`
      : `  → Great consistency — keep it up!`,
    f.teacherNotes ? `\n📝 Teacher notes: ${f.teacherNotes}` : '',
  ].filter(Boolean).join('\n')
}

function MarksEvalTab({
  subject,
  classIds,
  studentsByClass,
}: {
  subject: string
  classIds: string[]
  studentsByClass: Map<string, User[]>
}) {
  const { semesters, exams, addScore, addEvaluation } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()

  const [semesterId, setSemesterId] = useState(semesters[0]?.id ?? '')
  const [classId, setClassId] = useState(classIds[0] ?? '')
  const [examId, setExamId] = useState<number | ''>('')
  const [entries, setEntries] = useState<Record<string, StudentEntry>>({})
  const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({})
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)

  const availableExams = useMemo(
    () => exams.filter((e) => e.semesterId === semesterId && e.subject === subject),
    [exams, semesterId, subject],
  )
  const selectedExam = availableExams.find((e) => e.id === examId)
  const students = studentsByClass.get(classId) ?? []

  const getEntry = (email: string): StudentEntry => entries[email] ?? ENTRY_INITIAL

  const updateEntry = (email: string, patch: Partial<StudentEntry>) => {
    setEntries((p) => ({ ...p, [email]: { ...(p[email] ?? ENTRY_INITIAL), ...patch } }))
    if ('score' in patch)
      setScoreErrors((p) => { const n = { ...p }; delete n[email]; return n })
  }

  const resetEntries = () => {
    setEntries({})
    setScoreErrors({})
    setExpandedEmail(null)
  }

  const saveAll = () => {
    if (!examId) { push('error', 'Select an exam first.'); return }
    const next: Record<string, string> = {}
    for (const s of students) {
      const raw = getEntry(s.email).score
      if (raw === '') { next[s.email] = 'Required'; continue }
      const n = Number(raw)
      if (Number.isNaN(n) || n < 0 || n > 10) next[s.email] = '0–10'
    }
    setScoreErrors(next)
    if (Object.keys(next).length > 0) return

    let evalCount = 0
    students.forEach((student) => {
      const entry = getEntry(student.email)
      addScore({
        studentEmail: student.email,
        classId,
        subject,
        testId: String(examId),
        description: selectedExam?.name ?? '',
        date: selectedExam?.date ?? localDateStr(new Date()),
        scoreReceived: Number(entry.score),
      })
      if (entry.strengths.trim() && entry.weaknesses.trim()) {
        evalCount++
        addEvaluation({
          studentEmail: student.email,
          subject,
          testId: String(examId),
          score: Number(entry.score),
          performanceLevel: entry.performanceLevel as 'excellent' | 'good' | 'average' | 'below-average' | 'poor',
          topicsMastered: entry.topicsMastered.trim() || undefined,
          topicsToImprove: entry.topicsToImprove.trim() || undefined,
          studyHabits: entry.studyHabits as 'consistent' | 'irregular' | 'needs-work',
          teacherNotes: entry.teacherNotes.trim() || undefined,
          strengths: entry.strengths.trim(),
          weaknesses: entry.weaknesses.trim(),
          suggestedPath: buildAIPath(entry, selectedExam?.name ?? ''),
          teacher: currentUser?.fullName ?? 'Teacher',
        })
      }
    })
    resetEntries()
    push(
      'success',
      evalCount > 0
        ? `Marks + ${evalCount} evaluation(s) saved for ${students.length} students.`
        : `Marks saved for ${students.length} students.`,
    )
  }

  return (
    <div className="space-y-4">
      <Card title="Marks & Evaluation" description={`Subject: ${subject}`}>
        <div className="grid sm:grid-cols-3 gap-3">
          <FormField
            as="select" label="Semester" name="mesSemester" value={semesterId}
            onChange={(e) => { setSemesterId(e.target.value); setExamId(''); resetEntries() }}
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
            ))}
          </FormField>
          <FormField
            as="select" label="Class" name="mesClass" value={classId}
            onChange={(e) => { setClassId(e.target.value); resetEntries() }}
          >
            {classIds.map((id) => <option key={id} value={id}>{id}</option>)}
          </FormField>
          <FormField
            as="select" label="Exam" name="mesExam" value={examId}
            onChange={(e) => { setExamId(e.target.value ? Number(e.target.value) : ''); resetEntries() }}
          >
            <option value="">Select exam…</option>
            {availableExams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name} · {ex.date}</option>
            ))}
          </FormField>
        </div>
      </Card>

      {!examId ? (
        <p className="text-sm text-slate-500">
          {availableExams.length === 0
            ? 'No exams found for this semester and subject.'
            : 'Select an exam to enter marks and evaluations.'}
        </p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-500">No students in this class.</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {selectedExam?.name} · {selectedExam?.date}
            </p>
            <span className="text-xs text-slate-400">
              {students.length} students · click Evaluate to add per-student evaluation
            </span>
          </div>
          <ul className="space-y-1">
            {students.map((student, idx) => {
              const entry = getEntry(student.email)
              const hasEval = !!(entry.strengths.trim() && entry.weaknesses.trim())
              return (
                <li
                  key={student.email}
                  className="flex items-center gap-3 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50"
                >
                  <span className="text-xs text-slate-400 w-5 text-right">{idx + 1}.</span>
                  <span className="font-medium text-slate-800 text-sm flex-1">{student.fullName}</span>
                  {hasEval && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      ✓ Evaluated
                    </span>
                  )}
                  {entry.score !== '' && (
                    <span className="text-xs font-mono text-slate-500 tabular-nums">{entry.score}/10</span>
                  )}
                  <button
                    onClick={() => setExpandedEmail(student.email)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-md px-2 py-1 bg-indigo-50 hover:bg-indigo-100 whitespace-nowrap"
                  >
                    {hasEval ? '✏️ Edit' : '+ Evaluate'}
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            onClick={saveAll}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2 text-sm"
          >
            Save All Marks &amp; Evaluations
          </button>
        </>
      )}

      {/* Evaluation modal */}
      {expandedEmail && (() => {
        const modalStudent = students.find((s) => s.email === expandedEmail)
        const entry = getEntry(expandedEmail)
        const aiPreview = entry.strengths.trim() && entry.weaknesses.trim() && selectedExam
          ? buildAIPath(entry, selectedExam.name)
          : ''
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setExpandedEmail(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
                <div>
                  <h2 className="font-semibold text-slate-800">
                    Evaluation — {modalStudent?.fullName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedExam?.name} · {selectedExam?.date} · {subject}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedEmail(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Score */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Score (0–10) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={entry.score}
                      onChange={(e) => updateEntry(expandedEmail, { score: e.target.value })}
                      placeholder="e.g. 8.5"
                      className={`w-32 rounded-md border px-3 py-1.5 text-sm ${
                        scoreErrors[expandedEmail] ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                      }`}
                    />
                    <span className="text-xs text-slate-400">out of 10</span>
                  </div>
                  {scoreErrors[expandedEmail] && (
                    <p className="text-xs text-rose-500 mt-1">{scoreErrors[expandedEmail]}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <FormField
                    as="select"
                    label="Performance Level"
                    name={`perf-${expandedEmail}`}
                    value={entry.performanceLevel}
                    onChange={(e) => updateEntry(expandedEmail, { performanceLevel: e.target.value })}
                  >
                    {PERFORMANCE_LEVELS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </FormField>
                  <FormField
                    as="select"
                    label="Study Habits"
                    name={`habits-${expandedEmail}`}
                    value={entry.studyHabits}
                    onChange={(e) => updateEntry(expandedEmail, { studyHabits: e.target.value })}
                  >
                    {STUDY_HABITS_OPTIONS.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </FormField>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <FormField
                    as="textarea"
                    label="Topics Mastered"
                    name={`mastered-${expandedEmail}`}
                    rows={2}
                    hint="Skills clearly grasped"
                    value={entry.topicsMastered}
                    onChange={(e) => updateEntry(expandedEmail, { topicsMastered: e.target.value })}
                  />
                  <FormField
                    as="textarea"
                    label="Topics to Improve"
                    name={`improve-${expandedEmail}`}
                    rows={2}
                    hint="Skills needing more practice"
                    value={entry.topicsToImprove}
                    onChange={(e) => updateEntry(expandedEmail, { topicsToImprove: e.target.value })}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <FormField
                    as="textarea"
                    label="Strengths *"
                    name={`str-${expandedEmail}`}
                    rows={3}
                    value={entry.strengths}
                    onChange={(e) => updateEntry(expandedEmail, { strengths: e.target.value })}
                  />
                  <FormField
                    as="textarea"
                    label="Weaknesses / Gaps *"
                    name={`weak-${expandedEmail}`}
                    rows={3}
                    value={entry.weaknesses}
                    onChange={(e) => updateEntry(expandedEmail, { weaknesses: e.target.value })}
                  />
                </div>
                <FormField
                  as="textarea"
                  label="Teacher Notes (private)"
                  name={`notes-${expandedEmail}`}
                  rows={2}
                  value={entry.teacherNotes}
                  onChange={(e) => updateEntry(expandedEmail, { teacherNotes: e.target.value })}
                />
                {aiPreview && (
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 mb-1">🤖 AI Path Preview</p>
                    <pre className="whitespace-pre-wrap text-[11px] text-slate-600 font-mono bg-slate-50 rounded-lg p-3 border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                      {aiPreview}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex gap-2 px-5 py-4 border-t border-slate-200">
                <button
                  onClick={() => setExpandedEmail(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2 text-sm"
                >
                  Done
                </button>
                <button
                  onClick={() => setExpandedEmail(null)}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

interface ResourceFormState {
  semesterId: string
  classId: string
  title: string
  url: string
  system: Resource['system']
}

function detectResourceType(url: string): Resource['type'] {
  const lower = url.toLowerCase()
  if (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    /\.(mp4|mov|avi|mkv|webm)$/.test(lower)
  )
    return 'video'
  if (/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)$/.test(lower)) return 'document'
  return 'external-link'
}

function ResourceForm({ subject: teacherSubject, classIds }: { subject: string; classIds: string[] }) {
  const { addResource, semesters } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ResourceFormState>({
    semesterId: '',
    classId: classIds[0] ?? '',
    title: '',
    url: '',
    system: 'regular',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ResourceFormState, string>>>({})

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
    setForm((p) => ({
      ...p,
      url: objectUrl,
      title: p.title.trim() === '' ? nameWithoutExt : p.title,
    }))
    setErrors((p) => ({ ...p, url: undefined }))
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof ResourceFormState, string>> = {}
    if (!form.semesterId) next.semesterId = 'Select a semester.'
    if (!form.classId) next.classId = 'Select a class.'
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
      semesterId: form.semesterId,
      title: form.title.trim(),
      type: detectResourceType(form.url.trim()),
      url: form.url.trim(),
      subject: teacherSubject,
      classId: form.classId || undefined,
      system: form.system,
      addedBy: currentUser?.fullName ?? 'Teacher',
    })
    setForm((p) => ({ ...p, title: '', url: '' }))
    push('success', 'Resource added.')
  }

  return (
    <Card title="Upload Study Material" description={`Subject: ${teacherSubject}`}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            as="select"
            label="Semester"
            name="resSemester"
            value={form.semesterId}
            onChange={(e) => setForm((p) => ({ ...p, semesterId: e.target.value }))}
            error={errors.semesterId}
          >
            <option value="">— Select semester —</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.year})
              </option>
            ))}
          </FormField>
          <FormField
            as="select"
            label="Class"
            name="resClass"
            value={form.classId}
            onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))}
            error={errors.classId}
          >
            <option value="">— Select class —</option>
            {classIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </FormField>
        </div>
        <FormField
          label="Title"
          name="resTitle"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          error={errors.title}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">URL or Local File</label>
          <div className="flex gap-2">
            <input
              id="resUrl"
              name="resUrl"
              type="url"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
            >
              📂 Browse
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {errors.url && <p className="text-xs text-rose-600">{errors.url}</p>}
          <p className="text-xs text-slate-400">Type is detected automatically from URL or file extension.</p>
        </div>
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

const DOW_MAP: Record<number, DayOfWeek | null> = {
  0: null, 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
}

function RevisionForm({ subject, classIds }: { subject: string; classIds: string[] }) {
  const { timetable, revisionClasses, addRevisionClass } = useData()
  const { currentUser } = useAuth()
  const { push } = useToast()

  const [selectedDate, setSelectedDate] = useState(localDateStr(new Date()))
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [topic, setTopic] = useState('')
  const [classId, setClassId] = useState(classIds[0] ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const dayOfWeek = useMemo(
    () => DOW_MAP[new Date(selectedDate + 'T00:00:00').getDay()],
    [selectedDate],
  )

  /** All distinct rooms known from the timetable */
  const allRooms = useMemo(
    () => Array.from(new Set(timetable.map((s) => s.room))).sort(),
    [timetable],
  )

  /** Rooms occupied by the regular timetable for the current day+period */
  const occupiedByTimetable = useMemo(() => {
    if (!dayOfWeek || selectedPeriod === null) return new Set<string>()
    return new Set(
      timetable
        .filter((s) => s.day === dayOfWeek && s.period === selectedPeriod)
        .map((s) => s.room),
    )
  }, [timetable, dayOfWeek, selectedPeriod])

  /** Rooms occupied by already-scheduled revision classes on the same date+period */
  const occupiedByRevision = useMemo(() => {
    if (selectedPeriod === null) return new Set<string>()
    const startTime = PERIOD_TIME[selectedPeriod]?.split('–')[0] ?? ''
    const prefix = `${selectedDate}T${startTime}`
    return new Set(
      revisionClasses
        .filter((r) => r.dateTime === prefix && r.room)
        .map((r) => r.room as string),
    )
  }, [revisionClasses, selectedDate, selectedPeriod])

  const availableRooms = useMemo(
    () => allRooms.filter((r) => !occupiedByTimetable.has(r) && !occupiedByRevision.has(r)),
    [allRooms, occupiedByTimetable, occupiedByRevision],
  )

  /** Periods that already have a revision class booked on this date */
  const bookedPeriods = useMemo(() => {
    return new Set(
      revisionClasses
        .filter((r) => r.dateTime.startsWith(selectedDate) && r.teacher === (currentUser?.fullName ?? ''))
        .map((r) => {
          const t = r.dateTime.slice(11, 16)
          return Number(
            Object.entries(PERIOD_TIME).find(([, v]) => v.startsWith(t))?.[0] ?? -1,
          )
        }),
    )
  }, [revisionClasses, selectedDate, currentUser])

  const handlePeriodClick = (period: number) => {
    setSelectedPeriod(period)
    setSelectedRoom('')
    setErrors({})
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (selectedPeriod === null) next.period = 'Select a time slot first.'
    if (!selectedRoom) next.room = 'Select an available room.'
    if (!topic.trim()) next.topic = 'Topic is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const startTime = PERIOD_TIME[selectedPeriod!].split('–')[0]
    addRevisionClass({
      topic: topic.trim(),
      subject,
      classId: classId || undefined,
      dateTime: `${selectedDate}T${startTime}`,
      teacher: currentUser?.fullName ?? 'Teacher',
      room: selectedRoom,
    })
    setTopic('')
    setSelectedRoom('')
    setSelectedPeriod(null)
    push('success', 'Revision class scheduled.')
  }

  return (
    <Card title="Schedule Revision Class" description={`Subject: ${subject}`}>
      {/* Date picker */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedPeriod(null); setSelectedRoom('') }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 bg-white"
        />
        {!dayOfWeek && (
          <p className="mt-1 text-xs text-amber-600">Sunday — no regular classes, all rooms available.</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Period grid */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Time slots{dayOfWeek ? ` — ${dayOfWeek}` : ''}
          </p>
          <div className="space-y-1">
            {Object.entries(PERIOD_TIME).map(([p, time]) => {
              const period = Number(p)
              const busy = dayOfWeek
                ? timetable.some((s) => s.day === dayOfWeek && s.period === period)
                : false
              const myBooked = bookedPeriods.has(period)
              const isSelected = selectedPeriod === period
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriodClick(period)}
                  className={[
                    'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm border transition-colors',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-semibold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
                  ].join(' ')}
                >
                  <span className="font-medium w-6">P{period}</span>
                  <span className="flex-1 text-left px-2 text-slate-500">{time}</span>
                  {myBooked ? (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">Booked</span>
                  ) : busy ? (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">Busy</span>
                  ) : (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 text-slate-500">Free</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Room picker + booking form */}
        <div>
          {selectedPeriod === null ? (
            <p className="text-sm text-slate-400 mt-8 text-center">← Select a time slot to see available rooms</p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Available rooms — P{selectedPeriod} ({PERIOD_TIME[selectedPeriod]})
              </p>
              {errors.period && <p className="text-xs text-rose-600">{errors.period}</p>}
              {availableRooms.length === 0 ? (
                <p className="text-sm text-slate-400">No rooms available for this slot.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableRooms.map((room) => (
                    <button
                      key={room}
                      type="button"
                      onClick={() => setSelectedRoom(room)}
                      className={[
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                        selectedRoom === room
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white hover:bg-indigo-50 text-slate-700',
                      ].join(' ')}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              )}
              {errors.room && <p className="text-xs text-rose-600">{errors.room}</p>}

              <form onSubmit={submit} noValidate className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
                    placeholder="e.g. Quadratic equations review"
                  />
                  {errors.topic && <p className="text-xs text-rose-600 mt-1">{errors.topic}</p>}
                </div>
                <FormField
                  as="select"
                  label="Class"
                  name="revClass"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </FormField>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2 text-sm"
                >
                  Schedule Revision
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
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
