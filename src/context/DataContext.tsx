import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AttendanceRecord,
  ChatGroup,
  ChatMessage,
  Exam,
  Helpline,
  NewsItem,
  NotificationItem,
  ProgressDetail,
  RegistrationRequest,
  Resource,
  RevisionClass,
  SchoolClass,
  ScoreDetail,
  Semester,
  Subject,
  TestEvaluation,
  TimetableSlot,
  User,
} from '../types'

interface DataContextValue {
  loading: boolean
  error: string | null
  users: User[]
  classes: SchoolClass[]
  subjects: Subject[]
  semesters: Semester[]
  exams: Exam[]
  scores: ScoreDetail[]
  progress: ProgressDetail[]
  attendance: AttendanceRecord[]
  timetable: TimetableSlot[]
  resources: Resource[]
  revisionClasses: RevisionClass[]
  evaluations: TestEvaluation[]
  news: NewsItem[]
  notifications: NotificationItem[]
  chatGroups: ChatGroup[]
  chatMessages: ChatMessage[]
  helplines: Helpline[]
  registrations: RegistrationRequest[]
  addUser: (user: User) => void
  updateUser: (email: string, patch: Partial<Omit<User, 'email' | 'role'>>) => User | null
  deleteUser: (email: string) => void
  addClass: (schoolClass: SchoolClass) => void
  updateClass: (id: string, patch: Partial<Omit<SchoolClass, 'id'>>) => void
  deleteClass: (id: string) => void
  addSemester: (semester: Semester) => void
  updateSemester: (id: string, patch: Partial<Omit<Semester, 'id'>>) => void
  deleteSemester: (id: string) => void
  addExam: (exam: Omit<Exam, 'id'>) => void
  updateExam: (id: number, patch: Partial<Omit<Exam, 'id'>>) => void
  deleteExam: (id: number) => void
  addScore: (score: Omit<ScoreDetail, 'id'>) => void
  addProgress: (entry: Omit<ProgressDetail, 'id'>) => void
  addAttendance: (record: Omit<AttendanceRecord, 'id'>) => void
  addResource: (resource: Omit<Resource, 'id'>) => void
  addRevisionClass: (revision: Omit<RevisionClass, 'id'>) => void
  addEvaluation: (evaluation: Omit<TestEvaluation, 'id'>) => void
  addNews: (item: Omit<NewsItem, 'id'>) => void
  addNotification: (item: Omit<NotificationItem, 'id'>) => void
  updateNotification: (id: number, patch: Partial<Omit<NotificationItem, 'id'>>) => void
  deleteNotification: (id: number) => void
  addChatGroup: (group: ChatGroup) => void
  updateChatGroup: (id: string, patch: Partial<Omit<ChatGroup, 'id'>>) => void
  deleteChatGroup: (id: string) => void
  addChatMessage: (message: Omit<ChatMessage, 'id'>) => void
  addRegistrationRequest: (request: Omit<RegistrationRequest, 'id' | 'status' | 'submittedAt'>) => void
  approveRegistration: (id: number) => void
  rejectRegistration: (id: number) => void
}

