/**
 * HTTP client for the eStudiez backend at http://localhost:8081.
 *
 * Exports:
 *  - Typed wrappers for every available REST endpoint
 *  - Mapper functions that convert backend DTOs → frontend canonical types
 *  - Lookup tables for roleId / gradeId / semesterId / subjectId
 */
import type { components } from '../../api-types'
import type {
  ChatGroup,
  ChatMessage,
  DayOfWeek,
  Exam,
  Grade,
  Helpline,
  NewsItem,
  NotificationAudience,
  NotificationItem,
  RegistrationRequest,
  Resource,
  Role,
  ScoreDetail,
  SchoolClass,
  TimetableSlot,
  TrainingSystem,
  User,
} from '../types'
import { SEED_SUBJECTS } from './seed'

// ─── Backend DTO aliases ────────────────────────────────────────────────────
export type ApiUser        = components['schemas']['User']
export type ApiStudent     = components['schemas']['Student']
export type ApiTeacher     = components['schemas']['Teacher']
export type ApiClass       = components['schemas']['SchoolClass']
export type ApiAssessment  = components['schemas']['Assessment']
export type ApiMark        = components['schemas']['StudentMark']
export type ApiRegistration = components['schemas']['RegistrationRequest']

// ─── Base URL ────────────────────────────────────────────────────────────────
// Empty string = same origin, so /api/* requests are proxied by Vite in dev
// and served by the backend in production (no CORS issues either way).
export const API_BASE = ''

// ─── Base fetch helpers ──────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error(`[API] ${init?.method ?? 'GET'} ${path} → ${res.status}`)
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T)
}

const apiGet   = <T>(path: string)               => apiFetch<T>(path)
const apiPost  = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
const apiPut   = <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT',  body: JSON.stringify(body) })
const apiPatch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined })
const apiDel   = (path: string)                   => apiFetch<void>(path, { method: 'DELETE' })

// ─── Lookup tables ───────────────────────────────────────────────────────────

/** Backend roleId → frontend Role string */
export const ROLE_MAP: Record<number, Role> = {
  1: 'admin',
  2: 'teacher',
  3: 'student',
  4: 'parent',
}

/** Backend gradeId → THPT grade number (must stay in sync with DB seed) */
export const GRADE_MAP: Record<number, Grade> = {
  1: 10,
  2: 11,
  3: 12,
}

/** Backend schoolYearId → year string (must match semesters.json "year" field) */
export const YEAR_MAP: Record<number, string> = {
  1: '2025-2026',
  2: '2024-2025',
}

/** Backend semesterId → frontend semester id (must match semesters.json "id" field) */
export const SEMESTER_ID_MAP: Record<number, string> = {
  1: 'S1-2025',
  2: 'S2-2025',
}

/** Backend subjectId → subject name (derived from SEED_SUBJECTS order) */
export const SUBJECT_ID_MAP: Record<number, string> = Object.fromEntries(
  SEED_SUBJECTS.map((s, i) => [i + 1, s.name]),
)

// ─── Users ───────────────────────────────────────────────────────────────────
export const getUsers    = () => apiGet<ApiUser[]>('/api/users')
export const getStudents = () => apiGet<ApiStudent[]>('/api/students')
export const getTeachers = () => apiGet<ApiTeacher[]>('/api/teachers')
export const createApiUser = (u: ApiUser) => apiPost<ApiUser>('/api/users', u)
export const updateApiUser = (id: string, u: ApiUser) => apiPut<ApiUser>(`/api/users/${id}`, u)
export const deleteApiUser = (id: string) => apiDel(`/api/users/${id}`)

// ─── Parents & Student-Parent Links ──────────────────────────────────────────
export interface ApiParent {
  parentId?: string
  userId?: string
  occupation?: string
  address?: string
}
export interface ApiParentLink {
  id: { studentId: string; parentId: string }
  relationship?: string
  isPrimaryContact?: boolean
}
export const getParents     = () => apiGet<ApiParent[]>('/api/parents')
export const getParentLinks = () => apiGet<ApiParentLink[]>('/api/parents/links')

// ─── Class Enrollments ───────────────────────────────────────────────────────
export interface ApiClassEnrollment {
  enrollmentId?: number
  classId?: number
  studentId?: string
  enrolledAt?: string
  leftAt?: string | null
  status?: string
}
export const getClassEnrollments = () => apiGet<ApiClassEnrollment[]>('/api/enrollments')

