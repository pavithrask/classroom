"""Classroom management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..dependencies import get_current_user, get_db
from ..models import Classroom, ClassroomCreate, ClassroomRead, ClassroomUpdate, ClassStudent, Student, StudentRead

router = APIRouter(prefix="/api/v1/classes", tags=["classes"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ClassroomRead)
def create_classroom(
    payload: ClassroomCreate, session: Session = Depends(get_db), user=Depends(get_current_user)
) -> Classroom:
    del user  # Teacher-only app for now
    classroom = Classroom(**payload.dict())
    session.add(classroom)
    session.commit()
    session.refresh(classroom)
    return classroom


@router.get("/", response_model=list[ClassroomRead])
def list_classrooms(
    search: str | None = Query(default=None, description="Search by name or grade"),
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[Classroom]:
    del user
    statement = select(Classroom)
    if search:
        like = f"%{search.lower()}%"
        statement = statement.where((Classroom.name.ilike(like)) | (Classroom.grade.ilike(like)))
    return session.exec(statement.order_by(Classroom.name)).all()


@router.get("/{class_id}", response_model=ClassroomRead)
def get_classroom(class_id: int, session: Session = Depends(get_db), user=Depends(get_current_user)) -> Classroom:
    del user
    classroom = session.get(Classroom, class_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    return classroom


@router.get("/{class_id}/students", response_model=list[StudentRead])
def list_class_students(class_id: int, session: Session = Depends(get_db), user=Depends(get_current_user)) -> list[Student]:
    del user
    if not session.get(Classroom, class_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    statement = (
        select(Student)
        .join(ClassStudent, ClassStudent.student_id == Student.id)
        .where(ClassStudent.class_id == class_id)
        .where(ClassStudent.archived.is_(False))
    )
    return session.exec(statement.order_by(Student.last_name, Student.first_name)).all()


@router.put("/{class_id}", response_model=ClassroomRead)
def update_classroom(
    class_id: int, payload: ClassroomUpdate, session: Session = Depends(get_db), user=Depends(get_current_user)
) -> Classroom:
    del user
    classroom = session.get(Classroom, class_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(classroom, key, value)
    session.add(classroom)
    session.commit()
    session.refresh(classroom)
    return classroom


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(class_id: int, session: Session = Depends(get_db), user=Depends(get_current_user)) -> None:
    del user
    classroom = session.get(Classroom, class_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    session.delete(classroom)
    session.commit()
