"""Birthday greeting scheduling utilities."""

from zoneinfo import ZoneInfo

from datetime import date, datetime, time

from sqlalchemy import func
from sqlmodel import Session, select

from ..config import get_settings
from ..models import EmailJob, Setting, Student

DEFAULT_TEMPLATE_SUBJECT = "Happy Birthday, {{student_name}}! 🎉"
DEFAULT_TEMPLATE_BODY = """Dear {{student_name}},\nWishing you a wonderful birthday from {{class_name}}!\nHave an amazing year ahead.\n— {{teacher_name}}"""


def get_template(session: Session) -> tuple[str, str]:
    subject = session.exec(select(Setting).where(Setting.key == "birthday_subject")).first()
    body = session.exec(select(Setting).where(Setting.key == "birthday_body")).first()
    return (
        subject.value if subject else DEFAULT_TEMPLATE_SUBJECT,
        body.value if body else DEFAULT_TEMPLATE_BODY,
    )


def schedule_birthday_emails(session: Session, teacher_name: str) -> list[EmailJob]:
    settings = get_settings()
    today = date.today()
    subject_template, body_template = get_template(session)
    matches = session.exec(
        select(Student)
        .where(Student.active.is_(True))
        .where(func.extract("month", Student.date_of_birth) == today.month)
        .where(func.extract("day", Student.date_of_birth) == today.day)
    ).all()
    scheduled_jobs: list[EmailJob] = []
    for student in matches:
        body = body_template.replace("{{student_name}}", f"{student.first_name} {student.last_name}")
        body = body.replace("{{class_name}}", "Primary Class")
        body = body.replace("{{teacher_name}}", teacher_name)
        subject = subject_template.replace("{{student_name}}", student.first_name)
        job = EmailJob(
            student_id=student.id,
            scheduled_for=datetime.combine(today, time(7, 30), tzinfo=ZoneInfo(settings.timezone)),
            subject=subject,
            body=body,
        )
        session.add(job)
        scheduled_jobs.append(job)
    session.commit()
    for job in scheduled_jobs:
        session.refresh(job)
    return scheduled_jobs
