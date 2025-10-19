"""SQLModel table definitions and domain schemas."""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"
    excused = "excused"


class SubmissionStatus(str, Enum):
    not_submitted = "not_submitted"
    submitted = "submitted"
    submitted_late = "submitted_late"
    exempt = "exempt"


class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class UserBase(SQLModel):
    email: str
    full_name: str
    role: str = Field(default="teacher")


class User(UserBase, TimestampMixin, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int


class ClassroomBase(SQLModel):
    name: str
    grade: str
    section: Optional[str] = None
    academic_year: str


class Classroom(ClassroomBase, TimestampMixin, table=True):
    __tablename__ = "classes"

    id: Optional[int] = Field(default=None, primary_key=True)

    students: list[ClassStudent] = Relationship(back_populates="classroom")  # type: ignore[name-defined]
    assignments: list[Assignment] = Relationship(back_populates="classroom")  # type: ignore[name-defined]


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(SQLModel):
    name: str | None = None
    grade: str | None = None
    section: str | None = None
    academic_year: str | None = None


class ClassroomRead(ClassroomBase):
    id: int


class StudentBase(SQLModel):
    first_name: str
    last_name: str
    date_of_birth: date
    photo_url: Optional[str] = None
    guardian_name: str
    guardian_contact: str
    address: Optional[str] = None
    notes: Optional[str] = None
    active: bool = Field(default=True)


class Student(StudentBase, TimestampMixin, table=True):
    __tablename__ = "students"

    id: Optional[int] = Field(default=None, primary_key=True)

    enrollments: list[ClassStudent] = Relationship(back_populates="student")  # type: ignore[name-defined]
    submissions: list[Submission] = Relationship(back_populates="student")  # type: ignore[name-defined]


class StudentCreate(StudentBase):
    pass


class StudentUpdate(SQLModel):
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None
    photo_url: str | None = None
    guardian_name: str | None = None
    guardian_contact: str | None = None
    address: str | None = None
    notes: str | None = None
    active: bool | None = None


class StudentRead(StudentBase):
    id: int


class ClassStudentBase(SQLModel):
    class_id: int
    student_id: int
    start_date: date = Field(default_factory=date.today)
    end_date: Optional[date] = None
    archived: bool = Field(default=False)


class ClassStudent(ClassStudentBase, TimestampMixin, table=True):
    __tablename__ = "class_students"

    id: Optional[int] = Field(default=None, primary_key=True)

    classroom: Optional[Classroom] = Relationship(back_populates="students")
    student: Optional[Student] = Relationship(back_populates="enrollments")


class AttendanceBase(SQLModel):
    class_id: int
    student_id: int
    date: date
    status: AttendanceStatus
    note: Optional[str] = None


class Attendance(AttendanceBase, TimestampMixin, table=True):
    __tablename__ = "attendance"

    id: Optional[int] = Field(default=None, primary_key=True)


class AttendanceRead(AttendanceBase):
    id: int


class AssignmentBase(SQLModel):
    class_id: int
    title: str
    description: Optional[str] = None
    due_date: date
    attachment_url: Optional[str] = None


class Assignment(AssignmentBase, TimestampMixin, table=True):
    __tablename__ = "assignments"

    id: Optional[int] = Field(default=None, primary_key=True)

    classroom: Optional[Classroom] = Relationship(back_populates="assignments")
    submissions: list[Submission] = Relationship(back_populates="assignment")  # type: ignore[name-defined]


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    due_date: date | None = None
    attachment_url: str | None = None


class AssignmentRead(AssignmentBase):
    id: int


class SubmissionBase(SQLModel):
    assignment_id: int
    student_id: int
    status: SubmissionStatus = Field(default=SubmissionStatus.not_submitted)
    submitted_at: Optional[datetime] = None
    score: Optional[int] = Field(default=None, ge=0, le=100)
    feedback: Optional[str] = None
    file_url: Optional[str] = None


class Submission(SubmissionBase, TimestampMixin, table=True):
    __tablename__ = "submissions"

    id: Optional[int] = Field(default=None, primary_key=True)

    assignment: Optional[Assignment] = Relationship(back_populates="submissions")
    student: Optional[Student] = Relationship(back_populates="submissions")


class SubmissionRead(SubmissionBase):
    id: int


class EmailJobBase(SQLModel):
    student_id: int
    scheduled_for: datetime
    status: str = Field(default="pending")
    subject: str
    body: str
    last_error: Optional[str] = None


class EmailJob(EmailJobBase, TimestampMixin, table=True):
    __tablename__ = "email_jobs"

    id: Optional[int] = Field(default=None, primary_key=True)


class SettingBase(SQLModel):
    key: str
    value: str


class Setting(SettingBase, TimestampMixin, table=True):
    __tablename__ = "settings"

    id: Optional[int] = Field(default=None, primary_key=True)


class SettingRead(SettingBase):
    id: int
