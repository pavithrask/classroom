"""Student management endpoints including CSV import."""

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlmodel import Session, select

from ..dependencies import get_current_user, get_db
from ..models import ClassStudent, Student, StudentCreate, StudentRead, StudentUpdate

router = APIRouter(prefix="/api/v1/students", tags=["students"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=StudentRead)
def create_student(payload: StudentCreate, session: Session = Depends(get_db), user=Depends(get_current_user)) -> Student:
    del user
    if payload.date_of_birth >= date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="DOB must be in the past")
    student = Student(**payload.dict())
    session.add(student)
    session.commit()
    session.refresh(student)
    return student


@router.get("/", response_model=list[StudentRead])
def list_students(
    search: str | None = Query(default=None, description="Search across first/last name"),
    active: bool | None = Query(default=None),
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[Student]:
    del user
    statement = select(Student)
    if search:
        like = f"%{search.lower()}%"
        statement = statement.where((Student.first_name.ilike(like)) | (Student.last_name.ilike(like)))
    if active is not None:
        statement = statement.where(Student.active == active)
    return session.exec(statement.order_by(Student.last_name, Student.first_name)).all()


@router.post("/{student_id}/enroll", response_model=StudentRead)
def enroll_student(
    student_id: int,
    class_id: int,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Student:
    del user
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    existing = session.exec(
        select(ClassStudent).where(ClassStudent.class_id == class_id, ClassStudent.student_id == student_id)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student already enrolled")
    enrollment = ClassStudent(class_id=class_id, student_id=student_id)
    session.add(enrollment)
    session.commit()
    session.refresh(student)
    return student


@router.post("/import", response_model=list[StudentRead])
def import_students(
    class_id: int | None = None,
    file: UploadFile = File(...),
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[Student]:
    del user
    contents = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(contents))
    required = {"first_name", "last_name", "date_of_birth", "guardian_name", "guardian_contact"}
    students: list[Student] = []
    for row in reader:
        if not required.issubset(row):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing required columns")
        try:
            dob = date.fromisoformat(row["date_of_birth"])
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid DOB format") from exc
        if dob >= date.today():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="DOB must be in the past")
        student = Student(
            first_name=row["first_name"],
            last_name=row["last_name"],
            date_of_birth=dob,
            guardian_name=row["guardian_name"],
            guardian_contact=row["guardian_contact"],
            photo_url=row.get("photo_url"),
            address=row.get("address"),
            notes=row.get("notes"),
            active=row.get("active", "true").lower() in {"true", "1", "yes"},
        )
        session.add(student)
        session.flush()
        if class_id:
            session.add(ClassStudent(class_id=class_id, student_id=student.id))
        students.append(student)
    session.commit()
    for student in students:
        session.refresh(student)
    return students


@router.get("/{student_id}", response_model=StudentRead)
def get_student(student_id: int, session: Session = Depends(get_db), user=Depends(get_current_user)) -> Student:
    del user
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


@router.put("/{student_id}", response_model=StudentRead)
def update_student(
    student_id: int, payload: StudentUpdate, session: Session = Depends(get_db), user=Depends(get_current_user)
) -> Student:
    del user
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(student, key, value)
    session.add(student)
    session.commit()
    session.refresh(student)
    return student




@router.post("/{student_id}/transfer", response_model=StudentRead)
def transfer_student(
    student_id: int,
    new_class_id: int,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Student:
    del user
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    enrollments = session.exec(select(ClassStudent).where(ClassStudent.student_id == student_id, ClassStudent.archived.is_(False))).all()
    for enrollment in enrollments:
        enrollment.archived = True
        session.add(enrollment)
    session.add(ClassStudent(class_id=new_class_id, student_id=student_id))
    session.commit()
    session.refresh(student)
    return student

@router.post("/{student_id}/archive", response_model=StudentRead)
def archive_student(
    student_id: int,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Student:
    del user
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    student.active = False
    enrollments = session.exec(select(ClassStudent).where(ClassStudent.student_id == student_id)).all()
    for enrollment in enrollments:
        enrollment.archived = True
        session.add(enrollment)
    session.add(student)
    session.commit()
    session.refresh(student)
    return student

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, session: Session = Depends(get_db), user=Depends(get_current_user)) -> None:
    del user
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    session.delete(student)
    session.commit()
