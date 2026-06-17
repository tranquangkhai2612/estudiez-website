# eStudiez Backend API Reference

**Base URL:** `http://localhost:8081`
**Swagger UI:** `http://localhost:8081/swagger-ui/index.html`
**OpenAPI JSON:** `http://localhost:8081/v3/api-docs`

---

## Authentication
Currently **no authentication required** (JWT will be added later).
All endpoints are open.

---

## Data Types
| Type | Example |
|---|---|
| UUID (user/student/teacher/parent IDs) | `"3fa85f64-5717-4562-b3fc-2c963f66afa6"` |
| Integer (class/assessment/semester IDs) | `1` |
| Date | `"2025-09-01"` |
| DateTime | `"2026-06-12T10:00:00"` |

---

## Endpoints

### 👤 Users — `/api/users`
| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/{id}` | Get user by UUID |
| POST | `/api/users` | Create user (password is plain text, gets BCrypt-hashed) |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

**User object:**
```json
{
  "roleId": 2,
  "username": "teacher.math",
  "passwordHash": "plaintext_password_here",
  "fullName": "Nguyen Van Minh",
  "email": "minh@school.edu.vn",
  "phone": "0901000001",
  "isActive": true
}
```

---

### 👨‍🎓 Students — `/api/students`
| Method | Path | Description |
|---|---|---|
| GET | `/api/students` | List all (optional `?status=ACTIVE`) |
| GET | `/api/students/{id}` | Get by UUID |
| GET | `/api/students/code/{code}` | Get by student code (e.g. STU001) |
| POST | `/api/students` | Create student |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |

**Student status values:** `ACTIVE`, `TRANSFERRED`, `GRADUATED`, `SUSPENDED`

---

### 👨‍🏫 Teachers — `/api/teachers`
| Method | Path | Description |
|---|---|---|
| GET | `/api/teachers` | List all (optional `?subjectId=1`) |
| GET | `/api/teachers/{id}` | Get by UUID |
| POST | `/api/teachers` | Create teacher |
| PUT | `/api/teachers/{id}` | Update teacher |
| DELETE | `/api/teachers/{id}` | Delete teacher |

---

### 🏫 Classes — `/api/classes`
| Method | Path | Description |
|---|---|---|
| GET | `/api/classes` | List all (optional `?schoolYearId=1`) |
| GET | `/api/classes/{id}` | Get by ID |
| POST | `/api/classes` | Create class |
| PUT | `/api/classes/{id}` | Update class |
| DELETE | `/api/classes/{id}` | Delete class |

**TrainingProgram values:** `REGULAR`, `REVISION`

---

### 📝 Assessments — `/api/assessments`
| Method | Path | Description |
|---|---|---|
| GET | `/api/assessments` | List all (optional `?classId=1`) |
| GET | `/api/assessments/{id}` | Get by ID |
| GET | `/api/assessments/{id}/marks` | Get all marks for this assessment |
| GET | `/api/assessments/student/{studentId}/marks` | Get all marks for a student |
| POST | `/api/assessments` | Create assessment |
| POST | `/api/assessments/{id}/marks` | Submit a student mark |
| PUT | `/api/assessments/{id}` | Update assessment |
| DELETE | `/api/assessments/{id}` | Delete assessment |

**Assessment status values:** `SCHEDULED`, `COMPLETED`, `CANCELLED`

---

### 📅 Lesson Sessions — `/api/lessons`
| Method | Path | Description |
|---|---|---|
| GET | `/api/lessons` | List all (optional `?classId=1`) |
| GET | `/api/lessons/{id}` | Get by ID |
| GET | `/api/lessons/{id}/attendance` | Get attendance for a session |
| GET | `/api/lessons/attendance/student/{studentId}` | Get all attendance for a student |
| POST | `/api/lessons` | Create lesson session |
| POST | `/api/lessons/{id}/attendance` | Record attendance |
| PUT | `/api/lessons/{id}` | Update lesson session |
| DELETE | `/api/lessons/{id}` | Delete lesson session |

**Lesson status values:** `SCHEDULED`, `COMPLETED`, `CANCELLED`
**Attendance status values:** `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`

---

### 📬 Registration Requests — `/api/registrations`
| Method | Path | Description |
|---|---|---|
| GET | `/api/registrations` | List all (optional `?status=PENDING`) |
| GET | `/api/registrations/{id}` | Get by ID |
| POST | `/api/registrations` | Submit new request (public) |
| PATCH | `/api/registrations/{id}/approve` | Approve request |
| PATCH | `/api/registrations/{id}/reject` | Reject request |

**Request status values:** `PENDING`, `APPROVED`, `REJECTED`
**RoleRequested values:** `student`, `parent`, `teacher`

**Approve/Reject body:**
```json
{
  "reviewedBy": "uuid-of-admin-user",
  "reviewNotes": "Optional notes"
}
```

---

## Seed Test Accounts
| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Teacher | `teacher.math` | `Teacher@123` |
| Teacher | `teacher.lit` | `Teacher@123` |
| Teacher | `teacher.eng` | `Teacher@123` |
| Student | `bao.pq` | `Student@123` |
| Student | `mai.nt` | `Student@123` |
| Parent | `parent.bao` | `Parent@123` |

## Seed Reference IDs
After seeding, use `GET /api/users`, `GET /api/students`, etc. to get the actual UUIDs.
- School Year: "2025-2026" (isCurrent: true)
- Semesters: "Semester 1", "Semester 2"
- Classes: "10A1" (Grade 10), "11A1" (Grade 11)
- Subjects: Math (MATH), Literature (LIT), English (ENG)
- Assessment Types: QUIZ, MIDTERM, FINAL

