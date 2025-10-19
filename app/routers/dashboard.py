"""Dashboard endpoints summarizing daily metrics."""

from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select

from ..dependencies import get_current_user, get_db
from ..models import Attendance, AttendanceStatus, Assignment, Student, Submission, SubmissionStatus

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/today")
def today_view(session: Session = Depends(get_db), user=Depends(get_current_user)) -> dict[str, object]:
    del user
    today = date.today()
    attendance_summary = session.exec(
        select(Attendance.status, func.count()).where(Attendance.date == today).group_by(Attendance.status)
    ).all()
    assignments_due = session.exec(select(Assignment).where(Assignment.due_date == today)).all()
    birthdays = session.exec(
        select(Student)
        .where(func.extract("month", Student.date_of_birth) == today.month)
        .where(func.extract("day", Student.date_of_birth) == today.day)
    ).all()
    present_count = sum(count for status, count in attendance_summary if status == AttendanceStatus.present)
    total_count = sum(count for _, count in attendance_summary) or 1
    attendance_pct = round((present_count / total_count) * 100, 2)
    return {
        "attendance_pct": attendance_pct,
        "assignments_due": [assignment.title for assignment in assignments_due],
        "birthdays": [f"{student.first_name} {student.last_name}" for student in birthdays],
    }


@router.get("/reports")
def reports(
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict[str, object]:
    del user
    attendance_summary = session.exec(
        select(Attendance.class_id, Attendance.status, func.count()).group_by(Attendance.class_id, Attendance.status)
    ).all()
    submission_summary = session.exec(
        select(Submission.assignment_id, Submission.status, func.count()).group_by(
            Submission.assignment_id, Submission.status
        )
    ).all()
    late_list = session.exec(select(Submission).where(Submission.status == SubmissionStatus.submitted_late)).all()
    birthday_calendar = session.exec(select(Student.first_name, Student.last_name, Student.date_of_birth)).all()
    return {
        "attendance_summary": [
            {"class_id": class_id, "status": status.value, "count": count}
            for class_id, status, count in attendance_summary
        ],
        "submission_summary": [
            {"assignment_id": assignment_id, "status": status.value, "count": count}
            for assignment_id, status, count in submission_summary
        ],
        "late_submissions": [
            {
                "assignment_id": submission.assignment_id,
                "student_id": submission.student_id,
                "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            }
            for submission in late_list
        ],
        "birthday_calendar": [
            {
                "name": f"{first} {last}",
                "date": datetime(today.year, dob.month, dob.day).date().isoformat(),
            }
            for first, last, dob in birthday_calendar
            for today in [date.today()]
        ],
    }
