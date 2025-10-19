"""Assignment and submission management endpoints."""

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from ..dependencies import get_current_user, get_db
from ..models import (
    Assignment,
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    Submission,
    SubmissionBase,
    SubmissionRead,
    SubmissionStatus,
)

router = APIRouter(prefix="/api/v1/assignments", tags=["assignments"])


@router.post("/", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate, session: Session = Depends(get_db), user=Depends(get_current_user)
) -> Assignment:
    del user
    if payload.due_date < datetime.utcnow().date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Due date must be in the future")
    assignment = Assignment(**payload.dict())
    session.add(assignment)
    session.commit()
    session.refresh(assignment)
    return assignment



@router.put("/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Assignment:
    del user
    assignment = session.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    if payload.due_date and payload.due_date < datetime.utcnow().date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Due date must be in the future")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(assignment, key, value)
    session.add(assignment)
    session.commit()
    session.refresh(assignment)
    return assignment

@router.get("/", response_model=list[AssignmentRead])
def list_assignments(
    class_id: int | None = None,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[Assignment]:
    del user
    statement = select(Assignment)
    if class_id:
        statement = statement.where(Assignment.class_id == class_id)
    return session.exec(statement.order_by(Assignment.due_date)).all()


@router.post("/{assignment_id}/submissions", response_model=SubmissionRead)
def upsert_submission(
    assignment_id: int,
    payload: SubmissionBase,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Submission:
    del user
    submission = session.exec(
        select(Submission).where(Submission.assignment_id == assignment_id, Submission.student_id == payload.student_id)
    ).first()
    if submission:
        for key, value in payload.dict(exclude_unset=True).items():
            setattr(submission, key, value)
        if payload.status in {SubmissionStatus.submitted, SubmissionStatus.submitted_late}:
            submission.submitted_at = submission.submitted_at or datetime.utcnow()
    else:
        submission = Submission(assignment_id=assignment_id, **payload.dict())
        if payload.status in {SubmissionStatus.submitted, SubmissionStatus.submitted_late}:
            submission.submitted_at = datetime.utcnow()
        session.add(submission)
    session.commit()
    session.refresh(submission)
    return submission


@router.get("/{assignment_id}/submissions", response_model=list[SubmissionRead])
def list_submissions(
    assignment_id: int,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[Submission]:
    del user
    return session.exec(select(Submission).where(Submission.assignment_id == assignment_id)).all()


@router.get("/{assignment_id}/export")
def export_gradebook(
    assignment_id: int,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Response:
    del user
    records = session.exec(
        select(Submission).where(Submission.assignment_id == assignment_id)
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["student_id", "status", "score", "submitted_at"])
    for submission in records:
        writer.writerow(
            [
                submission.student_id,
                submission.status.value,
                submission.score if submission.score is not None else "",
                submission.submitted_at.isoformat() if submission.submitted_at else "",
            ]
        )
    return Response(content=output.getvalue(), media_type="text/csv")


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    session: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> None:
    del user
    assignment = session.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    session.delete(assignment)
    session.commit()