// ─── Classes ─────────────────────────────────────────────────────────────────
export const getClasses     = () => apiGet<ApiClass[]>('/api/classes')
export const createApiClass = (c: ApiClass) => apiPost<ApiClass>('/api/classes', c)
export const updateApiClass = (id: number, c: ApiClass) => apiPut<ApiClass>(`/api/classes/${id}`, c)
export const deleteApiClass = (id: number) => apiDel(`/api/classes/${id}`)

// ─── Assessments & marks ─────────────────────────────────────────────────────
export const getAssessments       = () => apiGet<ApiAssessment[]>('/api/assessments')
export const createApiAssessment  = (a: ApiAssessment) => apiPost<ApiAssessment>('/api/assessments', a)
export const updateApiAssessment  = (id: number, a: ApiAssessment) => apiPut<ApiAssessment>(`/api/assessments/${id}`, a)
export const deleteApiAssessment  = (id: number) => apiDel(`/api/assessments/${id}`)
export const getMarksByAssessment = (assessmentId: number) =>
  apiGet<ApiMark[]>(`/api/assessments/${assessmentId}/marks`)
export const getMarksByStudent    = (studentId: string) =>
  apiGet<ApiMark[]>(`/api/assessments/student/${studentId}/marks`)
export const saveMarkApi          = (assessmentId: number, m: ApiMark) =>
  apiPost<ApiMark>(`/api/assessments/${assessmentId}/marks`, m)

// ─── Registrations ───────────────────────────────────────────────────────────
export const getRegistrations       = () => apiGet<ApiRegistration[]>('/api/registrations')
export const submitRegistrationApi  = (r: ApiRegistration) => apiPost<ApiRegistration>('/api/registrations', r)
export const approveRegistrationApi = (id: number) => apiPatch<ApiRegistration>(`/api/registrations/${id}/approve`)
export const rejectRegistrationApi  = (id: number) => apiPatch<ApiRegistration>(`/api/registrations/${id}/reject`)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  userId?: string
  username?: string
  fullName?: string
  email?: string
  phone?: string
  avatarUrl?: string | null
  /** Uppercase role string from backend: ADMIN | TEACHER | STUDENT | PARENT */
  role?: string
  isActive?: boolean
}
export const loginApi = (username: string, password: string) =>
  apiPost<LoginResponse>('/api/auth/login', { username, password })

export const changePasswordApi = (userId: string, currentPassword: string, newPassword: string) =>
  apiPost<void>('/api/auth/change-password', { userId, currentPassword, newPassword })

// ─── Mappers ─────────────────────────────────────────────────────────────────

/**
 * Map backend User[] (with Teachers for subject lookup) to frontend User[].
 * Students that have `email: null` in the DB receive a generated email of the
 * form `username@estudiez.edu.vn` so the frontend always has a string key.
 * Passwords and role-specific fields (classId, grade, childEmail) come from
 * DEMO_CREDENTIALS — no mock JSON file is consulted.
 */
export function mapApiUsersToFrontend(
  apiUsers: ApiUser[],
  apiStudents: ApiStudent[],
  apiTeachers: ApiTeacher[],
): User[] {
  const teacherByUserId = new Map(apiTeachers.map(t => [t.userId!, t]))
  const studentByUserId = new Map(apiStudents.map(s => [s.userId!, s]))

  return apiUsers.map(u => {
    const role = ROLE_MAP[u.roleId ?? 0] ?? 'student'
    // Students have email: null in the DB → synthesise from username
    const email = u.email ?? `${u.username ?? u.userId}@estudiez.edu.vn`

    // Get address from student profile if available
    const student = role === 'student' ? studentByUserId.get(u.userId ?? '') : undefined

    const base: User = {
      email,
      fullName: u.fullName ?? '',
      address: student?.address ?? '',
      phone: u.phone ?? undefined,
      password: '',  // authentication is server-side; no plain-text password stored
      role,
      userId: u.userId ?? undefined,
    }

    if (role === 'teacher') {
      const t = teacherByUserId.get(u.userId ?? '')
      if (t?.subjectId) base.subject = SUBJECT_ID_MAP[t.subjectId] ?? String(t.subjectId)
    }

    return base
  })
}

