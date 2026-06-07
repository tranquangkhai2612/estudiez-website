import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { FormField } from '../components/FormField'
import { useData } from '../hooks/useData'
import { useToast } from '../hooks/useToast'
import { classDetailPath } from './classDetailPath'
import { userDetailPath } from './userDetailPath'
import type { Exam, Grade, SchoolClass, ScoreDetail, User } from '../types'

function average(values: number[]) {
  if (values.length === 0) return null
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

function averageBadge(value: number) {
  if (value >= 80) return 'bg-emerald-100 text-emerald-700'
  if (value >= 65) return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

export function ClassDetailPage() {
  const { classId: classIdParam } = useParams<{ classId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { classes, users, scores, progress, timetable, deleteClass } = useData()
  const { push } = useToast()
  const [editing, setEditing] = useState(false)

  const classId = classIdParam ? decodeURIComponent(classIdParam) : ''
  const schoolClass = classes.find((c) => c.id === classId)
  const subject = searchParams.get('subject') ?? ''

  const students = useMemo(
    () => users.filter((u) => u.role === 'student' && u.classId === classId),
    [users, classId],
  )

  const classSubjects = useMemo(() => {
    const slots = timetable.filter((s) => s.classId === classId)
    const map = new Map<string, Set<string>>()
    for (const slot of slots) {
      if (!map.has(slot.subject)) map.set(slot.subject, new Set())
      if (slot.teacher) map.get(slot.subject)!.add(slot.teacher)
    }
    return Array.from(map.entries())
      .map(([name, teacherSet]) => ({ subject: name, teachers: Array.from(teacherSet) }))
      .sort((a, b) => a.subject.localeCompare(b.subject))
  }, [timetable, classId])

  const teachers = useMemo(() => users.filter((u) => u.role === 'teacher'), [users])
  const homeroom = users.find((u) => u.email === schoolClass?.homeroomTeacher)

  if (!schoolClass) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back
        </button>
        <Card title="Class not found" description="No class is registered with that id.">
          <Link to="/dashboard" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Return to dashboard
          </Link>
        </Card>
      </div>
    )
  }

  const handleDelete = () => {
    if (students.length > 0) {
      push(
        'error',
        `${schoolClass.name} has ${students.length} enrolled student(s). Reassign them first.`,
      )
      return
    }
    if (!window.confirm(`Delete ${schoolClass.name}? This cannot be undone.`)) return
    deleteClass(schoolClass.id)
    push('info', `${schoolClass.name} was removed.`)
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {schoolClass.name}{' '}
            <span className="ml-1 inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-sm font-semibold">
              Grade {schoolClass.grade}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {schoolClass.id} · {schoolClass.year} · Homeroom:{' '}
            {homeroom ? homeroom.fullName : 'Unassigned'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-md px-3 py-1.5"
          >
            {editing ? 'Close' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-md px-3 py-1.5"
          >
            Delete
          </button>
        </div>
      </header>

      {editing ? (
        <ClassEditForm
          schoolClass={schoolClass}
          teachers={teachers}
          onDone={() => setEditing(false)}
        />
      ) : null}

      {classSubjects.length > 0 ? (
        <Card title="Subjects & Teachers" description="Select a subject to review marks for this class.">
          <div className="flex flex-wrap gap-2 mb-3">
            <Link
              to={classDetailPath(classId)}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                subject === ''
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </Link>
            {classSubjects.map((s) => (
              <Link
                key={s.subject}
                to={classDetailPath(classId, s.subject)}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  subject === s.subject
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s.subject}
              </Link>
            ))}
          </div>
          <ul className="divide-y divide-slate-100">
            {classSubjects.map((s) => (
              <li
                key={s.subject}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="font-semibold text-slate-900">{s.subject}</span>
                <span className="text-slate-600">
                  {s.teachers.length === 0 ? (
                    <span className="text-slate-400">Unassigned</span>
                  ) : (
                    s.teachers.map((name, i) => {
                      const teacher = users.find((u) => u.fullName === name)
                      return (
                        <span key={name}>
                          {i > 0 ? ', ' : ''}
                          {teacher ? (
                            <Link
                              to={userDetailPath(teacher.email)}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              {name}
                            </Link>
                          ) : (
                            name
                          )}
                        </span>
                      )
                    })
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <SemesterProgress subjects={classSubjects.map((s) => s.subject)} />

      <Card
        title={`Students (${students.length})`}
        description={subject ? `Showing marks for ${subject}.` : undefined}
      >
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">No students enrolled in this class.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  {subject ? (
                    <>
                      <th className="py-2 pr-4">{subject} Marks</th>
                      <th className="py-2 pr-2 text-right">Average</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <StudentRow
                    key={student.email}
                    student={student}
                    classId={classId}
                    subject={subject}
                    scores={scores}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {subject ? <SubjectProgress students={students} subject={subject} progress={progress} /> : null}
    </div>
  )
}

function StudentRow({
  student,
  classId,
  subject,
  scores,
}: {
  student: User
  classId: string
  subject: string
  scores: ScoreDetail[]
}) {
  const studentScores = subject
    ? scores.filter(
        (s) =>
          s.studentEmail === student.email && s.classId === classId && s.subject === subject,
      )
    : []
  const avg = average(studentScores.map((s) => s.scoreReceived))

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 font-semibold">
        <Link
          to={userDetailPath(student.email)}
          className="text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {student.fullName}
        </Link>
      </td>
      <td className="py-2 pr-4 text-slate-600">{student.email}</td>
      {subject ? (
        <>
          <td className="py-2 pr-4">
            {studentScores.length === 0 ? (
              <span className="text-slate-400">No marks</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {studentScores.map((s) => (
                  <span
                    key={s.id}
                    title={s.description}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                  >
                    {s.scoreReceived}
                  </span>
                ))}
              </div>
            )}
          </td>
          <td className="py-2 pr-2 text-right">
            {avg === null ? (
              <span className="text-slate-400">—</span>
            ) : (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${averageBadge(avg)}`}
              >
                {avg}
              </span>
            )}
          </td>
        </>
      ) : null}
    </tr>
  )
}

function SubjectProgress({
  students,
  subject,
  progress,
}: {
  students: User[]
  subject: string
  progress: ReturnType<typeof useData>['progress']
}) {
  const emails = new Set(students.map((s) => s.email))
  const entries = progress.filter((p) => p.subject === subject && emails.has(p.studentEmail))

  if (entries.length === 0) return null

  const byEmail = new Map(students.map((s) => [s.email, s.fullName]))

  return (
    <Card title={`${subject} Progress`} description="Term-by-term progress notes for this class.">
      <ul className="space-y-2">
        {entries.map((p) => (
          <li key={p.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <p className="font-semibold text-slate-900">
              {byEmail.get(p.studentEmail) ?? p.studentEmail} · {p.testName}{' '}
              <span className="ml-1 text-indigo-600">{p.score}</span>
            </p>
            <p className="text-xs text-slate-500">
              {p.term} · {p.remark}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

interface ClassEditFormState {
  name: string
  grade: string
  year: string
  homeroomTeacher: string
}

function ClassEditForm({
  schoolClass,
  teachers,
  onDone,
}: {
  schoolClass: SchoolClass
  teachers: User[]
  onDone: () => void
}) {
  const { updateClass } = useData()
  const { push } = useToast()
  const [form, setForm] = useState<ClassEditFormState>({
    name: schoolClass.name,
    grade: String(schoolClass.grade),
    year: schoolClass.year,
    homeroomTeacher: schoolClass.homeroomTeacher ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ClassEditFormState, string>>>({})

  const update = <K extends keyof ClassEditFormState>(key: K, value: ClassEditFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof ClassEditFormState, string>> = {}
    if (!form.name.trim()) next.name = 'Class name is required.'
    if (!form.year.trim()) next.year = 'Academic year is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    updateClass(schoolClass.id, {
      name: form.name.trim(),
      grade: Number(form.grade) as Grade,
      year: form.year.trim(),
      homeroomTeacher: form.homeroomTeacher || undefined,
    })
    push('success', 'Class updated.')
    onDone()
  }

  return (
    <Card title="Edit Class" description={`${schoolClass.id} · the class ID cannot be changed.`}>
      <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Class Name"
          name="editClassName"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
        />
        <FormField
          as="select"
          label="Grade"
          name="editClassGrade"
          value={form.grade}
          onChange={(e) => update('grade', e.target.value)}
        >
          <option value="10">Grade 10</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </FormField>
        <FormField
          label="Academic Year"
          name="editClassYear"
          value={form.year}
          onChange={(e) => update('year', e.target.value)}
          error={errors.year}
        />
        <FormField
          as="select"
          label="Homeroom Teacher (optional)"
          name="editClassHomeroom"
          value={form.homeroomTeacher}
          onChange={(e) => update('homeroomTeacher', e.target.value)}
        >
          <option value="">Unassigned</option>
          {teachers.map((t) => (
            <option key={t.email} value={t.email}>
              {t.fullName} ({t.subject})
            </option>
          ))}
        </FormField>
        <div className="sm:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onDone}
            className="border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-md px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  )
}

function progressBadge(pct: number) {
  if (pct >= 80) return 'bg-emerald-100 text-emerald-700'
  if (pct >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

function progressBar(pct: number) {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}

interface SemesterFormState {
  id: string
  name: string
  year: string
  startDate: string
  endDate: string
}

const SEMESTER_INITIAL: SemesterFormState = {
  id: '',
  name: '',
  year: '',
  startDate: '',
  endDate: '',
}

function SemesterProgress({ subjects }: { subjects: string[] }) {
  const {
    semesters,
    exams,
    addSemester,
    updateSemester,
    deleteSemester,
    addExam,
    updateExam,
    deleteExam,
  } = useData()
  const { push } = useToast()

  const [selectedId, setSelectedId] = useState('')
  const [mode, setMode] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState<SemesterFormState>(SEMESTER_INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof SemesterFormState, string>>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const activeId = selectedId || semesters[0]?.id || ''
  const semester = semesters.find((s) => s.id === activeId)

  const update = <K extends keyof SemesterFormState>(key: K, value: SemesterFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const openCreate = () => {
    setForm(SEMESTER_INITIAL)
    setErrors({})
    setMode('create')
  }

  const openEdit = () => {
    if (!semester) return
    setForm({
      id: semester.id,
      name: semester.name,
      year: semester.year,
      startDate: semester.startDate,
      endDate: semester.endDate,
    })
    setErrors({})
    setMode('edit')
  }

  const submitSemester = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<keyof SemesterFormState, string>> = {}
    const id = form.id.trim()
    if (mode === 'create') {
      if (!id) next.id = 'Semester ID is required.'
      else if (semesters.some((s) => s.id.toLowerCase() === id.toLowerCase()))
        next.id = 'This ID already exists.'
    }
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.year.trim()) next.year = 'Academic year is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    if (mode === 'create') {
      addSemester({
        id,
        name: form.name.trim(),
        year: form.year.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      })
      setSelectedId(id)
      push('success', `Semester ${form.name.trim()} created.`)
    } else if (mode === 'edit' && semester) {
      updateSemester(semester.id, {
        name: form.name.trim(),
        year: form.year.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      })
      push('success', 'Semester updated.')
    }
    setMode(null)
  }

  const removeSemester = () => {
    if (!semester) return
    const count = exams.filter((e) => e.semesterId === semester.id).length
    if (
      !window.confirm(
        `Delete ${semester.name}? This also removes its ${count} exam(s). This cannot be undone.`,
      )
    )
      return
    deleteSemester(semester.id)
    setSelectedId('')
    setExpanded(null)
    push('info', `${semester.name} was removed.`)
  }

  return (
    <Card
      title="Semester Progress"
      description="Completion is the share of planned exams marked done for each subject."
    >
      <div className="flex flex-wrap items-end gap-2 mb-4">
        <label className="text-sm">
          <span className="block text-slate-600 font-medium mb-1">Semester</span>
          <select
            value={activeId}
            onChange={(e) => {
              setSelectedId(e.target.value)
              setExpanded(null)
              setMode(null)
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {semesters.length === 0 ? <option value="">No semesters yet</option> : null}
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.year}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md px-3 py-2"
          >
            New
          </button>
          {semester ? (
            <>
              <button
                type="button"
                onClick={openEdit}
                className="border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-md px-3 py-2"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={removeSemester}
                className="text-rose-600 hover:text-rose-800 text-sm font-semibold rounded-md px-3 py-2"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      {semester ? (
        <p className="text-xs text-slate-500 mb-3">
          {semester.startDate || '—'} → {semester.endDate || '—'}
        </p>
      ) : null}

      {mode ? (
        <form
          onSubmit={submitSemester}
          noValidate
          className="grid gap-3 sm:grid-cols-2 border border-slate-200 rounded-lg p-3 mb-4 bg-slate-50"
        >
          {mode === 'create' ? (
            <FormField
              label="Semester ID"
              name="semId"
              value={form.id}
              onChange={(e) => update('id', e.target.value)}
              error={errors.id}
              hint="Short code, e.g. S1-2025."
            />
          ) : null}
          <FormField
            label="Name"
            name="semName"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            error={errors.name}
          />
          <FormField
            label="Academic Year"
            name="semYear"
            value={form.year}
            onChange={(e) => update('year', e.target.value)}
            error={errors.year}
          />
          <FormField
            type="date"
            label="Start Date"
            name="semStart"
            value={form.startDate}
            onChange={(e) => update('startDate', e.target.value)}
          />
          <FormField
            type="date"
            label="End Date"
            name="semEnd"
            value={form.endDate}
            onChange={(e) => update('endDate', e.target.value)}
          />
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
            >
              {mode === 'create' ? 'Create Semester' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-md px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {semesters.length === 0 ? (
        <p className="text-sm text-slate-500">Create a semester to start tracking exam progress.</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-slate-500">This class has no subjects on the timetable yet.</p>
      ) : (
        <ul className="space-y-2">
          {subjects.map((subjectName) => (
            <SubjectExamRow
              key={subjectName}
              subject={subjectName}
              semesterId={activeId}
              exams={exams.filter(
                (e) => e.semesterId === activeId && e.subject === subjectName,
              )}
              expanded={expanded === subjectName}
              onToggle={() =>
                setExpanded((prev) => (prev === subjectName ? null : subjectName))
              }
              addExam={addExam}
              updateExam={updateExam}
              deleteExam={deleteExam}
              push={push}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}

function SubjectExamRow({
  subject,
  semesterId,
  exams,
  expanded,
  onToggle,
  addExam,
  updateExam,
  deleteExam,
  push,
}: {
  subject: string
  semesterId: string
  exams: Exam[]
  expanded: boolean
  onToggle: () => void
  addExam: (exam: Omit<Exam, 'id'>) => void
  updateExam: (id: number, patch: Partial<Omit<Exam, 'id'>>) => void
  deleteExam: (id: number) => void
  push: (type: 'success' | 'error' | 'info', message: string) => void
}) {
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')

  const total = exams.length
  const done = exams.filter((e) => e.completed).length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const addExamSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!examName.trim()) {
      push('error', 'Exam name is required.')
      return
    }
    addExam({
      semesterId,
      subject,
      name: examName.trim(),
      date: examDate,
      completed: false,
    })
    setExamName('')
    setExamDate('')
    push('success', `Exam added to ${subject}.`)
  }

  return (
    <li className="border border-slate-200 rounded-lg px-3 py-2">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="font-semibold text-slate-900 min-w-[7rem]">{subject}</span>
        <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <span
            className={`block h-full ${progressBar(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${progressBadge(pct)}`}
        >
          {pct}%
        </span>
        <span className="text-xs text-slate-500 w-16 text-right">
          {done}/{total} done
        </span>
        <span className="text-slate-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-2">
          {exams.length === 0 ? (
            <p className="text-sm text-slate-500">No exams planned yet.</p>
          ) : (
            <ul className="space-y-1">
              {exams.map((exam) => (
                <li
                  key={exam.id}
                  className="flex flex-wrap items-center gap-2 text-sm border-b border-slate-100 pb-1"
                >
                  <label className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={exam.completed}
                      onChange={() => updateExam(exam.id, { completed: !exam.completed })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span
                      className={exam.completed ? 'line-through text-slate-400' : 'text-slate-800'}
                    >
                      {exam.name}
                    </span>
                  </label>
                  <span className="text-xs text-slate-500">{exam.date || 'No date'}</span>
                  <button
                    type="button"
                    onClick={() => deleteExam(exam.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addExamSubmit} className="flex flex-wrap items-end gap-2 pt-1">
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Exam name"
              className="flex-1 min-w-[8rem] rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md px-3 py-1.5"
            >
              Add Exam
            </button>
          </form>
        </div>
      ) : null}
    </li>
  )
}

