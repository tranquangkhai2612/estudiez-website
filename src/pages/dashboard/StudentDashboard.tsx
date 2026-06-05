import { useMemo } from 'react'
import { Card } from '../../components/Card'
import { ChatPanel } from '../../components/ChatPanel'
import { Tabs } from '../../components/Tabs'
import { TimetableGrid } from '../../components/TimetableGrid'
import { useAuth } from '../../hooks/useAuth'
import { useData } from '../../hooks/useData'
import { useToast } from '../../hooks/useToast'
import type { AttendanceStatus } from '../../types'

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-rose-100 text-rose-700',
  late: 'bg-amber-100 text-amber-700',
  excused: 'bg-slate-100 text-slate-600',
}

export function StudentDashboard() {
  const { currentUser } = useAuth()
  const {
    scores,
    attendance,
    resources,
    revisionClasses,
    evaluations,
    notifications,
    chatGroups,
    helplines,
  } = useData()
  const { push } = useToast()

  const email = currentUser?.email ?? ''
  const classId = currentUser?.classId ?? ''

  const studentScores = useMemo(
    () => scores.filter((item) => item.studentEmail === email),
    [scores, email],
  )
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
          content: (
            <Card title="Mark Report" description="Subject scores from your teachers">
              {studentScores.length === 0 ? (
                <p className="text-sm text-slate-500">No scores recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-4">Subject</th>
                        <th className="py-2 pr-4">Test</th>
                        <th className="py-2 pr-4">Description</th>
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentScores.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-2 pr-4 font-semibold">{item.subject}</td>
                          <td className="py-2 pr-4">{item.testId}</td>
                          <td className="py-2 pr-4">{item.description}</td>
                          <td className="py-2 pr-4">{item.date}</td>
                          <td className="py-2 pr-4 font-semibold text-indigo-600">
                            {item.scoreReceived}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ),
        },
        {
          id: 'attendance',
          label: 'Attendance',
          content: (
            <Card title="Attendance Report">
              {studentAttendance.length === 0 ? (
                <p className="text-sm text-slate-500">No attendance recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Subject</th>
                        <th className="py-2 pr-4">Period</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentAttendance.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-2 pr-4">{item.date}</td>
                          <td className="py-2 pr-4">{item.subject}</td>
                          <td className="py-2 pr-4">P{item.period}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[item.status]}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ),
        },
        {
          id: 'resources',
          label: 'Resources',
          content: (
            <Card title="Study Resources">
              <ul className="space-y-2">
                {resources.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        {resource.title}
                      </a>
                      <p className="text-xs text-slate-500">
                        {resource.subject} · Added by {resource.addedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {resource.system === 'revision' ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                          revision
                        </span>
                      ) : null}
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-semibold capitalize">
                        {resource.type.replace('-', ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ),
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
                      <p className="font-semibold text-slate-900">{n.title}</p>
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
