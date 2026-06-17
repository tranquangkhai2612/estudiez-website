import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AttendanceRecord,
  AttendanceStatus,
  ChatGroup,
  ChatMessage,
  Exam,
  Grade,
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
import {
  approveRegistrationApi,
  deleteApiClass,
  deleteApiUser,
  deleteApiNotification as deleteApiNotificationApi,
  getAssessments,
  getClasses,
  getClassEnrollments,
  getChatGroups,
  getChatMessages,
  getContacts,
  getMarksByAssessment,
  getAllLessons,
  getAllNews,
  getNotifications,
  getParentLinks,
  getParents,
  getRegistrations,
  getResources,
  getStudents,
  getTeachers,
  getTimetable,
  getUsers,
  GRADE_MAP,
  mapApiAssessmentToExam,
  mapApiChatGroup,
  mapApiChatMessage,
  mapApiClass,
  mapApiContact,
  mapApiMarkToScore,
  mapApiNewsPost,
  mapApiNotification,
  mapApiRegistration,
  mapApiStudyResource,
  mapApiTimetableSlot,
  mapApiUsersToFrontend,
  rejectRegistrationApi,
  SUBJECT_ID_MAP,
  submitRegistrationApi,
  type ApiAssessment,
  type ApiAttendanceRecord,
  type ApiChatGroup,
  type ApiChatMessage,
  type ApiLessonSession,
  type ApiMark,
} from '../services/api'
import { SEED_SEMESTERS, SEED_SUBJECTS } from '../services/seed'

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
  updateNews: (id: number, patch: Partial<Omit<NewsItem, 'id'>>) => void
  removeNews: (id: number) => void
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

  // Backend ID lookup maps — keyed by the frontend primary key so mutations can
  // call the correct REST endpoint without changing the frontend type shapes.
  const userIdByEmail           = useRef(new Map<string, string>())  // email → userId (UUID)
  const classBackendIdByFrontId = useRef(new Map<string, number>())  // classId string → classId int
  const emailByStudentId        = useRef(new Map<string, string>())  // studentId UUID → email

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      // Seed static reference data immediately (no network needed)
      setSubjects(SEED_SUBJECTS)
      setSemesters(SEED_SEMESTERS)

      try {
        const [apiUsers, apiStudents, apiTeachers, apiClasses, apiAssessments, apiRegs,
               apiTimetable, apiResources, apiNewsPosts, apiNotifs, apiChatGroups, apiContacts,
               apiParentLinks, apiParents, apiEnrollments, apiLessons] =
          await Promise.all([
            getUsers(),
            getStudents(),
            getTeachers(),
            getClasses(),
            getAssessments(),
            getRegistrations(),
            getTimetable().catch(() => []),
            getResources().catch(() => []),
            getAllNews().catch(() => []),
            getNotifications().catch(() => []),
            getChatGroups().catch(() => []),
            getContacts().catch(() => []),
            getParentLinks().catch(() => []),
            getParents().catch(() => []),
            getClassEnrollments().catch(() => []),
            getAllLessons().catch(() => []),
          ])

        if (cancelled) return

        // Build backend ID maps for use in mutations
        userIdByEmail.current.clear()
        apiUsers.forEach(u => {
          // Students may have email: null — use same formula as mapApiUsersToFrontend
          const email = u.email ?? `${u.username ?? u.userId}@estudiez.edu.vn`
          if (email && u.userId) userIdByEmail.current.set(email, u.userId)
        })

        classBackendIdByFrontId.current.clear()
        apiClasses.forEach(c => {
          if (c.classId != null) classBackendIdByFrontId.current.set(String(c.classId), c.classId)
        })

        // studentId UUID → frontend email (for mapping marks → ScoreDetail)
        const studentUserIdToEmail = new Map<string, string>()
        apiStudents.forEach(s => {
          const user = apiUsers.find(u => u.userId === s.userId)
          const email = user ? (user.email ?? `${user.username ?? user.userId}@estudiez.edu.vn`) : ''
          if (email && s.studentId) {
            studentUserIdToEmail.set(s.studentId, email)
            emailByStudentId.current.set(s.studentId, email)
          }
        })

        // Lookup maps for mappers that need user name / email by userId
        const nameByUserId = new Map<string, string>(
          apiUsers.map(u => [u.userId!, u.fullName ?? u.username ?? '']),
        )
        const emailByUserId = new Map<string, string>()
        apiUsers.forEach(u => {
          const email = u.email ?? `${u.username ?? u.userId}@estudiez.edu.vn`
          if (u.userId) emailByUserId.set(u.userId, email)
        })
        // teacherId (Teacher PK) → fullName, needed for homeroomTeacher on SchoolClass
        const nameByTeacherId = new Map<string, string>()
        apiTeachers.forEach(t => {
          if (t.teacherId && t.userId) {
            nameByTeacherId.set(t.teacherId, nameByUserId.get(t.userId) ?? '')
          }
        })

        // Build parent → child email mapping from parent-student links
        // parentId (Parent PK) → userId, then userId → email
        const userIdByParentId = new Map<string, string>()
        apiParents.forEach(p => {
          if (p.parentId && p.userId) userIdByParentId.set(p.parentId, p.userId)
        })
        // studentId (Student PK) → email (from earlier studentUserIdToEmail + apiStudents)
        const emailByStudentPk = new Map<string, string>()
        apiStudents.forEach(s => {
          if (s.studentId) {
            const email = studentUserIdToEmail.get(s.studentId)
            if (email) emailByStudentPk.set(s.studentId, email)
          }
        })
        // parentUserId → childEmail (first linked child)
        const childEmailByParentUserId = new Map<string, string>()
        apiParentLinks.forEach(link => {
          const parentUserId = userIdByParentId.get(link.id.parentId)
          const childEmail = emailByStudentPk.get(link.id.studentId)
          if (parentUserId && childEmail && !childEmailByParentUserId.has(parentUserId)) {
            childEmailByParentUserId.set(parentUserId, childEmail)
          }
        })

        // Build studentId → classId from active enrollments
        const classIdByStudentPk = new Map<string, number>()
        apiEnrollments.forEach(e => {
          if (e.studentId && e.classId && e.status === 'ACTIVE') {
            classIdByStudentPk.set(e.studentId, e.classId)
          }
        })

        // Build userId → studentId (Student PK) for mapping classId
        const studentPkByUserId = new Map<string, string>()
        apiStudents.forEach(s => {
          if (s.userId && s.studentId) studentPkByUserId.set(s.userId, s.studentId)
        })

        // Map users and enrich parent users with childEmail, students with classId
        const mappedUsers = mapApiUsersToFrontend(apiUsers, apiStudents, apiTeachers).map(u => {
          if (u.role === 'parent' && u.userId) {
            const childEmail = childEmailByParentUserId.get(u.userId)
            if (childEmail) return { ...u, childEmail }
          }
          if (u.role === 'student' && u.userId) {
            const studentPk = studentPkByUserId.get(u.userId)
            if (studentPk) {
              const classId = classIdByStudentPk.get(studentPk)
              if (classId != null) return { ...u, classId: String(classId) }
            }
          }
          return u
        })
        setUsers(mappedUsers)
        setClasses(apiClasses.map(c => mapApiClass(c, nameByTeacherId)))
        setExams(apiAssessments.map(mapApiAssessmentToExam))
        setRegistrations(apiRegs.map(mapApiRegistration))

        if (apiTimetable.length > 0)
          setTimetable(apiTimetable.map(s => mapApiTimetableSlot(s, nameByTeacherId)))

        if (apiResources.length > 0)
          setResources(apiResources.map(r => mapApiStudyResource(r, nameByUserId)))

        if (apiNewsPosts.length > 0)
          setNews(apiNewsPosts.map(n => mapApiNewsPost(n, nameByUserId)))

        if (apiNotifs.length > 0)
          setNotifications(apiNotifs.map(n => mapApiNotification(n, nameByUserId)))

        if (apiChatGroups.length > 0) {
          const groups = apiChatGroups.map(mapApiChatGroup)
          setChatGroups(groups)
          // Load messages for all groups in parallel
          const msgBatches = await Promise.all(
            (apiChatGroups as ApiChatGroup[]).map(g =>
              getChatMessages(g.chatGroupId!).catch(() => [] as ApiChatMessage[]),
            ),
          )
          const allMessages = (apiChatGroups as ApiChatGroup[]).flatMap((_g, i) =>
            msgBatches[i].map(m => mapApiChatMessage(m, nameByUserId, emailByUserId)),
          )
          if (!cancelled && allMessages.length > 0) setChatMessages(allMessages)
        }

        if (apiContacts.length > 0)
          setHelplines(apiContacts.map(mapApiContact))

        // Fetch marks for every assessment in parallel
        if (apiAssessments.length > 0 && studentUserIdToEmail.size > 0) {
          const markBatches = await Promise.all(
            apiAssessments.map(a =>
              getMarksByAssessment(a.assessmentId!).catch(() => [] as ApiMark[]),
            ),
          )
          const apiScores = (apiAssessments as ApiAssessment[]).flatMap((a, i) =>
            markBatches[i].map(m => mapApiMarkToScore(m, a, studentUserIdToEmail)),
          )
          if (!cancelled && apiScores.length > 0) setScores(apiScores)

          // Derive student classId + grade from which assessment they have marks in
          if (!cancelled) {
            const classByBackendId = new Map(
              apiClasses.map(c => [c.classId!, c]),
            )
            const emailToClassId = new Map<string, string>()
            const emailToGrade = new Map<string, Grade>()
            ;(apiAssessments as ApiAssessment[]).forEach((a, i) => {
              if (a.classId == null) return
              const cls = classByBackendId.get(a.classId)
              const grade = cls ? (GRADE_MAP[cls.gradeId ?? 1] ?? 10) : 10
              markBatches[i].forEach(m => {
                const email = m.studentId ? studentUserIdToEmail.get(m.studentId) : undefined
                if (email && !emailToClassId.has(email)) {
                  emailToClassId.set(email, String(a.classId))
                  emailToGrade.set(email, grade)
                }
              })
            })
            if (emailToClassId.size > 0) {
              setUsers(prev =>
                prev.map(u => {
                  if (u.role !== 'student') return u
                  const classId = emailToClassId.get(u.email)
                  const grade = emailToGrade.get(u.email)
                  if (!classId && grade == null) return u
                  return { ...u, classId: classId ?? u.classId, grade: grade ?? u.grade }
                }),
              )
            }
          }
        }

        // Fetch attendance records from lesson sessions
        if (apiLessons.length > 0 && emailByStudentId.current.size > 0) {
          // Build lesson session map for quick lookup
          const lessonById = new Map<number, ApiLessonSession>(
            (apiLessons as ApiLessonSession[]).map(l => [l.lessonSessionId!, l]),
          )

          // Fetch attendance for all lesson sessions in parallel
          const attendanceBatches = await Promise.all(
            (apiLessons as ApiLessonSession[]).map(l =>
              fetch(`/api/lessons/${l.lessonSessionId}/attendance`)
                .then(r => r.ok ? r.json() as Promise<ApiAttendanceRecord[]> : [])
                .catch(() => [] as ApiAttendanceRecord[]),
            ),
          )
          const allAttendance = attendanceBatches.flat()

          // Map to frontend AttendanceRecord
          const mappedAttendance = allAttendance
            .map(a => {
              const lesson = lessonById.get(a.lessonSessionId ?? 0)
              if (!lesson || !a.studentId) return null
              const studentEmail = emailByStudentId.current.get(a.studentId) ?? ''
              if (!studentEmail) return null
              // Normalize date to YYYY-MM-DD format (strip time portion if present)
              const rawDate = lesson.sessionDate ?? ''
              const normalizedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.slice(0, 10)
              return {
                id: a.attendanceRecordId ?? 0,
                studentEmail,
                classId: String(lesson.classId ?? ''),
                subject: SUBJECT_ID_MAP[lesson.subjectId ?? 0] ?? String(lesson.subjectId ?? ''),
                date: normalizedDate,
                period: lesson.periodNo ?? 0,
                status: (a.status ?? 'present').toLowerCase() as AttendanceStatus,
                teacher: nameByTeacherId.get(lesson.teacherId ?? '') ?? lesson.teacherId ?? '',
              }
            })
            .filter((a): a is AttendanceRecord => a !== null)

          if (!cancelled && mappedAttendance.length > 0) setAttendance(mappedAttendance)
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[DataContext] Backend unavailable:', err)
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
    const userId = userIdByEmail.current.get(normalized)
    if (userId) deleteApiUser(userId).catch(console.warn)
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
  const deleteClass = useCallback((id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id))
    const backendId = classBackendIdByFrontId.current.get(id)
    if (backendId !== undefined) deleteApiClass(backendId).catch(console.warn)
  }, [])
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
  const updateNews = useCallback(
    (id: number, patch: Partial<Omit<NewsItem, 'id'>>) =>
      setNews((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n))),
    [],
  )
  const removeNews = useCallback(
    (id: number) => setNews((prev) => prev.filter((n) => n.id !== id)),
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
    (id: number) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      deleteApiNotificationApi(id).catch(console.warn)
    },
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
    (request: Omit<RegistrationRequest, 'id' | 'status' | 'submittedAt'>) => {
      setRegistrations((prev) => [
        {
          ...request,
          id: nextId(prev),
          status: 'pending',
          submittedAt: new Date().toISOString().slice(0, 16),
        },
        ...prev,
      ])
      // Sync to backend (fire-and-forget)
      submitRegistrationApi({
        fullName: request.fullName,
        email: request.email,
        phone: request.phone ?? undefined,
        roleRequested: request.role,
        status: 'PENDING',
      }).catch(console.warn)
    },
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
    // Sync to backend (fire-and-forget; id equals requestId when data came from backend)
    approveRegistrationApi(id).catch(console.warn)
  }, [])
  const rejectRegistration = useCallback((id: number) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)),
    )
    rejectRegistrationApi(id).catch(console.warn)
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
      updateNews,
      removeNews,
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
      updateNews,
      removeNews,
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
