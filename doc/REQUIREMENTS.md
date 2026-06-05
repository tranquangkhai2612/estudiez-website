# eStudiez (eStudent) — Software Requirements Specification

> **Group 5 Project** — *eStudent: A Study-Progress Tracking Application*

## 1. Overview

**eStudiez** is a web application that models the **study-progress management** of a single
high school (THPT). It gives the school's board of management, subject teachers, students,
and parents/guardians one place to track marks, attendance, timetables, study resources,
revision classes, school news, notifications, and class chat groups.

> **Scope note:** The application is limited to **tracking academic progress only**. It does
> **not** cover teacher HR management, admissions, tuition/fees, or any other administrative
> domain. The personnel CRUD features described below exist **solely** to support the
> study-progress application.

## 2. Problem Statement

- Parents/Guardians need visibility into their children's academic progress and attendance.
- Students need a single place to see their timetable, marks, resources, and notifications.
- Teachers are overloaded and cannot track every student manually.
- The school needs a central channel for news, notifications, and class communication.
- A centralized web app is needed to solve these issues.

## 3. User Roles

| Role | Vietnamese | Description |
|------|-----------|-------------|
| **Admin** | Ban giám hiệu | Super Admin of the system. Manages teachers, students, and school news. |
| **Teacher** | Giáo viên bộ môn | Subject teacher. Teaches **one subject** (may cover many grades/classes). Students and teaching classes are assigned by the Admin. |
| **Student** | Học sinh | Student of grade 10/11/12. Belongs to **one regular class** at a time; may enroll in extra revision classes. Login is provided by the school. |
| **Parent** | Phụ huynh | Parent/guardian of a student. Login is provided by the school. |

### 3.1 Admin (Ban giám hiệu) — Functions

1. Manage and assign subject teachers (assign each teacher a subject and teaching classes).
2. Manage student information (add new, assign to a class, update info, etc.).
   - On adding a new student (enrollment), **send login credentials** to the student and the parent.
3. Post and update **school-wide news** (yearly class lists, festivals, school activities, …).

### 3.2 Teacher (Giáo viên bộ môn) — Functions

- Take **attendance** for students per teaching period.
- Update **subject marks** for their assigned classes/students.
- Upload **subject study resources**.
- Send **notifications** to the classes they teach (e.g., room change).
- Write a **detailed evaluation** of a test → the system's **AI suggests a learning path**.

### 3.3 Student (Học sinh) — Functions

- View **class timetable** (and weekly timetable).
- View **mark notifications** for each subject.
- View and **download** subject study resources.
- Join the **class chat group** (students + teachers).

### 3.4 Parent (Phụ huynh) — Functions

- Edit their **own contact info** (email, phone number).
- View their child's **timetable**.
- View their child's **mark notifications**.
- View **school news**.
- View **notifications related to their child**.
- Join the **parent chat group** (parents + teachers).

## 4. Core Functions of the Application

### 4.1 Academic Progress (Theo dõi tiến độ học tập)

| Feature | Vietnamese | Description |
|---------|-----------|-------------|
| **Mark report** | Quản lý điểm môn học | Subject marks per student/test. |
| **Attendance report** | Quản lý điểm danh chuyên cần | Attendance per period (present / absent / late / excused). |
| **Class timetable** | Thông báo lịch học của lớp | Full timetable for a class. |
| **Weekly timetable** | Lịch học theo từng tuần | A weekly view derived from the class timetable. |

### 4.2 Study Resources (Tài liệu học tập)

- Manage subject-related materials (images, videos, PDF files).

### 4.3 Revision Class (Lớp phụ đạo tăng cường)

- Manage out-of-hours extra/revision classes.
- Shares the same data store as sections 4.1 + 4.2, distinguished by a **"Training System"**
  column (`regular` vs `revision`).

### 4.4 News (Tin tức chung của trường)

- School-wide news and announcements.

### 4.5 Notification (Thông báo riêng)

- Notifications from the school to students and parents.
- Notifications from the Admin to subject teachers.

### 4.6 Chat Group (Nhóm chat riêng của lớp)

- **Student + Teacher** group: per class, per academic year — the students of the class and all
  subject teachers teaching that class that year.