export const DataContext = createContext<DataContextValue | undefined>(undefined)

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`)
  }
  return (await response.json()) as T
}

interface ChatFile {
  groups: ChatGroup[]
  messages: ChatMessage[]
}



export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [scores, setScores] = useState<ScoreDetail[]>([])
  const [progress, setProgress] = useState<ProgressDetail[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [timetable, setTimetable] = useState<TimetableSlot[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [revisionClasses, setRevisionClasses] = useState<RevisionClass[]>([])
  const [evaluations, setEvaluations] = useState<TestEvaluation[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [helplines, setHelplines] = useState<Helpline[]>([])
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const [
          baseUsers,
          baseClasses,
          baseSubjects,
          baseSemesters,
          baseExams,
          baseScores,
          baseProgress,
          baseAttendance,
          baseTimetable,
          baseResources,
          baseRevision,
          baseEvaluations,
          baseNews,
          baseNotifications,
          chatFile,
          baseHelplines,
          baseRegistrations,
        ] = await Promise.all([
          loadJson<User[]>('/data/users.json'),
          loadJson<SchoolClass[]>('/data/classes.json'),
          loadJson<Subject[]>('/data/subjects.json'),
          loadJson<Semester[]>('/data/semesters.json'),
          loadJson<Exam[]>('/data/exams.json'),
          loadJson<ScoreDetail[]>('/data/scores.json'),
          loadJson<ProgressDetail[]>('/data/progress.json'),
          loadJson<AttendanceRecord[]>('/data/attendance.json'),
          loadJson<TimetableSlot[]>('/data/timetable.json'),
          loadJson<Resource[]>('/data/resources.json'),
          loadJson<RevisionClass[]>('/data/revision.json'),
          loadJson<TestEvaluation[]>('/data/evaluations.json'),
          loadJson<NewsItem[]>('/data/news.json'),
          loadJson<NotificationItem[]>('/data/notifications.json'),
          loadJson<ChatFile>('/data/chat.json'),
          loadJson<Helpline[]>('/data/helplines.json'),
          loadJson<RegistrationRequest[]>('/data/registrations.json'),
        ])

        if (cancelled) return

        setUsers(baseUsers)
        setClasses(baseClasses)
        setSubjects(baseSubjects)
        setSemesters(baseSemesters)
        setExams(baseExams)
        setScores(baseScores)
        setProgress(baseProgress)
        setAttendance(baseAttendance)
        setTimetable(baseTimetable)
        setResources(baseResources)
        setRevisionClasses(baseRevision)
        setEvaluations(baseEvaluations)
        setNews(baseNews)
        setNotifications(baseNotifications)
        setChatGroups(chatFile.groups)
        setChatMessages(chatFile.messages)
        setHelplines(baseHelplines)
        setRegistrations(baseRegistrations)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const addUser = useCallback((user: User) => setUsers((prev) => [...prev, user]), [])
  const updateUser = useCallback(
    (email: string, patch: Partial<Omit<User, 'email' | 'role'>>) => {
      const normalized = email.trim().toLowerCase()
      let updated: User | null = null
      setUsers((prev) =>
        prev.map((user) => {
          if (user.email !== normalized) return user
          updated = { ...user, ...patch }
          return updated
        }),
      )
      return updated
    },
    [],
  )
  const deleteUser = useCallback((email: string) => {
    const normalized = email.trim().toLowerCase()
    setUsers((prev) => prev.filter((user) => user.email !== normalized))
  }, [])
  const addClass = useCallback(
    (schoolClass: SchoolClass) => setClasses((prev) => [...prev, schoolClass]),
    [],
  )
  const updateClass = useCallback(
    (id: string, patch: Partial<Omit<SchoolClass, 'id'>>) =>
      setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    [],
  )
  const deleteClass = useCallback(
    (id: string) => setClasses((prev) => prev.filter((c) => c.id !== id)),
    [],
  )
  const addSemester = useCallback(
    (semester: Semester) => setSemesters((prev) => [...prev, semester]),
    [],
  )
  const updateSemester = useCallback(
    (id: string, patch: Partial<Omit<Semester, 'id'>>) =>
      setSemesters((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    [],
  )
  const deleteSemester = useCallback((id: string) => {
    setSemesters((prev) => prev.filter((s) => s.id !== id))
    setExams((prev) => prev.filter((e) => e.semesterId !== id))
  }, [])
  const addExam = useCallback(
    (exam: Omit<Exam, 'id'>) => setExams((prev) => [...prev, { ...exam, id: nextId(prev) }]),
    [],
  )
  const updateExam = useCallback(
    (id: number, patch: Partial<Omit<Exam, 'id'>>) =>
      setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [],
  )
  const deleteExam = useCallback(
    (id: number) => setExams((prev) => prev.filter((e) => e.id !== id)),
    [],
  )
  const addScore = useCallback(
    (score: Omit<ScoreDetail, 'id'>) =>
      setScores((prev) => [...prev, { ...score, id: nextId(prev) }]),
    [],
  )
  const addProgress = useCallback(
    (entry: Omit<ProgressDetail, 'id'>) =>
      setProgress((prev) => [...prev, { ...entry, id: nextId(prev) }]),
    [],
  )
  const addAttendance = useCallback(
    (record: Omit<AttendanceRecord, 'id'>) =>
      setAttendance((prev) => [...prev, { ...record, id: nextId(prev) }]),
    [],
  )
  const addResource = useCallback(
    (resource: Omit<Resource, 'id'>) =>
      setResources((prev) => [...prev, { ...resource, id: nextId(prev) }]),
    [],
  )
  const addRevisionClass = useCallback(
    (revision: Omit<RevisionClass, 'id'>) =>
      setRevisionClasses((prev) => [...prev, { ...revision, id: nextId(prev) }]),
    [],
  )
  const addEvaluation = useCallback(
    (evaluation: Omit<TestEvaluation, 'id'>) =>
      setEvaluations((prev) => [...prev, { ...evaluation, id: nextId(prev) }]),
    [],
  )
  const addNews = useCallback(
    (item: Omit<NewsItem, 'id'>) => setNews((prev) => [{ ...item, id: nextId(prev) }, ...prev]),
    [],
  )
  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id'>) =>
      setNotifications((prev) => [{ ...item, id: nextId(prev) }, ...prev]),
    [],
  )
  const updateNotification = useCallback(
    (id: number, patch: Partial<Omit<NotificationItem, 'id'>>) =>
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n))),
    [],
  )
  const deleteNotification = useCallback(
    (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id)),
    [],
  )
  const addChatGroup = useCallback(
    (group: ChatGroup) => setChatGroups((prev) => [...prev, group]),
    [],
  )
  const updateChatGroup = useCallback(
    (id: string, patch: Partial<Omit<ChatGroup, 'id'>>) =>
      setChatGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g))),
    [],
  )
  const deleteChatGroup = useCallback((id: string) => {
    setChatGroups((prev) => prev.filter((g) => g.id !== id))
    setChatMessages((prev) => prev.filter((m) => m.groupId !== id))
  }, [])
  const addChatMessage = useCallback(
    (message: Omit<ChatMessage, 'id'>) =>
      setChatMessages((prev) => [...prev, { ...message, id: nextId(prev) }]),
    [],
  )
  const addRegistrationRequest = useCallback(
    (request: Omit<RegistrationRequest, 'id' | 'status' | 'submittedAt'>) =>
      setRegistrations((prev) => [
        {
          ...request,
          id: nextId(prev),
          status: 'pending',
          submittedAt: new Date().toISOString().slice(0, 16),
        },
        ...prev,
      ]),
    [],
  )
  const approveRegistration = useCallback((id: number) => {
    setRegistrations((prevRequests) => {
      const request = prevRequests.find((r) => r.id === id)
      if (request && request.status === 'pending') {
        const newUser: User = {
          email: request.email,
          fullName: request.fullName,
          address: request.address,
          phone: request.phone,
          password: request.password,
          role: request.role,
          age: request.age,
          childEmail: request.childEmail,
        }
        setUsers((prevUsers) =>
          prevUsers.some((u) => u.email === newUser.email)
            ? prevUsers
            : [...prevUsers, newUser],
        )
      }
      return prevRequests.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    })
  }, [])
  const rejectRegistration = useCallback((id: number) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)),
    )
  }, [])

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      error,
      users,
      classes,
      subjects,
      semesters,
      exams,
      scores,
      progress,
      attendance,
      timetable,
      resources,
      revisionClasses,
      evaluations,
      news,
      notifications,
      chatGroups,
      chatMessages,
      helplines,
      addUser,
      updateUser,
      deleteUser,
      addClass,
      updateClass,
      deleteClass,
      addSemester,
      updateSemester,
      deleteSemester,
      addExam,
      updateExam,
      deleteExam,
      addScore,
      addProgress,
      addAttendance,
      addResource,
      addRevisionClass,
      addEvaluation,
      addNews,
      addNotification,
      updateNotification,
      deleteNotification,
      addChatGroup,
      updateChatGroup,
      deleteChatGroup,
      addChatMessage,
      registrations,
      addRegistrationRequest,
      approveRegistration,
      rejectRegistration,
    }),
    [
      loading,
      error,
      users,
      classes,
      subjects,
      semesters,
      exams,
      scores,
      progress,
      attendance,
      timetable,
      resources,
      revisionClasses,
      evaluations,
      news,
      notifications,
      chatGroups,
      chatMessages,
      helplines,
      addUser,
      updateUser,
      deleteUser,
      addClass,
      updateClass,
      deleteClass,
      addSemester,
      updateSemester,
      deleteSemester,
      addExam,
      updateExam,
      deleteExam,
      addScore,
      addProgress,
      addAttendance,
      addResource,
      addRevisionClass,
      addEvaluation,
      addNews,
      addNotification,
      updateNotification,
      deleteNotification,
      addChatGroup,
      updateChatGroup,
      deleteChatGroup,
      addChatMessage,
      registrations,
      addRegistrationRequest,
      approveRegistration,
      rejectRegistration,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1
}
