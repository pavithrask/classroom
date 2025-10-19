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
Environment variables can be set to override defaults (see `app/config.py`). Key options include:

- `DATABASE_URL` – database connection string; Postgres URLs are normalized automatically.
- `DATABASE_SSLMODE` – set to `require` for managed Postgres providers like Fly.io to enforce TLS.
- `DATABASE_INIT_MAX_RETRIES` / `DATABASE_INIT_RETRY_INTERVAL` – control startup retries while waiting for the database to accept connections.
- SMTP settings (`SMTP_HOST`, `SMTP_PORT`, etc.), `TIMEZONE`, and file upload limits.

## Testing
Run the Python bytecode compilation check to validate syntax:
```bash
python -m compileall app
```
Front-end unit tests are not included in this iteration. Use `npm run build` to ensure the React bundle compiles successfully.

## Deployment cost recommendation
For the lowest-cost cloud setup that still satisfies the project’s database, storage, and email requirements, deploy on Fly.io’s free tier (single shared-cpu-1x VM plus Fly Postgres Lite) and pair it with free allowances from Cloudflare R2 for file storage and a starter transactional email provider. See `docs/deployment-options.md` for a comparison table against other popular hosts.

## Continuous deployment on Fly.io
The repository ships with a production-ready pipeline and infrastructure-as-code files for Fly.io:

- `Dockerfile` builds both the FastAPI backend and the React SPA into a single container image that serves API routes under `/api/v1` and the compiled UI everywhere else.
- `fly.toml` configures the Fly app, HTTP service, and build arguments so you can deploy with a single `fly deploy` command.
- `.github/workflows/deploy.yml` pushes every commit on `main` to Fly.io once the required secrets are configured (`FLY_API_TOKEN`, `FLY_APP_NAME`, and `VITE_API_BASE_URL`).

Follow `docs/fly-deployment.md` for step-by-step instructions on provisioning Fly Postgres, seeding application secrets, and enabling the CI/CD workflow.

## Pushing changes to GitHub
To publish the current code to GitHub:

1. Create an empty repository in your GitHub account (for example `primary-classes-manager`).
2. Add that repository as the `origin` remote in this project directory:
   ```bash
   git remote add origin git@github.com:<your-username>/primary-classes-manager.git
   # or use https://github.com/... if you prefer HTTPS authentication
   ```
3. Push the existing `work` branch (if you keep that name):
   ```bash
   git push -u origin work
   ```
   If you prefer `main`, rename the branch locally before the first push:
   ```bash
   git branch -m work main
   git push -u origin main
   ```
4. Subsequent pushes only require `git push` because the upstream is configured by `-u`.

Ensure your SSH key or HTTPS credentials are configured in your environment so GitHub accepts the push.