- **Parent + Teacher** group: per class, per academic year — the parents of students in the class
  and all subject teachers teaching that class that year.

### 4.7 Feedback and Contact Us (Liên hệ nhà trường)

- Students and parents send feedback/petitions to the Admin (e.g., evaluating a teacher's
  teaching attitude).
- General contact information of the school.

## 5. Functional Requirements Detail

### 5.1 Common Features (All Users)

- **Home Page** – Landing page with role-based navigation after login.
- **Login** – Authenticated access; the signed-in user's name and role are shown top-right.
- **Sign Out** – Log out of the application.
- **Profile** – Update personal details (and, for parents, contact info) and password.
- **Feedback** – Submit feedback to the school.
- **Contact Us** – Display the school's / developer's contact information.

> **Account provisioning:** In production, student and parent accounts are **issued by the
> school (Admin)**, not self-registered. The demo keeps a Register page for convenience.

### 5.2 Mark Report

- **Teacher:** view and update marks for their students; record test description, date, score.
- **Student/Parent:** view marks as notifications per subject.

## 6. Non-Functional Requirements

| Requirement | Description |
|-------------|-------------|
| Safety | No malicious downloads or unnecessary files. |
| Accessibility | Clear fonts, readable UI, intuitive navigation. |
| User-Friendly | Clear menus and easy-to-understand functions. |
| Reliability | Must operate efficiently and consistently. |
| Performance | Fast loading, smooth page transitions. |
| Security | Authentication-based, role-based access control. |
| Availability | 24/7 uptime with minimal downtime. |
| Compatibility | Works on all modern browsers. |

## 7. Tech Stack

### Frontend (current implementation)
- **React 19 + TypeScript** (Vite build)
- **React Router 7** for routing
- **Tailwind CSS 4** for styling
- **Front-end-first approach:** all data is currently served from **static JSON fixtures**
  in `public/data/*` and cached in `localStorage`, so the UI can be built and demoed before
  the database is designed.

### Backend (to be designed later)
- Java / Jakarta EE, or C# ASP.NET Core, or PHP, or Python (Flask) — TBD.

### Database (to be designed later)
- MySQL 5.7+ or SQL Server 2016+ — TBD.

## 8. Data Model (front-end fixtures)

The front-end is driven by the following JSON fixtures under `public/data/`:

| File | Entity | Notes |
|------|--------|-------|
| `users.json` | User | `admin` / `teacher` / `student` / `parent`. Teacher has a `subject`; student has `classId` + `grade`; parent has `childEmail`. |
| `classes.json` | SchoolClass | `id` (e.g. `10A1`), `grade`, `year`, `homeroomTeacher`. |
| `subjects.json` | Subject | Subject catalog. |
| `scores.json` | ScoreDetail (Mark report) | Per student, subject, test. |
| `progress.json` | ProgressDetail | Term progress summary. |
| `attendance.json` | AttendanceRecord | Per period: present / absent / late / excused. |
| `timetable.json` | TimetableSlot | Per class/day/period; `system` = regular / revision. |
| `resources.json` | Resource | Study materials; `subject` + `system`. |
| `revision.json` | RevisionClass | Out-of-hours revision classes. |
| `evaluations.json` | TestEvaluation | Teacher's detailed eval + AI-suggested learning path. |
| `news.json` | NewsItem | School-wide news. |
| `notifications.json` | NotificationItem | Audience: class / student / parent / teacher. |
| `chat.json` | ChatGroup + ChatMessage | Per class, per year; `student-teacher` / `parent-teacher`. |
| `helplines.json` | Helpline | Support phone numbers. |

> Detailed relational schema (PK/FK, indexes, SQL scripts) will be produced in the
> database-design phase. A `Training System` column distinguishes regular vs revision data.

## 9. Deliverables

- [ ] Problem Definition
- [ ] Design Specifications
- [ ] Diagrams (DFD, Activity diagrams)
- [ ] Database Design + SQL scripts (`.sql`)
- [x] Source Code (front-end with fake data)
- [ ] Test Data
- [ ] Installation Instructions
- [x] Sitemap (included in home page)
- [ ] ReadMe file with assumptions

> All deliverables submitted as a zip file.