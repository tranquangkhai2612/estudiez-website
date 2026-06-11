import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { ChatPanel } from '../../components/ChatPanel'
import { Tabs } from '../../components/Tabs'
import { TimetableGrid } from '../../components/TimetableGrid'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useToast } from '../../hooks/useToast'
import { notificationDetailPath } from '../notificationDetailPath'
import type { AttendanceRecord, AttendanceStatus, Resource } from '../../types'

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-rose-100 text-rose-700',
  late: 'bg-amber-100 text-amber-700',
  excused: 'bg-slate-100 text-slate-600',
}

export function StudentDashboard() {
  const { currentUser } = useAuth()
  const {
    attendance,
    revisionClasses,
    evaluations,
    notifications,
    chatGroups,
    helplines,
  } = useData()
  const { push } = useToast()

  const email = currentUser?.email ?? ''
  const classId = currentUser?.classId ?? ''

  const studentAttendance = useMemo(
    () => attendance.filter((item) => item.studentEmail === email),
    [attendance, email],
  )
  const studentEvaluations = useMemo(
    () => evaluations.filter((item) => item.studentEmail === email),
    [evaluations, email],
  )
  const myNotifications = useMemo(
    () =>
      notifications.filter(
        (n) =>
          (n.audience === 'student' && n.target === email) ||
          (n.audience === 'class' && n.target === classId),
      ),
    [notifications, email, classId],
  )
  const studentChatGroup = useMemo(
    () => chatGroups.find((g) => g.classId === classId && g.type === 'student-teacher'),
    [chatGroups, classId],
  )

  return (
    <Tabs
      tabs={[
        {
          id: 'timetable',
          label: 'Timetable',
          content: (
            <Card title="Weekly Timetable" description={`Class ${classId}`}>
              <TimetableGrid classId={classId} />
            </Card>
          ),
        },
        {
          id: 'marks',
          label: 'Marks',
          content: <MarksTab email={email} />,
        },
        {
          id: 'attendance',
          label: 'Attendance',
          content: <AttendanceTab studentAttendance={studentAttendance} />,
        },
        {
          id: 'resources',
          label: 'Resources',
          content: <ResourcesTab classId={classId} />,
        },
        {
          id: 'revision',
          label: 'Revision',
          content: (
            <Card title="Revision Classes" description="Optional out-of-hours classes you can join">
              <ul className="space-y-2">
                {revisionClasses.map((revision) => (
                  <li
                    key={revision.id}
                    className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{revision.topic}</span>
                      <span className="text-xs text-slate-500">
                        {revision.subject} · {revision.dateTime.replace('T', ' ')} ·{' '}
                        {revision.teacher}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => push('success', `Enrolled in "${revision.topic}".`)}
                      className="text-sm font-semibold text-indigo-600 hover:underline"
                    >
                      Enroll
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ),
        },
        {
          id: 'ai',
          label: 'AI Path',
          content: (
            <Card
              title="AI-Suggested Learning Path"
              description="Generated from your teachers' detailed test evaluations"
            >
              {studentEvaluations.length === 0 ? (
                <p className="text-sm text-slate-500">No evaluations yet.</p>
              ) : (
                <ul className="space-y-3">
                  {studentEvaluations.map((evaluation) => (
                    <li
                      key={evaluation.id}
                      className="border border-slate-200 rounded-lg px-3 py-3"
                    >
                      <p className="font-semibold text-slate-900">
                        {evaluation.subject} · {evaluation.testId}
                      </p>
                      <p className="text-sm text-emerald-700 mt-1">
                        <span className="font-semibold">Strengths:</span> {evaluation.strengths}
                      </p>
                      <p className="text-sm text-rose-700">
                        <span className="font-semibold">To improve:</span> {evaluation.weaknesses}
                      </p>
                      <p className="text-sm text-indigo-700 mt-1 bg-indigo-50 rounded-md px-2 py-1">
                        {evaluation.suggestedPath}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ),
        },
        {
          id: 'notifications',
          label: 'Notifications',
          content: (
            <Card title="Notifications">
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
          label: 'Class Chat',
          content: (
            <Card title="Class Chat Group" description="Students & teachers of your class">
              {studentChatGroup ? (
                <ChatPanel groupId={studentChatGroup.id} />
              ) : (
                <p className="text-sm text-slate-500">No chat group for your class yet.</p>
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

// ── Marks Tab ────────────────────────────────────────────────────────────────

function scoreStyle(s: number) {
  if (s >= 90) return 'bg-emerald-100 text-emerald-700'
  if (s >= 70) return 'bg-indigo-100 text-indigo-700'
  if (s >= 50) return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

export function MarksTab({ email }: { email: string }) {
  const { scores, evaluations, semesters } = useData()

  const [selectedSemesterId, setSelectedSemesterId] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    return semesters.find((s) => today >= s.startDate && today <= s.endDate)?.id ?? ''
  })
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const studentScores = useMemo(
    () => scores.filter((s) => s.studentEmail === email),
    [scores, email],
  )

  const filteredScores = useMemo(() => {
    if (!selectedSemesterId) return studentScores
    const sem = semesters.find((s) => s.id === selectedSemesterId)
    if (!sem) return studentScores
    return studentScores.filter((s) => s.date >= sem.startDate && s.date <= sem.endDate)
  }, [studentScores, semesters, selectedSemesterId])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredScores>()
    for (const s of filteredScores) {
      if (!map.has(s.subject)) map.set(s.subject, [])
      map.get(s.subject)!.push(s)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredScores])

  const selectedEval = useMemo(() => {
    if (!selectedKey) return null
    const [subject, testId] = selectedKey.split(':')
    return (
      evaluations.find(
        (e) => e.studentEmail === email && e.subject === subject && e.testId === testId,
      ) ?? null
    )
  }, [evaluations, email, selectedKey])

  return (
    <div className="space-y-4">
      {/* Semester selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 shrink-0">Semester</label>
        <select
          value={selectedSemesterId}
          onChange={(e) => { setSelectedSemesterId(e.target.value); setSelectedKey(null) }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 bg-white"
        >
          <option value="">All semesters</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
          ))}
        </select>
      </div>

      {filteredScores.length === 0 ? (
        <p className="text-sm text-slate-500">No scores recorded for this period.</p>
      ) : (
        grouped.map(([subject, subjectScores]) => {
          const avg = Math.round(
            subjectScores.reduce((sum, s) => sum + s.scoreReceived, 0) / subjectScores.length,
          )
          return (
            <Card
              key={subject}
              title={subject}
              description={`${subjectScores.length} test${subjectScores.length > 1 ? 's' : ''} · Average: ${avg}`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200 text-xs">
                      <th className="py-2 pr-3">Test ID</th>
                      <th className="py-2 pr-3">Description</th>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3 text-center">Score</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {subjectScores.map((item) => {
                      const key = `${subject}:${item.testId}`
                      const isSelected = selectedKey === key
                      const hasEval = evaluations.some(
                        (e) => e.studentEmail === email && e.subject === subject && e.testId === item.testId,
                      )
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-slate-100 ${isSelected ? 'bg-indigo-50' : ''}`}
                        >
                          <td className="py-2 pr-3 font-mono text-xs text-slate-600">{item.testId}</td>
                          <td className="py-2 pr-3">{item.description}</td>
                          <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{item.date}</td>
                          <td className="py-2 pr-3 text-center">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${scoreStyle(item.scoreReceived)}`}>
                              {item.scoreReceived}
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            {hasEval && (
                              <button
                                type="button"
                                onClick={() => setSelectedKey(isSelected ? null : key)}
                                className={`text-xs font-medium px-2 py-1 rounded border transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                                }`}
                              >
                                {isSelected ? 'Hide' : '📋 Evaluation'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Inline evaluation detail */}
              {selectedKey?.startsWith(subject + ':') && selectedEval && (
                <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-indigo-800">Teacher Evaluation — {selectedEval.testId}</p>
                    <p className="text-xs text-slate-500">by {selectedEval.teacher}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">✅ Strengths</p>
                      <p className="text-slate-700">{selectedEval.strengths}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-rose-700 uppercase mb-1">⚠️ Weaknesses</p>
                      <p className="text-slate-700">{selectedEval.weaknesses}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-indigo-700 uppercase mb-1">🤖 Suggested Learning Path</p>
                    <p className="text-slate-700">{selectedEval.suggestedPath}</p>
                  </div>
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

// ── Attendance Tab ────────────────────────────────────────────────────────────

const DAYS_ATT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const ALL_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function attGetMonday(d: Date): Date {
  const day = d.getDay()
  const m = new Date(d)
  m.setDate(m.getDate() + (day === 0 ? -6 : 1 - day))
  m.setHours(0, 0, 0, 0)
  return m
}

function attDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function AttendanceTab({ studentAttendance }: { studentAttendance: AttendanceRecord[] }) {
  const [weekStart, setWeekStart] = useState(() => attGetMonday(new Date()))

  const shiftWeek = (n: number) =>
    setWeekStart((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + n * 7); return nd })

  // Columns: Mon–Sat of current week
  const weekDays = DAYS_ATT.map((day, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return {
      day,
      dateStr: attDateStr(d),
      label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    }
  })

  const todayStr = attDateStr(new Date())

  // date → period → record
  const lookup = useMemo(() => {
    const map = new Map<string, Map<number, AttendanceRecord>>()
    for (const rec of studentAttendance) {
      if (!map.has(rec.date)) map.set(rec.date, new Map())
      map.get(rec.date)!.set(rec.period, rec)
    }
    return map
  }, [studentAttendance])

  // Only show periods that have any record in the student's entire history
  const activePeriods = useMemo(() => {
    const pSet = new Set(studentAttendance.map((a) => a.period))
    return ALL_PERIODS.filter((p) => pSet.has(p))
  }, [studentAttendance])

  // All-time summary counts
  const totals = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 }
    for (const rec of studentAttendance) counts[rec.status]++
    return counts
  }, [studentAttendance])

  const weekHasRecords = weekDays.some(({ dateStr }) => lookup.has(dateStr))

  const weekLabel =
    weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
    ' – ' +
    weekDays[5].label

  return (
    <div className="space-y-4">
      {/* All-time summary */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(totals) as [AttendanceStatus, number][]).map(([status, count]) => (
          <div key={status} className={`rounded-lg p-3 text-center ${STATUS_STYLES[status]}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs capitalize mt-0.5">{status}</p>
          </div>
        ))}
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-50"
        >
          ←
        </button>
        <span className="text-sm font-medium text-slate-700 min-w-[160px] text-center">
          {weekLabel}
        </span>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-50"
        >
          →
        </button>
        <button
          type="button"
          onClick={() => setWeekStart(attGetMonday(new Date()))}
          className="ml-1 px-3 py-1.5 rounded border border-slate-300 text-sm text-indigo-600 hover:bg-indigo-50"
        >
          Today
        </button>
      </div>

      {/* Grid */}
      {studentAttendance.length === 0 ? (
        <p className="text-sm text-slate-500">No attendance recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500 w-16">
                  Period
                </th>
                {weekDays.map(({ day, dateStr, label }) => (
                  <th
                    key={day}
                    className={`py-2 px-3 text-center text-xs font-semibold min-w-[100px] ${
                      dateStr === todayStr
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="block">{day}</span>
                    <span className="block font-normal">{label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePeriods.map((period) => (
                <tr key={period} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 px-3 text-xs font-semibold text-slate-500">
                    P{period}
                  </td>
                  {weekDays.map(({ day, dateStr }) => {
                    const rec = lookup.get(dateStr)?.get(period)
                    return (
                      <td
                        key={day}
                        className={`py-2 px-3 text-center ${
                          dateStr === todayStr ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        {rec ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-slate-600 font-medium leading-tight">
                              {rec.subject}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[rec.status]}`}
                            >
                              {rec.status}
                            </span>
                          </div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {!weekHasRecords && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-sm text-slate-400"
                  >
                    No attendance records for this week.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Resources Tab ─────────────────────────────────────────────────────────────

const TYPE_ICON: Record<Resource['type'], string> = {
  video: '🎬',
  document: '📄',
  'external-link': '🔗',
}

function ResourcesTab({ classId }: { classId: string }) {
  const { resources, timetable } = useData()
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  const subjects = useMemo(() => {
    const seen = new Set(timetable.filter((s) => s.classId === classId).map((s) => s.subject))
    return Array.from(seen).sort()
  }, [timetable, classId])

  const classResources = useMemo(
    () => resources.filter((r) => r.classId === classId),
    [resources, classId],
  )

  const countBySubject = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of classResources) map.set(r.subject, (map.get(r.subject) ?? 0) + 1)
    return map
  }, [classResources])

  const active = selectedSubject ?? subjects[0] ?? null

  const subjectResources = useMemo(
    () => classResources.filter((r) => r.subject === active),
    [classResources, active],
  )

  if (subjects.length === 0) {
    return <p className="text-sm text-slate-500">No subjects found for your class.</p>
  }

  return (
    <div className="flex gap-4 min-h-[260px]">
      {/* Subject sidebar */}
      <nav className="w-44 shrink-0 space-y-1">
        {subjects.map((subject) => {
          const count = countBySubject.get(subject) ?? 0
          const isActive = active === subject
          return (
            <button
              key={subject}
              type="button"
              onClick={() => setSelectedSubject(subject)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{subject}</span>
              {count > 0 && (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="w-px bg-slate-200 shrink-0" />

      {/* Resource list */}
      <div className="flex-1 min-w-0">
        {subjectResources.length === 0 ? (
          <p className="text-sm text-slate-400 mt-2">No resources for {active} yet.</p>
        ) : (
          <ul className="space-y-2">
            {subjectResources.map((resource) => (
              <li
                key={resource.id}
                className="flex items-start justify-between gap-3 border border-slate-200 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-base mt-0.5 shrink-0">{TYPE_ICON[resource.type]}</span>
                  <div className="min-w-0">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold hover:underline break-words"
                    >
                      {resource.title}
                    </a>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Added by {resource.addedBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {resource.system === 'revision' && (
                    <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                      revision
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-semibold capitalize">
                    {resource.type.replace('-', ' ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
