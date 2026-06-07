export type Role = 'admin' | 'teacher' | 'student' | 'parent'

/** Hệ đào tạo — distinguishes regular classes from out-of-hours revision classes. */
export type TrainingSystem = 'regular' | 'revision'

export type Grade = 10 | 11 | 12

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'

export interface User {
  email: string
  fullName: string
  address: string
  phone?: string
  age?: number
  password: string
  role: Role
  /** Student: homeroom class id (e.g. "10A1"). */
  classId?: string
  /** Student: grade level. */
  grade?: Grade
  /** Teacher: the single subject they teach. */
  subject?: string
  /** Parent: linked child's email. */
  childEmail?: string
}

export interface SchoolClass {
  id: string
  name: string
  grade: Grade
  year: string
  homeroomTeacher?: string
}

export interface Subject {
  id: string
  name: string
}

/** An academic semester shared across all classes. */
export interface Semester {
  id: string
  name: string
  year: string
  startDate: string
  endDate: string
}

/** A planned assessment for a subject within a semester. A subject can have many. */
export interface Exam {
  id: number
  semesterId: string
  subject: string
  name: string
  date: string
  completed: boolean
}

/** Mark report — điểm môn học. */
export interface ScoreDetail {
  id: number
  studentEmail: string
  classId: string
  subject: string
  testId: string
  description: string
  date: string
  scoreReceived: number
}

export interface ProgressDetail {
  id: number
  studentEmail: string
  subject: string
  term: string
  testName: string
  score: number
  remark: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

/** Attendance report — điểm danh chuyên cần. */
export interface AttendanceRecord {
  id: number
  studentEmail: string
  classId: string
  subject: string
  date: string
  period: number
  status: AttendanceStatus
  teacher: string
}

/** A single slot in a class timetable. */
export interface TimetableSlot {
  id: number
  classId: string
  day: DayOfWeek
  period: number
  subject: string
  teacher: string
  room: string
  system: TrainingSystem
}

export interface Resource {
  id: number
  title: string
  type: 'video' | 'document' | 'external-link'
  url: string
  subject: string
  classId?: string
  system: TrainingSystem
  addedBy: string
}

export interface RevisionClass {
  id: number
  topic: string
  subject: string
  classId?: string
  dateTime: string
  teacher: string
}

/** Teacher's detailed test evaluation with an AI-suggested learning path. */
export interface TestEvaluation {
  id: number
  studentEmail: string
  subject: string
  testId: string
  strengths: string
  weaknesses: string
  suggestedPath: string
  teacher: string
}

export interface NewsItem {
  id: number
  title: string
  body: string
  date: string
  author: string
  category: string
}

export type NotificationAudience = 'class' | 'student' | 'parent' | 'teacher'

export interface NotificationItem {
  id: number
  title: string
  body: string
  date: string
  audience: NotificationAudience
  /** classId or user email depending on audience. */
  target?: string
  sender: string
}

export type ChatGroupType = 'student-teacher' | 'parent-teacher'

export interface ChatGroup {
  id: string
  name: string
  classId: string
  year: string
  type: ChatGroupType
}

export interface ChatMessage {
  id: number
  groupId: string
  senderEmail: string
  senderName: string
  body: string
  sentAt: string
}

export interface Helpline {
  label: string
  phone: string
}

export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

export interface RegistrationRequest {
  id: number
  email: string
  fullName: string
  address: string
  phone?: string
  password: string
  role: Role
  age?: number
  childEmail?: string
  status: RegistrationStatus
  submittedAt: string
}
