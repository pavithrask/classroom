# Simple Requirement Spec — Primary Classes Course/Student Management System (Ages 8–10)

**Audience:** Single teacher (and optionally a co-teacher) managing 1–3 classes of ~20–40 students each.  
**Goal:** Minimal, reliable web app to track attendance, homework/assignments, submissions, student profiles, and auto-send birthday greetings.  
**Hosting:** Low-cost cloud (single container or small VPS).  
**Leverage OSS:** Optionally integrate with Moodle; otherwise ship a self-contained MVP.

---

## 1. Roles & Permissions

- **Teacher (Owner):** Full CRUD on classes, students, assignments, attendance, submissions; send/override birthday greetings; export data.  
- **Co-Teacher (Optional):** Same as Teacher except cannot delete classes or change hosting/config settings.  
- **Parent/Guardian (Future):** Read-only access to their child’s profile, attendance, homework status.  
- **Student (Future):** View assignments & submission status only.

> MVP ships with **Teacher** role only.

---

## 2. Core Features (MVP)

### 2.1 Classes & Students
- Manage classes (name, grade, section, year).
- Student profile: name, DOB, photo, guardian contacts, address (optional), notes, active/inactive.
- Import via CSV with validation.
- Promote, transfer, or archive students.
- Quick search and filters.

**Acceptance Criteria**
- CSV import shows validation errors and allows undo.
- Search < 100 ms for ≤ 5k records.

### 2.2 Attendance
- Daily per-class attendance: Present / Absent / Late / Excused.
- Bulk mark all present; per-student notes.
- Export per class/date range (CSV).
- Dashboard: % present, 7-day trend.

**Acceptance Criteria**
- Marking 35 students ≤ 60 s using keyboard navigation.
- Export includes name, date, status, notes.

### 2.3 Assignments & Homework
- Create assignments (title, description, due date, class, attachments).
- Track submissions: Not Submitted / Submitted / Late / Exempt.
- Record scores (0–100) and feedback.
- Student file uploads.
- Export gradebook (CSV).

**Acceptance Criteria**
- Inline spreadsheet-style editing for marks/status.
- File upload limit configurable (default 10 MB, pdf/docx/jpg/png/mp4).

### 2.4 Birthday Greetings (Automated)
- Daily cron checks DOB.
- Sends greeting email (optionally SMS later).
- Template vars: `{{student_name}}`, `{{class_name}}`, `{{teacher_name}}`.
- Preview/test send, pause/resume, opt-out per student.

**Acceptance Criteria**
- Runs 07:30 local time.
- Delivery log with success/failure.

### 2.5 Dashboards & Reports
- **Today View:** attendance, assignments due, birthdays.  
- **Reports:** attendance summary, submission summary, late list, birthday calendar.  
- **Export:** CSV for any table.

---

## 3. Non-Functional Requirements

- **Simplicity:** single region, single DB/container.  
- **Performance:** p95 < 300 ms for core views (≤ 5k students).  
- **Reliability:** daily backup (7-day retention).  
- **Security:** bcrypt/argon2 passwords, CSRF, rate-limit login.  
- **Privacy:** minimal PII, export/delete options.  
- **Timezone:** Asia/Colombo default.  
- **i18n:** English now, Sinhala/Tamil ready.  
- **Accessibility:** keyboard + ARIA labels.

---

## 4. Minimal Cloud Architecture

- **App:** FastAPI or Express single container.  
- **DB:** PostgreSQL (managed or container).  
- **Storage:** S3-compatible for photos/files.  
- **Email:** SMTP or free transactional provider.  
- **Cron:** internal scheduler (APScheduler/node-cron).  
- **Deploy:** cheap VPS (Caddy/NGINX TLS).  
- **Logs:** basic access/error + uptime ping.

> Target: one small VM or container + managed Postgres.

---

## 5. Data Model (Minimal)

| Table | Purpose |
|-------|----------|
| **users** | Auth and roles |
| **classes** | Class info |
| **students** | Student profiles |
| **class_students** | Enrollment links |
| **attendance** | Daily status records |
| **assignments** | Homework metadata |
| **submissions** | Student submissions |
| **email_jobs** | Birthday/send queue |
| **settings** | User/system config |

**Key Enums**  
- Attendance: `present`, `absent`, `late`, `excused`  
- Submission: `not_submitted`, `submitted`, `submitted_late`, `exempt`