/** Map a backend SchoolClass to the frontend SchoolClass shape. */
export function mapApiClass(c: ApiClass, nameByTeacherId?: Map<string, string>): SchoolClass {
  return {
    id: String(c.classId),
    name: c.name ?? '',
    grade: GRADE_MAP[c.gradeId ?? 1] ?? 10,
    year: YEAR_MAP[c.schoolYearId ?? 1] ?? '2025-2026',
    homeroomTeacher: c.homeroomTeacherId && nameByTeacherId
      ? (nameByTeacherId.get(c.homeroomTeacherId) ?? undefined)
      : undefined,
  }
}

/** Map a backend Assessment to the frontend Exam shape. */
export function mapApiAssessmentToExam(a: ApiAssessment): Exam {
  return {
    id: a.assessmentId ?? 0,
    semesterId: SEMESTER_ID_MAP[a.semesterId ?? 1] ?? 'S1-2025',
    subject: SUBJECT_ID_MAP[a.subjectId ?? 0] ?? String(a.subjectId),
    name: a.title ?? '',
    date: a.assessmentDate ?? '',
    completed: a.status === 'COMPLETED',
  }
}

/**
 * Map a backend StudentMark + its parent Assessment to a frontend ScoreDetail.
 * emailByStudentId: backend studentId (UUID) → frontend user email.
 */
export function mapApiMarkToScore(
  mark: ApiMark,
  assessment: ApiAssessment,
  emailByStudentId: Map<string, string>,
): ScoreDetail {
  return {
    id: mark.studentMarkId ?? 0,
    studentEmail: emailByStudentId.get(mark.studentId ?? '') ?? '',
    classId: String(assessment.classId ?? ''),
    subject: SUBJECT_ID_MAP[assessment.subjectId ?? 0] ?? String(assessment.subjectId),
    testId: String(mark.assessmentId ?? ''),
    description: assessment.title ?? '',
    date: assessment.assessmentDate ?? '',
    scoreReceived: mark.score ?? 0,
  }
}

/** Map a backend RegistrationRequest to the frontend RegistrationRequest shape. */
export function mapApiRegistration(r: ApiRegistration): RegistrationRequest {
  return {
    id: r.requestId ?? 0,
    email: r.email ?? '',
    fullName: r.fullName ?? '',
    address: '',
    phone: r.phone ?? undefined,
    password: '',
    role: (r.roleRequested as Role) ?? 'student',
    status: ((r.status ?? 'PENDING').toLowerCase() as RegistrationRequest['status']),
    submittedAt: r.createdAt?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
  }
}

// ─── Raw backend DTO types (not yet in generated api-types.d.ts) ─────────────

export interface ApiTimetableSlot {
  timetableSlotId?: number
  classId?: number
  subjectId?: number
  teacherId?: string
  semesterId?: number
  dayOfWeek?: number
  periodNo?: number
  startTime?: string
  endTime?: string
  room?: string
  effectiveFrom?: string
  effectiveTo?: string | null
}

export interface ApiStudyResource {
  resourceId?: number
  subjectId?: number
  classId?: number | null
  uploadedBy?: string
  title?: string
  description?: string | null
  resourceType?: string
  fileUrl?: string
  thumbnailUrl?: string | null
  visibility?: string
  createdAt?: string
}

