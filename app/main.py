"""FastAPI application entrypoint."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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

    frontend_dir = Path(__file__).resolve().parent / "static"
    if frontend_dir.exists():
        assets_dir = frontend_dir / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        index_file = frontend_dir / "index.html"

        @app.get("/", include_in_schema=False)
        async def serve_index() -> FileResponse:  # pragma: no cover - runtime integration
            if not index_file.exists():
                raise HTTPException(status_code=404)
            return FileResponse(index_file)

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str) -> FileResponse:  # pragma: no cover - runtime integration
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404)
            if full_path in {"docs", "openapi.json", "redoc"}:
                raise HTTPException(status_code=404)
            candidate = frontend_dir / full_path
            if candidate.is_file():
                return FileResponse(candidate)
            if not index_file.exists():
                raise HTTPException(status_code=404)
            return FileResponse(index_file)

    return app


app = create_app()
