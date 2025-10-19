"""Expose API routers."""

from . import assignments, attendance, auth, birthdays, classes, dashboard, students

__all__ = [
    "assignments",
    "attendance",
    "auth",
    "birthdays",
    "classes",
    "dashboard",
    "students",
]