export interface ApiNewsPost {
  newsPostId?: number
  authorUserId?: string
  category?: string
  title?: string
  slug?: string
  content?: string
  coverImageUrl?: string | null
  status?: string
  publishedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ApiNotification {
  notificationId?: number
  senderUserId?: string
  title?: string
  content?: string
  category?: string
  targetType?: string
  targetId?: string | null
  createdAt?: string
}

export interface ApiChatGroup {
  chatGroupId?: number
  classId?: number
  schoolYearId?: number
  groupType?: string
  name?: string
  createdAt?: string
}

export interface ApiChatMessage {
  chatMessageId?: number
  chatGroupId?: number
  senderUserId?: string
  messageText?: string | null
  attachmentUrl?: string | null
  createdAt?: string
  deletedAt?: string | null
}

export interface ApiSchoolContact {
  schoolContactId?: number
  name?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  workingHours?: string | null
  isActive?: boolean
}

export interface ApiFeedbackTicket {
  feedbackTicketId?: number
  senderUserId?: string
  relatedStudentId?: string | null
  category?: string
  subject?: string
  content?: string
  status?: string
  handledBy?: string | null
  handledAt?: string | null
  adminResponse?: string | null
  createdAt?: string
}

export interface ApiAttendanceRecord {
  attendanceRecordId?: number
  lessonSessionId?: number
  studentId?: string
  status?: string
  arrivedAt?: string | null
  notes?: string | null
}

export interface ApiLessonSession {
  lessonSessionId?: number
  timetableSlotId?: number | null
  classId?: number
  subjectId?: number
  teacherId?: string
  sessionDate?: string
  periodNo?: number
  room?: string | null
  topic?: string | null
  status?: string
  createdAt?: string
}

// ─── Timetable ───────────────────────────────────────────────────────────────
export const getTimetable        = (classId?: number) =>
  apiGet<ApiTimetableSlot[]>(classId ? `/api/timetable?classId=${classId}` : '/api/timetable')
export const createApiTimetable  = (s: ApiTimetableSlot) => apiPost<ApiTimetableSlot>('/api/timetable', s)
export const updateApiTimetable  = (id: number, s: ApiTimetableSlot) => apiPut<ApiTimetableSlot>(`/api/timetable/${id}`, s)
export const deleteApiTimetable  = (id: number) => apiDel(`/api/timetable/${id}`)

// ─── Study Resources ─────────────────────────────────────────────────────────
export const getResources        = (classId?: number) =>
  apiGet<ApiStudyResource[]>(classId ? `/api/resources?classId=${classId}` : '/api/resources')
export const createApiResource   = (r: ApiStudyResource) => apiPost<ApiStudyResource>('/api/resources', r)
export const updateApiResource   = (id: number, r: ApiStudyResource) => apiPut<ApiStudyResource>(`/api/resources/${id}`, r)
export const deleteApiResource   = (id: number) => apiDel(`/api/resources/${id}`)

// ─── News ─────────────────────────────────────────────────────────────────────
export const getNews             = () => apiGet<ApiNewsPost[]>('/api/news?status=PUBLISHED')
export const getAllNews           = () => apiGet<ApiNewsPost[]>('/api/news')
export const createApiNews       = (n: ApiNewsPost) => apiPost<ApiNewsPost>('/api/news', n)
export const updateApiNews       = (id: number, n: ApiNewsPost) => apiPut<ApiNewsPost>(`/api/news/${id}`, n)
export const deleteApiNews       = (id: number) => apiDel(`/api/news/${id}`)

// ─── Notifications ───────────────────────────────────────────────────────────
export const getNotifications    = () => apiGet<ApiNotification[]>('/api/notifications')
export const createApiNotification = (n: ApiNotification) => apiPost<ApiNotification>('/api/notifications', n)
export const deleteApiNotification = (id: number) => apiDel(`/api/notifications/${id}`)

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const getChatGroups       = () => apiGet<ApiChatGroup[]>('/api/chat/groups')
export const getChatMessages     = (groupId: number) => apiGet<ApiChatMessage[]>(`/api/chat/groups/${groupId}/messages`)
export const sendChatMessage     = (m: ApiChatMessage) => apiPost<ApiChatMessage>('/api/chat/messages', m)

// ─── Contacts ────────────────────────────────────────────────────────────────
export const getContacts         = () => apiGet<ApiSchoolContact[]>('/api/contacts')

// ─── Feedback ────────────────────────────────────────────────────────────────
export const submitFeedbackApi   = (f: ApiFeedbackTicket) => apiPost<ApiFeedbackTicket>('/api/feedback', f)

// ─── Attendance (via Lesson Sessions) ────────────────────────────────────────
export const getAttendanceByStudent = (studentId: string) =>
  apiGet<ApiAttendanceRecord[]>(`/api/lessons/attendance/student/${studentId}`)
export const getLessonsByClass = (classId: number) =>
  apiGet<ApiLessonSession[]>(`/api/lessons?classId=${classId}`)
export const getAllLessons = () =>
  apiGet<ApiLessonSession[]>('/api/lessons')
export const getAllAttendance = (lessonSessionIds: number[]) =>
  Promise.all(lessonSessionIds.map(id => 
    apiGet<ApiAttendanceRecord[]>(`/api/lessons/${id}/attendance`).catch(() => [] as ApiAttendanceRecord[])
  )).then(results => results.flat())

// ─── Mapper helpers ──────────────────────────────────────────────────────────

const DAY_OF_WEEK_MAP: Record<number, DayOfWeek> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
}