---

## 6. REST API (MVP)

All under `/api/v1`, JSON body, JWT cookie, 401/403 enforced.

### Auth
- `POST /auth/login`
- `POST /auth/logout`

### Classes
- `GET /classes`
- `POST /classes`
- `PATCH /classes/:id`
- `POST /classes/:id/import-students`

### Students
- CRUD + search + photo upload

### Attendance
- `GET /attendance?class_id=&date=`
- `POST /attendance/bulk`
- `GET /attendance/export`

### Assignments
- CRUD
- `GET /assignments/:id/submissions`
- `POST /assignments/:id/submissions/bulk`
- `GET /gradebook/export`

### Birthdays
- `GET /birthdays/calendar`
- `POST /birthdays/test-send`
- `PATCH /birthdays/settings`

### Jobs
- `POST /jobs/run-daily` (secret key protected)

### Reports/Dashboard
- `/dashboard/today`
- `/reports/attendance`
- `/reports/submissions`

---

## 7. UI Pages & Flows

- **Login → Dashboard**
- **Classes List → Class Detail (Students / Attendance / Assignments)**
- **Students:** Inline edit, CSV import/export.
- **Attendance:** Date picker, bulk mark, inline edit.
- **Assignments:** List → Submissions grid (spreadsheet-style).
- **Birthdays:** Calendar + template editor.
- **Reports:** Attendance & submission summaries.

**Keyboard Shortcuts**
- `A` Present, `S` Absent, `L` Late, `E` Excused, `Enter` next, `Ctrl+S` save.

---

## 8. Birthday Email Template (Default)

**Subject:** `Happy Birthday, {{student_name}}! 🎉`  
**Body:**
Dear {{student_name}},
Wishing you a wonderful birthday from {{class_name}}!
Have an amazing year ahead.
— {{teacher_name}}


Stored in `settings` with HTML/text variants.

---

## 9. Validation Rules

- Student: must have first/last name + guardian contact.  
- DOB: past date.  
- Assignment: due ≥ creation.  
- Score: 0–100.  
- Unique attendance per (class, student, date).  
- File size/type validated server-side.

---

## 10. Seed Data

On first run:
- Owner user.  
- Example class “Grade 4 – A”.  
- 3 students.  
- 1 assignment (due in 3 days).  
- 2 birthdays in current month.

---

## 11. Optional Moodle Integration (Post-MVP)

- **A)** LTI 1.3 launch integration  
- **B)** CSV batch sync for attendance/grades  
- Config: Moodle URL, OAuth keys, class–course mapping.

---

## 12. Security & Compliance

- bcrypt/argon2 hashes, min 12 chars.  
- HTTPS, secure cookies.  
- Validate inputs, escape outputs.  
- Soft-delete + audit log for changes.

---

## 13. Suggested Tech Stack

| Layer | Technology |
|--------|-------------|
| Backend | FastAPI / Express |
| Database | PostgreSQL |
| ORM | SQLAlchemy / Prisma |
| Frontend | React + TypeScript (Vite) |
| Styling | TailwindCSS |
| Auth | JWT cookie |
| Jobs | APScheduler / node-cron |
| Storage | S3-compatible |
| Email | SMTP |

---

## 14. Deployment Checklist

1. Docker build with env vars (`DATABASE_URL`, `SMTP_*`, etc.).  
2. Run DB migrations.  
3. Create admin user.  
4. Daily backup cron.  
5. `/healthz` and `/readyz` endpoints.  
6. Free uptime monitor ping.

---

## 15. Test Plan

- **Unit:** validation, CSV parser, permissions.  
- **Integration:** attendance uniqueness, email jobs.  
- **E2E:** create → import → attendance → assignment → birthday → export.  
- **Load:** 5k students list p95 < 300 ms.

---

## 16. Out of Scope (MVP)

Parent/student portals, exams, timetables, payments, advanced analytics, SSO, mobile apps.

---

## 17. Definition of Done

Teacher can:
1. Add classes/students.  
2. Take attendance.  
3. Create & track assignments.  
4. See dashboard (attendance + assignments + birthdays).  
5. Send birthday test email.  
6. Export attendance/grades.  
7. Confirm backup job success.

---

## 18. Implementation Notes

- Keep controllers thin; validation in schemas.  
- Paginate (default 25).  
- Bulk endpoints idempotent.  
- Abstract storage/email for easy swap.  

---

