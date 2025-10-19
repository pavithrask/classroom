"""Attendance endpoints for per-class tracking and exports."""

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlmodel import Session, select

from ..dependencies import get_current_user, get_db
from ..models import Attendance, AttendanceRead, AttendanceStatus, Classroom, Student

router = APIRouter(prefix="/api/v1/attendance", tags=["attendance"])


@router.post("/bulk", response_model=list[AttendanceRead])
def mark_attendance(
    records: list[Attendance],
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[Attendance]:
    del user
    for record in records:
        existing = session.exec(
            select(Attendance).where(
                Attendance.class_id == record.class_id,
                Attendance.student_id == record.student_id,
                Attendance.date == record.date,
            )
        ).first()
        if existing:
            for key, value in record.dict(exclude_unset=True).items():
                setattr(existing, key, value)
        else:
            session.add(record)
    session.commit()
    ids = {(r.class_id, r.student_id, r.date) for r in records}
    refreshed: list[Attendance] = []
    for class_id, student_id, day in ids:
        refreshed.append(
            session.exec(
                select(Attendance).where(
                    Attendance.class_id == class_id, Attendance.student_id == student_id, Attendance.date == day
                )
            ).one()
        )
    return refreshed


@router.get("/", response_model=list[AttendanceRead])
def list_attendance(
    class_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[Attendance]:
    del user
    statement = select(Attendance)
    if class_id:
        statement = statement.where(Attendance.class_id == class_id)
    if start_date:
        statement = statement.where(Attendance.date >= start_date)
    if end_date:
        statement = statement.where(Attendance.date <= end_date)
    return session.exec(statement.order_by(Attendance.date.desc())).all()


@router.get("/export")
def export_attendance(
    class_id: int,
    start_date: date,
    end_date: date,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Response:
    del user
    records = session.exec(
        select(Attendance, Student, Classroom)
        .where(Attendance.class_id == class_id)
        .where(Attendance.date.between(start_date, end_date))
        .join(Student, Attendance.student_id == Student.id)
        .join(Classroom, Attendance.class_id == Classroom.id)
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["class", "student", "date", "status", "note"])
    for attendance, student, classroom in records:
        writer.writerow(
            [
                classroom.name,
                f"{student.first_name} {student.last_name}",
                attendance.date.isoformat(),
                attendance.status.value,
                attendance.note or "",
            ]
        )
    return Response(content=output.getvalue(), media_type="text/csv")


@router.get("/stats")
def attendance_stats(
    class_id: int,
    days: int = Query(default=7, le=30),
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict[str, float | list[dict[str, str]]]:
    del user
    records = session.exec(
        select(Attendance)
        .where(Attendance.class_id == class_id)
        .order_by(Attendance.date.desc())
        .limit(days)
    ).all()
    if not records:
        return {"present_pct": 0.0, "trend": []}
    total = len(records)
    present = sum(1 for r in records if r.status == AttendanceStatus.present)
    trend = [
        {"date": r.date.isoformat(), "status": r.status.value}
        for r in sorted(records, key=lambda r: r.date, reverse=False)
    ]
    return {"present_pct": round((present / total) * 100, 2), "trend": trend}
