"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import assignments, attendance, auth, birthdays, classes, dashboard, students
from .seed import seed


def create_app() -> FastAPI:
    init_db()
    seed()
    app = FastAPI(title="Primary Classes Manager", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth.router)
    app.include_router(classes.router)
    app.include_router(students.router)
    app.include_router(attendance.router)
    app.include_router(assignments.router)
    app.include_router(birthdays.router)
    app.include_router(dashboard.router)
    return app


app = create_app()