function mapResourceType(t: string): 'video' | 'document' | 'external-link' {
  const s = (t ?? '').toUpperCase()
  if (s === 'VIDEO') return 'video'
  if (s === 'LINK' || s === 'EXTERNAL_LINK' || s === 'EXTERNAL-LINK') return 'external-link'
  return 'document'
}

/** Map backend TimetableSlot to frontend TimetableSlot. */
export function mapApiTimetableSlot(
  s: ApiTimetableSlot,
  nameByUserId: Map<string, string>,
): TimetableSlot {
  return {
    id: s.timetableSlotId ?? 0,
    classId: String(s.classId ?? ''),
    day: DAY_OF_WEEK_MAP[s.dayOfWeek ?? 1] ?? 'Mon',
    period: s.periodNo ?? 1,
    subject: SUBJECT_ID_MAP[s.subjectId ?? 0] ?? String(s.subjectId ?? ''),
    teacher: nameByUserId.get(s.teacherId ?? '') ?? s.teacherId ?? '',
    room: s.room ?? '',
    system: 'regular' as TrainingSystem,
  }
}

/** Map backend StudyResource to frontend Resource. */
export function mapApiStudyResource(
  r: ApiStudyResource,
  nameByUserId: Map<string, string>,
): Resource {
  return {
    id: r.resourceId ?? 0,
    title: r.title ?? '',
    type: mapResourceType(r.resourceType ?? ''),
    url: r.fileUrl ?? '',
    subject: SUBJECT_ID_MAP[r.subjectId ?? 0] ?? String(r.subjectId ?? ''),
    classId: r.classId != null ? String(r.classId) : undefined,
    system: 'regular' as TrainingSystem,
    addedBy: nameByUserId.get(r.uploadedBy ?? '') ?? r.uploadedBy ?? '',
  }
}

/** Map backend NewsPost to frontend NewsItem. */
export function mapApiNewsPost(
  n: ApiNewsPost,
  nameByUserId: Map<string, string>,
): NewsItem {
  return {
    id: n.newsPostId ?? 0,
    title: n.title ?? '',
    body: n.content ?? '',
    date: (n.publishedAt ?? n.createdAt ?? '').slice(0, 10),
    author: nameByUserId.get(n.authorUserId ?? '') ?? n.authorUserId ?? '',
    category: n.category ?? 'GENERAL',
  }
}

/** Map backend Notification to frontend NotificationItem. */
export function mapApiNotification(
  n: ApiNotification,
  nameByUserId: Map<string, string>,
): NotificationItem {
  const audience = ((n.targetType ?? 'class').toLowerCase() as NotificationAudience)
  return {
    id: n.notificationId ?? 0,
    title: n.title ?? '',
    body: n.content ?? '',
    date: (n.createdAt ?? '').slice(0, 10),
    audience,
    target: n.targetId ?? undefined,
    sender: nameByUserId.get(n.senderUserId ?? '') ?? n.senderUserId ?? '',
  }
}

/** Map backend ChatGroup to frontend ChatGroup. */
export function mapApiChatGroup(g: ApiChatGroup): ChatGroup {
  const rawType = (g.groupType ?? 'student-teacher').toLowerCase().replace('_', '-')
  return {
    id: String(g.chatGroupId ?? ''),
    name: g.name ?? '',
    classId: String(g.classId ?? ''),
    year: YEAR_MAP[g.schoolYearId ?? 1] ?? '2025-2026',
    type: (rawType as ChatGroup['type']),
  }
}

/** Map backend ChatMessage to frontend ChatMessage. */
export function mapApiChatMessage(
  m: ApiChatMessage,
  nameByUserId: Map<string, string>,
  emailByUserId: Map<string, string>,
): ChatMessage {
  return {
    id: m.chatMessageId ?? 0,
    groupId: String(m.chatGroupId ?? ''),
    senderEmail: emailByUserId.get(m.senderUserId ?? '') ?? m.senderUserId ?? '',
    senderName: nameByUserId.get(m.senderUserId ?? '') ?? '',
    body: m.messageText ?? '',
    sentAt: m.createdAt ?? new Date().toISOString(),
  }
}

/** Map backend SchoolContact to frontend Helpline. */
export function mapApiContact(c: ApiSchoolContact): Helpline {
  return {
    label: c.name ?? '',
    phone: c.phone ?? c.email ?? '',
  }
}
