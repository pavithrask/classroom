"""Initial data seeding utilities."""

from datetime import date, timedelta

from sqlmodel import Session, select

from .database import get_session
from .models import Assignment, Classroom, Student, User
from .security import hash_password


def seed() -> None:
    with get_session() as session:
        ensure_owner(session)
        ensure_sample_data(session)


def ensure_owner(session: Session) -> None:
    if session.exec(select(User)).first():
        return
    owner = User(email="teacher@example.com", full_name="Lead Teacher", hashed_password=hash_password("changeme"))
    session.add(owner)
    session.commit()


def ensure_sample_data(session: Session) -> None:
    if session.exec(select(Classroom)).first():
        return
    classroom = Classroom(name="Grade 4", grade="4", section="A", academic_year="2024")
    session.add(classroom)
    session.flush()
    students = [
        Student(
            first_name="Aanya",
            last_name="Perera",
            date_of_birth=date.today() - timedelta(days=9 * 365),
            guardian_name="Ms. Perera",
            guardian_contact="0770000001",
        ),
        Student(
            first_name="Ishan",
            last_name="Fernando",
            date_of_birth=date.today() - timedelta(days=10 * 365),
            guardian_name="Mr. Fernando",
            guardian_contact="0770000002",
        ),
        Student(
            first_name="Maya",
            last_name="Silva",
            date_of_birth=date.today() - timedelta(days=9 * 365 - 30),
            guardian_name="Mrs. Silva",
            guardian_contact="0770000003",
        ),
    ]
    session.add_all(students)
    session.flush()
    assignment = Assignment(
        class_id=classroom.id,
        title="Reading Log",
        description="Read chapter 2 and summarize.",
        due_date=date.today() + timedelta(days=3),
    )
    session.add(assignment)
    session.commit()
