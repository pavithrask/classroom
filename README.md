# Primary Classes Course/Student Management System

This repository contains a FastAPI backend **and** a React front-end that implement the MVP specified in `requirements.md` for managing classes, students, attendance, assignments, and automated birthday greetings for a small primary classes program.

## Features
- JWT-based authentication for teacher role.
- CRUD APIs for classes and students with CSV import/validation.
- Attendance tracking with bulk updates, exports, and trend statistics.
- Assignment and submission management with gradebook export.
- Dashboard summaries for today's attendance, due assignments, and birthdays.
- Automated birthday greeting scheduling with customizable templates.
- Seed data for an initial owner, class, students, and sample assignment.

## Getting Started
1. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Launch the API server:
   ```bash
   uvicorn app.main:app --reload
   ```
3. Access the interactive docs at `http://localhost:8000/docs` and authenticate using the seeded teacher credentials (`teacher@example.com` / `changeme`).

## Front-end (React + Vite)

1. Install dependencies and start the development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The UI is served on `http://localhost:5173` by default (configurable via `VITE_PORT`). Set `VITE_API_BASE_URL` in a `.env` file to point to the FastAPI instance (defaults to `http://localhost:8000/api/v1`).

2. Build an optimized production bundle:
   ```bash
   npm run build
   npm run preview  # optional smoke-test of the compiled bundle
   ```

The web client provides authenticated dashboards for daily operations, CRUD views for classes and students (including CSV import), inline attendance capture, assignment gradebook management, and birthday template automation. The application shares the same seeded credentials as the API.

## Configuration
Environment variables can be set to override defaults (see `app/config.py`). Key options include `DATABASE_URL`, SMTP settings, `TIMEZONE`, and file upload limits.

## Testing
Run the Python bytecode compilation check to validate syntax:
```bash
python -m compileall app
```
Front-end unit tests are not included in this iteration. Use `npm run build` to ensure the React bundle compiles successfully.
